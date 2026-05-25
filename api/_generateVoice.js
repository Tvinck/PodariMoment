// Shared-хелпер (имя с _ → Vercel НЕ создаёт публичный роут).
// Формирует текст сценария и запускает TTS через Kie.ai Jobs API (ElevenLabs).
const { getAdminClient } = require('./_lib/supabase');

const KIE_CREATE_URL = 'https://api.kie.ai/api/v1/jobs/createTask';
const KIE_DETAIL_URL = 'https://api.kie.ai/api/v1/jobs/getTaskDetail';

// voice_type → имя голоса ElevenLabs (строка, не ID)
const VOICE_NAMES = {
  male: 'Adam',     // мужской
  female: 'Rachel', // женский
  child: 'Gigi',    // детский
  solemn: 'Antoni', // торжественный мужской
  soft: 'Domi',     // мягкий женский
};

// tariff → модель Kie.ai
const TARIFF_MODEL = {
  basic: 'elevenlabs/text-to-speech-multilingual-v2',
  premium: 'elevenlabs/text-to-speech-multilingual-v2',
  vip: 'elevenlabs/text-to-dialogue-v3',
};

const GENDER_NOUN = { boy: 'сыночек', girl: 'доченька', surprise: 'малыш' };

const SCENARIO_KEY = {
  'торжественный': 'formal', 'с юмором': 'funny', 'душевный': 'warm', 'загадочный': 'mysterious',
  formal: 'formal', funny: 'funny', warm: 'warm', mysterious: 'mysterious',
};

const TEMPLATES = {
  formal: ({ names, noun, date }) =>
    `Дорогие ${names}! Я ваш ${noun}, и я уже не могу дождаться встречи с вами. Совсем скоро, ${date}, вы узнаете, кто я. Я люблю вас!`,
  funny: ({ names, noun, date }) =>
    `Эй, ${names}! Это я, ваш ${noun}! Да-да, тот самый, из животика! Готовьтесь — ${date} я раскрою главный секрет года. Я уже смеюсь!`,
  warm: ({ names, noun, date }) =>
    `Мамочка и папочка, ${names}... Я чувствую вашу любовь каждый день. ${date} вы узнаете, кто будет любить вас всю жизнь — ваш ${noun}.`,
  mysterious: ({ names, noun, date }) =>
    `Тссс... ${names}. Секрет хранится совсем недолго. ${date} всё откроется. Я жду не дождусь нашей встречи...`,
};

function fmtDate(d) {
  if (!d) return 'совсем скоро';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(dt.getDate())}.${p(dt.getMonth() + 1)}.${dt.getFullYear()}`;
}

function parseScenario(scenario) {
  const parts = String(scenario || '').split(' — ');
  const label = (parts[0] || '').trim().toLowerCase();
  const custom = parts.slice(1).join(' — ').trim();
  return { key: SCENARIO_KEY[label] || 'formal', custom };
}

/**
 * @function buildText
 * @description Собирает текст для TTS из данных заказа: подставляет
 *              существительное по полу, имена родителей, дату; берёт свой
 *              текст пользователя или шаблон по сценарию. = buildOrderText из ТЗ.
 * @param {object} order — заказ (baby_gender, parent_names, party_date, scenario)
 * @returns {string} готовый текст
 */
function buildText(order) {
  const noun = GENDER_NOUN[order.baby_gender] || 'малыш';
  const names = order.parent_names || 'дорогие родители';
  const date = fmtDate(order.party_date);
  const { key, custom } = parseScenario(order.scenario);
  if (custom) {
    return custom
      .replace(/\{?parent_names\}?/gi, names)
      .replace(/\{?baby_gender\}?/gi, noun)
      .replace(/\{?party_date\}?/gi, date);
  }
  return (TEMPLATES[key] || TEMPLATES.formal)({ names, noun, date });
}

// Универсальный разбор ответа Kie.ai (createTask / getTaskDetail / webhook).
// Возвращает { status: 'completed'|'failed'|'processing', audioUrl }
function parseKieResult(payload) {
  const d = (payload && (payload.data || payload)) || {};
  const rawState = d.state || d.status || payload.status || '';
  const state = String(rawState).toLowerCase();
  let status = 'processing';
  if (['success', 'succeeded', 'completed', 'done'].includes(state)) status = 'completed';
  else if (['fail', 'failed', 'error'].includes(state)) status = 'failed';

  let audioUrl = (d.output && (d.output.audio_url || d.output.audioUrl))
    || d.audio_url || d.audioUrl || null;
  // Kie часто кладёт результат строкой JSON в resultJson
  if (!audioUrl && d.resultJson) {
    try {
      const rj = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson;
      audioUrl = (rj.resultUrls && rj.resultUrls[0]) || rj.audio_url || rj.audioUrl
        || (rj.output && (rj.output.audio_url || rj.output.audioUrl)) || null;
    } catch { /* ignore */ }
  }
  if (!audioUrl && Array.isArray(d.resultUrls)) audioUrl = d.resultUrls[0];
  return { status, audioUrl };
}

// --- Кэш конфигов из Supabase (5 минут), fallback на хардкод ---
let _cfgCache = { t: 0, templates: null, voices: null };
async function loadConfig() {
  if (Date.now() - _cfgCache.t < 300000 && _cfgCache.voices) return _cfgCache;
  try {
    const sb = getAdminClient();
    const [{ data: templates }, { data: voices }] = await Promise.all([
      sb.from('prompt_templates').select('*').eq('is_active', true),
      sb.from('voice_config').select('*').eq('is_active', true),
    ]);
    _cfgCache = { t: Date.now(), templates: templates || [], voices: voices || [] };
  } catch { _cfgCache = { t: Date.now(), templates: [], voices: [] }; }
  return _cfgCache;
}

/**
 * @function getVoiceConfig
 * @description Настройки голоса из Supabase (или дефолт). Используется
 *              в generateVoice и admin-test-voice.
 */
async function getVoiceConfig(voiceKey) {
  const cfg = await loadConfig();
  const v = (cfg.voices || []).find((x) => x.voice_key === voiceKey);
  if (v) return v;
  return { voice_name: VOICE_NAMES[voiceKey] || VOICE_NAMES.female, stability: 0.6, similarity_boost: 0.8, style: 0.4, speed: 0.9 };
}

// Текст: свой текст пользователя → шаблон из БД → хардкод-шаблон
async function resolveText(order) {
  const { custom } = parseScenario(order.scenario);
  if (custom) return buildText(order); // buildText уже подставит кастом
  const cfg = await loadConfig();
  const { key } = parseScenario(order.scenario);
  const tpl = (cfg.templates || []).find((t) => t.scenario === key && t.baby_gender === order.baby_gender);
  if (tpl && tpl.template) {
    const names = order.parent_names || 'дорогие родители';
    const date = fmtDate(order.party_date);
    const noun = GENDER_NOUN[order.baby_gender] || 'малыш';
    return tpl.template
      .replace(/\{parent_names\}/g, names)
      .replace(/\{party_date\}/g, date)
      .replace(/\{baby_gender\}/g, noun);
  }
  return buildText(order);
}

// Запускает генерацию. Обновляет заказ: kie_task_id + статус processing.
async function generateVoice(order) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) throw new Error('KIE_API_KEY not configured');

  const text = await resolveText(order);
  const vcfg = await getVoiceConfig(order.voice_type);
  const model = TARIFF_MODEL[order.tariff] || TARIFF_MODEL.premium;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  const secret = process.env.KIE_WEBHOOK_SECRET || '';
  const callBackUrl = base
    ? `${base}/api/kie-callback${secret ? `?secret=${encodeURIComponent(secret)}` : ''}`
    : undefined;

  const resp = await fetch(KIE_CREATE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      callBackUrl,
      input: {
        text,
        voice: vcfg.voice_name,
        stability: vcfg.stability,
        similarity_boost: vcfg.similarity_boost,
        style: vcfg.style,
        speed: vcfg.speed,
        language_code: 'ru',
      },
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || (data.code && data.code !== 200)) {
    throw new Error(data.msg || data.message || `Kie.ai ответил ${resp.status}`);
  }
  const taskId = (data.data && (data.data.taskId || data.data.recordId)) || data.taskId;
  if (!taskId) throw new Error('Kie.ai не вернул taskId');

  const sb = getAdminClient();
  await sb.from('orders')
    .update({ kie_task_id: String(taskId), payment_status: 'processing', error_log: null })
    .eq('id', order.id);

  return { task_id: String(taskId), text };
}

// Опрос статуса задачи в Kie.ai
async function fetchTaskDetail(taskId) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) throw new Error('KIE_API_KEY not configured');
  const r = await fetch(`${KIE_DETAIL_URL}?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await r.json().catch(() => ({}));
  return parseKieResult(data);
}

// Скачивает MP3 по URL, кладёт в Supabase Storage, проставляет file_url + done + done_at.
async function storeAudioToOrder(order, audioUrl) {
  const sb = getAdminClient();
  const fileResp = await fetch(audioUrl);
  if (!fileResp.ok) throw new Error(`Не удалось скачать аудио: ${fileResp.status}`);
  const buf = Buffer.from(await fileResp.arrayBuffer());
  const path = `orders/${order.id}/voice.mp3`;
  const { error: upErr } = await sb.storage.from('order-files').upload(path, buf, {
    contentType: 'audio/mpeg', upsert: true,
  });
  if (upErr) throw upErr;
  const { data: pub } = sb.storage.from('order-files').getPublicUrl(path);
  await sb.from('orders')
    .update({ file_url: pub.publicUrl, payment_status: 'done', done_at: new Date().toISOString(), error_log: null })
    .eq('id', order.id);
  return pub.publicUrl;
}

module.exports = { generateVoice, buildText, fetchTaskDetail, parseKieResult, storeAudioToOrder, getVoiceConfig, VOICE_NAMES };
