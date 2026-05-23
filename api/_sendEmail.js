// Хелпер отправки писем через Resend. Тихоно-ошибочный: при отсутствии ключа
// или сбое логирует и не роняет основной поток.
const RESEND_URL = 'https://api.resend.com/emails';

const VOICE_RU = { male:'Мужской', female:'Женский', child:'Детский', solemn:'Торжественный', soft:'Мягкий' };
const TARIFF_RU = { basic:'Базовый', premium:'Премиум', vip:'VIP' };

function base() { return (process.env.NEXT_PUBLIC_SITE_URL || 'https://подаримомент.рф').replace(/\/+$/, ''); }
function shortId(id) { return 'PM-' + String(id).slice(0, 8); }

function shell(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0f;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#fff;margin-bottom:24px">
      Подари<span style="background:linear-gradient(135deg,#ff6b35,#ffd166);-webkit-background-clip:text;background-clip:text;color:#ffd166">Момент</span> 🎀
    </div>
    <div style="background:#14141f;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px;color:#e8e6e0">
      <h1 style="font-size:20px;color:#fff;margin:0 0 16px">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="text-align:center;color:rgba(255,255,255,0.4);font-size:12px;margin-top:20px">
      ПодариМомент · <a href="mailto:hello@podarimoment.ru" style="color:#ff8458">hello@podarimoment.ru</a>
    </div>
  </div></body></html>`;
}
function btn(href, label, gold) {
  const bg = gold ? '#ffd166' : 'linear-gradient(135deg,#ff6b35,#ffd166)';
  return `<a href="${href}" style="display:inline-block;background:${bg};color:#1a0d05;font-weight:700;font-size:16px;text-decoration:none;padding:14px 28px;border-radius:14px;margin:8px 0">${label}</a>`;
}

function emailPaid(order) {
  const track = `${base()}/track?order=${order.id}`;
  const body = `
    <p>Спасибо за заказ! Мы уже создаём голос для вашего малыша.</p>
    <p style="background:rgba(255,255,255,0.04);padding:14px;border-radius:12px;font-size:14px">
      <b>Заказ:</b> ${shortId(order.id)}<br>
      <b>Тариф:</b> ${TARIFF_RU[order.tariff] || order.tariff || 'Премиум'}<br>
      <b>Голос:</b> ${VOICE_RU[order.voice_type] || order.voice_type || '—'}
    </p>
    <p style="text-align:center">${btn(track, 'Отследить заказ')}</p>
    <p style="color:rgba(255,255,255,0.55);font-size:13px">Файл придёт в течение 5 минут.</p>`;
  return { subject: `Заказ ${shortId(order.id)} принят — создаём ваш голос 🎀`, html: shell('Заказ принят!', body) };
}
function emailDone(order) {
  const body = `
    <p>Ваш файл готов к скачиванию!</p>
    <p style="text-align:center">${btn(order.file_url, '⬇️ Скачать голос')}</p>
    <p style="text-align:center;font-size:13px"><a href="${base()}/account" style="color:#ff8458">Или откройте личный кабинет</a></p>
    <p style="color:rgba(255,255,255,0.55);font-size:13px">Ссылка действительна 30 дней.</p>
    <p style="color:rgba(255,255,255,0.7);font-size:13px"><b>Как воспроизвести:</b> скачайте MP3 и включите на bluetooth-колонке, телефоне или подключите к проектору на празднике.</p>`;
  return { subject: 'Голос вашего малыша готов! ⬇️', html: shell('Файл готов!', body) };
}
function emailFailed(order) {
  const body = `
    <p>Что-то пошло не так при создании файла.</p>
    <p>Мы уже получили уведомление и исправим в течение 2 часов.</p>
    <p style="text-align:center">${btn('https://t.me/podarimoment', 'Написать нам', true)}</p>
    <p style="color:rgba(255,255,255,0.55);font-size:13px">Или напишите на hello@podarimoment.ru</p>`;
  return { subject: 'Произошла ошибка — мы уже разбираемся', html: shell('Мы разбираемся', body) };
}

async function sendEmail(to, { subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'hello@podarimoment.ru';
  if (!key) { console.warn('[email] RESEND_API_KEY not set, skip'); return; }
  if (!to) return;
  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `ПодариМомент <${from}>`, to: [to], subject, html }),
    });
    if (!r.ok) console.warn('[email] resend failed', r.status, await r.text().catch(() => ''));
  } catch (e) { console.warn('[email] error', e && e.message); }
}

module.exports = { sendEmail, emailPaid, emailDone, emailFailed };
