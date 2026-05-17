// HowItWorks.jsx — 3-step strip
const HowItWorks = () => {
  const steps = [
    { n: '01', t: 'Заполните форму', d: 'Расскажите о&nbsp;герое: имя, повод, пара живых деталей.' },
    { n: '02', t: 'Оплатите онлайн', d: 'СБП, карты, ЮMoney. Безопасно через ЮКассу.' },
    { n: '03', t: 'Получите файл', d: 'Через 5&nbsp;минут готовый MP3 или MP4 на&nbsp;почте.' },
  ];
  return (
    <section id="how" className="pm-how" data-screen-label="03 How it works">
      <div className="pm-section-head">
        <div className="pm-caps">Как работает</div>
        <h2 className="pm-h2">Три шага — и&nbsp;<em>готово</em></h2>
      </div>
      <div className="pm-how-grid">
        {steps.map((s, i) => (
          <div key={s.n} className="pm-how-step">
            <div className="pm-how-num">{s.n}</div>
            <h3 className="pm-how-title">{s.t}</h3>
            <p className="pm-how-desc" dangerouslySetInnerHTML={{ __html: s.d }} />
            {i < 2 && <div className="pm-how-arrow">→</div>}
          </div>
        ))}
      </div>
    </section>
  );
};

window.HowItWorks = HowItWorks;
