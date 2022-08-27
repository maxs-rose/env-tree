import { ConfigGrid } from '@components/config/ConfigGrid';
import { DuplicateConfigModal } from '@components/config/DuplicateConfigModal';
import { EditConfigValueModal } from '@components/config/EditConfigValueModal';
import { Button, ButtonDropdown, Snippet, Spacer, Tabs, useModal } from '@geist-ui/core';
import { Check, Copy, DownloadCloud, Plus, Trash2 } from '@geist-ui/icons';
import { trpc } from '@utils/shared/trpc';
import { Config, ConfigType } from '@utils/shared/types';
import fileDownload from 'js-file-download';
import React, { useRef, useState } from 'react';
import { catchError, EMPTY, map, of, withLatestFrom } from 'rxjs';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';

export const DisplayProjectConfigs: React.FC<{ configs: Config[]; updateTab: (configId: string) => void }> = ({
  configs,
  updateTab,
}) => {
  const trpcContext = trpc.useContext();
  const currentConfig = useRef<Config>();
  const configSelectorRef = useRef() as React.MutableRefObject<HTMLDivElement>;
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
        map((data) => (downloadType !== 'env' ? JSON.stringify(data, null, '\t') : data)),
        withLatestFrom(of(`${config.name}.${downloadType === 'env' ? 'env' : 'json'}`))
      )
      .subscribe(([data, filename]) => fileDownload(data, filename));
  };

  const updateDownloadType = (type: ConfigType) => {
    setDownloadType(type);
    (
      configSelectorRef.current?.querySelector('.btn-dropdown>details[open]>summary') as HTMLElement | undefined
    )?.click();
  };

  return (
    <>
      {configs.map((c) => (
        <Tabs.Tab label={c.name} key={c.id} value={c.id}>
          <div className="flex justify-center items-center flex-wrap gap-2" ref={configSelectorRef}>
            <Button auto ghost icon={<Plus />} onClick={() => openConfigModal(c)}>
              Add Secret
            </Button>
            <Button auto ghost icon={<Copy />} onClick={() => openDuplicateModal(c)}>
              Duplicate Config
            </Button>
            <Button auto ghost icon={<Copy />} onClick={() => openLinkModal(c)}>
              Create Linked Config
            </Button>
            <ButtonDropdown auto icon={<DownloadCloud />} type="success">
              <ButtonDropdown.Item main onClick={() => downloadSecrets(c)}>
                Download Secrets ({downloadType.replaceAll('-', ' ')})
              </ButtonDropdown.Item>
              <ButtonDropdown.Item onClick={() => updateDownloadType('env')}>
                <span className="w-full flex justify-around items-center">
                  ENV {downloadType === 'env' ? <Check /> : <span />}
                </span>
              </ButtonDropdown.Item>
              <ButtonDropdown.Item onClick={() => updateDownloadType('json')}>
                <span className="w-full flex justify-around items-center">
                  JSON {downloadType === 'json' ? <Check /> : <span />}
                </span>
              </ButtonDropdown.Item>
              <ButtonDropdown.Item onClick={() => updateDownloadType('json-grouped')}>
                <span className="w-full flex justify-around items-center">
                  JSON Grouped {downloadType === 'json-grouped' ? <Check /> : <span />}
                </span>
              </ButtonDropdown.Item>
            </ButtonDropdown>
            <Button auto type="error" icon={<Trash2 />} onClick={() => deleteConfig(c.projectId, c.id)}>
              Delete Configuration
            </Button>
          </div>
          <Spacer />
          <ConfigGrid config={c} />
          <Spacer />
          <Snippet text={`${c.projectId} ${c.id}`} symbol="Project and Config ID:" type="secondary" />
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
