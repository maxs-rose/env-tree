import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { CssBaseline, GeistProvider, useTheme } from '@geist-ui/core';
import { withTRPC } from '@trpc/next';
import { AppRouter } from 'src/backend/router';
import Nav from '@components/nav';
import { useEffect, useState } from 'react';
import { ConfigProvider } from '@context/config';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  const theme = useTheme();
  const [themeType, setThemeType] = useState(theme.type);
  
  const themeChange = (theme: "light" | "dark") => {
    window.localStorage.setItem("theme", theme);
    setThemeType(theme);
  }

  useEffect(() => {
    const theme = window.localStorage.getItem("theme");

    if(theme && (theme === "light" || theme === "dark"))
      themeChange(theme);
    else
      themeChange("dark");
  }, []);

  return(
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
      </ConfigProvider>
    </GeistProvider>
  )
}

export default withTRPC<AppRouter>({
  config({ ctx }) {
    const url = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api` : `http://localhost:3000/api`

    return { url };
  }, 
  ssr: true
})(MyApp);
