import { useConfigs } from '@context/config';
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Popover,
  Spacer,
  Tabs,
  Text,
  useBodyScroll,
  useMediaQuery,
  User,
  useTheme,
} from '@geist-ui/core';
import { Bell, Check, LogOut, Menu, Moon, Settings, Sun, X } from '@geist-ui/icons';
import { Project, UserAddRequest } from '@prisma/client';
import { addColorAlpha } from '@utils/shared/colours';
import { trpc } from '@utils/shared/trpc';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const UserNofifPopover: React.FC<{
  acceptRequest: (requestId: string) => void;
  denyRequest: (requestId: string) => void;
  projectRequests: Array<UserAddRequest & { project: Project }>;
}> = ({ acceptRequest, denyRequest, projectRequests }) => {
  const requests = () => {
    return projectRequests.map((p) => (
      <Popover.Item key={p.id}>
        <Card style={{ width: '100%' }}>
          <div className="flex justify-center items-center flex-col">
            <Text h5>{p.project.name}</Text>
            <span>
              <Button auto type="abort" icon={<Check color="green" />} onClick={() => acceptRequest(p.id)} />
              <Button auto type="abort" icon={<X color="red" />} onClick={() => denyRequest(p.id)} />
            </span>
          </div>
        </Card>
      </Popover.Item>
    ));
  };

  return (
    <>
      <Popover.Item title>Project Requests</Popover.Item>
      {requests()}
    </>
  );
};

const UserDisplay: React.FC<{ showNofis?: boolean }> = ({ showNofis = true }) => {
  const router = useRouter();
  const trpcContext = trpc.useContext();
  const { data: session } = useSession();
  const [popoverVisible, setPopoverVisible] = useState(false);
  const user = trpc.useQuery(['user-current'], { enabled: !!session });
  const userProjectRequests = trpc.useQuery(['project-get-add-requests'], {
    enabled: !!session,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    onSuccess: (data) => {
      if (!data.length && popoverVisible) {
        setPopoverVisible(false);
      }
    },
  });
  const [isHovering, setIsHovering] = useState(false);

  const acceptProjectRequestMutation = trpc.useMutation(['project-accept-request'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['project-get-add-requests']);
      trpcContext.invalidateQueries(['project-get']);
    },
  });

  const denyProjectRequestMutation = trpc.useMutation(['project-deny-request'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['project-get-add-requests']);
    },
  });

  const acceptRequest = (requestId: string) => {
    acceptProjectRequestMutation.mutate({ requestId });
  };

  const denyRequest = (requestId: string) => {
    denyProjectRequestMutation.mutate({ requestId });
  };

  if (!session) {
    return <Button onClick={() => router.push('/user/login')}>Login</Button>;
  }

  return (
    <>
      <User
        name={user.data?.name ?? ''}
        src={session.user?.image ?? undefined}
        onMouseOver={() => setIsHovering(true)}
        onMouseOut={() => setIsHovering(false)}
      >
        {isHovering ? user.data?.username : session.user?.email}
      </User>
      {showNofis && userProjectRequests.data?.length ? (
        <span className="mx-2 hover:cursor-pointer active:animate-swing">
          <Popover
            portalClassName="min-w-[20em]"
            visible={popoverVisible}
            onVisibleChange={setPopoverVisible}
            content={() => UserNofifPopover({ acceptRequest, denyRequest, projectRequests: userProjectRequests.data! })}
            disableItemsAutoClose={true}
          >
            <Badge.Anchor placement="bottomRight">
              <Badge padding="5px" scale={2} type="error" dot>
                {userProjectRequests.data?.length}
              </Badge>
              <Bell color="red" />
            </Badge.Anchor>
          </Popover>
        </span>
      ) : undefined}
      <ButtonGroup>
        <Button
          className="propagate-hover:animate-spinDuration"
          auto
          onClick={() => router.push('/user/settings')}
          icon={<Settings />}
        />
        <Button auto onClick={() => signOut()} icon={<LogOut />} />
      </ButtonGroup>
    </>
  );
};

const MenuMobile: React.FC<{ expanded: boolean }> = ({ expanded }) => {
  const theme = useTheme();
  const [, setScroll] = useBodyScroll();
  const { onThemeChange } = useConfigs();

  useEffect(() => {
    setScroll(expanded);
  }, [expanded, setScroll]);

  const isLightMode = () => theme.type === 'light';

  const switchTheme = () => {
    onThemeChange(isLightMode() ? 'dark' : 'light');
  };

  if (!expanded) {
    return null;
  }

  return (
    <>
      <div className="mobile-menu absolute w-full h-full z-[999] flex flex-col pt-4 gap-4 items-center">
        <Link href="/">
          <a className="text-[#666]">Home</a>
        </Link>
        <Link href="/projects">
          <a className="text-[#666]">Projects</a>
        </Link>
        <Link href="/docs">
          <a className="text-[#666]">Docs</a>
        </Link>
        <Spacer />
        <UserDisplay showNofis={false} />
        <Button auto onClick={switchTheme} icon={isLightMode() ? <Sun /> : <Moon />}>
          {isLightMode() ? 'Light' : 'Dark'}
        </Button>
      </div>
      <style jsx>{`
        .mobile-menu {
          background-color: ${theme.palette.background};
        }
      `}</style>
    </>
  );
};

const Nav: React.FC = () => {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState('');
  const theme = useTheme();
  const { onThemeChange } = useConfigs();
  const isMobile = useMediaQuery('xs', { match: 'down' });
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const tabChange = (tab: string) => {
    setCurrentUrl(tab);
    router.push(`/${tab}`);
  };

  const isLightMode = () => theme.type === 'light';

  const switchTheme = () => {
    onThemeChange(isLightMode() ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleRouteChange = () => {
      setMobileExpanded(false);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    if (!isMobile) {
      setMobileExpanded(false);
    }
  }, [isMobile]);

  useEffect(() => {
    setCurrentUrl(router.pathname.split('/').filter((f) => !!f)[0]);
  }, [router]);

  return (
    <>
      <div className="h-[var(--nav-height)]">
        <div
          className="menu fixed top-0 left-0 right-0 h-[var(--nav-height)] backdrop-blur z-[999]"
          style={{
            backgroundColor: addColorAlpha(theme.palette.background, 0.8),
            boxShadow: theme.type === 'dark' ? '0 0 0 1px #333' : '0 0 15px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            className="content flex items-center justify-between h-[100%] select-none"
            style={{ padding: `0 ${theme.layout.gap}` }}
          >
            <div className="nav-tabs flex items-center menu-tabs">
              <Tabs
                align="center"
                hideDivider
                hideBorder
                onChange={tabChange}
                value={currentUrl}
                activeClassName="current"
              >
                <Tabs.Item label="Home" value="" />
                <Tabs.Item label="Projects" value="projects" />
                <Tabs.Item label="Docs" value="docs" />
              </Tabs>
            </div>
            <div className="flex justify-end items-center menu-tabs">
              <UserDisplay />
              <Spacer inline />
              <Button auto onClick={switchTheme} icon={isLightMode() ? <Sun /> : <Moon />}>
                {isLightMode() ? 'Light' : 'Dark'}
              </Button>
            </div>
            <div className="block flex items-center burger-button">
              <Button
                auto
                type="abort"
                icon={<Menu size="1.125rem" />}
                onClick={() => setMobileExpanded(!mobileExpanded)}
              />
            </div>
          </div>
        </div>
      </div>
      <MenuMobile expanded={mobileExpanded} />
      <style jsx>{`
        .menu-tabs :global(.content) {
          display: none;
        }

        .burger-button {
          display: none;
        }

        @media only screen and (max-width: ${theme.breakpoints.xs.max}) {
          .menu-tabs {
            display: none;
          }

          .burger-button {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default Nav;
