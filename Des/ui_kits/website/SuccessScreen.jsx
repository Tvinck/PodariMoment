// SuccessScreen.jsx — post-payment screen
const SuccessScreen = ({ setView }) => (
  <section className="pm-success" data-screen-label="06 Success">
    <div className="pm-ember pm-ember-1" />
    <div className="pm-success-card">
      <div className="pm-success-check">
        <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="url(#flameGrad)" /><polyline points="20,33 28,41 44,24" fill="none" stroke="#0a0a0f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="flameGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ff6b35"/><stop offset="100%" stopColor="#ffd166"/></linearGradient></defs></svg>
      </div>
      <div className="pm-caps">Заказ принят</div>
      <h1 className="pm-h1">Готово! Письмо уже <em>летит</em><br />на ваш ящик</h1>
      <p className="pm-lead">Через 5 минут получите готовый файл на email. Если не пришло — проверьте «Спам».</p>
      <div className="pm-success-row">
        <div className="pm-success-meta"><div className="pm-caps">Номер заказа</div><div>#PM-1842</div></div>
        <div className="pm-success-meta"><div className="pm-caps">Способ доставки</div><div>Email</div></div>
      </div>
      <div className="pm-success-cta-row">
        <button className="pm-btn pm-btn-primary pm-btn-lg" onClick={() => setView('landing')}>На главную</button>
        <button className="pm-btn pm-btn-ghost pm-btn-lg" onClick={() => setView('order')}>Сделать ещё один</button>
      </div>
    </div>
  </section>
);

window.SuccessScreen = SuccessScreen;
