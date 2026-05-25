// /api/crm-leads — CRM-лиды (только для админки, проверка пароля)
//   GET   ?password=X            → все лиды
//   POST  {password,name,email,phone,source,stage,notes}  → создать
//   PATCH {password,id,stage,notes,lost_reason,...}        → обновить
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { rateLimit } = require('./_rateLimit');

const STAGES = ['new', 'contacted', 'interested', 'ordered', 'done', 'lost'];
const STAGE_TS = { contacted: 'contacted_at', interested: 'interested_at', ordered: 'ordered_at', done: 'done_at', lost: 'lost_at' };

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
  if (!rateLimit(req, { key: 'crm-leads', limit: 30 })) { res.status(429).json({ error: 'Слишком много запросов' }); return; }
  const sb = getAdminClient();

  // ---- GET: список ----
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    if (!checkAdmin(url.searchParams.get('password') || req.headers['x-admin-password'])) {
      res.status(401).json({ error: 'Неверный пароль' }); return;
    }
    try {
      const { data, error } = await sb.from('crm_leads').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      res.status(200).json({ leads: data || [] });
    } catch (e) { res.status(500).json({ error: 'Не удалось загрузить лиды' }); }
    return;
  }

  let body;
  try { body = await readBody(req); } catch { res.status(400).json({ error: 'bad request' }); return; }
  if (!checkAdmin(body.password)) { res.status(401).json({ error: 'Неверный пароль' }); return; }

  // ---- POST: создать ----
  if (req.method === 'POST') {
    const stage = STAGES.includes(body.stage) ? body.stage : 'new';
    const row = {
      name: body.name || null,
      email: body.email || null,
      phone: body.phone || null,
      source: body.source || 'direct',
      stage,
      notes: body.notes || null,
    };
    if (STAGE_TS[stage]) row[STAGE_TS[stage]] = new Date().toISOString();
    try {
      const { data, error } = await sb.from('crm_leads').insert(row).select().single();
      if (error) throw error;
      res.status(200).json({ lead: data });
    } catch (e) { res.status(500).json({ error: 'Не удалось создать лид' }); }
    return;
  }

  // ---- PATCH: обновить ----
  if (req.method === 'PATCH') {
    if (!body.id) { res.status(400).json({ error: 'Не указан лид' }); return; }
    const patch = {};
    ['name', 'email', 'phone', 'source', 'notes', 'lost_reason', 'assigned_to'].forEach((k) => {
      if (body[k] !== undefined) patch[k] = body[k];
    });
    if (body.stage !== undefined) {
      if (!STAGES.includes(body.stage)) { res.status(400).json({ error: 'Недопустимый этап' }); return; }
      patch.stage = body.stage;
      if (STAGE_TS[body.stage]) patch[STAGE_TS[body.stage]] = new Date().toISOString();
    }
    if (Object.keys(patch).length === 0) { res.status(400).json({ error: 'Нечего обновлять' }); return; }
    try {
      const { data, error } = await sb.from('crm_leads').update(patch).eq('id', body.id).select().single();
      if (error) throw error;
      res.status(200).json({ lead: data });
    } catch (e) { res.status(500).json({ error: 'Не удалось обновить лид' }); }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
