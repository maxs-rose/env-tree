import { Card, Link, Page, Spacer, Text, useTheme } from '@geist-ui/core';
import { BookOpen, Feather, HardDrive } from '@geist-ui/icons';
import type { NextPage } from 'next';
import * as NextLink from 'next/link';
import React, { useEffect, useState } from 'react';

const colourOptions = ['#ef476f', '#06d6a0', '#ffd166'];

const Home: NextPage = () => {
  return (
    <Page className="page-height">
      <Page.Header center={true}>
        <Text h1>Env Tree</Text>
      </Page.Header>
      <Page.Content className="flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <span className="h-[25vh]">
            <Tree />
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
              No matter your size Env Tree is free for all, always
            </Text>
          </Card>
          <NextLink.default href="/docs/misc/selfhost">
            <span>
              <Card hoverable className="!w-[320px] !h-[160px] cursor-pointer">
                <Text h3 className="flex items-center justify-center gap-2">
                  <HardDrive /> Self Hostable
                </Text>
                <Text p type="secondary">
                  Self hosting Env Tree is welcomed with instructions available in the documentation
                </Text>
              </Card>
            </span>
          </NextLink.default>
          <Link href="https://github.com/maxs-rose/secrets" target="_blank">
            <Card hoverable className="!w-[320px] !h-[160px] cursor-pointer">
              <Text h3 className="flex items-center justify-center gap-2">
                <BookOpen />
                Open Source
              </Text>
              <Text p type="secondary">
                Env Tree is open sourced and available under the GNU GPL V3 licence
              </Text>
            </Card>
          </Link>
        </div>
      </Page.Content>
    </Page>
  );
};

const Tree = () => {
  const { palette } = useTheme();
  const [colour, setColour] = useState(palette.background === '#000' ? 'white' : 'black');
  const [nodeColours, setNodeColours] = useState(['', '', '', '', '']);

  useEffect(() => {
    setColour(palette.background === '#000' ? 'white' : 'black');

    const result = ['', '', '', '', ''];

    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.8) {
        const choice = colourOptions[Math.floor(Math.random() * colourOptions.length)];
        if (result.includes(choice)) {
          continue;
        }

        result[i] = choice;
      }
    }

    setNodeColours(result);
  }, [palette]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 183 259" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M97.5 258.5V225H91.5V258.5H97.5ZM97.5 225V193H91.5V225H97.5ZM97.5 193V148.5H91.5V193H97.5ZM97.5 148.5V28H91.5V148.5H97.5ZM97.4872 224.723C94.8728 196.487 77.7093 178.898 61.4973 168.476C53.3907 163.265 45.4616 159.8 39.5645 157.637C36.612 156.554 34.1583 155.793 32.4322 155.301C31.5689 155.054 30.8867 154.875 30.4143 154.756C30.178 154.696 29.9941 154.652 29.8662 154.621C29.8022 154.606 29.7521 154.595 29.7165 154.586C29.6987 154.582 29.6845 154.579 29.674 154.577C29.6687 154.575 29.6643 154.574 29.6609 154.574C29.6592 154.573 29.6573 154.573 29.6564 154.573C29.6548 154.572 29.6534 154.572 29 157.5C28.3466 160.428 28.3457 160.428 28.345 160.428C28.345 160.428 28.3445 160.428 28.3446 160.428C28.3449 160.428 28.346 160.428 28.3481 160.428C28.3522 160.429 28.3599 160.431 28.3712 160.434C28.3938 160.439 28.4306 160.447 28.4813 160.459C28.5825 160.483 28.739 160.521 28.947 160.574C29.3633 160.679 29.9858 160.842 30.7866 161.071C32.3886 161.527 34.7005 162.243 37.498 163.27C43.1009 165.325 50.6093 168.61 58.2527 173.524C73.5407 183.352 89.1272 199.513 91.5128 225.277L97.4872 224.723ZM97.4872 148.223C94.9324 120.632 85.2925 102.938 72.2863 92.1876C59.3318 81.4804 43.4455 78 29 78V84C42.5545 84 56.9182 87.2696 68.4637 96.8124C79.9575 106.312 89.0676 122.368 91.5128 148.777L97.4872 148.223ZM154 128.5C132.796 128.5 117.55 134.393 107.39 144.88L111.7 149.055C120.419 140.055 133.913 134.5 154 134.5V128.5ZM107.39 144.88C106.872 145.415 106.368 145.961 105.878 146.518L110.382 150.482C110.809 149.997 111.249 149.521 111.7 149.055L107.39 144.88ZM105.878 146.518C95.5535 158.247 91.5 174.638 91.5 193H97.5C97.5 175.386 101.406 160.679 110.382 150.482L105.878 146.518ZM110.261 150.612C110.8 150.067 111.319 149.505 111.819 148.925L107.272 145.01C106.862 145.486 106.438 145.945 105.999 146.388L110.261 150.612ZM111.819 148.925C118.876 140.728 121.979 129.075 123.406 115.954C124.838 102.796 124.63 87.5716 124.63 71.9336H118.63C118.63 87.7535 118.828 102.557 117.441 115.306C116.05 128.093 113.111 138.228 107.272 145.01L111.819 148.925Z"
        fill={colour}
      />
      <path
        d="M107.5 16.0094C107.5 23.1891 101.68 29.0094 94.5 29.0094C87.3203 29.0094 81.5 23.1891 81.5 16.0094C81.5 8.82974 87.3203 3.00945 94.5 3.00945C101.68 3.00945 107.5 8.82974 107.5 16.0094Z"
        fill={nodeColours[0]}
        stroke={colour}
        strokeWidth="6"
      />
      <path
        d="M29 156C29 163.18 23.1797 169 16 169C8.8203 169 3 163.18 3 156C3 148.82 8.8203 143 16 143C23.1797 143 29 148.82 29 156Z"
        fill={nodeColours[1]}
        stroke={colour}
        strokeWidth="6"
      />
      <path
        d="M29 81C29 88.1797 23.1797 94 16 94C8.8203 94 3 88.1797 3 81C3 73.8203 8.8203 68 16 68C23.1797 68 29 73.8203 29 81Z"
        fill={nodeColours[2]}
        stroke={colour}
        strokeWidth="6"
      />
      <path
        d="M135 57C135 64.1797 129.18 70 122 70C114.82 70 109 64.1797 109 57C109 49.8203 114.82 44 122 44C129.18 44 135 49.8203 135 57Z"
        fill={nodeColours[3]}
        stroke={colour}
        strokeWidth="6"
      />
      <path
        d="M180 130C180 137.18 174.18 143 167 143C159.82 143 154 137.18 154 130C154 122.82 159.82 117 167 117C174.18 117 180 122.82 180 130Z"
        fill={nodeColours[4]}
        stroke={colour}
        strokeWidth="6"
      />
    </svg>
  );
};

export default Home;
