import { useEffect, type ReactNode } from 'react';
import { Link } from 'wouter';
import type { Lang, Translation } from '@/translations';
import { utmQuery, useTrack } from '@/lib/site';

const base = (lang: Lang) => (lang === 'en' ? '/en' : '');
const logo = `${import.meta.env.BASE_URL}brand/logo.png`;

type Seo = { title: string; description: string; ogTitle?: string; ogDescription?: string };

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export function Shell({ lang, t, seo, children }: { lang: Lang; t: Translation; seo: Seo; children: ReactNode }) {
  const { title, description } = seo;
  const ogTitle = seo.ogTitle ?? title;
  const ogDescription = seo.ogDescription ?? description;
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      const origin = new URL(canonical.href).origin;
      canonical.href = origin + window.location.pathname;
      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonical.href);
    }
    document.querySelector<HTMLMetaElement>('meta[property="og:locale:alternate"]')?.setAttribute('content', lang === 'ar' ? 'en_US' : 'ar_SA');
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', ogTitle);
    setMeta('property', 'og:description', ogDescription);
    setMeta('property', 'og:locale', lang === 'ar' ? 'ar_SA' : 'en_US');
    setMeta('name', 'twitter:title', ogTitle);
    setMeta('name', 'twitter:description', ogDescription);
  }, [lang, t.dir, title, description, ogTitle, ogDescription]);
  return (
    <div dir={t.dir} lang={lang} className="min-h-[100dvh]">
      {children}
    </div>
  );
}

export function Header({ lang, t, home = true, switchTo }: { lang: Lang; t: Translation; home?: boolean; switchTo?: string }) {
  const track = useTrack(lang);
  const other: Lang = lang === 'ar' ? 'en' : 'ar';
  const target = switchTo ?? (other === 'en' ? '/en' : '/');
  const prefix = home ? '' : `${base(lang) || '/'}`;
  const nav: [string, string][] = [
    ['how', t.nav.how], ['differentiators', t.nav.differentiators],
  ];
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3" >{t.skip}</a>
      <header className="m-header">
        <div className="m-wrap m-header-in">
           <Link href={base(lang) || '/'} aria-label={t.brand} className="flex items-center gap-2 shrink-0" data-testid="link-logo">
             <img src={`${import.meta.env.BASE_URL}brand/favicon.png`} alt="" width={34} height={34} />
            <img src={logo} alt={t.logoAlt} width={120} height={34} style={{ height: 34, width: 'auto' }} />
          </Link>
          <nav className="m-nav" aria-label={t.nav.label}>
            {nav.map(([id, label]) => (
              <a key={id} href={`${prefix}#${id}`} data-testid={`link-nav-${id}`}>{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={`${target}${utmQuery()}`}
              className="m-lang"
              lang={other}
              aria-label={t.lang.aria}
              onClick={() => track('language_switch', 'header')}
              data-testid="link-language-switch"
            >
              {t.lang.label}
            </Link>
            <a
              href={`${prefix}#early-access`}
              className="m-btn m-btn-primary m-btn-shine"
              onClick={() => track('cta_join_click', 'header')}
              data-testid="button-cta-header"
            >
              <span className="m-cta-long">{t.cta}</span>
              <span className="m-cta-short">{t.common.ctaShort}</span>
            </a>
          </div>
        </div>
      </header>
    </>
  );
}

export function Footer({ lang, t }: { lang: Lang; t: Translation }) {
  const home = base(lang) || '/';
  const links: [string, string, string][] = [
    ['home', home, t.footer.home],
    ['results', `${home}#problem`, t.footer.results],
    ['features', `${home}#differentiators`, t.footer.features],
    ['how', `${home}#how`, t.footer.how],
  ];
  return (
    <footer className="m-footer">
      <div className="m-wrap">
        <div className="m-foot-top">
          <div className="m-foot-brand">
            <Link href={home} aria-label={t.brand} data-testid="link-footer-logo"><img src={logo} alt={t.logoAlt} width={110} height={30} style={{ height: 30, width: 'auto' }} /></Link>
            <span className="m-foot-tag">{t.footer.tagline}</span>
          </div>
          <nav className="m-foot-nav" aria-label={t.footer.navLabel}>
            {links.map(([id, href, label]) => <a key={id} href={href} data-testid={`link-footer-${id}`}>{label}</a>)}
          </nav>
          <a className="m-foot-mail" href="mailto:sales@muntej.app" data-testid="link-footer-email">sales@muntej.app</a>
        </div>
        <div className="m-foot-bottom">
          <span>© {new Date().getFullYear()} {t.footer.rights}. {t.footer.reserved}</span>
          <span className="m-foot-legal">
            <Link href={lang === 'en' ? '/en/privacy' : '/privacy'} data-testid="link-privacy">{t.footer.privacy}</Link>
            <span className="m-foot-status"><i aria-hidden="true" />{t.footer.early}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
