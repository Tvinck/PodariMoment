// POST /api/validate-promo { code, tariff } — публичная проверка промокода.
// Возвращает { valid, discount_amount, new_price, discount_type, discount_value }.
const { getAdminClient } = require('./_lib/supabase');
const { rateLimit } = require('./_rateLimit');

const TARIFF_PRICE = { basic: 399, premium: 599, vip: 999 };

async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((res, rej)=>{ let r=''; req.on('data',c=>r+=c); req.on('end',()=>{try{res(r?JSON.parse(r):{})}catch(e){rej(e)}}); req.on('error',rej); });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({error:'Method not allowed'}); return; }
  if (!rateLimit(req, { key:'validate-promo', limit:30 })) { res.status(429).json({error:'Слишком много попыток'}); return; }
  let body; try{ body = await readBody(req); }catch{ res.status(400).json({error:'bad request'}); return; }

  const code = (body.code||'').trim().toUpperCase();
  const tariff = TARIFF_PRICE[body.tariff] ? body.tariff : 'premium';
  if (!code) { res.status(400).json({ valid:false, error:'Введите код' }); return; }

  try {
    const sb = getAdminClient();
    const { data: promo } = await sb.from('promo_codes').select('*').eq('code', code).single();
    if (!promo || !promo.is_active) { res.status(200).json({ valid:false, error:'Код не найден' }); return; }
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) { res.status(200).json({ valid:false, error:'Срок действия истёк' }); return; }
    if (promo.max_uses && promo.max_uses > 0 && promo.uses_count >= promo.max_uses) { res.status(200).json({ valid:false, error:'Код исчерпан' }); return; }

    const base = TARIFF_PRICE[tariff];
    const discount = promo.discount_type === 'percent'
      ? Math.round(base * promo.discount_value / 100)
      : Math.min(promo.discount_value, base - 1);
    const newPrice = Math.max(1, base - discount);
    res.status(200).json({
      valid: true,
      discount_amount: discount,
      new_price: newPrice,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
    });
  } catch(e){ res.status(200).json({ valid:false, error:'Код не найден' }); }
};
