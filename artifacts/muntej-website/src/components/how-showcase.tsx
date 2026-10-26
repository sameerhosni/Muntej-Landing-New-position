import { useEffect, useRef, useState } from 'react';
import { translations } from '@/translations';

type T = (typeof translations)['ar'];

function useAutoplay(count: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [active, setActive] = useState(reduced ? count - 1 : 0);
  const [playing, setPlaying] = useState(!reduced);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(typeof document !== 'undefined' && document.hidden);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    const vis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, []);

  useEffect(() => {
    if (!playing || !visible || hidden || held) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), ms);
    return () => window.clearInterval(id);
  }, [playing, visible, hidden, held, count, ms]);

  const pick = (i: number) => { setActive(i); setPlaying(false); };
  const toggle = () => setPlaying((p) => !p);
  const hold = { onFocus: () => setHeld(true), onBlur: () => setHeld(false), onMouseEnter: () => setHeld(true), onMouseLeave: () => setHeld(false) };
  return { ref, active, pick, playing, toggle, hold, reduced };
}

function Svg({ d }: { d: string[] }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {d.map((p) => <path key={p} d={p} />)}
    </svg>
  );
}

const FLOW_ICONS = [
  ['M4 5h16v11H9l-5 4V5z', 'M9 10h6'],
  ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 16v4M17 18h4'],
  ['M9 4h6v3H9z', 'M7 5.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6.500a1 1 0 0 0-1-1h-1', 'm9 14 2 2 4-4'],
  ['M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5 20c.6-3.5 3.4-5.5 7-5.5s6.4 2 7 5.5'],
  ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
];

function PlayToggle({ t, playing, onClick }: { t: T; playing: boolean; onClick: () => void }) {
  return (
    <button type="button" className="r-pp" onClick={onClick} aria-pressed={!playing} data-testid="button-autoplay">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {playing ? <path d="M7 5h3.500v14H7zM13.500 5H17v14h-3.500z" /> : <path d="M8 5v14l11-7z" />}
      </svg>
      {playing ? t.demo.pause : t.demo.play}
    </button>
  );
}

export function FlowStrip({ t }: { t: T }) {
  const n = t.flow.items.length;
  const { ref, active, pick, playing, toggle, hold, reduced } = useAutoplay(n, 1900);
  return (
    <div ref={ref} className="r-fs" {...hold}>
      <ol style={{ ['--p' as string]: active / (n - 1) }}>
        {t.flow.items.map((label, i) => (
          <li key={label} className={i < active ? 'done' : i === active ? 'on' : ''} aria-current={i === active ? 'step' : undefined}>
            <button type="button" onClick={() => pick(i)} data-testid={`flow-node-${i}`}>
              <span className="r-fs-dot"><Svg d={FLOW_ICONS[i]} /></span>
              <span className="r-fs-label">{label}</span>
            </button>
          </li>
        ))}
      </ol>
      {!reduced && <PlayToggle t={t} playing={playing} onClick={toggle} />}
    </div>
  );
}

const STAGE_ICONS = [
  ['M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
  ['M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5 20c.6-3.5 3.4-5.5 7-5.5s6.4 2 7 5.5'],
  ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'm8 12 3 3 5-6'],
];
const STAGE_SHOTS = ['capture', 'autopilot', 'decisions', 'brief'];

export function HowShowcase({ t, onZoom }: { t: T; onZoom: (k: string) => void }) {
  const st = t.how.stage;
  const sources = [st.web, st.mobile, t.channels.items[0].title, t.channels.items[1].title];
  return (
    <div className="r-road-wrap">
      <div className="r-road-src">
        <span>{st.sources}</span>
        <ul>{sources.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <ol className="r-road" aria-label={t.ref.sequenceHint}>
        {t.how.steps.map((s, i) => {
          const shotItem = t.showcase.items.find((x) => x.key === STAGE_SHOTS[i])!;
          return (
            <li key={s.n} data-testid={`step-${s.n}`}>
              <div className="r-road-top">
                <span className="r-road-node" aria-hidden="true"><Svg d={STAGE_ICONS[i]} /></span>
                <span className="r-road-n" aria-hidden="true">{s.n}</span>
              </div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              <div className="r-road-val">
                <span>{t.how.valueLabel}</span>
                <b>{t.how.values[i]}</b>
              </div>
              <button type="button" className="r-road-view" aria-haspopup="dialog" aria-label={`${t.showcase.openScreen}: ${shotItem.title}`} onClick={() => onZoom(STAGE_SHOTS[i])}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                {t.how.viewScreen}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
