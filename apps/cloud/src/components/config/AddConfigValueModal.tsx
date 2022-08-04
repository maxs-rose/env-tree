import { Input, Modal, Spacer, Text, useInput } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { BindingsChangeTarget } from '@geist-ui/core/esm/use-input/use-input';
import { trpc } from '@utils/trpc';
import { Config } from '@utils/types';
import React, { MutableRefObject, useState } from 'react';

export const AddConfigValueModal: React.FC<{
  onCloseModel: () => void;
  bindings: ModalHooksBindings;
  config: MutableRefObject<Config | undefined>;
}> = ({ bindings, config, onCloseModel }) => {
  const { state: keyValue, setState: setKey, bindings: propertyBinding } = useInput('');
  const { state: valueValue, setState: setValue, bindings: valueBinding } = useInput('');
  const updateConfig = trpc.useMutation('config-update');
  const [invalid, setInvalid] = useState<undefined | string>(undefined);

  if (!config.current) {
    return <></>;
  }

  const configMap = new Map(Object.entries(config.current.values));

  const tryAddValue = () => {
    const key = keyValue.trim();
    const value = valueValue;

    if (!key) {
      setKey(key);
      setInvalid('Invalid property name');
      return;
    }

    if (configMap.has(key)) {
      setInvalid('Property already exists in config');
      return;
    }

    configMap.set(key, value);

    updateConfig.mutate(
      {
        projectId: config.current!.projectId,
        config: { id: config.current!.id, values: Object.fromEntries(configMap) },
      },
      {
        onSuccess: () => {
          clearInput();
          onCloseModel();
        },
      }
    );
  };

  const clearInput = () => {
    setInvalid(undefined);
    setKey('');
    setValue('');
  };

  const modalClose = () => {
    clearInput();

    if (bindings.onClose) {
      bindings.onClose();
    }

    onCloseModel();
  };

  const onInputChange = (b: (event: BindingsChangeTarget) => void) => {
    return (e: BindingsChangeTarget) => {
      setInvalid(undefined);
      b(e);
    };
  };

  return (
    <Modal visible={bindings.visible} onClose={modalClose}>
      <Modal.Title>Add secret</Modal.Title>
      <Modal.Content>
        <Input
          placeholder="Property"
          value={propertyBinding.value}
          onChange={onInputChange(propertyBinding.onChange)}
          width="100%"
        />
        <Spacer />
        <Input
          placeholder="Value"
          value={valueBinding.value}
          onChange={onInputChange(valueBinding.onChange)}
          width="100%"
        />
        <Text p type="error">
          {invalid}
        </Text>
      </Modal.Content>
      <Modal.Action onClick={modalClose}>Cancel</Modal.Action>
      <Modal.Action onClick={tryAddValue}>Create</Modal.Action>
    </Modal>
  );
};
