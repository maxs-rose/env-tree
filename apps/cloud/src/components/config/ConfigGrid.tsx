import { EditConfigValueModal } from '@components/config/EditConfigValueModal';
import { Button, ButtonGroup, Input, Table, Tooltip, useModal, useTheme } from '@geist-ui/core';
import { TableColumnRender } from '@geist-ui/core/esm/table';
import { AlertTriangle, Eye, Info, PenTool, Trash2 } from '@geist-ui/icons';
import { flattenConfigValues } from '@utils/shared/flattenConfig';
import { trpc } from '@utils/shared/trpc';
import { Config, ConfigValue } from '@utils/shared/types';
import React, { useRef, useState } from 'react';

const propertyName = (property: string, value: ConfigValue[string]) => {
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

const propertyValue = ({ value, hidden }: { value: string | null; hidden?: boolean }) => {
  if (!value) {
    return null;
  }

  return hidden ? (
    <Input.Password readOnly width="100%" value={value} />
  ) : (
    <Input readOnly width="100%" value={value} />
  );
};

export const ConfigGrid: React.FC<{ config: Config }> = ({ config }) => {
  const theme = useTheme();
  const trpcContext = trpc.useContext();
  const updateConfig = trpc.useMutation('config-update');

  const editValue = useRef<string | undefined>(undefined);
  const currentConfig = useRef(config);
  const { setVisible: setAddConfigValueVisible, bindings: addConfigValueModalBindings, visible } = useModal();
  const [allowConfigEdit, setAllowConfigEdit] = useState(true);

  const tableData = Array.from(Object.entries(flattenConfigValues(config))).map(([property, value]) => ({
    property: propertyName(property, value),
    value: propertyValue(value),
    group: (
      <span className="max-w-[200px] whitespace-nowrap overflow-hidden overflow-ellipsis">{value.group || '-'}</span>
    ),
    mobileProperty: property,
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
          configVersion: config.version,
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

  const renderEditDelete: TableColumnRender<typeof tableData[number]> = (_, row) => {
    const openShowConfig = () => {
      currentConfig.current = config;
      editValue.current = row.mobileProperty;
      setAllowConfigEdit(false);
      setAddConfigValueVisible(true);
    };

    if (!row.deleteProperty || !row.editProperty) {
      return <Button style={{ margin: 'auto' }} auto icon={<Eye />} onClick={openShowConfig} />;
    }

    return (
      <ButtonGroup>
        {renderEdit(row.editProperty)}
        {renderDelete(row.deleteProperty)}
      </ButtonGroup>
    );
  };

  const closeConfigValueModal = () => {
    setAllowConfigEdit(true);
    setAddConfigValueVisible(false);
    trpcContext.invalidateQueries(['config-get']);
  };

  return (
    <>
      <div className="table-display">
        <Table data={tableData} emptyText="-">
          <Table.Column prop="property" label="Property" />
          <Table.Column prop="value" label="Value" />
          <Table.Column width={200} prop="group" label="Group" />
          <Table.Column width={50} prop="editProperty" render={renderEdit}>
            <div className="w-full text-center">Edit</div>
          </Table.Column>
          <Table.Column width={50} prop="deleteProperty" render={renderDelete}>
            <div className="w-full text-center">Delete</div>
          </Table.Column>
        </Table>
      </div>
      <div className="mobile-display flex justify-center">
        <Table data={tableData} emptyText="-">
          <Table.Column prop="property" label="Property" />
          <Table.Column width={50} prop="mobileProperty" render={renderEditDelete}>
            <div className="w-full text-center">Edit/Delete</div>
          </Table.Column>
        </Table>
      </div>

      {visible ? (
        <EditConfigValueModal
          bindings={addConfigValueModalBindings}
          config={currentConfig}
          onCloseModel={closeConfigValueModal}
          configValue={editValue.current}
          allowEdit={allowConfigEdit}
        />
      ) : (
        <></>
      )}

      <style jsx>{`
        .mobile-display {
          display: none;
        }

        @media only screen and (max-width: ${theme.breakpoints.xs.max}) {
          .table-display {
            display: none;
          }

          .mobile-display {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};
