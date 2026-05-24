// POST /api/admin-test-voice { password, voice_key } → запускает 5-сек тест.
// Возвращает { task_id }. Готовый файл придёт обычным путём (опрос/коллбэк),
// но для теста проще опросить getTaskDetail из админки.
const { checkAdmin } = require('./_lib/admin');
const { getVoiceConfig } = require('./_generateVoice');

const KIE_CREATE_URL = 'https://api.kie.ai/api/v1/jobs/createTask';

async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((res, rej)=>{ let r=''; req.on('data',c=>r+=c); req.on('end',()=>{try{res(r?JSON.parse(r):{})}catch(e){rej(e)}}); req.on('error',rej); });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({error:'Method not allowed'}); return; }
  let body; try{ body = await readBody(req); }catch{ res.status(400).json({error:'bad request'}); return; }
  if (!checkAdmin(body.password)) { res.status(401).json({error:'Неверный пароль'}); return; }

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) { res.status(500).json({error:'KIE_API_KEY не настроен'}); return; }

  try {
    const cfg = await getVoiceConfig(body.voice_key || 'female');
    const r = await fetch(KIE_CREATE_URL, {
      method:'POST',
      headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' },
      body: JSON.stringify({
        model: 'elevenlabs/text-to-speech-multilingual-v2',
        input: {
          text: 'Привет, это тестовый голос.',
          voice: cfg.voice_name,
          stability: cfg.stability, similarity_boost: cfg.similarity_boost,
          style: cfg.style, speed: cfg.speed, language_code: 'ru',
        },
      }),
    });
    const data = await r.json().catch(()=>({}));
    if (!r.ok || (data.code && data.code !== 200)) throw new Error(data.msg || `Kie.ai ${r.status}`);
    const taskId = (data.data && (data.data.taskId || data.data.recordId)) || data.taskId;
    res.status(200).json({ task_id: String(taskId||'') });
  } catch(e){ res.status(502).json({error: String(e&&e.message||e)}); }
};
