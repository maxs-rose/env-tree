import { SidebarGroup } from '@components/docs/sidebar/sidebarGroup';
import { SideItem, Sides } from '@components/docs/sidebar/sideItem';
import React from 'react';

const docsData: Array<Sides> = [
  {
    name: 'CLI',
    children: [
      { name: 'CLI', url: '/docs/cli/cli' },
      { name: 'Gradle', url: '/docs/cli/gradle' },
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