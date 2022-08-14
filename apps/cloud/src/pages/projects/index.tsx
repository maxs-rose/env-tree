import { CreateProjectModal } from '@components/project/CreateProjectModal';
import { ProjectsDisplay } from '@components/project/ProjectsDisplay';
import { Button, Page, Text, useModal } from '@geist-ui/core';
import { Plus } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { NextPage } from 'next';
import React from 'react';

const Projects: NextPage = () => {
  const trpcContext = trpc.useContext();

  const { setVisible, bindings: modalBindings } = useModal();

  const closeModal = (status: boolean) => {
    if (status) {
      trpcContext.invalidateQueries(['project-get']);
    }
    setVisible(false);
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
        <Page.Content>
          <ProjectsDisplay />
        </Page.Content>
      </Page>
      <CreateProjectModal onCloseModel={closeModal} bindings={modalBindings} />
    </>
  );
};

export default Projects;
