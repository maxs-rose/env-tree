import { CommandSelector } from '@components/docs/CommandSelector';
import { Sidebar } from '@components/docs/sidebar/sidebar';
import { Collapse, Page, useTabs, useTheme } from '@geist-ui/core';
import { MDXProvider } from '@mdx-js/react';
import Head from 'next/head';
import React from 'react';

export const Layout: React.FC<{ meta: { title: string }; children: React.ReactNode }> = ({ meta, children }) => {
  const theme = useTheme();
  const { bindings } = useTabs('npm');

  const mdxCompoents = {
    CommandSelector: CommandSelector(bindings),
  };

  return (
    <>
      <Head>
        <title>Env Tree Docs - {meta.title}</title>
      </Head>
      <Page className="page-height">
        <Page.Content>
          <div className="flex mobile-layout">
            <span className="mobile-nav">
              <Collapse title="Pages">
                <Sidebar />
              </Collapse>
            </span>
            <aside className="w-[260px] desktop-layout">
              <Sidebar />
            </aside>
            <div className="grow">
              <MDXProvider components={mdxCompoents}>{children}</MDXProvider>
            </div>
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
