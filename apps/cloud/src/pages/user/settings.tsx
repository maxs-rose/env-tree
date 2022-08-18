import { User } from '@backend/api/user';
import SecretLoader from '@components/loader';
import { Button, Page, Snippet, Text } from '@geist-ui/core';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { trpc } from '@utils/trpc';
import { GetServerSideProps, NextPage } from 'next';
import { unstable_getServerSession } from 'next-auth';
import React from 'react';

const Token: React.FC<{ user: User }> = ({ user }) => {
  const trpcContext = trpc.useContext();
  const authToken = trpc.useMutation(['user-authToken'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['user-getCurrent']);
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
  const user = trpc.useQuery(['user-getCurrent']);

  if (user.isLoading || user.isError || !user.data) {
    return <SecretLoader loadingText="Loading" />;
  }

  return (
    <Page className="page-height">
      <Page.Header>
        <Text h2>User settings</Text>
      </Page.Header>
      <Page.Content>
        <Token user={user.data} />
        <div>
          <Button>Delete account</Button>
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
