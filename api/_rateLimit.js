// Простой in-memory rate limiter (в пределах одного serverless-инстанса).
// Не распределённый — для базовой защиты от флуда этого достаточно.
const buckets = new Map(); // key → { count, reset }

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim();
  return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Возвращает true, если запрос разрешён; false — если лимит превышен.
function rateLimit(req, { key, limit, windowMs = 60000 }) {
  const id = `${key}:${clientIp(req)}`;
  const now = Date.now();
  let b = buckets.get(id);
  if (!b || now > b.reset) { b = { count: 0, reset: now + windowMs }; buckets.set(id, b); }
  b.count += 1;
  // периодическая чистка, чтобы Map не рос бесконечно
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  return b.count <= limit;
}

module.exports = { rateLimit, clientIp };
