import SecretLoader from '@components/loader';
import { AddUserToProjectModal } from '@components/project/AddUserToProject';
import { Button, Collapse, Divider, Input, Modal, Spacer, Text, Textarea, useInput, User } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { Trash2 } from '@geist-ui/icons';
import { getZodErrorMessage, trpc } from '@utils/shared/trpc';
import { Project } from '@utils/shared/types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const UpdateProjectNameAndDescription: React.FC<{ project: Project }> = ({ project }) => {
  const router = useRouter();
  const trpcContext = trpc.useContext();
  const updateProject = trpc.useMutation('project-update');
  const { bindings: projectNameBindings } = useInput(project.name);
  const { bindings: projectDescriptionBindings } = useInput(project.description || '');
  const [updateProjectState, setUpdateProjectSate] = useState<{
    nameInvalid?: string;
    descriptionInvalid?: string;
  }>({});

  const updateProjectDetails = () => {
    updateProject.mutate(
      {
        projectId: project.id,
        name: projectNameBindings.value.trim(),
        description: projectDescriptionBindings.value.trim() || null,
      },
      {
        onSuccess: () => {
          trpcContext.invalidateQueries(['project-get']);
          trpcContext.invalidateQueries(['project-get-single', { projectId: project.id }]);
        },
        onError: (error) => {
          if (error?.data?.code === 'NOT_FOUND') {
            router.replace('/projects');
          }

          const errorMessage = getZodErrorMessage(error.message);

          setUpdateProjectSate({
            nameInvalid: errorMessage.filter((e) => e.path.some((v) => v === 'name'))?.[0]?.message || undefined,
            descriptionInvalid:
              errorMessage.filter((e) => e.path.some((v) => v === 'description'))?.[0]?.message || undefined,
          });
        },
      }
    );
  };

  return (
    <div>
      <Input width="100%" {...projectNameBindings} type={updateProjectState.nameInvalid ? 'error' : 'default'} />
      <Spacer inline />
      <Text span type="error">
        {updateProjectState.nameInvalid}
      </Text>
      <Textarea
        width="100%"
        height="120px"
        placeholder="Project description"
        type={updateProjectState.descriptionInvalid ? 'error' : 'default'}
        {...projectDescriptionBindings}
      />
      <Spacer inline />
      <Text span type="error">
        {updateProjectState.descriptionInvalid}
      </Text>
      <Spacer />
      <Button onClick={updateProjectDetails}>Update</Button>
    </div>
  );
};

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
          <Collapse title="General" initialVisible={true}>
            <UpdateProjectNameAndDescription project={project} />
          </Collapse>
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
