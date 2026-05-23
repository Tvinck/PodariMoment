// Утилиты Т-Банк (Tinkoff) Acquiring API
const crypto = require('crypto');

// Токен = SHA-256 от конкатенации значений корневых скалярных параметров
// (включая Password), отсортированных по ключу. Объекты (DATA, Receipt) и
// сам Token в расчёте не участвуют.
function genToken(params, password) {
  const src = { ...params, Password: password };
  const concat = Object.keys(src)
    .filter((k) => k !== 'Token' && k !== 'Receipt' && k !== 'DATA' && src[k] !== undefined && src[k] !== null && typeof src[k] !== 'object')
    .sort()
    .map((k) => (typeof src[k] === 'boolean' ? (src[k] ? 'true' : 'false') : String(src[k])))
    .join('');
  return crypto.createHash('sha256').update(concat, 'utf8').digest('hex');
}

function verifyToken(body, password) {
  const received = body.Token;
  const expected = genToken(body, password);
  return received && received.toLowerCase() === expected.toLowerCase();
}

module.exports = { genToken, verifyToken };
