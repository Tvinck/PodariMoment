// POST /api/kie-callback — Kie.ai сообщает, что файл готов (или ошибка).
// { task_id, status: 'completed'|'failed', output: { audio_url } }
const { getAdminClient } = require('./_lib/supabase');

const BUCKET = 'order-files';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method not allowed'); return; }

  let body;
  try { body = await readBody(req); } catch { res.status(400).send('bad request'); return; }

  const taskId = body.task_id || (body.data && body.data.task_id);
  const status = body.status || (body.data && body.data.status);
  const audioUrl = (body.output && body.output.audio_url)
    || (body.data && body.data.output && body.data.output.audio_url);

  if (!taskId) { res.status(200).send('OK'); return; } // нечего сопоставлять

  const sb = getAdminClient();

  try {
    const { data: order } = await sb.from('orders').select('*').eq('kie_task_id', String(taskId)).single();
    if (!order) { res.status(200).send('OK'); return; }

    if (status === 'completed' && audioUrl) {
      // 1. Скачиваем MP3
      const fileResp = await fetch(audioUrl);
      if (!fileResp.ok) throw new Error(`Не удалось скачать аудио: ${fileResp.status}`);
      const buf = Buffer.from(await fileResp.arrayBuffer());

      // 2. Кладём в Supabase Storage
      const path = `orders/${order.id}/voice.mp3`;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, {
        contentType: 'audio/mpeg', upsert: true,
      });
      if (upErr) throw upErr;

      // 3. Публичный URL + статус done
      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
      await sb.from('orders').update({
        file_url: pub.publicUrl, payment_status: 'done', error_log: null,
      }).eq('id', order.id);
    } else if (status === 'failed') {
      await sb.from('orders').update({
        payment_status: 'generation_failed',
        error_log: JSON.stringify(body).slice(0, 2000),
      }).eq('id', order.id);
    }
  } catch (e) {
    try {
      await sb.from('orders').update({
        payment_status: 'generation_failed',
        error_log: String(e && e.message || e).slice(0, 2000),
      }).eq('kie_task_id', String(taskId));
    } catch { /* ignore */ }
  }

  res.status(200).send('OK');
};
