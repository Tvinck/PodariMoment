// Reviews.jsx — testimonials section
const REVIEWS = [
  { name: 'Анна', age: 'Москва', text: 'Заказала песню для мамы на юбилей. Она расплакалась — в хорошем смысле. Стоит каждой копейки.', rating: 5 },
  { name: 'Дмитрий', age: 'Казань', text: 'Видео для жены сделали за 4 минуты. Она думала — я готовил неделю.', rating: 5 },
  { name: 'Светлана', age: 'СПб', text: 'Поздравление от Деда Мороза для сына. Реакция стоила 799 рублей × сто.', rating: 5 },
];

const Reviews = () => (
  <section id="reviews" className="pm-reviews" data-screen-label="04 Reviews">
    <div className="pm-section-head">
      <div className="pm-caps">Отзывы</div>
      <h2 className="pm-h2">Что <em>говорят</em></h2>
    </div>
    <div className="pm-reviews-grid">
      {REVIEWS.map((r) => (
        <div key={r.name} className="pm-review">
          <div className="pm-review-stars">{'★'.repeat(r.rating)}</div>
          <p className="pm-review-text">«{r.text}»</p>
          <div className="pm-review-author">
            <div className="pm-review-ava">{r.name[0]}</div>
            <div>
              <div className="pm-review-name">{r.name}</div>
              <div className="pm-review-loc">{r.age}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

window.Reviews = Reviews;
