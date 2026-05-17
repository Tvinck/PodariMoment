// ProductCards.jsx — three-up product grid
const PRODUCTS = [
  {
    id: 'song',
    label: 'Песня',
    title: 'ИИ-песня',
    italic: 'на заказ',
    desc: 'Текст, голос и бит — всё про вашего человека. MP3 готов за 5 минут.',
    price: 299,
    badge: 'Хит',
    icon: 'M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  },
  {
    id: 'video',
    label: 'Видео из фото',
    title: 'Видео',
    italic: 'из ваших фото',
    desc: 'До 15 кадров, музыка и плавные переходы. MP4 в Full HD.',
    price: 499,
    badge: null,
    icon: 'M23 7l-7 5 7 5V7z M16 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
  },
  {
    id: 'celeb',
    label: 'От знаменитости',
    title: 'Поздравление',
    italic: 'от звезды',
    desc: 'Дед Мороз, Нагиев, Харламов — узнаваемый голос для вашего адресата.',
    price: 799,
    badge: 'Премиум',
    icon: 'M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z',
  },
];

const ProductCards = ({ setView, setProduct }) => {
  return (
    <section id="products" className="pm-products" data-screen-label="02 Products">
      <div className="pm-section-head">
        <div className="pm-caps">Продукты</div>
        <h2 className="pm-h2">Три способа <em>удивить</em></h2>
      </div>
      <div className="pm-products-grid">
        {PRODUCTS.map((p) => (
          <article
            key={p.id}
            className="pm-product-card"
            onClick={() => { setProduct(p.id); setView('order'); }}
          >
            <div className="pm-product-glow" />
            {p.badge && <div className="pm-product-badge">{p.badge}</div>}
            <div className="pm-product-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.icon} />
              </svg>
            </div>
            <div className="pm-caps pm-product-label">{p.label}</div>
            <h3 className="pm-product-title">{p.title} <em>{p.italic}</em></h3>
            <p className="pm-product-desc">{p.desc}</p>
            <div className="pm-product-foot">
              <span className="pm-product-cta">Создать <span className="pm-arrow">→</span></span>
              <span className="pm-product-price">{p.price} ₽</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

window.ProductCards = ProductCards;
window.PM_PRODUCTS = PRODUCTS;
