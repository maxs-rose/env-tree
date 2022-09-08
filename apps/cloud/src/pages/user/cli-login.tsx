import { Card, Divider, Page, Text } from '@geist-ui/core';
import { GetServerSideProps, NextPage } from 'next';

const cliLogin: NextPage<{ cliLoginStateData: string | null }> = ({ cliLoginStateData }) => {
  return (
    <Page className="page-height  flex items-center justify-center">
      <div className="flex items-center justify-center">
        <Card>
          <Text h3 className="text-center">
            {cliLoginStateData !== '200' ? 'Failed to login to CLI' : 'Sucessfully logged into CLI'}
          </Text>
          <Divider />
          <Text className="text-center">
            {cliLoginStateData !== '200' ? `Status: ${cliLoginStateData}` : 'You may now close this window'}
          </Text>
        </Card>
      </div>
    </Page>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  return {
    props: { cliLoginStateData: query.status || null },
  };
};

export default cliLogin;
