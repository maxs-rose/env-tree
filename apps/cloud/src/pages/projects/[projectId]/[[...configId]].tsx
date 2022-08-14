import { prisma } from '@backend/prisma';
import { AddConfigModal } from '@components/config/AddConfigModal';
import { DisplayProjectConfigs } from '@components/config/DisplayProjectConfigs';
import SecretLoader from '@components/loader';
import { Button, Page, Tabs, Text, useModal, useTabs } from '@geist-ui/core';
import { Plus, Trash2 } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { Project } from '@utils/types';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const ProjectConfigs: NextPage<{ project: Project & { configs: Array<{ id: string }> }; configId?: string }> = ({
  project,
  configId,
}) => {
  const router = useRouter();
  const trpcContext = trpc.useContext();
  const { setState: setTabState, bindings: tabBindings } = useTabs(configId ?? '');
  const { setVisible: setAddConfigVisible, bindings: addConfigModalBindings } = useModal();
  const configs = trpc.useQuery(['config-get', { projectId: project?.id ?? '' }]);
  const deleteProjectMutation = trpc.useMutation('project-delete');

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

  const deleteProject = () => {
    deleteProjectMutation.mutate({ projectId: project.id }, { onSuccess: () => router.push('/projects') });
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
          <div className="flex items-center gap-3">
            <Text h2>
              <Text span>{project?.name}</Text> Configurations
            </Text>
            <Button auto icon={<Plus />} px={0.6} type="success" onClick={() => setAddConfigVisible(true)} />
            <Button auto icon={<Trash2 />} px={0.6} type="error" onClick={deleteProject} />
          </div>
        </Page.Header>
        <Page.Content className="flex items-center justify-center">{showContent()}</Page.Content>
      </Page>
      <AddConfigModal onCloseModel={closeConfigModal} bindings={addConfigModalBindings} projectId={project.id} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (typeof ctx.params?.projectId !== 'string') {
    return { notFound: true };
  }
  const project = await prisma.project.findUnique({ where: { id: ctx.params?.projectId }, include: { configs: true } });

  if (!project) {
    return { notFound: true };
  }

  let config = ctx.params?.configId?.[0];

  const configId = project.configs.some((c) => c.id === config) ? config : null;

  return {
    props: { project, configId },
  };
};

export default ProjectConfigs;
