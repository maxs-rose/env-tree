import { Button, Card, Input, Modal, useInput, User } from '@geist-ui/core';
import { ModalHooksBindings } from '@geist-ui/core/dist/use-modal';
import { Check } from '@geist-ui/icons';
import { trpc } from '@utils/trpc';
import React, { useEffect, useState } from 'react';

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debounced;
};

export const AddUserToProjectModal: React.FC<{
  onCloseModel: () => void;
  bindings: ModalHooksBindings;
  projectId: string;
}> = ({ onCloseModel, bindings, projectId }) => {
  const trpcContext = trpc.useContext();
  const [firstLoad, setFirstLoad] = useState(true);
  const { state: inputState, setState: setSearchInputState, bindings: searchInputBindings } = useInput('');
  const inputValue = useDebounce(inputState, 100);
  const { data: foundUsers } = trpc.useQuery(['user-search', { query: inputValue, projectId }], {
    enabled: !firstLoad,
  });
  const addUserRequest = trpc.useMutation(['project-add-user-request']);

  useEffect(() => {
    setFirstLoad(false);
  }, []);

  const addUserToProjectRequest = (userEmail: string) => {
    addUserRequest.mutate(
      { projectId, userEmail },
      {
        onSuccess: closeModal,
      }
    );
  };

  const displayFoundUsers = () => {
    return (
      foundUsers?.map((user) => {
        return (
          <Card key={user.email!} style={{ width: '25rem' }}>
            <Card.Content className="flex gap-2 justify-between">
              <User
                style={{ maxWidth: '20rem', textOverflow: 'ellipsis' }}
                name={user.name}
                src={user.image || undefined}
              >
                {user.email}
              </User>
              <Button auto icon={<Check />} onClick={() => addUserToProjectRequest(user.email!)} />
            </Card.Content>
          </Card>
        );
      }) ?? []
    );
  };

  const closeModal = () => {
    trpcContext.invalidateQueries(['user-search']);
    setSearchInputState('');
    onCloseModel();
  };

  return (
    <Modal {...bindings} onClose={closeModal}>
      <Modal.Title>Add User to Project</Modal.Title>
      <Modal.Content>
        <div className="flex flex-col gap-4">
          <Input {...searchInputBindings} placeholder="Search users" />
          <div className="flex flex-col gap-2">{displayFoundUsers()}</div>
        </div>
      </Modal.Content>
    </Modal>
  );
};
