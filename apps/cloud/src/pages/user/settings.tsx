import { User } from '@backend/api/user';
import SecretLoader from '@components/loader';
import { Button, Input, Page, Snippet, Text, useInput } from '@geist-ui/core';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { trpc } from '@utils/trpc';
import { GetServerSideProps, NextPage } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import React, { useEffect } from 'react';

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

const UserSettings: NextPage = () => {
  const trpcContext = trpc.useContext();
  const {} = useSession();
  const user = trpc.useQuery(['user-current']);
  const deleteUser = trpc.useMutation(['user-delete'], {
    onSuccess: () => {
      signOut();
    },
  });
  const updateUsername = trpc.useMutation(['user-rename'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['user-current']);
    },
  });
  const { state: usernameState, setState: setUsernameState, bindings: usernameBindings } = useInput('');

  useEffect(() => {
    setUsernameState(user.data?.name ?? '');
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
          <Input {...usernameBindings} />
          <Button onClick={() => updateUsername.mutate({ name: usernameState })}>Update username</Button>
        </div>
        <Token user={user.data} />
        <div>
          <Button onClick={() => deleteUser.mutate()}>Delete account</Button>
        </div>
      </Page.Content>
    </Page>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  return {
    props: { session },
  };
};

export default UserSettings;
