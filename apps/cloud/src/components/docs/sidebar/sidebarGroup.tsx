import { SideItem, Sides } from '@components/docs/sidebar/sideItem';
import React from 'react';

export const SidebarGroup: React.FC<{ sides?: Sides | Array<Sides> }> = React.memo(({ sides }) => {
  if (!sides) {
    return null;
  }
  sides = Array.isArray(sides) ? sides : [sides];
  return (
    <SideItem sides={sides}>
      <SidebarGroup />
    </SideItem>
  );
});
SidebarGroup.displayName = 'SidebarGroup';
