import { Sidebar } from '@components/docs/sidebar/sidebar';
import { Divider, Page, useTheme } from '@geist-ui/core';
import Head from 'next/head';
import React from 'react';

export const Layout: React.FC<{ meta: { title: string }; children: React.ReactNode }> = ({ meta, children }) => {
  const theme = useTheme();

  return (
    <>
      <Head>
        <title>Cloud Secrets Docs - {meta.title}</title>
      </Head>
      <Page className="page-height">
        <Page.Content>
          <div className="flex mobile-layout">
            <aside className="w-[200px] desktop-layout">
              <Sidebar />
            </aside>
            <div className="grow">{children}</div>
            <Divider className="mobile-nav" />
            <span className="mobile-nav">
              <Sidebar />
            </span>
          </div>
        </Page.Content>
      </Page>
      <style jsx>{`
        .mobile-nav {
          display: none;
        }

        @media only screen and (max-width: ${theme.breakpoints.xs.max}) {
          .desktop-layout {
            display: none;
          }

          .mobile-nav {
            display: block;
          }

          .mobile-layout {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
};
