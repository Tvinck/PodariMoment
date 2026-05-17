// AdminTable.jsx — orders dashboard (password-gated)
const { useState: useStateA } = React;

const ORDERS = [
  { id: 'PM-1842', product: 'Песня', recipient: 'Анна', email: 'anna@mail.ru', price: 299, status: 'Готов', date: '07.05 14:32' },
  { id: 'PM-1841', product: 'Видео', recipient: 'Михаил', email: 'mike@gmail.com', price: 499, status: 'В работе', date: '07.05 14:18' },
  { id: 'PM-1840', product: 'Знаменитость', recipient: 'Светлана', email: 's.belova@yandex.ru', price: 799, status: 'Готов', date: '07.05 13:50' },
  { id: 'PM-1839', product: 'Песня', recipient: 'Денис', email: 'denis@mail.ru', price: 299, status: 'Готов', date: '07.05 13:22' },
  { id: 'PM-1838', product: 'Видео', recipient: 'Ольга', email: 'olga@gmail.com', price: 499, status: 'Ошибка', date: '07.05 12:55' },
  { id: 'PM-1837', product: 'Знаменитость', recipient: 'Виктор', email: 'v.k@inbox.ru', price: 799, status: 'Готов', date: '07.05 11:40' },
];

const StatusPill = ({ s }) => {
  const cls = s === 'Готов' ? 'ok' : s === 'В работе' ? 'wip' : 'err';
  return <span className={`pm-status pm-status-${cls}`}>{s}</span>;
};

const AdminTable = () => {
  const [pw, setPw] = useStateA('');
  const [auth, setAuth] = useStateA(false);
  const [err, setErr] = useStateA('');

  if (!auth) {
    return (
      <section className="pm-admin-gate" data-screen-label="07 Admin Login">
        <form className="pm-admin-gate-card" onSubmit={(e) => { e.preventDefault(); pw === 'admin' ? setAuth(true) : setErr('Неверный пароль (попробуйте «admin»)'); }}>
          <div className="pm-caps">Админ-панель</div>
          <h2 className="pm-h2">Введите <em>пароль</em></h2>
          <input type="password" placeholder="Пароль" className={err ? 'err' : ''} value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); }} />
          {err && <div className="pm-field-error">{err}</div>}
          <button className="pm-btn pm-btn-primary pm-btn-lg" type="submit">Войти</button>
        </form>
      </section>
    );
  }

  const total = ORDERS.reduce((s, o) => s + o.price, 0);
  const ready = ORDERS.filter((o) => o.status === 'Готов').length;

  return (
    <section className="pm-admin" data-screen-label="08 Admin Dashboard">
      <div className="pm-admin-head">
        <div>
          <div className="pm-caps">Админ-панель</div>
          <h1 className="pm-h1">Заказы <em>сегодня</em></h1>
        </div>
        <div className="pm-admin-stats">
          <div className="pm-stat"><div className="pm-stat-num">{ORDERS.length}</div><div className="pm-caps">всего</div></div>
          <div className="pm-stat"><div className="pm-stat-num">{ready}</div><div className="pm-caps">готовы</div></div>
          <div className="pm-stat"><div className="pm-stat-num">{total} ₽</div><div className="pm-caps">выручка</div></div>
        </div>
      </div>
      <div className="pm-admin-table-wrap">
        <table className="pm-admin-table">
          <thead><tr><th>№</th><th>Продукт</th><th>Получатель</th><th>Email</th><th>Сумма</th><th>Статус</th><th>Дата</th></tr></thead>
          <tbody>
            {ORDERS.map((o) => (
              <tr key={o.id}>
                <td className="pm-mono">{o.id}</td>
                <td>{o.product}</td>
                <td>{o.recipient}</td>
                <td className="pm-mono pm-fg-3">{o.email}</td>
                <td><strong>{o.price} ₽</strong></td>
                <td><StatusPill s={o.status} /></td>
                <td className="pm-fg-3">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

window.AdminTable = AdminTable;
