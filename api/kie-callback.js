// POST /api/kie-callback — Kie.ai сообщает, что задача готова (или ошибка).
// Формат коллбэка Kie.ai Jobs API разбирается универсально (parseKieResult).
const { getAdminClient } = require('./_lib/supabase');
const { parseKieResult, storeAudioToOrder } = require('./_generateVoice');

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

  const d = (body && body.data) || body || {};
  const taskId = d.taskId || d.task_id || d.recordId || body.taskId || body.task_id;
  if (!taskId) { res.status(200).send('OK'); return; }

  const { status, audioUrl } = parseKieResult(body);
  const sb = getAdminClient();

  try {
    const { data: order } = await sb.from('orders').select('*').eq('kie_task_id', String(taskId)).single();
    if (!order) { res.status(200).send('OK'); return; }

    if (status === 'completed' && audioUrl) {
      await storeAudioToOrder(order, audioUrl); // file_url + done + done_at
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
