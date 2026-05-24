// /api/admin-pricing — цены тарифов (админка)
//   GET  ?password=  → все тарифы
//   PATCH {password,id,price,old_price,badge,is_active} → обновить
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { rateLimit } = require('./_rateLimit');

async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((res, rej)=>{ let r=''; req.on('data',c=>r+=c); req.on('end',()=>{try{res(r?JSON.parse(r):{})}catch(e){rej(e)}}); req.on('error',rej); });
}

module.exports = async (req, res) => {
  if (!rateLimit(req, { key:'admin-pricing', limit:30 })) { res.status(429).json({error:'Слишком много запросов'}); return; }
  const sb = getAdminClient();
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    if (!checkAdmin(url.searchParams.get('password') || req.headers['x-admin-password'])) { res.status(401).json({error:'Неверный пароль'}); return; }
    try { const { data, error } = await sb.from('pricing').select('*').order('price'); if (error) throw error; res.status(200).json({ pricing: data||[] }); }
    catch(e){ res.status(500).json({error:'Не удалось загрузить цены'}); }
    return;
  }
  if (req.method === 'PATCH') {
    let body; try{ body = await readBody(req); }catch{ res.status(400).json({error:'bad request'}); return; }
    if (!checkAdmin(body.password)) { res.status(401).json({error:'Неверный пароль'}); return; }
    if (!body.id) { res.status(400).json({error:'Не указан тариф'}); return; }
    const patch = {};
    if (body.price !== undefined) patch.price = parseInt(body.price, 10);
    if (body.old_price !== undefined) patch.old_price = body.old_price ? parseInt(body.old_price, 10) : null;
    if (body.badge !== undefined) patch.badge = body.badge || null;
    if (body.is_active !== undefined) patch.is_active = !!body.is_active;
    if (!Object.keys(patch).length) { res.status(400).json({error:'Нечего обновлять'}); return; }
    try { const { data, error } = await sb.from('pricing').update(patch).eq('id', body.id).select().single(); if (error) throw error; res.status(200).json({ pricing: data }); }
    catch(e){ res.status(500).json({error:'Не удалось сохранить'}); }
    return;
  }
  res.status(405).json({error:'Method not allowed'});
};
