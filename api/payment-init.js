// POST /api/payment-init
// 1. Создаёт заказ в Supabase (status: pending)
// 2. Инициализирует оплату через Т-Банк (Tinkoff) Init
// 3. Возвращает { paymentUrl } для редиректа клиента
const { randomUUID } = require('crypto');
const { genToken } = require('./_lib/tbank');
const { getAdminClient } = require('./_lib/supabase');

// Цена по тарифу (в копейках)
const TARIFF_KOPECKS = { basic: 39900, premium: 59900, vip: 99900 };
const TARIFF_TITLE = { basic: 'Базовый', premium: 'Премиум', vip: 'VIP' };
const TBANK_INIT_URL = 'https://securepay.tinkoff.ru/v2/Init';

function siteUrl(req) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

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
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const terminalKey = process.env.TBANK_TERMINAL_KEY;
  const password = process.env.TBANK_PASSWORD;
  if (!terminalKey || !password) { res.status(500).json({ error: 'Эквайринг не настроен' }); return; }

  let order;
  try { order = await readBody(req); } catch { res.status(400).json({ error: 'Некорректный запрос' }); return; }

  const email = (order.email || '').trim();
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { res.status(400).json({ error: 'Некорректный email' }); return; }
  if (!order.baby_gender || !order.voice_type || !order.parent_names || !order.party_date) {
    res.status(400).json({ error: 'Заполните обязательные поля' }); return;
  }

  const tariff = TARIFF_KOPECKS[order.tariff] ? order.tariff : 'premium';
  let amount = TARIFF_KOPECKS[tariff];
  const orderId = randomUUID();

  // Промокод: пересчитываем скидку на сервере (нельзя доверять клиенту)
  let discountKop = 0;
  let promoApplied = null;
  const sb = getAdminClient();
  if (order.promo_code) {
    try {
      const { data: promo } = await sb.from('promo_codes').select('*').eq('code', String(order.promo_code).trim().toUpperCase()).single();
      const valid = promo && promo.is_active
        && (!promo.valid_until || new Date(promo.valid_until) >= new Date())
        && (!promo.max_uses || promo.max_uses <= 0 || promo.uses_count < promo.max_uses);
      if (valid) {
        discountKop = promo.discount_type === 'percent'
          ? Math.round(amount * promo.discount_value / 100)
          : Math.min(promo.discount_value * 100, amount - 100);
        amount = Math.max(100, amount - discountKop);
        promoApplied = promo;
      }
    } catch { /* промокод невалиден — игнорируем */ }
  }

  // 1. Записываем заказ как pending
  try {
    const { error } = await sb.from('orders').insert({
      id: orderId,
      product: 'gender',
      tariff,
      baby_gender: order.baby_gender,
      voice_type: order.voice_type,
      scenario: [order.scenario, order.script, order.survey ? ('Анкета: ' + order.survey) : '']
        .filter(Boolean).join(' — '),
      parent_names: order.parent_names,
      party_date: order.party_date,
      email,
      promo_code: promoApplied ? promoApplied.code : null,
      discount_amount: Math.round(discountKop / 100),
      payment_status: 'pending',
    });
    if (error) throw error;
    if (promoApplied) {
      try { await sb.from('promo_codes').update({ uses_count: (promoApplied.uses_count || 0) + 1 }).eq('id', promoApplied.id); } catch {}
    }
  } catch (e) {
    res.status(500).json({ error: 'Не удалось сохранить заказ' }); return;
  }

  // 2. Init в Т-Банк
  const base = siteUrl(req);
  const initParams = {
    TerminalKey: terminalKey,
    Amount: amount,
    OrderId: orderId,
    Description: `Голос для гендер-пати — тариф ${TARIFF_TITLE[tariff]}`,
    SuccessURL: `${base}/success?orderId=${orderId}`,
    FailURL: `${base}/order/gender?payment=fail`,
    NotificationURL: `${base}/api/payment-callback`,
  };
  initParams.Token = genToken(initParams, password);
  initParams.DATA = { Email: email };

  try {
    const tb = await fetch(TBANK_INIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initParams),
    });
    const data = await tb.json();
    if (!data.Success || !data.PaymentURL) {
      res.status(502).json({ error: data.Message || data.Details || 'Банк отклонил инициализацию' }); return;
    }

    // 3. Сохраняем PaymentId
    try {
      const sb = getAdminClient();
      await sb.from('orders').update({ payment_id: String(data.PaymentId) }).eq('id', orderId);
    } catch { /* не критично для редиректа */ }

    res.status(200).json({ paymentUrl: data.PaymentURL, orderId });
  } catch (e) {
    res.status(502).json({ error: 'Платёжный сервис недоступен' });
  }
};
