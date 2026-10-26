import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useJoinEarlyAccess } from '@workspace/api-client-react';
import type { Lang, Translation } from '@/translations';
import { getUtm, useTrack } from '@/lib/site';

const RX = /^\+9665[0-9]{8}$/;
const EMPTY = { name: '', company: '', whatsapp: '', website: '' };
const IDS: Record<string, string> = { name: 'f-name', company: 'f-company', whatsapp: 'f-wa' };
const ORDER = ['name', 'company', 'whatsapp'];

export function LeadForm({ t, lang }: { t: Translation; lang: Lang }) {
  const f = t.form;
  const track = useTrack(lang);
  const join = useJoinEarlyAccess();
  const [v, setV] = useState(EMPTY);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const n: Record<string, string> = {};
    const name = v.name.trim(), company = v.company.trim();
    const wa = v.whatsapp.replace(/[\s-]/g, '');
    if (!name) n.name = f.required;
    if (!company) n.company = f.required;
    if (!RX.test(wa)) n.whatsapp = f.invalidWhatsapp;
    setErrs(n);
    setFailed(false);
    const first = ORDER.find((k) => n[k]);
    if (first) {
      document.getElementById(IDS[first])?.focus();
      return;
    }
    join.mutate(
      { data: { name, company, whatsapp: wa, language: lang, website: v.website, ...getUtm() } },
      {
        onSuccess: () => {
          track('form_submit_success', 'early-access');
          setDone(true);
        },
        onError: () => setFailed(true),
      },
    );
  }

  const field = (k: 'name' | 'company', label: string, max: number) => (
    <div className="m-field">
      <label htmlFor={IDS[k]}>{label} <span className="sr-only">({f.requiredMark})</span></label>
      <input id={IDS[k]} value={v[k]} onChange={set(k)} required aria-required="true" aria-invalid={!!errs[k]} aria-describedby={errs[k] ? `e-${k}` : undefined} maxLength={max} autoComplete={k === 'name' ? 'name' : 'organization'} data-testid={`input-${k}`} />
      {errs[k] && <p className="m-err" id={`e-${k}`}>{errs[k]}</p>}
    </div>
  );

  return (
    <div className="m-formbox" id="join">
      <div>
        <span id="early-access" className="m-anchor-alias" aria-hidden="true" />
        <span id="contact" className="m-anchor-alias" aria-hidden="true" />
        <span className="m-eyebrow">{f.eyebrow}</span>
        <h2 className="m-h2">{f.title}</h2>
        <p className="m-lead">{f.sub}</p>
      </div>
      {done ? (
        <div className="m-success" role="status" data-testid="status-form-success">
          <div className="tick">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </div>
          <h3 className="text-xl font-semibold">{f.successTitle}</h3>
          <p className="m-lead mx-auto">{f.successBody}</p>
          <button type="button" className="m-btn m-btn-ghost mt-6" onClick={() => { setDone(false); setV(EMPTY); }}>{f.another}</button>
        </div>
      ) : (
        <form className="m-form" onSubmit={submit} noValidate data-testid="form-early-access">
          <div className="m-two">{field('name', f.name, 120)}{field('company', f.company, 160)}</div>
          <div className="m-field">
            <label htmlFor="f-wa">{f.whatsapp} <span className="sr-only">({f.requiredMark})</span></label>
            <input id="f-wa" type="tel" inputMode="tel" dir="ltr" placeholder={f.whatsappPlaceholder} value={v.whatsapp} onChange={set('whatsapp')} required aria-required="true" aria-invalid={!!errs.whatsapp} aria-describedby={errs.whatsapp ? 'e-wa h-wa' : 'h-wa'} autoComplete="tel" maxLength={20} data-testid="input-whatsapp" style={{ textAlign: 'start' }} />
            {errs.whatsapp && <p className="m-err" id="e-wa">{errs.whatsapp}</p>}
            <p className="m-hint" id="h-wa">{f.whatsappHint}. {f.whatsappStrip}</p>
          </div>
          <div className="m-hp" aria-hidden="true">
            <label>{f.honeypot}<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></label>
          </div>
          <p className="m-hint" data-testid="text-form-privacy">
            {f.privacyNotice}{' '}
            <Link href={lang === 'en' ? '/en/privacy' : '/privacy'} style={{ textDecoration: 'underline' }}>{f.privacyLink}</Link>
          </p>
          {failed && <p className="m-err" role="alert" data-testid="text-form-error">{f.serverError}</p>}
          <button type="submit" className="m-btn m-btn-primary" disabled={join.isPending} data-testid="button-submit-lead">
            {join.isPending ? f.sending : f.submit}
          </button>
        </form>
      )}
    </div>
  );
}
