import SecretLoader from '@components/loader';
import { Button, Card, Divider, Page, Text } from '@geist-ui/core';
import { Github, Gitlab, LogIn } from '@geist-ui/icons';
import { GetServerSideProps, NextPage } from 'next';
import { Provider } from 'next-auth/providers';
import { getProviders, signIn } from 'next-auth/react';

const loginProviderIcon = (providerId: string) => {
  switch (providerId) {
    case 'github':
      return <Github />;
    case 'gitlab':
      return <Gitlab />;
    default:
      return <LogIn />;
  }
};

const Login: NextPage<{ providers: Provider; cliCallback: string | null }> = ({ providers, cliCallback }) => {
  if (!providers) {
    return <SecretLoader loadingText="Loading login options"></SecretLoader>;
  }

  const providerLoginButtons = Object.values(providers).map((provider) => {
    return (
      <Button
        key={provider.name}
        icon={loginProviderIcon(provider.id)}
        width={2}
        scale={1.2}
        onClick={() =>
          signIn(provider.id, {
            callbackUrl: `${window.location.origin}${
              cliCallback ? `/user/cli-login?${new URLSearchParams({ cliCallback })}` : ''
            }`,
          })
        }
      >
        {provider.name}
      </Button>
    );
  });

  return (
    <Page className="page-height flex items-center justify-center">
      <div className="flex items-center justify-center">
        <Card className="w-fit">
          <Text className="flex items-center justify-center" h4>
            Login
          </Text>
          <Divider />
          <div className="flex flex-col justify-center items-center gap-2">{providerLoginButtons}</div>
        </Card>
      </div>
    </Page>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const providers = await getProviders();

  return {
    props: { providers, cliCallback: query.cliCallback || null },
  };
};

export default Login;
