// /api/admin-promo — промокоды (админка)
//   GET   ?password=  → все
//   POST  {password,code,discount_type,discount_value,max_uses,valid_until,description} → создать
//   PATCH {password,id,is_active,...} → обновить
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { rateLimit } = require('./_rateLimit');

async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((res, rej)=>{ let r=''; req.on('data',c=>r+=c); req.on('end',()=>{try{res(r?JSON.parse(r):{})}catch(e){rej(e)}}); req.on('error',rej); });
}

module.exports = async (req, res) => {
  if (!rateLimit(req, { key:'admin-promo', limit:30 })) { res.status(429).json({error:'Слишком много запросов'}); return; }
  const sb = getAdminClient();

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    if (!checkAdmin(url.searchParams.get('password') || req.headers['x-admin-password'])) { res.status(401).json({error:'Неверный пароль'}); return; }
    try { const { data, error } = await sb.from('promo_codes').select('*').order('created_at',{ascending:false}); if (error) throw error; res.status(200).json({ promos: data||[] }); }
    catch(e){ res.status(500).json({error:'Не удалось загрузить'}); }
    return;
  }

  let body; try{ body = await readBody(req); }catch{ res.status(400).json({error:'bad request'}); return; }
  if (!checkAdmin(body.password)) { res.status(401).json({error:'Неверный пароль'}); return; }

  if (req.method === 'POST') {
    const code = (body.code||'').trim().toUpperCase();
    if (!code) { res.status(400).json({error:'Укажите код'}); return; }
    if (!['percent','fixed'].includes(body.discount_type)) { res.status(400).json({error:'Тип скидки'}); return; }
    const row = {
      code, discount_type: body.discount_type,
      discount_value: parseInt(body.discount_value,10)||0,
      max_uses: body.max_uses!==undefined ? parseInt(body.max_uses,10) : 1,
      valid_until: body.valid_until || null,
      description: body.description || null,
    };
    try { const { data, error } = await sb.from('promo_codes').insert(row).select().single(); if (error) throw error; res.status(200).json({ promo: data }); }
    catch(e){ res.status(500).json({error: e.code==='23505'?'Такой код уже есть':'Не удалось создать'}); }
    return;
  }

  if (req.method === 'PATCH') {
    if (!body.id) { res.status(400).json({error:'Не указан промокод'}); return; }
    const patch = {};
    ['is_active','description'].forEach(k=>{ if (body[k]!==undefined) patch[k]=body[k]; });
    ['discount_value','max_uses'].forEach(k=>{ if (body[k]!==undefined) patch[k]=parseInt(body[k],10); });
    if (body.valid_until !== undefined) patch.valid_until = body.valid_until || null;
    if (!Object.keys(patch).length) { res.status(400).json({error:'Нечего обновлять'}); return; }
    try { const { data, error } = await sb.from('promo_codes').update(patch).eq('id', body.id).select().single(); if (error) throw error; res.status(200).json({ promo: data }); }
    catch(e){ res.status(500).json({error:'Не удалось сохранить'}); }
    return;
  }
  res.status(405).json({error:'Method not allowed'});
};
