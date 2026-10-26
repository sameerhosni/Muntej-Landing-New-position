import { useEffect, useRef, useState } from 'react';
import '../home-ref.css';
import { translations, type Lang } from '@/translations';
import { Footer, Header, Shell } from '@/components/site-chrome';
import { TaskFlowDemo } from '@/components/task-flow-demo';
import { PhoneDemo } from '@/components/phone-demo';
import { LeadForm } from '@/components/lead-form';
import { useTrack } from '@/lib/site';

const ICONS: Record<string, string[]> = {
  chat: ['M4 5h16v11H9l-5 4V5z', 'M8 9h8M8 12.5h5'],
  mic: ['M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
  bell: ['M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7', 'M10 20a2 2 0 0 0 4 0'],
  flag: ['M5 21V4', 'M5 4h12l-2 4 2 4H5'],
  layers: ['M12 3 3 8l9 5 9-5-9-5z', 'M3 13l9 5 9-5', 'M3 17.5l9 5 9-5'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  hand: ['M9 11V5a1.5 1.5 0 0 1 3 0v5', 'M12 10V4a1.5 1.5 0 0 1 3 0v7', 'M15 11V7a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L9 15'],
  target: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 12h.01'],
  gauge: ['M4 19a9 9 0 1 1 16 0', 'M12 14l4-5'],
  award: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M8.5 14 7 21l5-3 5 3-1.5-7'],
  sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
};

function Icon({ name }: { name: string }) {
  return (
    <span className="m-icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {(ICONS[name] ?? []).map((d) => <path key={d} d={d} />)}
      </svg>
    </span>
  );
}

function Mark({ kind }: { kind: 'x' | 'check' }) {
  return (
    <span className="r-mark" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={kind === 'x' ? 'M6 6l12 12M18 6L6 18' : 'm5 12 5 5 9-10'} />
      </svg>
    </span>
  );
}


export default function Home({ lang }: { lang: Lang }) {
  const t = translations[lang];
  const track = useTrack(lang);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const base = import.meta.env.BASE_URL;
  const shot = (key: string) => `${base}screens/muntej-${key}-${lang}.webp`;
  const item = (key: string) => t.showcase.items.find((s) => s.key === key)!;
  const opened = openKey ? item(openKey) : null;
  const split = t.hero.title.match(/^(.*?(?:…|\.))\s*(.+)$/s);

  useEffect(() => {
    const rawHash = window.location.hash.slice(1);
    if (!rawHash) return;
    let targetId = rawHash;
    try { targetId = decodeURIComponent(rawHash); } catch { /* ignore */ }
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function enlarge(key: string) {
    setOpenKey(key);
    dialog.current?.showModal();
  }

  return (
    <Shell lang={lang} t={t} seo={t.seo}>
      <Header lang={lang} t={t} />
      <main id="main" className="r-page">
        {/* Hero: promise + compact chat */}
        <section className="r-hero" id="hero">
          <div className="m-wrap r-hero-grid">
            <div>
              <span className="m-badge" data-testid="text-hero-badge">{t.hero.badge}</span>
              <h1 className="m-h1" data-testid="text-hero-title">
                {split ? <>{split[1]} <span className="r-accent">{split[2]}</span></> : t.hero.title}
              </h1>
              <p className="sub">{t.hero.sub}</p>
              <div className="m-hero-actions">
                <a href="#early-access" className="m-btn m-btn-primary m-btn-shine" onClick={() => track('cta_join_click', 'hero')} data-testid="button-cta-hero">{t.cta}</a>
                <a href="#how" className="m-btn m-btn-ghost" data-testid="button-cta-how">{t.hero.howCta}</a>
              </div>
            </div>
            <div className="r-chat-wrap">
              <div className="r-hero-screens" aria-hidden="true">
                <img className="r-hero-screen r-hero-screen-start" src={shot('home')} alt="" width={473} height={1024} decoding="async" draggable={false} />
                <img className="r-hero-screen r-hero-screen-end" src={shot('decisions')} alt="" width={473} height={1024} decoding="async" draggable={false} />
              </div>
              <PhoneDemo t={t} onView={() => track('demo_view', 'hero')} />
            </div>
          </div>
        </section>

        {/* Before / after */}
        <section className="r-sec" id="problem">
          <span id="results" className="m-anchor-alias" aria-hidden="true" />
          <span id="promise" className="m-anchor-alias" aria-hidden="true" />
          <div className="m-wrap">
            <div className="r-head">
              <span className="r-eyebrow">{t.problems.eyebrow}</span>
              <h2 className="m-h2">{t.ref.compareTitle}</h2>
              <p className="m-lead">{t.problems.intro}</p>
            </div>
            <p className="r-task">{t.ref.compareTask}</p>
            <div className="r-cmp" role="table">
              <div className="r-cmp-row r-cmp-head" role="row">
                <span aria-hidden="true" />
                <span role="columnheader">{t.ref.beforeLabel}</span>
                <span aria-hidden="true" />
                <span role="columnheader" className="after">{t.ref.afterLabel}</span>
              </div>
              {t.ref.rows.map((r, i) => (
                <div key={r.k} className="r-cmp-row" role="row" data-testid={`compare-${i}`}>
                  <b role="rowheader" className="r-cmp-k">{r.k}</b>
                  <span role="cell" className="r-cmp-b"><Mark kind="x" />{r.b}</span>
                  <span className="r-cmp-arrow" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                  </span>
                  <span role="cell" className="r-cmp-a"><Mark kind="check" />{r.a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works with screen */}
        <section className="r-sec" id="how" style={{ background: '#fff' }}>
          <span id="showcase" className="m-anchor-alias" aria-hidden="true" />
          <span id="how-it-works" className="m-anchor-alias" aria-hidden="true" />
          <span id="gallery" className="m-anchor-alias" aria-hidden="true" />
          <span id="channels" className="m-anchor-alias" aria-hidden="true" />
          <span id="day" className="m-anchor-alias" aria-hidden="true" />
          <span id="journey" className="m-anchor-alias" aria-hidden="true" />
          <div className="m-wrap">
            <div className="r-head">
              <span className="r-eyebrow">{t.how.eyebrow}</span>
              <h2 className="m-h2">{t.how.title}</h2>
              <p className="m-lead">{t.how.sub}</p>
            </div>
            <TaskFlowDemo t={t} onView={() => track('demo_view', 'how')} />
          </div>
        </section>

        {/* Manager + employee outcomes */}
        <section className="r-sec" id="benefits" style={{ background: '#fff' }}>
          <span id="capabilities" className="m-anchor-alias" aria-hidden="true" />
          <span id="managers" className="m-anchor-alias" aria-hidden="true" />
          <span id="employees" className="m-anchor-alias" aria-hidden="true" />
          <div className="m-wrap">
            <div className="r-duo">
              <div className="r-panel">
                <div className="r-panel-head">
                  <img src={`${base}illustrations/focused-manager.webp`} alt="" width={595} height={445} loading="lazy" decoding="async" />
                  <div>
                    <span className="r-eyebrow">{t.manager.eyebrow}</span>
                    <h2 className="r-panel-title">{t.manager.title}</h2>
                  </div>
                </div>
                <ol className="r-ben">
                  {[1, 2, 0].map((k) => {
                    const x = t.manager.items[k];
                    return (
                      <li key={k} data-testid={`card-manager-${k}`}>
                        <Icon name={x.icon} />
                        <span><b>{x.t}</b><span className="d">{x.d}</span></span>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div className="r-panel" id="team">
                <div className="r-panel-head">
                  <div>
                    <span className="r-eyebrow">{t.employee.eyebrow}</span>
                    <h2 className="r-panel-title">{t.employee.title}</h2>
                  </div>
                </div>
                <div className="r-emp-body">
                  <ol className="r-ben">
                    {t.employee.items.slice(0, 3).map((x, i) => (
                      <li key={i} data-testid={`item-employee-${i}`}>
                        <Icon name={['target', 'hand', 'award'][i]} />
                        <span><b>{x.t}</b><span className="d">{x.d}</span></span>
                      </li>
                    ))}
                  </ol>
                  <figure className="r-phone-mini">
                    <div className="r-phone-stage">
                      <img src={shot('employee')} alt={item('employee').alt} width={585} height={1266} loading="lazy" decoding="async" />
                      <ul aria-hidden="true">
                        <li className="ok">{t.demo.btnDone}</li>
                        <li className="blk">{t.demo.btnBlocked}</li>
                        <li className="wait">{t.demo.btnLater}</li>
                      </ul>
                    </div>
                    <figcaption>{t.ref.exampleLabel}</figcaption>
                  </figure>
                </div>
                <p className="r-emp-intro">{t.employee.intro}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product features */}
        <section className="r-sec" id="differentiators">
          <span id="features" className="m-anchor-alias" aria-hidden="true" />
          <div className="m-wrap">
            <div className="r-head">
              <span className="r-eyebrow">{t.differentiators.eyebrow}</span>
              <h2 className="m-h2">{t.differentiators.title}</h2>
              <p className="m-lead">{t.differentiators.intro}</p>
            </div>
            <div className="r-feats">
              {t.differentiators.items.map((d, i) => {
                const c = { key: d.screen };
                const it = item(c.key);
                return (
                  <article key={d.title} className="r-feat" data-testid={`card-differentiator-${i}`}>
                    <div className="r-feat-body">
                      <Icon name={d.icon} />
                      <div>
                        <h3>{d.title}</h3>
                        <p>{d.description}</p>
                      </div>
                    </div>
                    <button type="button" className="r-screen-link" aria-haspopup="dialog" aria-label={`${t.ref.viewScreen}: ${it.title}`} onClick={() => enlarge(c.key)}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></svg>
                      {t.ref.viewScreen}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="r-sec r-cta" id="contact-form">
          <div className="m-wrap r-ctafaq">
            <div className="r-ctafaq-form"><LeadForm t={t} lang={lang} /></div>
            <div className="r-ctafaq-faq" id="faq">
              <span className="r-eyebrow">{t.faq.eyebrow}</span>
              <div className="m-faq">
                {t.faq.items.map((x, i) => (
                  <details key={i} data-testid={`faq-${i}`}>
                    <summary>{x.q}</summary>
                    <p>{x.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer lang={lang} t={t} />
      <dialog
        ref={dialog}
        className="m-screen-dialog"
        aria-label={opened?.title ?? t.showcase.title}
        onClose={() => setOpenKey(null)}
        onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}
      >
        <div className="m-screen-dialog-content">
          <div className="m-screen-dialog-header">
            <h3>{opened?.title}</h3>
            <button type="button" className="m-lang" autoFocus onClick={() => dialog.current?.close()}>{t.showcase.closeScreen}</button>
          </div>
          <p className="m-note">{t.showcase.disclaimer}</p>
          {opened && <img src={shot(opened.key)} alt={opened.alt} width={585} height={1266} />}
        </div>
      </dialog>
    </Shell>
  );
}
