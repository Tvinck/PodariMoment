// GET /api/admin-kie-stats?password= — баланс кредитов Kie.ai + локальная статистика
const { getAdminClient } = require('./_lib/supabase');
const { checkAdmin } = require('./_lib/admin');
const { rateLimit } = require('./_rateLimit');

const KIE_CREDITS_URL = 'https://api.kie.ai/api/v1/account/credits';
const CREDITS_PER_ORDER = 50; // примерный расход ElevenLabs на заказ

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({error:'Method not allowed'}); return; }
  if (!rateLimit(req, { key:'admin-kie-stats', limit:20 })) { res.status(429).json({error:'Слишком много запросов'}); return; }
  const url = new URL(req.url, 'http://localhost');
  if (!checkAdmin(url.searchParams.get('password') || req.headers['x-admin-password'])) { res.status(401).json({error:'Неверный пароль'}); return; }

  let credits = null;
  const apiKey = process.env.KIE_API_KEY;
  if (apiKey) {
    try {
      const r = await fetch(KIE_CREDITS_URL, { headers:{ Authorization:`Bearer ${apiKey}` } });
      const d = await r.json().catch(()=>({}));
      credits = (d.data && (d.data.credits ?? d.data.balance)) ?? d.credits ?? d.balance ?? null;
    } catch(_){ credits = null; }
  }

  // Локальная статистика из orders
  let generated = 0, recent = [];
  try {
    const sb = getAdminClient();
    const { data } = await sb.from('orders')
      .select('id,email,kie_task_id,payment_status,created_at')
      .not('kie_task_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    recent = data || [];
    const { count } = await sb.from('orders')
      .select('id', { count: 'exact', head: true })
      .not('payment_status', 'in', '(pending,failed)');
    generated = count || 0;
  } catch(_){}

  const spent = generated * CREDITS_PER_ORDER;
  const ordersLeft = credits != null ? Math.floor(credits / CREDITS_PER_ORDER) : null;

  res.status(200).json({ credits, generated, spent, ordersLeft, creditsPerOrder: CREDITS_PER_ORDER, recent });
};
