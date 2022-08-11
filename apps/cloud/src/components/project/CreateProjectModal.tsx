import { Input, Modal, Spacer, Text, useInput } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { trpc } from '@utils/trpc';
import React, { useState } from 'react';

export const CreateProjectModal: React.FC<{
  onCloseModel: (status: boolean) => void;
  bindings: ModalHooksBindings;
}> = ({ onCloseModel, bindings }) => {
  const createProject = trpc.useMutation('project-create');
  const { setState: setInputState, bindings: inputBindings } = useInput('');
  const [createProjectState, setCreateProjectSate] = useState<{
    valid: boolean;
    errorMessage?: string;
  }>({ valid: true });

  const submitProjectName = () => {
    createProject.mutate(
      { name: inputBindings.value.trim() },
      {
        onSuccess: () => closeModal(true),
        onError: (error) => {
          setInputState(inputBindings.value.trim());
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
