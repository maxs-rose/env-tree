import { AutoComplete, Input, Modal, Spacer, Text, Toggle, useInput, useToasts } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { BindingsChangeTarget } from '@geist-ui/core/esm/use-input/use-input';
import { flattenConfigValues } from '@utils/shared/flattenConfig';
import { trpc } from '@utils/shared/trpc';
import { Config, ConfigValue } from '@utils/shared/types';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

const getConfigValue = <T,>(
  conf: Config | undefined,
  configValue: string | undefined,
  target: keyof ConfigValue[string]
) => conf?.values?.[configValue ?? '']?.[target] as T | undefined;

const EditConfigValueModalComponent: React.FC<{
  onCloseModel: () => void;
  bindings: ModalHooksBindings;
  config: Config;
  configValue?: string;
  allowEdit?: boolean;
}> = ({ bindings, config, onCloseModel, configValue, allowEdit = true }) => {
  const toaster = useToasts();
  const { state: keyValue, setState: setKey, bindings: propertyBinding } = useInput('');
  const {
    state: valueValue,
    setState: setValue,
    bindings: valueBinding,
  } = useInput(getConfigValue<string>(config, configValue, 'value') ?? '');
  const [hidden, setHidden] = useState(getConfigValue<boolean>(config, configValue, 'hidden') ?? false);
  const updateConfig = trpc.useMutation('config-update');
  const [invalid, setInvalid] = useState<undefined | string>(undefined);
  const [group, setGroup] = useState<string | null>(
    getConfigValue<string | null>(config, configValue, 'group') || null
  );
  const [groupOptions, setGroupOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    setKey(configValue ?? '');
    setValue(getConfigValue<string>(config, configValue, 'value') ?? '');
    setGroup(getConfigValue<string>(config, configValue, 'group') || null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, configValue]);

  const configMap = new Map(Object.entries(config.values));
  const allGroupOptions = Array.from(
    new Set(Array.from(Object.entries(flattenConfigValues(config))).map(([, v]) => v.group)).values()
  )
    .filter((g) => g)
    .map((g) => ({ label: g!, value: g! }));

  const tryAddValue = () => {
    const key = keyValue.trim();
    const value = { value: valueValue, group: group || null, hidden };

    if (!key) {
      setKey(key);
      setInvalid('Invalid property name');
      return;
    }

    if (!configValue && configMap.has(key)) {
      setInvalid('Property already exists in config');
      return;
    }

    configMap.set(key, value);

    updateConfig.mutate(
      {
        projectId: config.projectId,
        configId: config.id,
        configVersion: config.version,
        values: Object.fromEntries(configMap),
      },
      {
        onSuccess: () => {
          setInvalid(undefined);
          onCloseModel();
        },
        onError: (error) => {
          if (error.data?.code === 'CONFLICT') {
            modalClose();
            setTimeout(() => {
              toaster.setToast({
                type: 'error',
                text: 'Failed to update config due to version mismatch, reloading',
                delay: 10000,
              });
            }, 500);
          } else {
            modalClose();
            toaster.setToast({ type: 'error', text: 'Failed to update config' });
          }
        },
      }
    );
  };

  const modalClose = () => {
    setInvalid(undefined);

    if (bindings.onClose) {
      bindings.onClose();
    }

    if (!configValue) {
      setInvalid(undefined);
      setKey('');
      setValue('');
      setGroup(null);
      setHidden(false);
    }

    onCloseModel();
  };

  const onInputChange = (binding: (event: BindingsChangeTarget) => void) => {
    return (event: BindingsChangeTarget) => {
      setInvalid(undefined);
      binding(event);
    };
  };

  const handleSearch = (searchValue: string) => {
    const currentOptions = allGroupOptions.filter(
      (g) => g.value.toLowerCase().includes(searchValue.toLowerCase()) || g.label.toLowerCase().includes(searchValue)
    );

    if (currentOptions.length === 0) {
      setGroupOptions([{ label: `Create group "${searchValue}"`, value: searchValue }]);
    } else {
      setGroupOptions(currentOptions);
    }
  };

  const handleGroupChange = (value: string) => {
    setGroup(value || null);
  };

  return (
    <Modal visible={bindings.visible} onClose={modalClose}>
      <Modal.Title>Add secret</Modal.Title>
      <Modal.Content>
        <Input
          disabled={!!configValue}
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
        <Spacer />
        <AutoComplete
          clearable
          width="100%"
          placeholder="Group"
          initialValue={group ?? undefined}
          options={groupOptions}
          onChange={handleGroupChange}
          onSearch={handleSearch}
        />
        <Spacer />
        <div className="flex items-center gap-2">
          <label htmlFor="hiddenToggle">Hidden</label>
          <Toggle id="hiddenToggle" padding={0} initialChecked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        </div>
        <Text p type="error">
          {invalid}
        </Text>
      </Modal.Content>
      <Modal.Action onClick={modalClose}>Cancel</Modal.Action>
      {allowEdit ? <Modal.Action onClick={tryAddValue}>{!configValue ? 'Create' : 'Update'}</Modal.Action> : undefined}
    </Modal>
  );
};

export const EditConfigValueModal = dynamic(() => Promise.resolve(EditConfigValueModalComponent), { ssr: false });
