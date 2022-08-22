import { Footer } from '@components/footer';
import Nav from '@components/nav';
import { ConfigProvider } from '@context/config';
import { CssBaseline, GeistProvider, useTheme } from '@geist-ui/core';
import { withTRPC } from '@trpc/next';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { AppRouter } from 'src/backend/router';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
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

  return (
    <SessionProvider session={session}>
      <GeistProvider themeType={themeType}>
        <CssBaseline />
        <ConfigProvider onThemeChange={themeChange}>
          <Head>
            <title>Cloud Secrets</title>
            <link rel="icon" href="/favicon.png" />
            <meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1, viewport-fit=cover" />
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
