import { useCallback, useRef } from 'react';
import { useTrackEvent } from '@workspace/api-client-react';
import type { Lang } from '@/translations';

export const WHATSAPP_NUMBER = 'TODO_WHATSAPP_NUMBER'; // TODO: replace with real number, digits only e.g. 9665XXXXXXXX
export const isWhatsappPlaceholder = WHATSAPP_NUMBER.startsWith('TODO');

const KEY = 'muntej_utm';
export type Utm = { utmSource?: string; utmMedium?: string; utmCampaign?: string };

export function captureUtm() {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem(KEY)) return;
    const p = new URLSearchParams(window.location.search);
    const u: Utm = {};
    const s = p.get('utm_source');
    const m = p.get('utm_medium');
    const c = p.get('utm_campaign');
    if (s) u.utmSource = s.slice(0, 200);
    if (m) u.utmMedium = m.slice(0, 200);
    if (c) u.utmCampaign = c.slice(0, 200);
    if (Object.keys(u).length) window.sessionStorage.setItem(KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

export function getUtm(): Utm {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || '{}') as Utm;
  } catch {
    return {};
  }
}

export function utmQuery(): string {
  const u = getUtm();
  const p = new URLSearchParams();
  if (u.utmSource) p.set('utm_source', u.utmSource);
  if (u.utmMedium) p.set('utm_medium', u.utmMedium);
  if (u.utmCampaign) p.set('utm_campaign', u.utmCampaign);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export type EventName =
  | 'cta_join_click'
  | 'form_submit_success'
  | 'whatsapp_click'
  | 'language_switch'
  | 'demo_view';

export function useTrack(lang: Lang) {
  const { mutate } = useTrackEvent();
  const ref = useRef(mutate);
  ref.current = mutate;
  return useCallback(
    (event: EventName, section?: string) => {
      ref.current({ data: { event, language: lang, section, ...getUtm() } });
    },
    [lang],
  );
}
