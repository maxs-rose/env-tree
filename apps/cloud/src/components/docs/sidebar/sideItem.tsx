import { Spacer } from '@geist-ui/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';

export type Sides = {
  name: string;
  url?: string;
  children?: Array<Sides>;
};

const SidebarGroupName: React.FC<{ name: string }> = React.memo(({ name, ...props }) => {
  return (
    <span {...props} className="text-sm text-neutral-600">
      {name}
    </span>
  );
});
SidebarGroupName.displayName = 'SidebarGroupName';

const SidebarPageLink: React.FC<{ href: string; text: string }> = React.memo(({ href, text }) => {
  const { pathname } = useRouter();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <a className={`flex items-baseline text-neutral-400 ${isActive ? 'font-bold' : 'hover:italic'}`}>{text}</a>
    </Link>
  );
});
SidebarPageLink.displayName = 'SidebarPageLink';

export const SideItem: React.FC<{ children: ReactElement<{ sides?: Array<Sides> }>; sides: Array<Sides> }> = React.memo(
  ({ children, sides }) => (
    <>
      {sides.map((side, index) => {
        const showChildren = side.children && children;
        return (
          <div key={`${side.name}-${index}`} className="w-full">
            {!side.url && (
              <>
                {index ? <Spacer /> : undefined}
                <SidebarGroupName name={side.name} />
              </>
            )}
            {side.url && <SidebarPageLink href={side.url} text={side.name} />}

            {showChildren && (
              <div className="children flex justify-center items-center flex-col relative mt-[0.5rem]">
                {React.cloneElement(children, {
                  sides: side.children,
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  )
);
SideItem.displayName = 'SideItem';
