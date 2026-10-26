import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Lang, Translation } from '@/translations';

function ScreenGlyph({ index }: { index: number }) {
  const paths = [
    <><path d="M4 5h16v12H8l-4 3z" /><path d="M8 9h8M8 13h5" /></>,
    <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="m8 12 2.5 2.5L16 9" /></>,
    <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /></>,
  ];

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[index]}
    </svg>
  );
}

type Props = {
  copy: Translation['screens'];
  demo: Translation['demo'];
  lang: Lang;
};

export function SystemScreens({ copy, demo, lang }: Props) {
  const [active, setActive] = useState(0);
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const activeTab = copy.tabs[active];

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const forward = lang === 'ar' ? 'ArrowLeft' : 'ArrowRight';
    const backward = lang === 'ar' ? 'ArrowRight' : 'ArrowLeft';
    let next = index;

    if (event.key === forward) next = (index + copy.tabs.length + 1) % copy.tabs.length;
    else if (event.key === backward) next = (index + copy.tabs.length - 1) % copy.tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = copy.tabs.length - 1;
    else return;

    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  }

  return (
    <section className="m-section m-screens-section" id="screens" aria-labelledby={`${id}-heading`}>
      <div className="m-wrap">
        <div className="m-section-heading">
          <span className="m-eyebrow">{copy.eyebrow}</span>
          <h2 className="m-h2" id={`${id}-heading`}>{copy.title}</h2>
          <p className="m-lead">{copy.intro}</p>
        </div>

        <div className="m-screen-gallery">
          <div className="m-screen-tabs" role="tablist" aria-label={copy.tabsLabel}>
            {copy.tabs.map((tab, index) => (
              <button
                key={tab.label}
                ref={(node) => { buttons.current[index] = node; }}
                id={`${id}-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={active === index}
                aria-controls={`${id}-panel`}
                tabIndex={active === index ? 0 : -1}
                className={`m-screen-tab${active === index ? ' is-active' : ''}`}
                onClick={() => setActive(index)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                <ScreenGlyph index={index} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="m-screen-preview">
            <div className="m-screen-copy">
              <h3>{activeTab.title}</h3>
              <p>{activeTab.description}</p>
            </div>

            <div
              className="m-screen-panel"
              id={`${id}-panel`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${active}`}
              tabIndex={0}
            >
              <p className="sr-only">{activeTab.description}</p>
              {active < 2 ? (
                <div className={`m-screen-image-frame m-screen-image-frame-${active + 1}`}>
                  <p className="m-screen-image-source">{copy.imageSourceLabel}</p>
                  <img
                    className="m-screen-image"
                    src={`${import.meta.env.BASE_URL}screens/${active === 0 ? 'task-follow-up-concept.png' : 'follow-up-plan-concept.png'}`}
                    alt={copy.screenImageAlts[active]}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
              <div className={`m-screen-window m-screen-window-${active + 1}`} aria-hidden="true">
                <div className="m-window-bar">
                  <span className="m-window-dots"><i /><i /><i /></span>
                  <span className="m-window-title">{copy.appLabel}</span>
                  <span className="m-window-brand">{copy.onlineLabel}<span /></span>
                </div>

                <div className="m-whatsapp-bar">
                  <span className="m-avatar">م</span>
                  <span className="m-whatsapp-heading">
                    <b>{active === 1 ? demo.chatEmployee : demo.chatManager}</b>
                    <small>{active === 1 ? copy.employeeLabel : copy.managerLabel}</small>
                  </span>
                  <span className="m-window-date">{active === 2 ? demo.nextDay : demo.timeSkip}</span>
                </div>

                <div className={`m-screen-messages m-screen-messages-${active + 1}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  {active === 0 && (
                    <>
                      <div className="m-screen-message m-screen-message-manager">
                        <small>{copy.managerLabel}</small>
                        <p>{demo.transcript}</p>
                      </div>
                      <div className="m-screen-receipt">
                        <b><span className="m-receipt-check">✓</span>{demo.receiptTitle}</b>
                        <span>{demo.receiptTask}</span>
                        <small>{demo.receiptWho} · {demo.receiptDue}</small>
                      </div>
                      <div className="m-screen-message m-screen-message-reply">{demo.receiptNote}</div>
                    </>
                  )}

                  {active === 1 && (
                    <>
                      <span className="m-screen-time">{demo.timeSkip}</span>
                      <div className="m-screen-message m-screen-message-reply">
                        <small>{copy.employeeLabel}</small>
                        <p>{demo.checkin}</p>
                      </div>
                      <div className="m-screen-options" role="presentation">
                        <span>{demo.btnDone}</span>
                        <span>{demo.btnBlocked}</span>
                        <span>{demo.btnLater}</span>
                      </div>
                      <div className="m-screen-message m-screen-message-manager m-screen-done">{demo.employeeReply}</div>
                    </>
                  )}

                  {active === 2 && (
                    <>
                      <div className="m-screen-brief">
                        <b>{demo.briefTitle}</b>
                        <div className="m-screen-brief-rows">
                          {copy.briefRows.map((row, index) => (
                            <div className="m-screen-brief-row" key={row.status}>
                              <span className={`m-screen-state m-screen-state-${index + 1}`} />
                              <span>{row.task}</span>
                              <small>{row.status}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="m-screen-message m-screen-message-reply">{demo.briefNote}</div>
                    </>
                  )}
                </div>

                <div className="m-window-input" />
              </div>
              )}
            </div>
          </div>
          <p className="m-screen-disclaimer">{copy.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
