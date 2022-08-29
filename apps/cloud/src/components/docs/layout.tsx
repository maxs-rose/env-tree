import { Sidebar } from '@components/docs/sidebar/sidebar';
import { Page } from '@geist-ui/core';
import Head from 'next/head';
import React from 'react';

export const Layout: React.FC<{ meta: { title: string }; children: React.ReactNode }> = ({ meta, children }) => {
  return (
    <>
      <Head>
        <title>Cloud Secrets Docs - {meta.title}</title>
      </Head>
      <Page className="page-height">
        <Page.Content>
          <div className="flex">
            <aside className="w-[200px]">
              <Sidebar />
            </aside>
            <div className="grow">{children}</div>
          </div>
        </Page.Content>
      </Page>
    </>
  );
};
