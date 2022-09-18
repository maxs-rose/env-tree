import { Footer } from '@components/footer';
import Nav from '@components/nav';
import { ConfigProvider } from '@context/config';
import { CssBaseline, GeistProvider, useTheme } from '@geist-ui/core';
import { withTRPC } from '@trpc/next';
import * as ackee from 'ackee-tracker';
import { AckeeInstance } from 'ackee-tracker';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import { useEffect, useState } from 'react';
import { AppRouter } from 'src/backend/router';
import '../styles/globals.css';

function MyApp({ Component, pageProps, ackeeEnabled }: AppProps<{ session: Session }> & { ackeeEnabled: boolean }) {
  const theme = useTheme();
  const [themeType, setThemeType] = useState(theme.type);

  const themeChange = (theme: 'light' | 'dark') => {
    window.localStorage.setItem('theme', theme);
    setThemeType(theme);
  };

  useEffect(() => {
    const theme = window.localStorage.getItem('theme');

    if (theme && (theme === 'light' || theme === 'dark')) {
      themeChange(theme);
    } else {
      themeChange('dark');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin === 'https://www.envtree.net') {
      const w = window as unknown as { ackee: AckeeInstance };
      w.ackee = ackee.create('https://ackee.max-rose.com');

      w.ackee.record('f130d370-d9d6-4ae5-ae8c-90d0aabe03dc');

      Router.events.on('routeChangeComplete', () => w.ackee.record('f130d370-d9d6-4ae5-ae8c-90d0aabe03dc'));
    }
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <GeistProvider themeType={themeType}>
        <CssBaseline />
        <ConfigProvider onThemeChange={themeChange}>
          <Head>
            <title>Env Tree</title>
            <link rel="icon" href="/favicon.svg" />
            <meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1, viewport-fit=cover" />
            <meta name="og:title" content="Env Tree" />
            <meta
              name="description"
              content="The open source system for secure .env storage to easily share configurations across your development team and environments"
            />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://www.envtree.net/" />
            <meta property="og:image" content="https://www.envtree.net/envtree.svg" />
          </Head>
          <Nav />
          <Component {...pageProps} />
          <Footer />
        </ConfigProvider>
      </GeistProvider>
    </SessionProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== undefined) {
    return '';
  }

  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT ?? 3000}`;
}

export default withTRPC<AppRouter>({
  config({ ctx }) {
    const url = `${getBaseUrl()}/api/trpc`;

    return {
      url,
      queryClientConfig: { defaultOptions: { queries: { refetchOnWindowFocus: false } } },
    };
  },
  ssr: false, // no ssr since it messes up the auth for trpc
})(MyApp);
