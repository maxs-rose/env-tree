import { SidebarGroup } from '@components/docs/sidebar/sidebarGroup';
import { SideItem, Sides } from '@components/docs/sidebar/sideItem';
import React from 'react';

const docsData: Array<Sides> = [
  {
    name: 'Tooling',
    children: [
      { name: 'CLI', url: '/docs/tooling/cli' },
      { name: 'Gradle', url: '/docs/tooling/gradle' },
    ],
  },
  { name: 'API', children: [{ name: '/api/config', url: '/docs/api/api-config' }] },
  {
    name: 'Usage',
    children: [
      { name: 'Projects', url: '/docs/usage/projects' },
      { name: 'Configurations', url: '/docs/usage/configurations' },
      { name: 'User Management', url: '/docs/usage/user-management' },
    ],
  },
  {
    name: 'Misc',
    children: [
      { name: 'Self Hosting', url: '/docs/misc/selfhost' },
      { name: 'Changelog', url: '/docs/misc/changelog' },
    ],
  },
];

export const Sidebar: React.FC = React.memo(() => {
  return (
    <div className="w-full overflow-x-hidden overflow-y-auto h-full flex flex-col items-center">
      <SideItem key="test" sides={docsData}>
        <SidebarGroup />
      </SideItem>
    </div>
  );
});
Sidebar.displayName = 'Sidebar';
