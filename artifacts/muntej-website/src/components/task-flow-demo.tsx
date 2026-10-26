import { useEffect, useRef, useState } from 'react';
import type { Translation } from '@/translations';
import { ToolIcon } from '@/components/tool-icons';
import '../task-flow-demo.css';

const W = 1000;
const H = 460;
const SRC_Y = [40, 130, 220, 310, 400];
const TEAM_Y = [60, 230, 400];
const ENG = { x: 350, y: 230 };
const TEAM_X = 540;
const APP = { x: 745, y: 230 };
const DONE_X = 925;

const pathsIn = SRC_Y.map((y) => `M190 ${y} C 260 ${y} 235 ${ENG.y} 292 ${ENG.y}`);
const pathsOut = TEAM_Y.map((y) => `M408 ${ENG.y} C 445 ${ENG.y} 440 ${y} 473 ${y}`);
const pathsBack = pathsOut;
const pathsApp = TEAM_Y.map((y) => `M607 ${y} C 645 ${y} 645 ${APP.y} 685 ${APP.y}`);
const pathDone = `M805 ${APP.y} L 865 ${APP.y}`;
const pathLoop = `M${APP.x} ${APP.y + 38} C ${APP.x} 520 ${ENG.x} 520 ${ENG.x} ${ENG.y + 62}`;

const px = (x: number, mir: boolean) => `${((mir ? W - x : x) / W) * 100}%`;
const py = (y: number) => `${(y / H) * 100}%`;

function Glyph({ d }: { d: string[] }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {d.map((p) => <path key={p} d={p} />)}
    </svg>
  );
}
const USER = ['M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5 20c.6-3.5 3.4-5.5 7-5.5s6.4 2 7 5.5'];
const CHECK = ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'm8 12 3 3 5-6'];
const DECIDE = ['M9 11l3 3 8-8', 'M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9'];

export function TaskFlowDemo({ t, onView }: { t: Translation; onView: () => void }) {
  const f = t.hero.tf;
  const mir = t.dir === 'rtl';
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef(onView);
  viewRef.current = onView;
  const seen = useRef(false);
  const [reduced, setReduced] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener('change', h);
    const vis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => { mq.removeEventListener('change', h); document.removeEventListener('visibilitychange', vis); };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting && !seen.current) { seen.current = true; viewRef.current(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const run = !reduced && playing && visible && !hidden;
  useEffect(() => {
    const s = svgRef.current;
    if (!s || typeof s.pauseAnimations !== 'function') return;
    if (run) s.unpauseAnimations(); else s.pauseAnimations();
  }, [run, reduced]);

  const dot = (id: string, cls: string, dur: number, delay: number, back = false) => (
    <circle key={`${id}-${delay}-${back}`} r="4.5" opacity="0" className={`tf-dot ${cls}`}>
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.95;1" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" {...(back ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}>
        <mpath href={`#${id}`} />
      </animateMotion>
    </circle>
  );

  const names = f.team;
  return (
    <div ref={rootRef} className={`tf${run ? ' tf-run' : ''}`} data-testid="task-flow-demo" role="group" aria-label={f.title}>
      <p className="sr-only">{f.summary}</p>

      {/* desktop map */}
      <div className="tf-map" aria-hidden="true">
        <svg ref={svgRef} className="tf-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" focusable="false">
          <g transform={mir ? `translate(${W},0) scale(-1,1)` : undefined}>
            <defs>
              {pathsIn.map((d, i) => <path key={i} id={`tf-in-${i}`} d={d} />)}
              {pathsOut.map((d, i) => <path key={i} id={`tf-out-${i}`} d={d} />)}
              {pathsApp.map((d, i) => <path key={i} id={`tf-app-${i}`} d={d} />)}
              <path id="tf-done" d={pathDone} />
              <path id="tf-loop" d={pathLoop} />
            </defs>
            {pathsIn.map((d, i) => <path key={`a${i}`} d={d} className="tf-line" />)}
            {pathsOut.map((d, i) => <path key={`b${i}`} d={d} className="tf-line" />)}
            {pathsApp.map((d, i) => <path key={`c${i}`} d={d} className="tf-line" />)}
            <path d={pathDone} className="tf-line tf-line-ok" />
            <path d={pathLoop} className="tf-line tf-line-back" />
            {!reduced && (
              <>
                {pathsIn.map((_, i) => dot(`tf-in-${i}`, 'in', 3.4, i * 0.7))}
                {pathsOut.map((_, i) => dot(`tf-out-${i}`, 'in', 2.4, 1.2 + i * 0.5))}
                {pathsBack.map((_, i) => dot(`tf-out-${i}`, 'back', 2.8, 2 + i * 0.6, true))}
                {pathsApp.map((_, i) => dot(`tf-app-${i}`, 'in', 2.4, 2.4 + i * 0.5))}
                {dot('tf-done', 'ok', 1.6, 3.4)}
                {dot('tf-loop', 'rev', 4.2, 1.5)}
              </>
            )}
          </g>
        </svg>

        {t.channels.items.map((c, i) => (
          <div key={c.title} className="tf-node tf-src" style={{ left: px(100, mir), top: py(SRC_Y[i]) }}>
            <ToolIcon index={i} />
            <span><b>{c.title}</b><i>{f.examples[i]}</i></span>
          </div>
        ))}

        <div className="tf-node tf-engine" style={{ left: px(ENG.x, mir), top: py(ENG.y) }}>
          <img src={`${base}brand/favicon.png`} alt="" width={40} height={40} />
          <b>{t.brand}</b>
          <i>{f.engineSub}</i>
        </div>

        {names.map((n, i) => (
          <div key={n} className="tf-node tf-team" style={{ left: px(TEAM_X, mir), top: py(TEAM_Y[i]) }}>
            <Glyph d={USER} />
            <span><b>{n}</b><i>{f.teamHint}</i></span>
          </div>
        ))}

        <div className="tf-node tf-approve" style={{ left: px(APP.x, mir), top: py(APP.y) }}>
          <Glyph d={DECIDE} />
          <b>{f.approvalTitle}</b>
          <i>{f.approve} / {f.revise}</i>
        </div>

        <div className="tf-node tf-done" style={{ left: px(DONE_X, mir), top: py(APP.y) }}>
          <Glyph d={CHECK} />
          <b>{f.doneTitle}</b>
        </div>

        <span className="tf-tag tf-tag-ok" style={{ left: px(835, mir), top: py(APP.y - 28) }}>{f.approve}</span>
        <span className="tf-tag tf-tag-back" style={{ left: px(548, mir), top: py(436) }}>{f.loopNote}</span>
      </div>

      {/* mobile vertical flow */}
      <ol className="tf-stack">
        <li>
          <h3>{f.heads[0]}</h3>
          <ul className="tf-chips">
            {t.channels.items.map((c, i) => (
              <li key={c.title}><ToolIcon index={i} /><span><b>{c.title}</b><i>{f.examples[i]}</i></span></li>
            ))}
          </ul>
        </li>
        <li className="tf-engine-m">
          <h3>{f.heads[1]}</h3>
          <div className="tf-eng-card"><img src={`${base}brand/favicon.png`} alt="" width={36} height={36} /><span><b>{t.brand}</b><i>{f.engineSub}</i></span></div>
        </li>
        <li>
          <h3>{f.heads[2]}</h3>
          <ul className="tf-chips tf-chips-team">
            {names.map((n) => <li key={n}><Glyph d={USER} /><span><b>{n}</b><i>{f.teamHint}</i></span></li>)}
          </ul>
        </li>
        <li>
          <h3>{f.heads[3]}</h3>
          <div className="tf-decide">
            <span className="ok"><Glyph d={CHECK} />{f.approve}<i>{f.doneTitle}</i></span>
            <span className="rev"><Glyph d={DECIDE} />{f.revise}<i>{f.loopNote}</i></span>
          </div>
        </li>
      </ol>

      <div className="tf-foot">
        <p>{f.illus}</p>
        {!reduced && (
          <button type="button" className="r-pp" aria-pressed={!playing} onClick={() => setPlaying((p) => !p)} data-testid="button-hero-flow-pause">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
            {playing ? t.demo.pause : t.demo.play}
          </button>
        )}
      </div>
    </div>
  );
}
