import SecretLoader from '@components/loader';
import { Card, Divider, Page, Text } from '@geist-ui/core';
import { isArray } from 'lodash-es';
import { GetServerSideProps, NextPage } from 'next';
import React, { useEffect, useState } from 'react';

const LoginResult: React.FC<{ status: string | null }> = ({ status }) => {
  return (
    <Card>
      <Text h3 className="text-center">
        {status !== '200' ? 'Failed to login to CLI' : 'Sucessfully logged into CLI'}
      </Text>
      <Divider />
      <Text className="text-center">{status !== '200' ? `Status: ${status}` : 'You may now close this window'}</Text>
    </Card>
  );
};

const CliLogin: NextPage<{ cliCallback: string | null; cookie: string | null }> = ({ cliCallback, cookie }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (cliCallback) {
      fetch(cliCallback, { headers: { Authorization: cookie ?? '' }, credentials: 'include' })
        .then((data) => {
          setStatus(`${data.status}`);
          setLoading(false);
        })
        .catch(() => {
          setStatus('500');
          setLoading(false);
        });
    } else {
      setStatus('500');
      setLoading(false);
    }
  }, [cookie, cliCallback]);

  return (
    <Page className="page-height  flex items-center justify-center">
      <div className="flex items-center justify-center">
        {loading && <SecretLoader loadingText="Waiting for response from CLI" />}
        {!loading && <LoginResult status={status} />}
      </div>
    </Page>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query, req }) => {
  let cliCallback: string | null | string[] = query.cliCallback || null;
  const validCallbackRegex = /^http:\/\/localhost:\d+\/clilogin$/;

  if (isArray(cliCallback)) {
    cliCallback = null;
  }

  if ((cliCallback && !validCallbackRegex.test(cliCallback)) || !req.headers.cookie) {
    // Redirect to if the cli callback is invalid
    return {
      redirect: {
        permanent: false,
        destination: '/404',
      },
    };
  }

  return {
    props: { cliCallback: cliCallback, cookie: req.headers.cookie },
  };
};

export default CliLogin;
