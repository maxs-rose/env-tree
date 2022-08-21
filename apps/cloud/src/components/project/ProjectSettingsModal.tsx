import SecretLoader from '@components/loader';
import { AddUserToProjectModal } from '@components/project/AddUserToProject';
import { Button, Collapse, Divider, Input, Modal, useInput, User } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { Trash2 } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import { Project } from '@utils/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const DeleteProject: React.FC<{ projectId: string; projectName: string }> = ({ projectId, projectName }) => {
  const router = useRouter();
  const [canDelete, setCanDelete] = useState(false);
  const { state: deleteInput, bindings: deleteInputBindings } = useInput('');
  const deleteProject = trpc.useMutation(['project-delete']);

  useEffect(() => {
    if (deleteInput === projectName) {
      setCanDelete(true);
    }
  }, [deleteInput, projectName]);

  const deleteProjectAction = () => {
    deleteProject.mutate(
      { projectId: projectId },
      {
        onSuccess: () => {
          router.push('projects');
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Input type="error" width="100%" placeholder={projectName} {...deleteInputBindings} />
      <Button type="error" width="100%" icon={<Trash2 />} disabled={!canDelete} onClick={deleteProjectAction}>
        Delete Project
      </Button>
    </div>
  );
};

const ProjectUserList: React.FC<{ projectId: string }> = ({ projectId }) => {
  const trpcContext = trpc.useContext();
  const currentUser = trpc.useQuery(['user-current']);
  const usersOnProject = trpc.useQuery(['project-users', { projectId }], { refetchInterval: 60000 });
  const removeUserFromProject = trpc.useMutation(['project-remove-user'], {
    onSuccess: () => {
      trpcContext.invalidateQueries(['project-users']);
    },
  });

  const users = (users: typeof usersOnProject['data']) => {
    return users!.map((u) => displayUser(u.id, u.name!, u.username!, u.image || ''));
  };

  const displayUser = (id: string, name: string, username: string, icon: string) => {
    const removeUser = (userId: string) => {
      removeUserFromProject.mutate({ userId, projectId });
    };

    return (
      <div key={id} className="w-full flex items-center justify-between">
        <User name={name} src={icon}>
          {username}
        </User>
        <Button
          auto
          type="error"
          icon={<Trash2 />}
          disabled={id === currentUser.data!.id}
          onClick={() => removeUser(id)}
        />
      </div>
    );
  };

  if (usersOnProject.isLoading || !usersOnProject.data || currentUser.isLoading || !currentUser.data) {
    return <SecretLoader loadingText="Loading users" />;
  }

  return <div className="flex flex-col gap-2">{users(usersOnProject.data)}</div>;
};

export const ProjectSettingsModal: React.FC<{
  onCloseModel: () => void;
  bindings: ModalHooksBindings;
  project: Project;
}> = ({ onCloseModel, bindings, project }) => {
  return (
    <Modal {...bindings} onClose={onCloseModel}>
      <Modal.Title>Project Settings</Modal.Title>
      <Modal.Content>
        <Collapse.Group accordion={false}>
          {/*<Collapse title="General" initialVisible={true}></Collapse>*/}
          <Collapse title="User Management">
            <ProjectUserList projectId={project.id} />
            <Divider />
            <AddUserToProjectModal projectId={project.id} />
          </Collapse>
          <Collapse title="Danger Zone" className="danger-zone">
            <DeleteProject projectId={project.id} projectName={project.name} />
          </Collapse>
        </Collapse.Group>
      </Modal.Content>
    </Modal>
  );
};
