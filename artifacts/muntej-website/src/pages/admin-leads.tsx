import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminLogin, useAdminLogout, useGetAdminLeads, getGetAdminLeadsQueryKey } from '@workspace/api-client-react';
import { translations, type Lang } from '@/translations';
import { Shell } from '@/components/site-chrome';

export default function AdminLeads() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = translations[lang];
  const a = t.admin;
  const qc = useQueryClient();
  const leads = useGetAdminLeads({ query: { queryKey: getGetAdminLeadsQueryKey(), retry: false, refetchOnWindowFocus: false } });
  const login = useAdminLogin();
  const logout = useAdminLogout();
  const [pw, setPw] = useState('');

  const status = (leads.error as { status?: number } | null)?.status;
  const unauth = leads.isError && status === 401;

  function doLogin(e: FormEvent) {
    e.preventDefault();
    login.mutate(
      { data: { password: pw } },
      {
        onSuccess: () => {
          setPw('');
          qc.invalidateQueries({ queryKey: getGetAdminLeadsQueryKey() });
        },
      },
    );
  }

  function doLogout() {
    logout.mutate(undefined, {
      onSettled: () => {
        qc.removeQueries({ queryKey: getGetAdminLeadsQueryKey() });
        qc.resetQueries({ queryKey: getGetAdminLeadsQueryKey() });
      },
    });
  }

  const toggle = (
    <button type="button" className="m-lang" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} data-testid="button-admin-lang">{a.toggle}</button>
  );

  return (
    <Shell lang={lang} t={t} seo={{ title: t.seo.adminTitle, description: t.seo.adminTitle }}>
      <main className="m-wrap m-section" id="main">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="m-h2" style={{ marginTop: 0 }}>{unauth ? a.loginTitle : a.title}</h1>
          <div className="flex items-center gap-2">
            {toggle}
            {leads.isSuccess && (
              <>
                <a href="/api/admin/leads.csv" className="m-btn m-btn-primary" download data-testid="link-export-csv">{a.export}</a>
                <button type="button" className="m-btn m-btn-ghost" onClick={doLogout} disabled={logout.isPending} data-testid="button-logout">{a.logout}</button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8">
          {leads.isLoading && (
            <div role="status" aria-label={a.loading} className="grid gap-2" data-testid="status-loading">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="m-skel" />)}
            </div>
          )}

          {unauth && (
            <form onSubmit={doLogin} className="m-form m-card" style={{ maxWidth: '26rem' }} data-testid="form-admin-login">
              <div className="m-field">
                <label htmlFor="admin-pw">{a.password}</label>
                <input id="admin-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required maxLength={256} data-testid="input-admin-password" />
              </div>
              {login.isError && <p className="m-err" role="alert" data-testid="text-login-error">{a.loginError}</p>}
              <button type="submit" className="m-btn m-btn-primary" disabled={login.isPending || !pw} data-testid="button-admin-login">
                {login.isPending ? a.loggingIn : a.login}
              </button>
            </form>
          )}

          {leads.isError && !unauth && (
            <div className="m-card" role="alert" data-testid="status-error">
              <p className="m-err">{a.error}</p>
              <button type="button" className="m-btn m-btn-ghost mt-4" onClick={() => leads.refetch()} data-testid="button-retry">{a.retry}</button>
            </div>
          )}

          {leads.isSuccess && leads.data.length === 0 && (
            <div className="m-card text-center" data-testid="status-empty">
              <h2 className="text-xl font-semibold">{a.emptyTitle}</h2>
              <p className="m-lead mx-auto">{a.emptyBody}</p>
            </div>
          )}

          {leads.isSuccess && leads.data.length > 0 && (
            <>
              <p className="m-note mb-3">{a.count}: {leads.data.length}</p>
              <div className="m-table-wrap">
                <table className="m-table" data-testid="table-leads">
                  <thead>
                    <tr>
                      {Object.values(a.cols).map((c) => <th key={c} scope="col">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.data.map((l) => (
                      <tr key={l.id} data-testid={`row-lead-${l.id}`}>
                        <td>{l.id}</td>
                        <td>{new Date(l.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB')}</td>
                        <td>{l.name}</td>
                        <td>{l.company}</td>
                        <td>{l.role || '—'}</td>
                        <td>{l.teamSize || '—'}</td>
                        <td dir="ltr">{l.whatsapp}</td>
                        <td>{l.language}</td>
                        <td>{[l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean).join(' / ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </Shell>
  );
}
