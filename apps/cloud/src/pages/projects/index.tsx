import SecretLoader from '@components/loader';
import { CreateProjectModal } from '@components/project/CreateProjectModal';
import { ProjectCard } from '@components/project/ProjectCard';
import { Button, Grid, Page, Text, useModal } from '@geist-ui/core';
import { Plus } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { NextPage } from 'next';
import React from 'react';

const Projects: NextPage = () => {
  const trpcContext = trpc.useContext();
  const projects = trpc.useQuery(['project-get']);

  const { setVisible, bindings: modalBindings } = useModal();

  const closeModal = (status: boolean) => {
    if (status) {
      trpcContext.invalidateQueries(['project-get']);
    }
    setVisible(false);
  };

  const getProjects = () => {
    if (projects.status !== 'success') {
      return <SecretLoader loadingText="Loading projects" />;
    }

    return (
      <Grid.Container gap={2} justify="center" dir="row" wrap="wrap">
        {projects.data.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </Grid.Container>
    );
  };

  return (
    <>
      <Page className="page-height">
        <Page.Header>
          <div className="flex items-center gap-3">
            <Text h2>My Projects</Text>
            <Button auto icon={<Plus />} px={0.6} type="success" onClick={() => setVisible(true)} />
          </div>
        </Page.Header>
        <Page.Content>{getProjects()}</Page.Content>
      </Page>
      <CreateProjectModal onCloseModel={closeModal} bindings={modalBindings} />
    </>
  );
};

export default Projects;
