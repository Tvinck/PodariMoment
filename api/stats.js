// GET /api/stats — публичная статистика (без пароля): кол-во готовых заказов
const { getAdminClient } = require('./_lib/supabase');
const { rateLimit } = require('./_rateLimit');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }
  if (!rateLimit(req, { key: 'stats', limit: 120 })) { res.status(429).json({ error: 'rate limited' }); return; }
  try {
    const sb = getAdminClient();
    const { count } = await sb.from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'done');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({ done: count || 0 });
  } catch (e) {
    res.status(200).json({ done: 0 }); // тихий fallback
  }
};
