// Nav.jsx — sticky glass top navigation
const Nav = ({ view, setView }) => {
  return (
    <nav className="pm-nav">
      <button className="pm-brand" onClick={() => setView('landing')}>
        <span className="pm-brand-mark">П</span>
        <span className="pm-brand-text">Подари<em>Момент</em></span>
      </button>
      <div className="pm-nav-links">
        <a onClick={(e) => { e.preventDefault(); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) || setView('landing'); }}>Продукты</a>
        <a onClick={(e) => { e.preventDefault(); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) || setView('landing'); }}>Как работает</a>
        <a onClick={(e) => { e.preventDefault(); document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) || setView('landing'); }}>Отзывы</a>
        <a onClick={() => setView('admin')} style={{ opacity: 0.5 }}>Админ</a>
      </div>
      <button className="pm-btn pm-btn-primary pm-btn-sm" onClick={() => setView('order')}>
        Заказать <span className="pm-arrow">→</span>
      </button>
    </nav>
  );
};

window.Nav = Nav;
