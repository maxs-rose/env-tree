import { ConfigType } from '@backend/api/config';
import { DuplicateConfigModal } from '@components/config/DuplicateConfigModal';
import { EditConfigValueModal } from '@components/config/EditConfigValueModal';
import { Button, ButtonDropdown, Input, Spacer, Table, Tabs, Tooltip, useModal } from '@geist-ui/core';
import { Check, Copy, DownloadCloud, Info, PenTool, Plus, Trash2 } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { Config, ConfigValue } from '@utils/types';
import fileDownload from 'js-file-download';
import React, { useRef, useState } from 'react';
import { catchError, EMPTY, map, of, withLatestFrom } from 'rxjs';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';

const getConfigValues = (config: Config | null): ConfigValue => {
  if (config?.linkedParent) {
    const parentValues = getConfigValues(config.linkedParent);

    return { ...config.values, ...parentValues };
  }

  return config?.values ?? {};
};

const ConfigGrid: React.FC<{ config: Config }> = ({ config }) => {
  const trpcContext = trpc.useContext();
  const updateConfig = trpc.useMutation('config-update');

  const editValue = useRef<string | undefined>(undefined);
  const currentConfig = useRef(config);
  const { setVisible: setAddConfigValueVisible, bindings: addConfigValueModalBindings, visible } = useModal();

  const parentConfigData = Array.from(
    new Map(Object.entries(getConfigValues(config.linkedParent ?? null))).entries()
  ).map(([property, value]) => ({
    property: (
      <Tooltip placement="right" text="Imported from parent config">
        <span className="flex gap-2">
          {property}
          <Info color="#0070f3" />
        </span>
      </Tooltip>
    ),
    value:
      value.hidden && value.value ? (
        <Input.Password readOnly width="100%" value={value.value} />
      ) : (
        <Input readOnly width="100%" value={value.value ?? '-'} />
      ),
    editProperty: undefined,
    deleteProperty: undefined,
  }));

  const currentConfigData = Array.from(new Map(Object.entries(config.values)).entries()).map(([property, value]) => ({
    property,
    value:
      value.hidden && value.value ? (
        <Input.Password readOnly width="100%" value={value.value} />
      ) : (
        <Input readOnly width="100%" value={value.value ?? '-'} />
      ),
    editProperty: property,
    deleteProperty: property,
  }));

  const tableData = [...parentConfigData, ...currentConfigData];

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

export const DisplayProjectConfigs: React.FC<{ configs: Config[]; updateTab: (configId: string) => void }> = ({
  configs,
  updateTab,
}) => {
  const trpcContext = trpc.useContext();
  const currentConfig = useRef<Config>();
  const deleteConfigMutation = trpc.useMutation('config-delete');
  const [downloadType, setDownloadType] = useState<ConfigType>('env');
  const [link, setLink] = useState(false);
  const { setVisible: setAddConfigValueVisible, bindings: addConfigValueModalBindings } = useModal();
  const { setVisible: setDuplicateConfigVisible, bindings: duplicateConfigModalBindings } = useModal();

  const openConfigModal = (conf: Config) => {
    currentConfig.current = conf;
    setAddConfigValueVisible(true);
  };

  const openDuplicateModal = (conf: Config) => {
    setLink(false);
    currentConfig.current = conf;
    setDuplicateConfigVisible(true);
  };

  const openLinkModal = (conf: Config) => {
    setLink(true);
    currentConfig.current = conf;
    setDuplicateConfigVisible(true);
  };

  const closeConfigValueModal = (invalidate = true) => {
    if (invalidate) {
      trpcContext.invalidateQueries(['config-get']);
    }
    setAddConfigValueVisible(false);
    setDuplicateConfigVisible(false);
  };

  const closeDuplicateModal = (newConfigId?: string) => {
    closeConfigValueModal(!!newConfigId);
    if (newConfigId) {
      updateTab(newConfigId);
    }
  };

  const deleteConfig = (pId: string, cId: string) => {
    deleteConfigMutation.mutate(
      { projectId: pId, configId: cId },
      {
        onSuccess: () => {
          trpcContext.invalidateQueries(['config-get']).then(() => {
            window.location.reload();
          });
        },
      }
    );
  };

  const downloadSecrets = (config: Config) => {
    const baseUrl = window.location.origin;

    const formData = JSON.stringify({ projectId: config.projectId, configId: config.id, type: downloadType });

    fromFetch(`${baseUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: formData,
      selector: (response) => (downloadType === 'env' ? response.text() : response.json()),
    })
      .pipe(
        catchError((error) => {
          console.error(error);
          return EMPTY;
        }),
        map((data) => (downloadType === 'json' ? JSON.stringify(data, null, '\t') : data)),
        withLatestFrom(of(`${config.name}.${downloadType}`))
      )
      .subscribe(([data, filename]) => fileDownload(data, filename));
  };

  return (
    <>
      {configs.map((c) => (
        <Tabs.Tab label={c.name} key={c.id} value={c.id}>
          <div className="flex justify-center">
            <Button auto ghost icon={<Plus />} onClick={() => openConfigModal(c)}>
              Add Secret
            </Button>
            <Spacer inline />
            <Button auto ghost icon={<Copy />} onClick={() => openDuplicateModal(c)}>
              Duplicate Config
            </Button>
            <Spacer inline />
            {!!c.linkedParent ? undefined : (
              <>
                <Button auto ghost icon={<Copy />} onClick={() => openLinkModal(c)}>
                  Link Config
                </Button>
                <Spacer inline />
              </>
            )}
            <ButtonDropdown auto icon={<DownloadCloud />} type="success">
              <ButtonDropdown.Item main onClick={() => downloadSecrets(c)}>
                Download Secrets ({downloadType})
              </ButtonDropdown.Item>
              <ButtonDropdown.Item onClick={() => setDownloadType('env')}>
                <span className="w-full flex justify-around items-center">
                  ENV {downloadType === 'env' ? <Check /> : <span />}
                </span>
              </ButtonDropdown.Item>
              <ButtonDropdown.Item onClick={() => setDownloadType('json')}>
                <span className="w-full flex justify-around items-center">
                  JSON {downloadType === 'json' ? <Check /> : <span />}
                </span>
              </ButtonDropdown.Item>
            </ButtonDropdown>
            <Spacer inline />
            <Button auto type="error" icon={<Trash2 />} onClick={() => deleteConfig(c.projectId, c.id)}>
              Delete Configuration
            </Button>
          </div>
          <Spacer />
          <ConfigGrid config={c} />
        </Tabs.Tab>
      ))}

      <DuplicateConfigModal
        bindings={duplicateConfigModalBindings}
        projectId={currentConfig.current?.projectId ?? ''}
        configId={currentConfig.current?.id ?? ''}
        onCloseModel={closeDuplicateModal}
        link={link}
      />

      <EditConfigValueModal
        bindings={addConfigValueModalBindings}
        config={currentConfig}
        onCloseModel={closeConfigValueModal}
      />
    </>
  );
};
