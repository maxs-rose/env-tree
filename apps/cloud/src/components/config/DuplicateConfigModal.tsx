import { Input, Modal, Text, useInput } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { trpc } from '@utils/trpc';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

export const DuplicateConfigModal: React.FC<{
  onCloseModel: (configId?: string) => void;
  bindings: ModalHooksBindings;
  projectId: string;
  configId: string;
  link: boolean;
}> = ({ bindings, onCloseModel, projectId, configId, link }) => {
  const router = useRouter();
  const updateConfig = trpc.useMutation(link ? 'config-link' : 'config-duplicate');
  const { state: configName, setState: setConfigName, bindings: configBindings } = useInput('');
  const [invalidConfig, setInvalidConfig] = useState(false);

  const createConfig = () => {
    if (!configName.trim()) {
      setConfigName(configName.trim());
      setInvalidConfig(true);
      return;
    }

    updateConfig.mutate(
      { projectId, targetConfig: configId, configName: configName.trim() },
      {
        onSuccess: ({ projectId, id }) => {
          closeModal(id);
          router.push(`/projects/${projectId}/${id}`, undefined, { shallow: false });
        },
      }
    );
  };

  const closeModal = (configId?: string) => {
    setInvalidConfig(false);
    setConfigName('');
    onCloseModel(configId);
  };

  const inputChange: typeof configBindings.onChange = (e) => {
    setInvalidConfig(false);
    configBindings.onChange(e);
  };

  return (
    <Modal {...bindings} onClose={closeModal}>
      <Modal.Title>Duplicate Configuration</Modal.Title>
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
      <Modal.Action onClick={() => closeModal()}>Cancel</Modal.Action>
      <Modal.Action onClick={createConfig}>{link ? 'Link' : 'Duplicate'}</Modal.Action>
    </Modal>
  );
};
