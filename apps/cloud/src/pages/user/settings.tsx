import { Button, Page, Text } from '@geist-ui/core';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { GetServerSideProps, NextPage } from 'next';
import { unstable_getServerSession } from 'next-auth';

const UserSettings: NextPage = () => {
  return (
    <Page className="page-height">
      <Page.Header>
        <Text h2>User settings</Text>
      </Page.Header>
      <Page.Content>
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
