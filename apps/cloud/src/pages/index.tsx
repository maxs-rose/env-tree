import { Page, Text } from '@geist-ui/core';
import { CloudDrizzle, CloudLightning, CloudOff, CloudRain, CloudSnow, Cloud, DownloadCloud, UploadCloud } from '@geist-ui/icons';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

const HomeCloud: React.FC = () => {
  const options = [
    <CloudDrizzle size="50%" />,
    <CloudLightning size="50%" />,
    <CloudOff size="50%" />,
    <CloudRain size="50%" />,
    <CloudSnow size="50%" />,
    <Cloud size="50%" />,
    <DownloadCloud size="50%" />,
    <UploadCloud size="50%" />
  ];
  const cloud = options[Math.floor(Math.random() * options.length)];

  return cloud;
}

const NoSSRCloud = dynamic(
  () => Promise.resolve(HomeCloud),
  { ssr: false }
);

const Home: NextPage = () => {
  return (
    <Page className="page-height">
      <Page.Header center={true}>
        <Text h1>Cloud Secrets</Text>
      </Page.Header>
      <Page.Content className='flex items-center justify-center h-full'>
        <NoSSRCloud />
      </Page.Content>
      <Page.Footer>something</Page.Footer>
    </Page>
  )
}

export default Home
