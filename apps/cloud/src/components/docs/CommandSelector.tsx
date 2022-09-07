import { Snippet, Tabs, useTabs } from '@geist-ui/core';
import React from 'react';

export const CommandSelector: (bindings: ReturnType<typeof useTabs>['bindings']) => React.FC<{ command: string }> = (
  bindings
) => {
  const CommandTabber: React.FC<{ command: string }> = ({ command }) => {
    return (
      <Tabs {...bindings}>
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

  return CommandTabber;
};
