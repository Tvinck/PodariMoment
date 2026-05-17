// LoadingScreen.jsx — Premium intro animation
const LoadingScreen = ({ onDone }) => {
  const [progress, setProgress] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    let raf, start;
    const DURATION = 2400;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 2.5);
      setProgress(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setTimeout(() => setExiting(true), 250);
        setTimeout(() => onDone && onDone(), 1100);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  const pct = Math.round(progress * 100);

  return (
    <div className={`pm-loader ${exiting ? 'pm-loader-out' : ''}`}>
      <div className="pm-loader-grid" />
      <div className="pm-loader-glow pm-loader-glow-1" />
      <div className="pm-loader-glow pm-loader-glow-2" />

      <div className="pm-loader-stage">
        <div className="pm-loader-cards">
          <div className="pm-lcard pm-lcard-1" style={{ transform: `rotate(${-12 + progress * 6}deg) translateY(${(1 - progress) * 60}px)`, opacity: progress }}>
            <div className="pm-lcard-brand">подари<em>момент</em></div>
            <div className="pm-lcard-chip" />
          </div>
          <div className="pm-lcard pm-lcard-2" style={{ transform: `rotate(${2 - progress * 1}deg) translateY(${(1 - progress) * 80}px)`, opacity: progress }}>
            <div className="pm-lcard-brand">песня</div>
            <div className="pm-lcard-note pm-lcard-n1">♪</div>
            <div className="pm-lcard-note pm-lcard-n2">♫</div>
          </div>
          <div className="pm-lcard pm-lcard-3" style={{ transform: `rotate(${10 - progress * 4}deg) translateY(${(1 - progress) * 100}px)`, opacity: progress }}>
            <div className="pm-lcard-brand">видео</div>
            <div className="pm-lcard-play">▶</div>
          </div>

          {/* sparks */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="pm-spark"
              style={{
                left: `${50 + Math.cos(i * Math.PI / 6) * 180}px`,
                top: `${50 + Math.sin(i * Math.PI / 6) * 180}px`,
                animationDelay: `${i * 0.08}s`,
                opacity: progress > 0.4 ? 1 : 0,
              }}
            />
          ))}
        </div>

        <div className="pm-loader-text">
          <div className="pm-loader-wordmark">
            {'ПодариМомент'.split('').map((c, i) => (
              <span
                key={i}
                style={{
                  opacity: progress > i / 14 ? 1 : 0,
                  transform: progress > i / 14 ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all .5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'inline-block',
                }}
              >{c}</span>
            ))}
          </div>
          <div className="pm-loader-tag">подарок, которого ещё не было</div>
        </div>

        <div className="pm-loader-bar">
          <div className="pm-loader-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="pm-loader-pct">{String(pct).padStart(3, '0')}%</div>
      </div>
    </div>
  );
};

window.LoadingScreen = LoadingScreen;
