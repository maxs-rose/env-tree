import SecretLoader from '@components/loader';
import { Button, Card, Grid, Input, Modal, Page, Spacer, Text, useInput, useModal } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { Plus } from '@geist-ui/icons';
import { Project } from '@prisma/client';
import { trpc } from '@utils/trpc';
import { NextPage } from 'next';
import Link from 'next/link';
import React, { useState } from 'react';

const CreateProjectModal: React.FC<{ onCloseModel: (status: boolean) => void; bindings: ModalHooksBindings }> = ({
  onCloseModel,
  bindings,
}) => {
  const createProject = trpc.useMutation('createProject');
  const { setState: setInputState, bindings: inputBindings } = useInput('');
  const [createProjectState, setCreateProjectSate] = useState<{
    valid: boolean;
    errorMessage?: string;
  }>({ valid: true });

  const submitProjectName = () => {
    createProject.mutate(
      { name: inputBindings.value },
      {
        onSuccess: () => closeModal(true),
        onError: (error) => {
          setCreateProjectSate({
            valid: false,
            errorMessage: error.data?.code === 'CONFLICT' ? error.message : 'Invalid project name',
          });
        },
      }
    );
  };

  const inputChange: typeof inputBindings.onChange = (e) => {
    setCreateProjectSate({ valid: true });
    inputBindings.onChange(e);
  };

  const closeModal = (status = false) => {
    onCloseModel(status);
    setCreateProjectSate({ valid: true });
    setInputState('');
  };

  return (
    <Modal {...bindings} onClose={closeModal}>
      <Modal.Title>Create Project</Modal.Title>
      <Modal.Content>
        <Input
          placeholder="Enter Project name"
          type={createProjectState.valid ? 'default' : 'error'}
          value={inputBindings.value}
          onChange={inputChange}
          width="100%"
        />
        {createProjectState.valid ? (
          <></>
        ) : (
          <>
            <Spacer />{' '}
            <Text span type="error">
              {createProjectState.errorMessage}
            </Text>
          </>
        )}
      </Modal.Content>
      <Modal.Action passive onClick={() => closeModal(false)}>
        Cancel
      </Modal.Action>
      <Modal.Action passive onClick={submitProjectName}>
        Create
      </Modal.Action>
    </Modal>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const linkTarget = `/projects/${project.id}`;

  return (
    <Grid>
      <Link href={linkTarget} passHref>
        <a>
          <Card hoverable>
            <Text h4>{project.name}</Text>
            <Text>Short project description</Text>
          </Card>
        </a>
      </Link>
    </Grid>
  );
};

const Projects: NextPage = () => {
  const trpcContext = trpc.useContext();
  const projects = trpc.useQuery(['projects']);

  const { setVisible, bindings: modalBindings } = useModal();

  const closeModal = (status: boolean) => {
    if (status) {
      trpcContext.invalidateQueries(['projects']);
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
