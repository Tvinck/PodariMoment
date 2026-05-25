// Проверка пароля админки. Пароль живёт ТОЛЬКО в env на сервере
// (process.env.ADMIN_PASSWORD), никогда не отдаётся клиенту.
const crypto = require('crypto');

function checkAdmin(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { checkAdmin };
