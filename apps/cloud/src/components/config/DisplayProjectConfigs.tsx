import { AddConfigValueModal } from '@components/config/AddConfigValueModal';
import { Button, ButtonDropdown, Spacer, Table, Tabs, useModal } from '@geist-ui/core';
import { Check, DownloadCloud, Plus, Trash2 } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { Config } from '@utils/types';
import fileDownload from 'js-file-download';
import React, { useRef, useState } from 'react';
import { catchError, EMPTY, map, of, withLatestFrom } from 'rxjs';
import { fromFetch } from 'rxjs/internal/observable/dom/fetch';

const ConfigGrid: React.FC<{ config: Config }> = ({ config }) => {
  const tableData = Array.from(new Map(Object.entries(config.values)).entries()).map(([property, value]) => ({
    property,
    value,
  }));

  return (
    <Table data={tableData} emptyText="-">
      <Table.Column prop="property" label="Property" />
      <Table.Column prop="value" label="Value" />
    </Table>
  );
};

export const DisplayProjectConfigs: React.FC<{ configs: Config[] }> = ({ configs }) => {
  const trpcContext = trpc.useContext();
  const currentConfig = useRef<Config>();
  const deleteConfigMutation = trpc.useMutation('config-delete');
  const [downloadType, setDownloadType] = useState<'env' | 'json'>('env');
  const { setVisible: setAddConfigValueVisible, bindings: addConfigValueModalBindings } = useModal();

  const openConfigModal = (conf: Config) => {
    currentConfig.current = conf;
    setAddConfigValueVisible(true);
  };
  const closeConfigValueModal = () => {
    trpcContext.invalidateQueries(['config-get']);
    setAddConfigValueVisible(false);
  };
  const deleteConfig = (pId: string, cId: string) => {
    deleteConfigMutation.mutate(
      { projectId: pId, configId: cId },
      {
        onSuccess: () => {
          window.location.reload();
        },
      }
    );
  };

  const downloadSecrets = (config: Config) => {
    const baseUrl = window.location.origin;

    const query = encodeURIComponent(JSON.stringify({ projectId: config.projectId, configId: config.id }));

    fromFetch(`${baseUrl}/api/config-${downloadType}?input=${query}`, {
      selector: (response) => response.json(),
    })
      .pipe(
        map((res) => res.result.data),
        catchError((error) => {
          console.error(error);
          return EMPTY;
        }),
        map((secretData): string => {
          switch (downloadType) {
            case 'env':
              return secretData;
            case 'json':
              return JSON.stringify(secretData, null, '\t');
          }
        }),
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

      <AddConfigValueModal
        bindings={addConfigValueModalBindings}
        config={currentConfig}
        onCloseModel={closeConfigValueModal}
      />
    </>
  );
};
