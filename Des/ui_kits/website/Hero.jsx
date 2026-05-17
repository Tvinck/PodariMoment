// Hero.jsx — landing hero with floating gradient product cards
const Hero = ({ setView }) => {
  return (
    <section className="pm-hero" data-screen-label="01 Hero">
      <div className="pm-ember pm-ember-1" />
      <div className="pm-ember pm-ember-2" />
      <div className="pm-hero-grid">
        <div className="pm-hero-copy">
          <div className="pm-caps pm-hero-eyebrow">
            <span className="pm-dot-pulse" /> ИИ-поздравления · доставка за 5 минут
          </div>
          <h1 className="pm-hero-title">
            Подарите <em>момент,</em><br />
            который запомнится
          </h1>
          <p className="pm-hero-sub">
            ИИ-песни, видео из фото и поздравления от&nbsp;знаменитостей. Заполните форму, оплатите — готовый файл прилетит на&nbsp;почту.
          </p>
          <div className="pm-hero-cta-row">
            <button className="pm-btn pm-btn-primary pm-btn-lg" onClick={() => setView('order')}>
              Создать подарок <span className="pm-arrow">→</span>
            </button>
            <button className="pm-btn pm-btn-ghost pm-btn-lg">
              <span className="pm-play-circle">▶</span> Посмотреть пример
            </button>
          </div>
          <div className="pm-hero-stats">
            <div><strong>12 400+</strong><span>подарков сделано</span></div>
            <div><strong>4.9 ★</strong><span>средняя оценка</span></div>
            <div><strong>5 мин</strong><span>от формы до файла</span></div>
          </div>
        </div>
        <div className="pm-hero-art">
          <div className="pm-card-3d pm-card-3d-back">
            <div className="pm-card-brand">подари<em>момент</em></div>
            <div className="pm-card-chip" />
            <div className="pm-card-wave">))) </div>
          </div>
          <div className="pm-card-3d pm-card-3d-mid">
            <div className="pm-card-brand">песня</div>
            <div className="pm-card-chip" />
          </div>
          <div className="pm-card-3d pm-card-3d-front">
            <div className="pm-card-brand">видео</div>
            <div className="pm-card-chip" />
          </div>
          <div className="pm-explore-badge">
            <svg viewBox="0 0 100 100" className="pm-explore-rotate">
              <defs>
                <path id="circ" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
              </defs>
              <text fill="#f7f5f0" fontFamily="Manrope" fontSize="9" fontWeight="700" letterSpacing="3">
                <textPath href="#circ">EXPLORE · MORE · EXPLORE · MORE · </textPath>
              </text>
            </svg>
            <div className="pm-explore-arrow">↓</div>
          </div>
        </div>
      </div>
    </section>
  );
};

window.Hero = Hero;
