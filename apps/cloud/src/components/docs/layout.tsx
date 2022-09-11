import { CommandSelector } from '@components/docs/CommandSelector';
import { Sidebar } from '@components/docs/sidebar/sidebar';
import { PMProvider } from '@context/packageManager';
import { Collapse, Link, Page, Snippet, useTheme } from '@geist-ui/core';
import { MDXProvider } from '@mdx-js/react';
import Head from 'next/head';
import React, { useEffect, useMemo, useState } from 'react';

export const Layout: React.FC<{ meta: { title: string }; children: React.ReactNode }> = ({ meta, children }) => {
  const theme = useTheme();
  const [manager, setManager] = useState<'npm' | 'yarn' | 'global'>('npm');
  const windowTitle = useMemo(() => `Env Tree - ${meta.title}`, [meta.title]);

  const packageManagerChange = (packageManager: 'npm' | 'yarn' | 'global') => {
    window.localStorage.setItem('packageManager', packageManager);
    setManager(packageManager);
  };

  useEffect(() => {
    const manager = window.localStorage.getItem('packageManager');

    if (manager && (manager === 'npm' || manager === 'yarn' || manager === 'global')) {
      packageManagerChange(manager);
    }
  }, []);

  const mdxCompoents = {
    CommandSelector: CommandSelector,
    Link: Link,
    Snippet: Snippet,
  };

  return (
    <>
      <Head>
        <title>{windowTitle}</title>
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
              <PMProvider onPackageManagerChange={packageManagerChange} packageManager={manager}>
                <MDXProvider components={mdxCompoents}>{children}</MDXProvider>
              </PMProvider>
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
