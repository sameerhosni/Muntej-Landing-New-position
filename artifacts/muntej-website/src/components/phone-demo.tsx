import { useCallback, useEffect, useRef, useState } from 'react';
import type { Translation } from '@/translations';

const LAST = 9;
const STEP_MS = 1900;
const BARS = [6, 12, 18, 10, 20, 14, 8, 17, 12, 20, 9, 15, 7, 13, 18, 10];

export function PhoneDemo({ t, onView }: { t: Translation; onView: () => void }) {
  const d = t.demo;
  const [step, setStep] = useState(LAST);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [choice, setChoice] = useState<'done' | 'blocked' | 'later'>('done');
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(onView);
  viewRef.current = onView;
  const seen = useRef(false);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Enter viewport: track once, start animation
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !seen.current) {
          seen.current = true;
          viewRef.current();
          setStarted(true);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      setPlaying(false);
      setStep(LAST);
    } else if (started && !hasPlayed.current) {
      hasPlayed.current = true;
      setStep(2);
      setPlaying(true);
    }
  }, [reduced, started]);

  useEffect(() => {
    if (!playing) return;
    if (step >= LAST) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), step < 0 ? 400 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, step]);

  useEffect(() => {
    const c = chatRef.current;
    if (c && (playing || step >= 0)) c.scrollTop = c.scrollHeight;
  }, [step, playing]);

  const pick = (c: 'done' | 'blocked' | 'later') => {
    setChoice(c);
    setStep(6);
    setPlaying(!reduced);
    if (reduced) setStep(LAST);
  };

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
    } else if (step >= LAST) {
      setStep(1);
      setChoice('done');
      setPlaying(true);
    } else {
      setPlaying(true);
    }
  }, [playing, step]);

  const show = (i: number) => step >= i;
  const label = playing ? d.pause : step >= LAST ? d.replay : d.play;
  const inEmployee = show(4) && !show(7);


  return (
    <div className="m-phone-col" ref={rootRef} data-testid="demo-phone">
      <div className={`m-phone ${reduced ? 'm-static' : ''}`} role="group" aria-label={d.phoneLabel} aria-describedby="demo-summary">
        <div className="m-screen">
          <div className="m-chat-head">
            <span className="m-avatar">{inEmployee ? 'ف' : t.brand.charAt(0)}</span>
            <div>
              <b>{inEmployee ? d.chatEmployee : d.chatManager}</b>
              <small>{d.illustrative}</small>
            </div>
          </div>
          <div className="m-chat" ref={chatRef} tabIndex={-1}>
            {show(0) && <span className="m-chip soft">{d.chatManager}</span>}
            {show(1) && (
              <div className={`m-msg out ${playing && step === 1 ? 'm-playing' : ''}`}>
                <div className="m-voice">
                  <span className="m-play">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
                  </span>
                  <span className="m-wave" aria-hidden="true">
                    {BARS.map((h, i) => (
                      <i key={i} style={{ ['--h' as string]: `${h}px`, ['--d' as string]: i }} />
                    ))}
                  </span>
                  <small>{d.voiceDur}</small>
                </div>
                <div className="m-trans">{d.voiceLabel}: {d.transcript}</div>
              </div>
            )}
            {show(2) && (
              <div className="m-msg in m-receipt">
                <b>{d.receiptTitle}</b>
                <ul>
                  <li>{d.receiptTask}</li>
                  <li>{d.receiptWho}</li>
                  <li>{d.receiptDue}</li>
                </ul>
                {d.receiptNote}
              </div>
            )}
            {show(3) && <span className="m-chip">{d.timeSkip}</span>}
            {show(4) && <span className="m-chip soft">{d.chatEmployee}</span>}
            {show(5) && (
              <div className="m-msg in">
                {d.checkin}
                <div className="m-btns" role="group" aria-label={d.buttonsLabel}>
                  <button type="button" className={`m-qb ${show(6) && choice === 'done' ? 'hit' : ''}`} aria-pressed={show(6) && choice === 'done'} onClick={() => pick('done')} data-testid="button-demo-done">{d.btnDone}</button>
                  <button type="button" className={`m-qb ${show(6) && choice === 'blocked' ? 'hit' : ''}`} aria-pressed={show(6) && choice === 'blocked'} onClick={() => pick('blocked')} data-testid="button-demo-blocked">{d.btnBlocked}</button>
                  <button type="button" className={`m-qb ${show(6) && choice === 'later' ? 'hit' : ''}`} aria-pressed={show(6) && choice === 'later'} onClick={() => pick('later')} data-testid="button-demo-later">{d.btnLater}</button>
                </div>
              </div>
            )}
            {show(6) && <div className="m-msg out">{choice === 'done' ? d.employeeReply : choice === 'blocked' ? d.blockedReply : d.laterReply}</div>}
            {show(7) && <span className="m-chip soft">{d.chatManager}</span>}
            {show(8) && <div className="m-msg in" aria-live="polite">{choice === 'done' ? d.doneNote : choice === 'blocked' ? d.blockedNote : d.laterNote}</div>}
            {show(9) && <span className="m-chip">{d.nextDay}</span>}
            {show(9) && (
              <div className="m-msg in m-brief">
                <b>{d.briefTitle}</b>
                <div>{d.briefDone}</div>
                <div>{d.briefOpen}</div>
                <div>{d.briefBlocked}</div>
                <div className="m-trans">{d.briefNote}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="sr-only" id="demo-summary" data-testid="demo-summary">{d.summaryLabel}: {d.summary}</p>
      {!reduced && (
        <button type="button" className="m-ctrl" onClick={toggle} data-testid="button-demo-toggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {playing ? <path d="M8 5v14M16 5v14" /> : step >= LAST ? <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" /> : <path d="M7 4l13 8-13 8z" />}
          </svg>
          {label}
        </button>
      )}
      <p className="m-illus">{d.illustrative} {d.tryIt}</p>
    </div>
  );
}
