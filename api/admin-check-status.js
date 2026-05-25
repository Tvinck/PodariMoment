// GET /api/admin-check-status?orderId=XXX&password=YYY (или заголовок x-admin-password)
// Опрашивает Kie.ai по kie_task_id; если готово — финализирует заказ.
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { fetchTaskDetail, storeAudioToOrder } = require('./_generateVoice');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const url = new URL(req.url, 'http://localhost');
  const orderId = url.searchParams.get('orderId');
  const password = url.searchParams.get('password') || req.headers['x-admin-password'];
  if (!checkAdmin(password)) { res.status(401).json({ error: 'Неверный пароль' }); return; }
  if (!orderId) { res.status(400).json({ error: 'Не указан заказ' }); return; }

  try {
    const sb = getAdminClient();
    const { data: order, error } = await sb.from('orders').select('*').eq('id', orderId).single();
    if (error || !order) throw new Error('Заказ не найден');
    if (!order.kie_task_id) { res.status(200).json({ status: order.payment_status, note: 'нет kie_task_id' }); return; }

    const { status, audioUrl } = await fetchTaskDetail(order.kie_task_id);

    if (status === 'completed' && audioUrl) {
      const fileUrl = await storeAudioToOrder(order, audioUrl);
      res.status(200).json({ status: 'done', file_url: fileUrl }); return;
    }
    if (status === 'failed') {
      await sb.from('orders').update({ payment_status: 'generation_failed', error_log: 'Kie.ai: failed' }).eq('id', orderId);
      res.status(200).json({ status: 'generation_failed' }); return;
    }
    res.status(200).json({ status: order.payment_status, kie_status: 'processing' });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
};
