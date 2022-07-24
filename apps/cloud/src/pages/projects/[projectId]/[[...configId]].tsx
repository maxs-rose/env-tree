import { prisma } from '@backend/prisma';
import { transformConfigProject } from '@backend/utils/config';
import SecretLoader from '@components/loader';
import {
  Button,
  ButtonDropdown,
  Input,
  Modal,
  Page,
  Spacer,
  Table,
  Tabs,
  Text,
  useInput,
  useModal,
} from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { BindingsChangeTarget } from '@geist-ui/core/esm/use-input/use-input';
import { Check, DownloadCloud, Plus, Trash2 } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { Config, ConfigProject } from '@utils/types';
import fileDownload from 'js-file-download';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';

const AddConfigValueModal: React.FC<{
  onCloseModel: () => void;
  bindings: ModalHooksBindings;
  config: MutableRefObject<Config | undefined>;
}> = ({ bindings, config, onCloseModel }) => {
  const { state: keyValue, setState: setKey, bindings: propertyBinding } = useInput('');
  const { state: valueValue, setState: setValue, bindings: valueBinding } = useInput('');
  const updateConfig = trpc.useMutation('updateConfig');
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

const AddConfigModal: React.FC<{
  onCloseModel: () => void;
  bindings: ModalHooksBindings;
  projectId: string;
}> = ({ bindings, onCloseModel, projectId }) => {
  const updateConfig = trpc.useMutation('createConfig');
  const { state: configName, setState: setConfigName, bindings: configBindings } = useInput('');
  const [invalidConfig, setInvalidConfig] = useState(false);

  const createConfig = () => {
    if (!configName.trim()) {
      setConfigName(configName.trim());
      setInvalidConfig(true);
      return;
    }

    updateConfig.mutate({ projectId, configName: configName.trim() }, { onSuccess: closeModal });
  };

  const closeModal = () => {
    setInvalidConfig(false);
    setConfigName('');
    onCloseModel();
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
      <Modal.Action onClick={closeModal}>Cancel</Modal.Action>
      <Modal.Action onClick={createConfig}>Create</Modal.Action>
    </Modal>
  );
};

const ProjectConfigs: NextPage<{ project: ConfigProject; configId?: string }> = ({ project, configId }) => {
  const trpcContext = trpc.useContext();
  const router = useRouter();
  const { setVisible: setAddConfigValueVisible, bindings: addConfigValueModalBindings } = useModal();
  const { setVisible: setAddConfigVisible, bindings: addConfigModalBindings } = useModal();
  const currentConfig = useRef<Config>();
  const configs = trpc.useQuery(['config', { id: project?.id ?? '' }], { initialData: project?.configs ?? [] });
  const deleteConfigMutation = trpc.useMutation('deleteConfig');
  const deleteProjectMutation = trpc.useMutation('deleteProject');
  const [downloadType, setDownloadType] = useState<'env' | 'json'>('env');

  useEffect(() => {
    if (!configId && project.configs.length > 0) {
      router.push(`/projects/${project.id}/${project.configs[0].id}`, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!project) {
    return (
      <Page className="page-height flex items-center">
        <SecretLoader loadingText="Loading project" />
      </Page>
    );
  }

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

  const showConfigs = (configs: Config[]) => {
    const openConfigModal = (conf: Config) => {
      currentConfig.current = conf;
      setAddConfigValueVisible(true);
    };
    const closeConfigValueModal = () => {
      trpcContext.invalidateQueries(['config']);
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

    const updateDownloadType = (type: 'env' | 'json') => setDownloadType(type);

    const downloadSecrets = (config: Config) => {
      const baseUrl = window.location.origin;
      const dataUrl = `${baseUrl}/api/config${downloadType === 'env' ? 'Env' : 'Json'}?`;

      const query = encodeURIComponent(JSON.stringify({ projectId: config.projectId, configId: config.id }));

      fetch(dataUrl + `input=${query}`)
        .then((res) => res.json())
        .then((res) => res.result.data)
        .then((data) =>
          fileDownload(
            downloadType === 'json' ? JSON.stringify(data, null, '\t') : data,
            `${config.name}.${downloadType}`
          )
        );
    };

    return configs.map((c) => (
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
          </ButtonDropdown>
          <Spacer inline />
          <Button auto type="error" icon={<Trash2 />} onClick={() => deleteConfig(c.projectId, c.id)}>
            Delete Configuration
          </Button>
        </div>
        <Spacer />
        <ConfigGrid config={c} />

        <AddConfigValueModal
          bindings={addConfigValueModalBindings}
          config={currentConfig}
          onCloseModel={closeConfigValueModal}
        />
      </Tabs.Tab>
    ));
  };

  const showContent = () => {
    const tabChange = (val: string) => {
      router.push(`/projects/${project.id}/${val}`, undefined, { shallow: true });
    };

    if (configs.isLoading) {
      return <SecretLoader loadingText="Loading configurations" />;
    }

    if (!configs.data || configs.data.length === 0) {
      return <Text p>No configurations for project</Text>;
    }

    const initialTab = configId ?? configs.data[0]?.id ?? 'none';

    return (
      <div className="w-full">
        <Tabs initialValue={initialTab} onChange={tabChange}>
          {showConfigs(configs.data)}
        </Tabs>
      </div>
    );
  };

  const closeConfigModal = () => {
    trpcContext.invalidateQueries(['config']);
    setAddConfigVisible(false);
  };

  const deleteProject = () => {
    deleteProjectMutation.mutate({ id: project.id }, { onSuccess: () => router.push('/projects') });
  };

  return (
    <>
      <Page className="page-height">
        <Page.Header>
          <div className="flex items-center gap-3">
            <Text h2>
              <Text span>{project?.name}</Text> Configurations
            </Text>
            <Button auto icon={<Plus />} px={0.6} type="success" onClick={() => setAddConfigVisible(true)} />
            <Button auto icon={<Trash2 />} px={0.6} type="error" onClick={deleteProject} />
          </div>
        </Page.Header>
        <Page.Content className="flex items-center justify-center">{showContent()}</Page.Content>
      </Page>
      <AddConfigModal onCloseModel={closeConfigModal} bindings={addConfigModalBindings} projectId={project.id} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (typeof ctx.params?.projectId !== 'string') {
    return { notFound: true };
  }
  const project = await prisma.project.findUnique({ where: { id: ctx.params?.projectId }, include: { configs: true } });

  if (!project) {
    return { notFound: true };
  }

  let config = ctx.params?.configId?.[0];

  const configId = project.configs.some((c) => c.id === config) ? config : null;

  return {
    props: { project: transformConfigProject(project), configId },
  };
};

export default ProjectConfigs;
