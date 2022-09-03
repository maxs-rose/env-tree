import { getUser$ } from '@backend/api/user';
import SecretLoader from '@components/loader';
import { Button, Input, Page, Snippet, Text, useInput, useToasts } from '@geist-ui/core';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { trpc } from '@utils/shared/trpc';
import { AuthUser, User } from '@utils/shared/types';
import { GetServerSideProps, NextPage } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
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

const UserSettings: NextPage<{ currentUser: User }> = ({ currentUser }) => {
  const router = useRouter();
  const toaster = useToasts();
  const trpcContext = trpc.useContext();
  const user = trpc.useQuery(['user-current'], { initialData: currentUser, refetchOnMount: false });
  const deleteUser = trpc.useMutation(['user-delete'], {
    onSuccess: () => {
      signOut();
    },
  });
  const updateDisplayName = trpc.useMutation(['user-rename'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['user-current']);
    },
  });
  const updateUsername = trpc.useMutation(['user-username'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['user-current']);
    },
    onError: () => toaster.setToast({ text: 'Username already in use', type: 'error', delay: 10000 }),
  });
  const { state: displayNameState, setState: setDisplayNameState, bindings: displayNameBindings } = useInput('');
  const { state: usernameState, setState: setUsernameState, bindings: usernameBindings } = useInput('');

  useEffect(() => {
    setDisplayNameState(user.data?.name ?? '');
    setUsernameState(user.data?.username ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.data]);

  if (user.isLoading || user.isError || !user.data) {
    return <SecretLoader loadingText="Loading" />;
  }

  return (
    <Page className="page-height">
      <Page.Header>
        <Text h2>User settings</Text>
      </Page.Header>
      <Page.Content>
        <div className="flex items-center gap-2 flex-wrap">
          <Input {...displayNameBindings} />
          <Button onClick={() => updateDisplayName.mutate({ name: displayNameState })}>Update name</Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input {...usernameBindings} />
          <Button onClick={() => updateUsername.mutate({ username: usernameState })}>Update username</Button>
        </div>
        <Token user={user.data} />
        <div>
          <Button onClick={() => router.push('/user/login')}>Link Accout</Button>
        </div>
        <div>
          <Button onClick={() => deleteUser.mutate()}>Delete account</Button>
        </div>
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
