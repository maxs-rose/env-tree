import { DuplicateConfigModal } from '@components/config/DuplicateConfigModal';
import { Button, Collapse, Input, Modal, Spacer, Text, useInput, useModal, useToasts } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { Copy, Trash2 } from '@geist-ui/icons';
import Link from '@geist-ui/icons/link';
import { trpc } from '@utils/shared/trpc';
import { Config } from '@utils/shared/types';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

const UpdateName: React.FC<{ config: Config; closeModal: () => void }> = ({ config, closeModal }) => {
  const toaster = useToasts();
  const trpcContext = trpc.useContext();
  const { state: configNameState, bindings: configNameBindings } = useInput(config.name);
  const renameConfig = trpc.useMutation(['config-rename']);
  const [nameInvalid, setNameInvalid] = useState(false);

  useEffect(() => {
    setNameInvalid((invalid) => {
      return invalid ? false : invalid;
    });
  }, [configNameState]);

  const tryRenameConfig = () => {
    renameConfig.mutate(
      {
        projectId: config.projectId,
        configId: config.id,
        configVersion: config.version,
        configName: configNameState.trim(),
      },
      {
        onSuccess: (data) => {
          config.name = data.name;
          config.version = data.version;
        },
        onError: (error) => {
          if (error.data?.code === 'CONFLICT') {
            closeModal();
            toaster.setToast({
              type: 'error',
              delay: 10000,
              text: 'Failed to update config due to version mismatch, reloading',
            });
          } else {
            setNameInvalid(true);
          }
        },
        onSettled: () => {
          trpcContext.invalidateQueries(['config-get']);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Input width="100%" {...configNameBindings} type={nameInvalid ? 'error' : 'default'} />
      {nameInvalid && (
        <Text span type="error">
          Invalid configuration name
        </Text>
      )}
      <Button onClick={tryRenameConfig} disabled={configNameState.trim() === config.name}>
        Update Name
      </Button>
    </div>
  );
};

const DeleteConfig: React.FC<{ config: Config; closeModal: () => void }> = ({ config, closeModal }) => {
  const [canDelete, setCanDelete] = useState(false);
  const { state: deleteInput, bindings: deleteInputBindings } = useInput('');
  const deleteConfig = trpc.useMutation(['config-delete']);

  useEffect(() => {
    if (deleteInput === config.name) {
      setCanDelete(true);
    }
  }, [deleteInput, config.name]);

  const deleteConfigAction = () => {
    deleteConfig.mutate(
      { projectId: config.projectId, configId: config.id },
      {
        onSuccess: () => {
          window.location.reload();
          closeModal();
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Input type="error" width="100%" placeholder={config.name} {...deleteInputBindings} />
      <Button type="error" width="100%" icon={<Trash2 />} disabled={!canDelete} onClick={deleteConfigAction}>
        Delete Configuration
      </Button>
    </div>
  );
};

const ConfigOptionsModalComponent: React.FC<{
  bindings: ModalHooksBindings;
  config: Config;
  updateTab: (configId: string) => void;
  closeConfigValueModal: (invalidate: boolean) => void;
}> = ({ bindings, config, updateTab, closeConfigValueModal }) => {
  const [link, setLink] = useState(false);
  const { setVisible: setDuplicateConfigVisible, bindings: duplicateConfigModalBindings } = useModal();

  const openLinkModal = () => {
    setLink(true);
    setDuplicateConfigVisible(true);
  };

  const openDuplicateModal = () => {
    setLink(false);
    setDuplicateConfigVisible(true);
  };

  const closeDuplicateModal = (newConfigId?: string) => {
    setDuplicateConfigVisible(false);
    closeConfigValueModal(!!newConfigId);
    if (newConfigId) {
      updateTab(newConfigId);
    }
  };

  return (
    <>
      <Modal {...bindings}>
        <Modal.Title>Configuration Options</Modal.Title>
        <Modal.Content>
          <Collapse title="General" initialVisible>
            <div className="flex flex-col gap-2">
              <UpdateName config={config} closeModal={closeDuplicateModal} />
              <Spacer />
              <Button auto ghost icon={<Copy />} onClick={openDuplicateModal}>
                Duplicate Config
              </Button>
              <Button auto ghost icon={<Link />} onClick={openLinkModal}>
                Create Linked Config
              </Button>
            </div>
          </Collapse>
          <Collapse title="Danger Zone" className="danger-zone">
            <DeleteConfig config={config} closeModal={() => closeConfigValueModal(true)} />
          </Collapse>
        </Modal.Content>
      </Modal>

      <DuplicateConfigModal
        bindings={duplicateConfigModalBindings}
        projectId={config.projectId}
        configId={config.id}
        onCloseModel={closeDuplicateModal}
        link={link}
      />
    </>
  );
};

export const ConfigOptionsModal = dynamic(() => Promise.resolve(ConfigOptionsModalComponent), { ssr: false });
