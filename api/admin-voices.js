// /api/admin-voices — конфигурация голосов (админка)
//   GET  ?password=  → все голоса
//   PATCH {password,id,...} → обновить (stability/similarity_boost/style/speed/is_active/tariffs/voice_name)
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { rateLimit } = require('./_rateLimit');

async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((res, rej)=>{ let r=''; req.on('data',c=>r+=c); req.on('end',()=>{try{res(r?JSON.parse(r):{})}catch(e){rej(e)}}); req.on('error',rej); });
}

module.exports = async (req, res) => {
  if (!rateLimit(req, { key:'admin-voices', limit:30 })) { res.status(429).json({error:'Слишком много запросов'}); return; }
  const sb = getAdminClient();
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    if (!checkAdmin(url.searchParams.get('password') || req.headers['x-admin-password'])) { res.status(401).json({error:'Неверный пароль'}); return; }
    try { const { data, error } = await sb.from('voice_config').select('*').order('voice_key'); if (error) throw error; res.status(200).json({ voices: data||[] }); }
    catch(e){ res.status(500).json({error:'Не удалось загрузить голоса'}); }
    return;
  }
  if (req.method === 'PATCH') {
    let body; try{ body = await readBody(req); }catch{ res.status(400).json({error:'bad request'}); return; }
    if (!checkAdmin(body.password)) { res.status(401).json({error:'Неверный пароль'}); return; }
    if (!body.id) { res.status(400).json({error:'Не указан голос'}); return; }
    const patch = {};
    ['voice_name','display_name','tariffs','is_active'].forEach(k=>{ if (body[k]!==undefined) patch[k]=body[k]; });
    ['stability','similarity_boost','style','speed'].forEach(k=>{ if (body[k]!==undefined) patch[k]=Math.max(0, Math.min(1, parseFloat(body[k]))); });
    if (!Object.keys(patch).length) { res.status(400).json({error:'Нечего обновлять'}); return; }
    try { const { data, error } = await sb.from('voice_config').update(patch).eq('id', body.id).select().single(); if (error) throw error; res.status(200).json({ voice: data }); }
    catch(e){ res.status(500).json({error:'Не удалось сохранить'}); }
    return;
  }
  res.status(405).json({error:'Method not allowed'});
};
