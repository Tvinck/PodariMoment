// GET /api/get-pricing — публичные активные цены (для сайта, без пароля)
const { getAdminClient } = require('./_lib/supabase');
const { rateLimit } = require('./_rateLimit');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({error:'Method not allowed'}); return; }
  if (!rateLimit(req, { key:'get-pricing', limit:120 })) { res.status(429).json({error:'rate limited'}); return; }
  try {
    const sb = getAdminClient();
    const { data, error } = await sb.from('pricing').select('tariff,price,old_price,badge,is_active').eq('is_active', true);
    if (error) throw error;
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({ pricing: data || [] });
  } catch(e){ res.status(200).json({ pricing: [] }); } // тихий fallback — сайт возьмёт дефолт
};
