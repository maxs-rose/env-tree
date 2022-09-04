import { Card, Link, Page, Spacer, Text } from '@geist-ui/core';
import {
  BookOpen,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudOff,
  CloudRain,
  CloudSnow,
  DownloadCloud,
  Feather,
  HardDrive,
  UploadCloud,
} from '@geist-ui/icons';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import * as NextLink from 'next/link';
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
        <Text h1>Cloud Env</Text>
      </Page.Header>
      <Page.Content className="flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <span className="max-w-xs">
            <NoSSRCloud />
          </span>
          <Spacer h="2" />
          <Text h3 className="max-w-[500px] text-center" type="secondary">
            The open source system for secure .env storage to easily share configurations across your development team
            and environments
          </Text>
        </div>
        <Spacer h="10" />
        <div className="flex gap-10 flex-wrap items-center justify-center max-w-[782pt]">
          <Card hoverable className="!w-[320px] !h-[160px]">
            <Text h3 className="flex items-center justify-center gap-2">
              <Feather /> Free Always
            </Text>
            <Text p type="secondary">
              No matter your size Cloud Env is free for all, always
            </Text>
          </Card>
          <NextLink.default href="/docs/misc/selfhost">
            <Card hoverable className="!w-[320px] !h-[160px] cursor-pointer">
              <Text h3 className="flex items-center justify-center gap-2">
                <HardDrive /> Self Hostable
              </Text>
              <Text p type="secondary">
                Self hosting Cloud Env is welcomed with instructions available in the documentation
              </Text>
            </Card>
          </NextLink.default>
          <Link href="https://github.com/maxs-rose/secrets" target="_blank">
            <Card hoverable className="!w-[320px] !h-[160px] cursor-pointer">
              <Text h3 className="flex items-center justify-center gap-2">
                <BookOpen />
                Open Source
              </Text>
              <Text p type="secondary">
                Cloud Env is open sourced and available under the GNU GPL V3 licence
              </Text>
            </Card>
          </Link>
        </div>
      </Page.Content>
    </Page>
  );
};

export default Home;
