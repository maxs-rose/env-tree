import { ConfigGrid } from '@components/config/ConfigGrid';
import { ConfigOptionsModal } from '@components/config/ConfigOptionsModal';
import { EditConfigValueModal } from '@components/config/EditConfigValueModal';
import { Button, ButtonDropdown, Snippet, Spacer, Tabs, useModal } from '@geist-ui/core';
import { Check, DownloadCloud, Plus, Settings } from '@geist-ui/icons';
import { trpc } from '@utils/shared/trpc';
import { Config, ConfigType } from '@utils/shared/types';
import fileDownload from 'js-file-download';
import React, { useRef, useState } from 'react';
import { catchError, EMPTY, map, of, withLatestFrom } from 'rxjs';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';

const ConfigDownloadButton: React.FC<{ config: Config }> = ({ config }) => {
  const [downloadType, setDownloadType] = useState<ConfigType>('env');
  const updateDownloadType = (type: ConfigType, event?: { target: HTMLElement }) => {
    setDownloadType(type);
    (event?.target.closest('details[open]')?.querySelector('summary') as HTMLElement | undefined)?.click();
  };

  const downloadSecrets = () => {
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

  return (
    <ButtonDropdown auto icon={<DownloadCloud />} type="success">
      <ButtonDropdown.Item main onClick={downloadSecrets}>
        Download ({downloadType.replaceAll('-', ' ')})
      </ButtonDropdown.Item>
      <ButtonDropdown.Item onClick={(event) => updateDownloadType('env', event as unknown as { target: HTMLElement })}>
        <span className="w-full flex justify-around items-center">
          ENV {downloadType === 'env' ? <Check /> : <span />}
        </span>
      </ButtonDropdown.Item>
      <ButtonDropdown.Item onClick={(event) => updateDownloadType('json', event as unknown as { target: HTMLElement })}>
        <span className="w-full flex justify-around items-center">
          JSON {downloadType === 'json' ? <Check /> : <span />}
        </span>
      </ButtonDropdown.Item>
      <ButtonDropdown.Item
        onClick={(event) => updateDownloadType('json-grouped', event as unknown as { target: HTMLElement })}
      >
        <span className="w-full flex justify-around items-center">
          JSON Grouped {downloadType === 'json-grouped' ? <Check /> : <span />}
        </span>
      </ButtonDropdown.Item>
    </ButtonDropdown>
  );
};

export const DisplayProjectConfigs: React.FC<{ configs: Config[]; updateTab: (configId: string) => void }> = ({
  configs,
  updateTab,
}) => {
  const trpcContext = trpc.useContext();
  const currentConfig = useRef<Config>();
  const configSelectorRef = useRef() as React.MutableRefObject<HTMLDivElement>;
  const { setVisible: setAddConfigValueVisible, bindings: addConfigValueModalBindings } = useModal();
  const { setVisible: setConfigSettingsVisible, bindings: addConfigSettingsModalBindings } = useModal();

  const openAddSecretModal = (conf: Config) => {
    currentConfig.current = conf;
    setAddConfigValueVisible(true);
  };

  const openOptionsModal = (conf: Config) => {
    currentConfig.current = conf;
    setConfigSettingsVisible(true);
  };

  const closeConfigValueModal = (invalidate = true) => {
    if (invalidate) {
      trpcContext.invalidateQueries(['config-get']);
    }
    setAddConfigValueVisible(false);
    setConfigSettingsVisible(false);
  };

  return (
    <>
      {configs.map((c) => (
        <Tabs.Tab label={c.name} key={c.id} value={c.id}>
          <div className="flex items-center flex-wrap justify-between gap-2" ref={configSelectorRef}>
            <span className="flex items-center flex-wrap gap-2">
              <Button auto ghost icon={<Plus />} onClick={() => openAddSecretModal(c)}>
                Add Secret
              </Button>
              <ConfigDownloadButton config={c} />
            </span>
            <Button
              auto
              icon={<Settings />}
              className="propagate-hover:animate-spinDuration"
              onClick={() => openOptionsModal(c)}
            />
          </div>
          <Spacer />
          <ConfigGrid config={c} />
          <Spacer />
          <Snippet text={`${c.projectId} ${c.id}`} symbol="Project and Config ID:" type="secondary" />
        </Tabs.Tab>
      ))}

      {currentConfig.current && (
        <ConfigOptionsModal
          bindings={addConfigSettingsModalBindings}
          config={currentConfig.current}
          allConfigs={configs}
          updateTab={updateTab}
          closeConfigValueModal={closeConfigValueModal}
        ></ConfigOptionsModal>
      )}

      {currentConfig.current && (
        <EditConfigValueModal
          bindings={addConfigValueModalBindings}
          config={currentConfig.current}
          onCloseModel={closeConfigValueModal}
        />
      )}
    </>
  );
};
