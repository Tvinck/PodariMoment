// GenderFields.jsx — premium-shimmer voice announcement for gender reveal parties
const { useState, useRef, useEffect } = React;

const REVEAL_OPTIONS = [
  { id: 'boy', label: 'Мальчик', emoji: '💙' },
  { id: 'girl', label: 'Девочка', emoji: '💗' },
  { id: 'surprise', label: 'Сюрприз — пусть выберет ИИ', emoji: '❓' },
];

const VOICE_OPTIONS = [
  { id: 'male',    label: 'Мужской', emoji: '👨', freq: 160, type: 'sine' },
  { id: 'female',  label: 'Женский', emoji: '👩', freq: 240, type: 'sine' },
  { id: 'child',   label: 'Детский', emoji: '🧒', freq: 340, type: 'triangle' },
  { id: 'star',    label: 'Звезда',  emoji: '🎤', freq: 200, type: 'sawtooth', add: 200 },
  { id: 'showman', label: 'Шоумен',  emoji: '🎙', freq: 180, type: 'square' },
];

const VIBE_OPTIONS = ['🥹 Душевно', '🎉 Громко-весело', '🎬 Кинематика', '🤡 С приколом', '✨ Загадочно'];
const FMT_OPTIONS = ['🔊 MP3 (для колонки)', '🎬 MP4 — видео с анимацией', '📱 Вертикальное (для соцсетей)'];
const DUR_OPTIONS = ['15 секунд', '30 секунд', '1 минута (+200 ₽)'];

const SCRIPTS = {
  cinema: 'Тёмный экран. Гул барабанов нарастает. «Анна и Михаил… после долгих месяцев ожидания… ваш малыш — это…» Пауза три секунды. «Сын!»',
  fun:    'Привет всем! Кто думал «девочка» — поднимите руки. Кто «мальчик» — вторую руку. А теперь барабанная дробь… и у Анны с Михаилом будет дочка! Никаких споров.',
  soul:   'Анна, Михаил. Сегодня в вашем доме рождается имя. Сегодня в вашей жизни — новый смысл. И этот смысл зовут… дочка. С любовью — от всех нас.',
  quiet:  'Загадайте число. Загадали? А теперь представьте: первая улыбка, первое слово, первый шаг. Всё это случится — с вашим сыном.',
};

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
);

const RevealStage = ({ reveal, voice, vibe, duration }) => {
  const cur = REVEAL_OPTIONS.find((o) => o.id === reveal) || REVEAL_OPTIONS[0];
  const v = VOICE_OPTIONS.find((o) => o.id === voice);
  return (
    <div className="pm-reveal-stage" data-reveal={reveal} aria-label="Превью анонса">
      <div className="pm-reveal-inner">
        <div className="pm-reveal-eyebrow">Превью · реакция гостей</div>
        <div className="pm-reveal-headline">«У вас будет…»</div>
        <div className="pm-reveal-pill">{cur.emoji} <span>{cur.label}</span></div>
        <div className="pm-reveal-meta">
          {(v ? v.label.toLowerCase() : '—')} голос · {vibe.replace(/^[^\s]+\s/, '').toLowerCase()} · {duration}
        </div>
      </div>
    </div>
  );
};

const VoiceChip = ({ opt, selected, playing, onPlay, onSelect }) => (
  <button
    type="button"
    className={`pm-voice-chip${selected ? ' sel' : ''}${playing ? ' playing' : ''}`}
    onClick={onSelect}
    role="radio"
    aria-checked={selected}
    aria-label={`Голос: ${opt.label}${opt.add ? ', +' + opt.add + ' ₽' : ''}. Нажмите play для прослушивания.`}
  >
    <span
      className="pm-vc-play"
      onClick={(e) => { e.stopPropagation(); onPlay(); }}
      aria-label="Воспроизвести превью"
    ><PlayIcon /></span>
    <span>{opt.emoji} {opt.label}{opt.add && <span className="pm-vc-add">+{opt.add} ₽</span>}</span>
    <span className="pm-vc-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>
  </button>
);

const GenderFields = ({ data, set, errors }) => {
  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  const reveal = data.greveal || 'boy';
  const voice = data.gvoice || 'male';
  const vibe = data.gvibe || VIBE_OPTIONS[2];
  const fmt = data.gfmt || FMT_OPTIONS[1];
  const duration = data.gdur || DUR_OPTIONS[1];

  const stopAudio = () => {
    if (audioRef.current) {
      try { audioRef.current.osc.stop(); audioRef.current.ctx.close(); } catch (_) {}
      audioRef.current = null;
    }
    setPlaying(null);
  };

  const playVoice = (opt) => {
    if (playing === opt.id) { stopAudio(); return; }
    stopAudio();
    setPlaying(opt.id);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), g = ctx.createGain();
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      osc.type = opt.type; osc.frequency.value = opt.freq;
      lfo.frequency.value = 5; lfoG.gain.value = 8;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.08);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.6);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); lfo.start();
      audioRef.current = { osc, ctx };
      setTimeout(stopAudio, 2700);
    } catch (_) { setTimeout(() => setPlaying(null), 2500); }
  };

  useEffect(() => () => stopAudio(), []);

  const useTemplate = (key) => set('gscript', SCRIPTS[key]);

  const voiceObj = VOICE_OPTIONS.find((o) => o.id === voice);
  let total = 599;
  const adds = [];
  if (voiceObj && voiceObj.add) { total += voiceObj.add; adds.push('звезда'); }
  if (duration.indexOf('1 минута') !== -1) { total += 200; adds.push('1 мин'); }

  return (
    <>
      <RevealStage reveal={reveal} voice={voice} vibe={vibe} duration={duration} />

      <div className="pm-field">
        <label className="pm-caps pm-field-label">Что обнародуем</label>
        <div className="pm-pill-row">
          {REVEAL_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              data-rv={o.id}
              className={`pm-pill${reveal === o.id ? ' sel' : ''}`}
              onClick={() => set('greveal', o.id)}
            >{o.emoji} {o.label}</button>
          ))}
        </div>
        {errors.greveal && <div className="pm-field-error">{errors.greveal}</div>}
      </div>

      <div className="pm-field">
        <label className="pm-caps pm-field-label">Голос объявляющего <span style={{ opacity: 0.5, fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>— нажмите ▶, чтобы послушать</span></label>
        <div className="pm-voice-row" role="radiogroup" aria-label="Голос объявляющего">
          {VOICE_OPTIONS.map((opt) => (
            <VoiceChip
              key={opt.id}
              opt={opt}
              selected={voice === opt.id}
              playing={playing === opt.id}
              onSelect={() => set('gvoice', opt.id)}
              onPlay={() => playVoice(opt)}
            />
          ))}
        </div>
      </div>

      <div className="pm-field">
        <label className="pm-caps pm-field-label">Стиль анонса</label>
        <div className="pm-pill-row">
          {VIBE_OPTIONS.map((v) => (
            <button key={v} type="button" className={`pm-pill${vibe === v ? ' sel' : ''}`} onClick={() => set('gvibe', v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="pm-field">
        <label className="pm-caps pm-field-label">Формат</label>
        <div className="pm-pill-row">
          {FMT_OPTIONS.map((f) => (
            <button key={f} type="button" className={`pm-pill${fmt === f ? ' sel' : ''}`} onClick={() => set('gfmt', f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="pm-field">
        <label className="pm-caps pm-field-label">Имена родителей</label>
        <input placeholder="Анна и Михаил" value={data.gparents || ''} onChange={(e) => set('gparents', e.target.value)} />
        {errors.gparents && <div className="pm-field-error">{errors.gparents}</div>}
      </div>

      <div className="pm-field">
        <label className="pm-caps pm-field-label">Длительность</label>
        <select value={duration} onChange={(e) => set('gdur', e.target.value)}>
          {DUR_OPTIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="pm-field">
        <label className="pm-caps pm-field-label">Сценарий / о чём сказать</label>
        <textarea
          rows={3}
          placeholder="Опишите драматургию анонса своими словами…"
          value={data.gscript || ''}
          onChange={(e) => set('gscript', e.target.value)}
          className={errors.gscript ? 'err' : ''}
        />
        <div className="pm-script-tmpl-row">
          <button type="button" className="pm-script-tmpl" onClick={() => useTemplate('cinema')}>🎬 Кинодрама</button>
          <button type="button" className="pm-script-tmpl" onClick={() => useTemplate('fun')}>😂 С приколом</button>
          <button type="button" className="pm-script-tmpl" onClick={() => useTemplate('soul')}>🥹 Душевно</button>
          <button type="button" className="pm-script-tmpl" onClick={() => useTemplate('quiet')}>✨ Загадочно</button>
        </div>
        {errors.gscript && <div className="pm-field-error">{errors.gscript}</div>}
      </div>

      <div className="pm-gender-price-preview" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(20,20,31,0.92), rgba(28,28,48,0.92))',
        border: '1px solid var(--pm-line-2)', marginTop: 8,
      }}>
        <div>
          <div className="pm-caps" style={{ fontSize: 10 }}>Предв. итог</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <b style={{ fontFamily: 'var(--pm-font-display)', fontSize: 22, background: 'var(--pm-grad-flame)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 800 }}>{total} ₽</b>
            <span style={{ fontSize: 11, opacity: 0.6 }}>{adds.length ? '+ ' + adds.join(' · ') : 'базовый пакет'}</span>
          </div>
        </div>
      </div>
    </>
  );
};

window.GenderFields = GenderFields;
window.PM_GENDER_DEFAULTS = { greveal: 'boy', gvoice: 'male', gvibe: VIBE_OPTIONS[2], gfmt: FMT_OPTIONS[1], gdur: DUR_OPTIONS[1] };
