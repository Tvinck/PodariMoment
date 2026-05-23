// GET /api/track-order?orderId=PM-XXXXXXXX (или полный uuid)
// Публичный трекинг: возвращает только статусы, без персональных данных.
const { getAdminClient } = require('./_lib/supabase');
const { rateLimit } = require('./_rateLimit');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!rateLimit(req, { key: 'track-order', limit: 60 })) { res.status(429).json({ error: 'Слишком много запросов' }); return; }

  const url = new URL(req.url, 'http://localhost');
  let id = (url.searchParams.get('orderId') || '').trim().replace(/^PM-/i, '');
  if (!id) { res.status(400).json({ error: 'Не указан заказ' }); return; }

  try {
    const sb = getAdminClient();
    let order = null;

    // Полный uuid — точное совпадение; короткий префикс — поиск по началу id
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const { data } = await sb.from('orders')
        .select('id,payment_status,created_at,paid_at,done_at,file_url')
        .eq('id', id).single();
      order = data || null;
    } else {
      try {
        const { data } = await sb.from('orders')
          .select('id,payment_status,created_at,paid_at,done_at,file_url')
          .like('id', `${id}%`).limit(1);
        order = (data && data[0]) || null;
      } catch { order = null; }
    }

    if (!order) { res.status(404).json({ error: 'Заказ не найден' }); return; }

    res.status(200).json({
      orderId: 'PM-' + String(order.id).slice(0, 8),
      status: order.payment_status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      done_at: order.done_at,
      file_url: order.file_url || null,
    });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
