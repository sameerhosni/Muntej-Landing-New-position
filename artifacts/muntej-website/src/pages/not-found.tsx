import { Link } from 'wouter';
import { translations, type Lang } from '@/translations';
import { Header, Shell } from '@/components/site-chrome';

export default function NotFound({ lang = 'ar' }: { lang?: Lang }) {
  const t = translations[lang];
  return (
    <Shell lang={lang} t={t} seo={{ title: t.common.notFoundTitle, description: t.common.notFoundBody }}>
      <Header lang={lang} t={t} home={false} />
      <main id="main" className="m-section">
        <div className="m-wrap" style={{ maxWidth: '40rem' }}>
          <h1 className="m-h1" style={{ fontSize: 'clamp(2rem,5vw,3rem)' }}>{t.common.notFoundTitle}</h1>
          <p className="m-lead">{t.common.notFoundBody}</p>
          <p className="mt-8"><Link href={lang === 'en' ? '/en' : '/'} className="m-btn m-btn-primary" data-testid="link-notfound-home">{t.common.notFoundHome}</Link></p>
        </div>
      </main>
    </Shell>
  );
}
