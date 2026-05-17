// OrderForm.jsx — tabbed order form (song / video / celeb) with validation
const { useState } = React;

const OCCASIONS = ['День рождения', 'Юбилей', 'Свадьба', 'Новый год', 'Другое'];
const GENRES = ['Поп', 'Рэп', 'Романтика', 'Весёлая'];
const STYLES = ['Нежный', 'Весёлый', 'Торжественный', 'Магический'];
const TRACKS = ['Кинематограф', 'Электро-поп', 'Лаунж', 'Оркестр', 'Хип-хоп'];
const CELEBS = ['Дед Мороз', 'Нагиев', 'Харламов', 'Другой'];

const TABS = [
  { id: 'song',  label: 'ИИ-песня',  price: 299 },
  { id: 'video', label: 'Видео из фото', price: 499 },
  { id: 'celeb', label: 'От знаменитости', price: 799 },
];

const Field = ({ label, error, children }) => (
  <div className="pm-field">
    <label className="pm-caps pm-field-label">{label}</label>
    {children}
    {error && <div className="pm-field-error">{error}</div>}
  </div>
);

const PillRadio = ({ options, value, onChange }) => (
  <div className="pm-pill-row">
    {options.map((o) => (
      <button key={o} type="button" className={`pm-pill ${value === o ? 'sel' : ''}`} onClick={() => onChange(o)}>{o}</button>
    ))}
  </div>
);

const OrderForm = ({ initialProduct, setView }) => {
  const [tab, setTab] = useState(initialProduct || 'song');
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState([]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const price = TABS.find((t) => t.id === tab).price;

  const validate = () => {
    const e = {};
    if (!data.name?.trim()) e.name = 'Укажите имя получателя';
    if (!data.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Похоже, в адресе опечатка';
    if (!data.occasion) e.occasion = 'Выберите повод';
    if (tab === 'song') {
      if (!data.genre) e.genre = 'Выберите жанр';
      if (!data.facts?.trim() || data.facts.length < 20) e.facts = 'Хотя бы 3 коротких факта';
    }
    if (tab === 'video') {
      if (!data.style) e.style = 'Выберите стиль';
      if (!photos.length) e.photos = 'Загрузите хотя бы одно фото';
      if (!data.track) e.track = 'Выберите музыку';
    }
    if (tab === 'celeb') {
      if (!data.celeb) e.celeb = 'Выберите персонажа';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setView('success'); }, 1200);
  };

  const onPhotos = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 15);
    setPhotos(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })));
  };

  return (
    <section className="pm-order" data-screen-label="05 Order">
      <div className="pm-ember pm-ember-1" />
      <div className="pm-order-head">
        <div className="pm-caps">Шаг 1 из 2 — детали</div>
        <h1 className="pm-h1">Расскажите о <em>герое</em></h1>
      </div>
      <div className="pm-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`pm-tab ${tab === t.id ? 'act' : ''}`} onClick={() => { setTab(t.id); setErrors({}); }}>
            {t.label} <span className="pm-tab-price">{t.price} ₽</span>
          </button>
        ))}
      </div>

      <form className="pm-form" onSubmit={submit}>
        <Field label="Имя получателя" error={errors.name}>
          <input className={errors.name ? 'err' : ''} placeholder="Например, Анна" value={data.name || ''} onChange={(e) => set('name', e.target.value)} />
        </Field>

        <Field label="Повод" error={errors.occasion}>
          <select className={errors.occasion ? 'err' : ''} value={data.occasion || ''} onChange={(e) => set('occasion', e.target.value)}>
            <option value="">Выберите повод</option>
            {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>

        {tab === 'song' && (
          <>
            <Field label="Жанр" error={errors.genre}>
              <PillRadio options={GENRES} value={data.genre} onChange={(v) => set('genre', v)} />
            </Field>
            <Field label="Факты о человеке" error={errors.facts}>
              <textarea rows={5} className={errors.facts ? 'err' : ''} placeholder="3–5 фактов: характер, увлечения, общие шутки, мечты…" value={data.facts || ''} onChange={(e) => set('facts', e.target.value)} />
            </Field>
          </>
        )}

        {tab === 'video' && (
          <>
            <Field label="Стиль" error={errors.style}>
              <PillRadio options={STYLES} value={data.style} onChange={(v) => set('style', v)} />
            </Field>
            <Field label="Фотографии (до 15)" error={errors.photos}>
              <label className={`pm-dropzone ${errors.photos ? 'err' : ''}`}>
                <input type="file" multiple accept="image/jpeg,image/png" onChange={onPhotos} hidden />
                <div className="pm-dropzone-icon">↑</div>
                <div className="pm-dropzone-text">
                  {photos.length ? `${photos.length} фото загружено` : 'Перетащите или выберите JPG/PNG'}
                </div>
                <div className="pm-dropzone-hint">До 15 файлов · до 10 МБ каждый</div>
              </label>
              {photos.length > 0 && (
                <div className="pm-photo-strip">
                  {photos.map((p, i) => <div key={i} className="pm-photo-thumb" style={{ backgroundImage: `url(${p.url})` }} />)}
                </div>
              )}
            </Field>
            <Field label="Музыка" error={errors.track}>
              <PillRadio options={TRACKS} value={data.track} onChange={(v) => set('track', v)} />
            </Field>
          </>
        )}

        {tab === 'celeb' && (
          <>
            <Field label="Персонаж" error={errors.celeb}>
              <PillRadio options={CELEBS} value={data.celeb} onChange={(v) => set('celeb', v)} />
            </Field>
            <Field label="Пожелания (необязательно)">
              <textarea rows={4} placeholder="Что хотите услышать в поздравлении?" value={data.wishes || ''} onChange={(e) => set('wishes', e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Email заказчика" error={errors.email}>
          <input type="email" className={errors.email ? 'err' : ''} placeholder="anna@example.com" value={data.email || ''} onChange={(e) => set('email', e.target.value)} />
        </Field>

        <div className="pm-order-foot">
          <div className="pm-order-total">
            <div className="pm-caps">Итого</div>
            <div className="pm-order-price">{price} <small>₽</small></div>
          </div>
          <button type="submit" className="pm-btn pm-btn-primary pm-btn-lg" disabled={submitting}>
            {submitting ? 'Отправляем…' : <>Оплатить {price} ₽ <span className="pm-arrow">→</span></>}
          </button>
        </div>
      </form>
    </section>
  );
};

window.OrderForm = OrderForm;
