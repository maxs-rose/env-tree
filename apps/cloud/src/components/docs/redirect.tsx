import { NextPage } from 'next';
import Head from 'next/head';
import Router from 'next/router';

export const redirect = (redirectTo: string) => {
  type Props = { destination?: string };

  const Redirect: NextPage<Props> = ({ destination }) => {
    return (
      <Head>
        <meta httpEquiv="refresh" content={`0; url=${destination}`} />
      </Head>
    );
  };

  Redirect.getInitialProps = async ({ res }): Promise<Props> => {
    const destination = redirectTo;

    if (res) {
      res.writeHead(302, { Location: destination });
      res.end();
      return {};
    } else {
      await Router.push(destination);
    }

    return { destination };
  };

  return Redirect;
};
