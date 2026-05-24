// /api/admin-prompts — шаблоны текстов (админка)
//   GET  ?password=          → все шаблоны
//   PATCH {password,id,template,is_active} → обновить
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { rateLimit } = require('./_rateLimit');

async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((res, rej)=>{ let r=''; req.on('data',c=>r+=c); req.on('end',()=>{try{res(r?JSON.parse(r):{})}catch(e){rej(e)}}); req.on('error',rej); });
}

module.exports = async (req, res) => {
  if (!rateLimit(req, { key:'admin-prompts', limit:30 })) { res.status(429).json({error:'Слишком много запросов'}); return; }
  const sb = getAdminClient();
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    if (!checkAdmin(url.searchParams.get('password') || req.headers['x-admin-password'])) { res.status(401).json({error:'Неверный пароль'}); return; }
    try { const { data, error } = await sb.from('prompt_templates').select('*').order('scenario'); if (error) throw error; res.status(200).json({ templates: data||[] }); }
    catch(e){ res.status(500).json({error:'Не удалось загрузить шаблоны'}); }
    return;
  }
  if (req.method === 'PATCH') {
    let body; try{ body = await readBody(req); }catch{ res.status(400).json({error:'bad request'}); return; }
    if (!checkAdmin(body.password)) { res.status(401).json({error:'Неверный пароль'}); return; }
    if (!body.id) { res.status(400).json({error:'Не указан шаблон'}); return; }
    const patch = { updated_at: new Date().toISOString() };
    if (body.template !== undefined) patch.template = body.template;
    if (body.is_active !== undefined) patch.is_active = !!body.is_active;
    try { const { data, error } = await sb.from('prompt_templates').update(patch).eq('id', body.id).select().single(); if (error) throw error; res.status(200).json({ template: data }); }
    catch(e){ res.status(500).json({error:'Не удалось сохранить'}); }
    return;
  }
  res.status(405).json({error:'Method not allowed'});
};
