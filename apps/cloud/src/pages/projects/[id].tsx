import { prisma } from '@backend/prisma';
import SecretLoader from '@components/loader';
import { Button, Page, Spacer, Table, Tabs, Text } from '@geist-ui/core';
import { DownloadCloud, Plus, Trash2 } from '@geist-ui/icons';
import { Config, Project } from '@prisma/client';
import { trpc } from '@utils/trpc';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

const ProjectConfigs: NextPage<{ project: Project & { configs: Config[] } }> = ({ project }) => {
  if (!project) {
    return (
      <Page className="page-height flex items-center">
        <SecretLoader loadingText="Loading project" />
      </Page>
    );
  }

  const configs = trpc.useQuery(['config', { id: project.id }], {
    initialData: project.configs,
    staleTime: Infinity,
  });

  const ConfigGrid: React.FC<{ config: Config }> = ({ config }) => {
    const tableData = [
      { property: 'ENV_SECRET', value: 'some value' },
      { property: 'ENV_SECRET_2', value: 'some value' },
    ];

    return (
      <Table data={tableData}>
        <Table.Column prop="property" label="Property" />
        <Table.Column prop="value" label="Value" />
      </Table>
    );
  };

  const showConfigs = (configs: Config[]) => {
    return configs.map((c) => (
      <Tabs.Tab label={c.name} key={c.id} value={c.id}>
        <div className="flex justify-center">
          <Button auto ghost type="success" icon={<DownloadCloud />}>
            Download secrets
          </Button>
          <Spacer inline />
          <Button auto ghost type="error" icon={<Trash2 />}>
            Delete Configuration
          </Button>
        </div>
        <Spacer />
        <ConfigGrid config={c} />
      </Tabs.Tab>
    ));
  };

  const showContent = () => {
    if (configs.isLoading) {
      return <SecretLoader loadingText="Loading configurations" />;
    }

    if (!configs.data || configs.data.length === 0) {
      return <Text p>No configurations for project</Text>;
    }

    return (
      <div className="w-full">
        <Tabs initialValue={configs.data[0]?.id}>{showConfigs(configs.data ?? [])}</Tabs>
      </div>
    );
  };

  return (
    <>
      <Page className="page-height">
        <Page.Header>
          <div className="flex items-center gap-3">
            <Text h2>
              <Text span>{project?.name}</Text> Configurations
            </Text>
            <Button auto icon={<Plus />} px={0.6} type="success" />
          </div>
        </Page.Header>
        <Page.Content className="flex items-center justify-center">{showContent()}</Page.Content>
      </Page>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (typeof ctx.params?.id !== 'string') {
    return { notFound: true };
  }
  const project = await prisma.project.findUnique({ where: { id: ctx.params?.id }, include: { configs: true } });

  if (!project) {
    return { notFound: true };
  }

  return {
    props: { project },
  };
};

export default ProjectConfigs;
