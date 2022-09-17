import { DuplicateConfigModal } from '@components/config/DuplicateConfigModal';
import { Button, Collapse, Input, Modal, useInput, useModal } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { Copy, Trash2 } from '@geist-ui/icons';
import Link from '@geist-ui/icons/link';
import { trpc } from '@utils/shared/trpc';
import { Config } from '@utils/shared/types';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

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
