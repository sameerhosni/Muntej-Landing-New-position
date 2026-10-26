import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Privacy from '@/pages/privacy';
import AdminLeads from '@/pages/admin-leads';
import { captureUtm } from '@/lib/site';
import { translations, type Lang } from '@/translations';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function RoutedErrorBoundary({ children, lang }: { children: ReactNode; lang: Lang }) {
  const [location] = useLocation();
  const c = translations[lang].common;
  useEffect(() => {
    captureUtm();
  }, [location]);
  return <ErrorBoundary resetKey={location} copy={{ title: c.errorTitle, body: c.errorBody, retry: c.errorRetry }}>{children}</ErrorBoundary>;
}

function Router({ initialLanguage }: { initialLanguage?: Lang }) {
  const [location] = useLocation();
  const fallback: Lang = initialLanguage ?? 'ar';
  const routeLang = (p: string): Lang => (p === '/en' || p.startsWith('/en/') ? 'en' : p.startsWith('/') && p !== '/' && !p.startsWith('/admin') && !p.startsWith('/privacy') ? fallback : 'ar');
  return (
    <RoutedErrorBoundary lang={routeLang(location)}>
      <Switch>
        <Route path="/">{() => <Home lang="ar" />}</Route>
        <Route path="/en">{() => <Home lang="en" />}</Route>
        <Route path="/privacy">{() => <Privacy lang="ar" />}</Route>
        <Route path="/en/privacy">{() => <Privacy lang="en" />}</Route>
        <Route path="/admin/leads" component={AdminLeads} />
        <Route>{() => <NotFound lang={routeLang(location)} />}</Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}

function App({ initialLanguage, ssrPath }: { initialLanguage?: Lang; ssrPath?: string }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')} ssrPath={ssrPath}>
        <Router initialLanguage={initialLanguage} />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
