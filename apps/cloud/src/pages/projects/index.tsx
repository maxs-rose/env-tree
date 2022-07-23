import { Button, Grid, Input, Modal, Page, Spacer, Text, useInput, useModal } from '@geist-ui/core';
import { Plus } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { NextPage } from 'next';
import { useState } from 'react';

const Projects: NextPage = () => {
  const createProject = trpc.useMutation('createProject');
  const trpcContext = trpc.useContext();
  const projects = trpc.useQuery(['projects']);

  const { setVisible, bindings: modalBindings } = useModal();
  const { setState: setInputState, bindings: inputBindings } = useInput('');
  const [createProjectState, setCreateProjectSate] = useState<{
    valid: boolean;
    errorMessage?: string;
  }>({ valid: true });

  const closeModal = () => {
    if (createProject.isSuccess) {
      trpcContext.invalidateQueries(['projects']);
    }
    setVisible(false);
    setCreateProjectSate({ valid: true });
    setInputState('');
  };

  const submitProjectName = () => {
    createProject.mutate(
      { name: inputBindings.value },
      {
        onSuccess: closeModal,
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

  const getProjects = () => {
    if (projects.status !== 'success') {
      return <></>;
    }

    return projects.data.map((p) => <Grid key={p.id}>{p.name}</Grid>);
  };

  return (
    <>
      <Page className="page-height" dotBackdrop={true}>
        <Page.Header>
          <div className="flex items-center gap-3">
            <Text h2>My Projects</Text>{' '}
            <Button auto icon={<Plus />} px={0.6} type="success" onClick={() => setVisible(true)} />
          </div>
        </Page.Header>
        <Page.Content>
          <Grid.Container gap={2} justify="center" dir="row" wrap="wrap">
            {getProjects()}
          </Grid.Container>
        </Page.Content>
      </Page>
      <Modal {...modalBindings} onClose={closeModal}>
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
        <Modal.Action passive onClick={closeModal}>
          Cancel
        </Modal.Action>
        <Modal.Action passive onClick={submitProjectName}>
          Create
        </Modal.Action>
      </Modal>
    </>
  );
};

export default Projects;
