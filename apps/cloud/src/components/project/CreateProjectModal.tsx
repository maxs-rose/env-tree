import { Input, Modal, Spacer, Text, Textarea, useInput } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { getZodErrorMessage, trpc } from '@utils/shared/trpc';
import React, { useState } from 'react';

export const CreateProjectModal: React.FC<{
  onCloseModel: (status: boolean) => void;
  bindings: ModalHooksBindings;
}> = ({ onCloseModel, bindings }) => {
  const createProject = trpc.useMutation('project-create');
  const { setState: setProjectNameState, bindings: projectNameBindings } = useInput('');
  const { setState: setProjectDescriptionState, bindings: projectDescriptionBindings } = useInput('');
  const [createProjectState, setCreateProjectSate] = useState<{
    nameInvalid?: string;
    descriptionInvalid?: string;
  }>({});

  const submitCreateProject = () => {
    createProject.mutate(
      { name: projectNameBindings.value.trim(), description: projectDescriptionBindings.value.trim() || null },
      {
        onSuccess: () => closeModal(true),
        onError: (error) => {
          setProjectNameState(projectNameBindings.value.trim());

          const errorMessage = getZodErrorMessage(error.message);

          setCreateProjectSate({
            nameInvalid: errorMessage.filter((e) => e.path.some((v) => v === 'name'))?.[0]?.message || undefined,
            descriptionInvalid:
              errorMessage.filter((e) => e.path.some((v) => v === 'description'))?.[0]?.message || undefined,
          });
        },
      }
    );
  };

  const inputChange: typeof projectNameBindings.onChange = (e) => {
    setCreateProjectSate({});
    projectNameBindings.onChange(e);
  };

  const closeModal = (status = false) => {
    onCloseModel(status);
    setCreateProjectSate({});
    setProjectNameState('');
    setProjectDescriptionState('');
  };

  return (
    <Modal {...bindings} onClose={closeModal}>
      <Modal.Title>Create Project</Modal.Title>
      <Modal.Content>
        <Input
          placeholder="Project name"
          type={createProjectState.nameInvalid ? 'error' : 'default'}
          value={projectNameBindings.value}
          onChange={inputChange}
          width="100%"
        />
        <Text span type="error">
          {createProjectState.nameInvalid}
        </Text>
        <Spacer inline />
        <Textarea
          placeholder="Project description"
          width="100%"
          height="100px"
          type={createProjectState.descriptionInvalid ? 'error' : 'default'}
          {...projectDescriptionBindings}
        />
        <Text span type="error">
          {createProjectState.descriptionInvalid}
        </Text>
        <Spacer inline />
      </Modal.Content>
      <Modal.Action passive onClick={() => closeModal(false)}>
        Cancel
      </Modal.Action>
      <Modal.Action passive onClick={submitCreateProject}>
        Create
      </Modal.Action>
    </Modal>
  );
};
