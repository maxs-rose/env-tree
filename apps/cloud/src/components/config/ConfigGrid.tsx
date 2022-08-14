import { EditConfigValueModal } from '@components/config/EditConfigValueModal';
import { Button, Input, Table, Tooltip, useModal } from '@geist-ui/core';
import { AlertTriangle, Info, PenTool, Trash2 } from '@geist-ui/icons';
import { flattenConfigValues } from '@utils/config';
import { trpc } from '@utils/trpc';
import { Config, ConfigValue } from '@utils/types';
import React, { useRef } from 'react';

const getPropertyNameDisplay = (property: string, value: ConfigValue[string]) => {
  if (value.parentName || value.overrides) {
    return (
      <Tooltip
        placement="right"
        text={`${value.parentName ? 'Imported from' : 'Overrides'} ${value.parentName ?? value.overrides}`}
      >
        <span className="flex gap-2">
          {property}
          {value.parentName ? <Info color="#0070f3" /> : <AlertTriangle color="red" />}
        </span>
      </Tooltip>
    );
  }

  return property;
};

export const ConfigGrid: React.FC<{ config: Config }> = ({ config }) => {
  const trpcContext = trpc.useContext();
  const updateConfig = trpc.useMutation('config-update');

  const editValue = useRef<string | undefined>(undefined);
  const currentConfig = useRef(config);
  const { setVisible: setAddConfigValueVisible, bindings: addConfigValueModalBindings, visible } = useModal();

  const tableData = Array.from(Object.entries(flattenConfigValues(config))).map(([property, value]) => ({
    property: getPropertyNameDisplay(property, value),
    value:
      value.hidden && value.value ? (
        <Input.Password readOnly width="100%" value={value.value} />
      ) : (
        <Input readOnly width="100%" value={value.value ?? '-'} />
      ),
    editProperty: value.parentName ? undefined : property,
    deleteProperty: value.parentName ? undefined : property,
  }));

  const renderDelete = (value?: string) => {
    const deleteConfigValue = () => {
      const newConfig = { ...config, values: { ...config.values } };
      delete newConfig.values[value!];

      updateConfig.mutate(
        {
          projectId: config.projectId,
          configId: config.id,
          values: newConfig.values,
        },
        {
          onSuccess: () => {
            trpcContext.invalidateQueries('config-get');
          },
        }
      );
    };

    return (
      <Button
        disabled={value === undefined}
        type="error"
        auto
        font="12px"
        icon={<Trash2 />}
        onClick={deleteConfigValue}
      />
    );
  };

  const renderEdit = (value?: string) => {
    const editConfig = () => {
      currentConfig.current = config;
      editValue.current = value;
      setAddConfigValueVisible(true);
    };

    return (
      <Button disabled={value === undefined} type="success" auto font="12px" icon={<PenTool />} onClick={editConfig} />
    );
  };

  const closeConfigValueModal = () => {
    setAddConfigValueVisible(false);
    trpcContext.invalidateQueries(['config-get']);
  };

  return (
    <>
      <Table data={tableData} emptyText="-">
        <Table.Column prop="property" label="Property" />
        <Table.Column prop="value" label="Value" />
        <Table.Column width={50} prop="editProperty" render={renderEdit}>
          <div className="w-full text-center">Edit</div>
        </Table.Column>
        <Table.Column width={50} prop="deleteProperty" render={renderDelete}>
          <div className="w-full text-center">Delete</div>
        </Table.Column>
      </Table>

      {visible ? (
        <EditConfigValueModal
          bindings={addConfigValueModalBindings}
          config={currentConfig}
          onCloseModel={closeConfigValueModal}
          editValue={editValue.current}
        />
      ) : (
        <></>
      )}
    </>
  );
};
