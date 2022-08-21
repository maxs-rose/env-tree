import { prisma } from '@backend/prisma';
import { AddConfigModal } from '@components/config/AddConfigModal';
import { DisplayProjectConfigs } from '@components/config/DisplayProjectConfigs';
import SecretLoader from '@components/loader';
import { ProjectSettingsModal } from '@components/project/ProjectSettingsModal';
import { Button, Page, Spacer, Tabs, Text, useModal, useTabs } from '@geist-ui/core';
import { Plus, Settings } from '@geist-ui/icons';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { trpc } from '@utils/trpc';
import { Project } from '@utils/types';
import { GetServerSideProps, NextPage } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const ProjectConfigs: NextPage<{ project: Project & { configs: Array<{ id: string }> }; configId?: string }> = ({
  project,
  configId,
}) => {
  const router = useRouter();
  const trpcContext = trpc.useContext();
  const { setState: setTabState, bindings: tabBindings } = useTabs(configId ?? '');
  const { setVisible: setProjectSettingsVisible, bindings: projectSettingsModalBindings } = useModal();
  const { setVisible: setAddConfigVisible, bindings: addConfigModalBindings } = useModal();
  const configs = trpc.useQuery(['config-get', { projectId: project?.id ?? '' }]);

  useEffect(() => {
    if (!configId && project.configs.length > 0) {
      tabChange(project.configs[0].id);
      setTabState(project.configs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabChange = (configId: string) => {
    router.push(`/projects/${project?.id}/${configId}`, undefined, { shallow: true });
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
        <Tabs {...tabBindings} onChange={tabChange}>
          <DisplayProjectConfigs configs={configs.data} updateTab={setTabState} />
        </Tabs>
      </div>
    );
  };

  const closeConfigModal = (newConfigId?: string) => {
    trpcContext.invalidateQueries(['config-get']);
    setAddConfigVisible(false);

    if (newConfigId) {
      setTabState(newConfigId);
    }
  };

  const closeProjectSettings = () => {
    setProjectSettingsVisible(false);
  };

  if (!project) {
    return (
      <Page className="page-height flex items-center">
        <SecretLoader loadingText="Loading project" />
      </Page>
    );
  }

  return (
    <>
      <Page className="page-height">
        <Page.Header>
          <div className="flex items-center gap-2 flex-wrap">
            <Text h2>{project?.name}</Text>
            <Spacer inline />
            <Button auto icon={<Plus />} px={0.6} type="success" onClick={() => setAddConfigVisible(true)}>
              Add Configuration
            </Button>
            <Button
              className="propagate-hover:animate-spin"
              auto
              icon={<Settings />}
              onClick={() => setProjectSettingsVisible(true)}
            />
          </div>
        </Page.Header>
        <Page.Content className="flex items-center justify-center">{showContent()}</Page.Content>
      </Page>
      <ProjectSettingsModal
        onCloseModel={closeProjectSettings}
        bindings={projectSettingsModalBindings}
        project={project}
      />
      <AddConfigModal onCloseModel={closeConfigModal} bindings={addConfigModalBindings} projectId={project.id} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = (await unstable_getServerSession(ctx.req, ctx.res, authOptions))?.user as { id: string } | null;

  if (!user) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  if (typeof ctx.params?.projectId !== 'string') {
    return { notFound: true };
  }

  const uop = await prisma.usersOnProject.findUnique({
    where: { projectId_userId: { projectId: ctx.params?.projectId, userId: user.id } },
    include: { project: { include: { configs: true } } },
  });

  if (!uop) {
    return { redirect: { destination: '/projects', permanent: false } };
  }

  let config = ctx.params?.configId?.[0];

  const configId = uop.project.configs.some((c) => c.id === config) ? config : null;

  return {
    props: { project: uop.project, configId },
  };
};

export default ProjectConfigs;
