import { Input, Modal, Text, useInput } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { trpc } from '@utils/trpc';
import React, { useState } from 'react';

export const AddConfigModal: React.FC<{
  onCloseModel: (projectId?: string) => void;
  bindings: ModalHooksBindings;
  projectId: string;
}> = ({ bindings, onCloseModel, projectId }) => {
  const updateConfig = trpc.useMutation('config-create');
  const { state: configName, setState: setConfigName, bindings: configBindings } = useInput('');
  const [invalidConfig, setInvalidConfig] = useState(false);

  const createConfig = () => {
    if (!configName.trim()) {
      setConfigName(configName.trim());
      setInvalidConfig(true);
      return;
    }

    updateConfig.mutate({ projectId, configName: configName.trim() }, { onSuccess: ({ id }) => closeModal(id) });
  };

  const closeModal = (projectId?: string) => {
    setInvalidConfig(false);
    setConfigName('');
    onCloseModel(projectId);
  };

  const inputChange: typeof configBindings.onChange = (e) => {
    setInvalidConfig(false);
    configBindings.onChange(e);
  };

  return (
    <Modal {...bindings} onClose={closeModal}>
      <Modal.Title>Add Configuration</Modal.Title>
      <Modal.Content>
        <Input
          placeholder="Config Name"
          value={configBindings.value}
          onChange={inputChange}
          width="100%"
          type={invalidConfig ? 'error' : 'default'}
        />
        {invalidConfig ? (
          <Text p type="error">
            Invalid configuration name
          </Text>
        ) : (
          <></>
        )}
      </Modal.Content>
      <Modal.Action onClick={() => closeModal}>Cancel</Modal.Action>
      <Modal.Action onClick={createConfig}>Create</Modal.Action>
    </Modal>
  );
};
