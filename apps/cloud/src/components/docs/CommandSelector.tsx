import { usePackageManager } from '@context/packageManager';
import { Snippet, Tabs } from '@geist-ui/core';
import React from 'react';

export const CommandSelector: React.FC<{ command: string }> = ({ command }) => {
  const { onPackageManagerChange, packageManager } = usePackageManager();

  return (
    <Tabs
      initialValue={packageManager}
      value={packageManager}
      onChange={(selection) => onPackageManagerChange(selection as typeof packageManager)}
    >
      <Tabs.Item label="npm" value="npm">
        <Snippet text={`npx dlx @envtree/cli ${command}`} />
      </Tabs.Item>
      <Tabs.Item label="yarn" value="yarn">
        <Snippet text={`yarn dlx @envtree/cli ${command}`} />
      </Tabs.Item>
      <Tabs.Item label="Global Install" value="global">
        <Snippet text={`envtree ${command}`} />
      </Tabs.Item>
    </Tabs>
  );
};
