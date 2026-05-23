// Shared-хелпер (имя с _ → Vercel НЕ создаёт публичный роут).
// Формирует текст сценария и запускает TTS-генерацию через Kie.ai (ElevenLabs).
const { getAdminClient } = require('./_lib/supabase');

const KIE_TTS_URL = 'https://api.kie.ai/v1/elevenlabs/tts';

// voice_type → ElevenLabs voice_id
const VOICE_IDS = {
  male: 'pNInz6obpgDQGcFmaJgB',   // Adam
  female: 'EXAVITQu4vr4xnSDxMaL', // Bella
  child: 'jBpfuIE2acCO8z3wKNLl',  // Gigi
};

// baby_gender → существительное для текста
const GENDER_NOUN = { boy: 'сыночек', girl: 'доченька', surprise: 'малыш' };

// Метки сценария (рус.) → ключ шаблона
const SCENARIO_KEY = {
  'торжественный': 'formal',
  'с юмором': 'funny',
  'душевный': 'warm',
  'загадочный': 'mysterious',
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

// scenario в БД может быть «Торжественный — <свой текст>». Разбираем.
function parseScenario(scenario) {
  const parts = String(scenario || '').split(' — ');
  const label = (parts[0] || '').trim().toLowerCase();
  const custom = parts.slice(1).join(' — ').trim();
  return { key: SCENARIO_KEY[label] || 'formal', custom };
}

function buildText(order) {
  const noun = GENDER_NOUN[order.baby_gender] || 'малыш';
  const names = order.parent_names || 'дорогие родители';
  const date = fmtDate(order.party_date);
  const { key, custom } = parseScenario(order.scenario);
  if (custom) {
    // Свой текст пользователя — подставляем плейсхолдеры, если есть
    return custom
      .replace(/\{?parent_names\}?/gi, names)
      .replace(/\{?baby_gender\}?/gi, noun)
      .replace(/\{?party_date\}?/gi, date);
  }
  return (TEMPLATES[key] || TEMPLATES.formal)({ names, noun, date });
}

// Запускает генерацию. Обновляет заказ: kie_task_id + статус processing.
// Бросает ошибку — вызывающий код пометит generation_failed.
async function generateVoice(order) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) throw new Error('KIE_API_KEY not configured');

  const text = buildText(order);
  const voiceId = VOICE_IDS[order.voice_type] || VOICE_IDS.female;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');

  const resp = await fetch(KIE_TTS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      model_id: 'eleven_multilingual_v2',
      language_code: 'ru',
      voice_settings: { stability: 0.7, similarity_boost: 0.8, style: 0.5 },
      webhook_url: base ? `${base}/api/kie-callback` : undefined,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.message || data.error || `Kie.ai ответил ${resp.status}`);

  const taskId = data.task_id || (data.data && data.data.task_id) || data.id;
  if (!taskId) throw new Error('Kie.ai не вернул task_id');

  const sb = getAdminClient();
  await sb.from('orders')
    .update({ kie_task_id: String(taskId), payment_status: 'processing', error_log: null })
    .eq('id', order.id);

  return { task_id: String(taskId), text };
}

// Скачивает MP3 по URL, кладёт в Supabase Storage, проставляет file_url + done.
// Используется и в kie-callback, и в admin-check-status.
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
  await sb.from('orders').update({ file_url: pub.publicUrl, payment_status: 'done', error_log: null }).eq('id', order.id);
  return pub.publicUrl;
}

module.exports = { generateVoice, buildText, VOICE_IDS, storeAudioToOrder };
