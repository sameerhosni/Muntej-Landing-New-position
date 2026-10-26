import { Link } from 'wouter';
import { translations, type Lang } from '@/translations';
import { Footer, Header, Shell } from '@/components/site-chrome';

export default function Privacy({ lang }: { lang: Lang }) {
  const t = translations[lang];
  return (
    <Shell lang={lang} t={t} seo={{ title: t.seo.privacyTitle, description: t.meta.privacyDescription }}>
      <Header lang={lang} t={t} home={false} switchTo={lang === 'ar' ? '/en/privacy' : '/privacy'} />
      <main id="main" className="m-section">
        <div className="m-wrap" style={{ maxWidth: '48rem' }}>
          <h1 className="m-h1" style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>{t.privacy.title}</h1>
          <p className="m-todo" data-testid="text-privacy-todo">{t.privacy.todo}</p>
          <p className="mt-8">
            <Link href={lang === 'en' ? '/en' : '/'} className="m-btn m-btn-ghost" data-testid="link-back-home">{t.privacy.back}</Link>
          </p>
        </div>
      </main>
      <Footer lang={lang} t={t} />
    </Shell>
  );
}
