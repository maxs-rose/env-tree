import { getUser$ } from '@backend/api/user';
import SecretLoader from '@components/loader';
import useOnScreen from '@context/useOnScreen';
import { Button, Collapse, Input, Page, Snippet, Spacer, Text, Tooltip, useInput, useToasts } from '@geist-ui/core';
import { Info, Trash } from '@geist-ui/icons';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { trpc } from '@utils/shared/trpc';
import { AuthUser, User } from '@utils/shared/types';
import { GetServerSideProps, NextPage } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { firstValueFrom } from 'rxjs';

const Token: React.FC<{ user: User }> = ({ user }) => {
  const trpcContext = trpc.useContext();
  const authToken = trpc.useMutation(['user-authToken'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['user-current']);
    },
  });

  const updateAuthToken = () => {
    authToken.mutate();
  };

  return (
    <div className="flex items-center flex-wrap gap-2">
      <Text>Auth token</Text>
      <Snippet text={user.authToken ?? ''} width={36} />
      <Button onClick={updateAuthToken}>{user.authToken ? 'Regenerate' : 'Generate'} Auth Token</Button>
    </div>
  );
};

const DeleteUser: React.FC = () => {
  const deleteConfirmText = 'I understand, please delete my account' as const;
  const { state, setState, bindings } = useInput('');
  const [canDelete, setCanDelete] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref as unknown as MutableRefObject<Element>);

  const deleteUser = trpc.useMutation(['user-delete'], {
    onSuccess: () => {
      signOut();
    },
  });

  useEffect(() => {
    setCanDelete(state === deleteConfirmText);
  }, [state]);

  useEffect(() => {
    if (!isVisible) {
      setState('');
    }
  }, [isVisible, setState]);

  return (
    <div className="max-w-md flex flex-col" ref={ref}>
      <Text p>
        <Text b type="error">
          Warning!
        </Text>{' '}
        Deleting your account cannot be undone and will <Text b>delete all projects</Text> that you are the last member
        of. If you are sure please type:
      </Text>
      <Text blockquote width="100%">
        {deleteConfirmText}
      </Text>
      <Input {...bindings} placeholder="Delete account" width="100%" clearable />
      <Spacer />
      <Button type="error" disabled={!canDelete} icon={<Trash />} onClick={() => deleteUser.mutate()}>
        Delete Account
      </Button>
    </div>
  );
};

const UserSettings: NextPage<{ currentUser: User }> = ({ currentUser }) => {
  const router = useRouter();
  const toaster = useToasts();
  const trpcContext = trpc.useContext();
  const { data: userData, ...user } = trpc.useQuery(['user-current'], {
    initialData: currentUser,
    refetchOnMount: false,
  });

  const updateDisplayName = trpc.useMutation(['user-rename'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['user-current']);
      toaster.setToast({ text: 'Updated name', type: 'success', delay: 10000 });
    },
    onError: () => {
      setDisplayNameState(`${userData?.name}`);
      toaster.setToast({ text: 'Failed to updated name', type: 'error', delay: 10000 });
    },
  });
  const updateUsername = trpc.useMutation(['user-username'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['user-current']);
      toaster.setToast({ text: 'Updated username', type: 'success', delay: 10000 });
    },
    onError: () => toaster.setToast({ text: 'Username already in use', type: 'error', delay: 10000 }),
  });
  const [nameUpdate, setNameUpdate] = useState('');
  const { state: displayNameState, setState: setDisplayNameState, bindings: displayNameBindings } = useInput('');
  const { state: usernameState, setState: setUsernameState, bindings: usernameBindings } = useInput('');

  useEffect(() => {
    setDisplayNameState(`${userData?.name}`);
    setUsernameState(`${userData?.username}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const blurName = () => {
    setNameUpdate(displayNameState);
    setDisplayNameState(`${userData?.name}`);
  };

  const blurUsername = () => {
    setNameUpdate(usernameState);
    setUsernameState(`${userData?.username}`);
  };

  if (user.isLoading || user.isError || !userData) {
    return <SecretLoader loadingText="Loading" />;
  }

  return (
    <Page className="page-height">
      <Page.Header>
        <Text h2>User settings</Text>
      </Page.Header>
      <Page.Content>
        <Collapse title="General" initialVisible>
          <div className="flex items-center gap-2 flex-wrap">
            <Input {...displayNameBindings} onBlur={blurName} />
            <Button onClick={() => updateDisplayName.mutate({ name: nameUpdate })}>Update name</Button>
          </div>
          <Spacer />
          <div className="flex items-center gap-2 flex-wrap">
            <Input {...usernameBindings} onBlur={blurUsername} />
            <Button onClick={() => updateUsername.mutate({ username: nameUpdate })}>Update username</Button>
          </div>
        </Collapse>
        <Collapse title="Security">
          <Token user={userData} />

          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/user/login')}>Link Account</Button>
            <Tooltip text="Link your account with another authentication provider">
              <Info color="#0070f3" />
            </Tooltip>
          </div>
        </Collapse>
        <Collapse title="Danger Zone" className="danger-zone">
          <DeleteUser />
        </Collapse>
      </Page.Content>
    </Page>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = (await unstable_getServerSession(context.req, context.res, authOptions))?.user as AuthUser | null;

  if (!session) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  return {
    props: {
      currentUser: await firstValueFrom(getUser$(session.id)),
    },
  };
};

export default UserSettings;
