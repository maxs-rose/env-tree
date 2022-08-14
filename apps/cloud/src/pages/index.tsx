import { Page, Text } from '@geist-ui/core';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudOff,
  CloudRain,
  CloudSnow,
  DownloadCloud,
  UploadCloud,
} from '@geist-ui/icons';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';

const HomeCloud: React.FC = () => {
  const options = [
    <CloudDrizzle size="100%" />,
    <CloudLightning size="100%" />,
    <CloudOff size="100%" />,
    <CloudRain size="100%" />,
    <CloudSnow size="100%" />,
    <Cloud size="100%" />,
    <DownloadCloud size="100%" />,
    <UploadCloud size="100%" />,
  ];

  const [randomSelection] = useState(options[Math.floor(Math.random() * options.length)]);

  return <div className="max-h-[80vh]">{randomSelection}</div>;
};

const NoSSRCloud = dynamic(() => Promise.resolve(HomeCloud), { ssr: false });

const Home: NextPage = () => {
  return (
    <Page className="page-height">
      <Page.Header center={true}>
        <Text h1>Cloud Secrets</Text>
      </Page.Header>
      <Page.Content className="flex items-center justify-center">
        <NoSSRCloud />
      </Page.Content>
    </Page>
  );
};

export default Home;
