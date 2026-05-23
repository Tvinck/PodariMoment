// POST /api/admin-generate { password, orderId } — ручной запуск генерации.
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { generateVoice } = require('./_generateVoice');

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
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  let body;
  try { body = await readBody(req); } catch { res.status(400).json({ error: 'bad request' }); return; }
  if (!checkAdmin(body.password)) { res.status(401).json({ error: 'Неверный пароль' }); return; }
  if (!body.orderId) { res.status(400).json({ error: 'Не указан заказ' }); return; }

  try {
    const sb = getAdminClient();
    const { data: order, error } = await sb.from('orders').select('*').eq('id', body.orderId).single();
    if (error || !order) throw new Error('Заказ не найден');
    const result = await generateVoice(order); // выставит processing + kie_task_id
    res.status(200).json({ ok: true, task_id: result.task_id });
  } catch (e) {
    try {
      const sb = getAdminClient();
      await sb.from('orders').update({ payment_status: 'generation_failed', error_log: String(e && e.message || e) }).eq('id', body.orderId);
    } catch { /* ignore */ }
    res.status(500).json({ error: String(e && e.message || e) });
  }
};
