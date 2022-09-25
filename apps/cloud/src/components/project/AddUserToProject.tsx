import { Button, Input, useInput, User } from '@geist-ui/core';
import { Plus } from '@geist-ui/icons';
import { trpc } from '@utils/shared/trpc';
import dynamic from 'next/dynamic';
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

const AddUserToProjectModalComponent: React.FC<{
  projectId: string;
}> = ({ projectId }) => {
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

  const addUserToProjectRequest = (userId: string) => {
    addUserRequest.mutate(
      { projectId, userId },
      {
        onSuccess: clearAndInvalidate,
      }
    );
  };

  const displayFoundUsers = () => {
    return (
      foundUsers?.map((user) => {
        return (
          <div key={user.id} className="w-full flex items-center justify-between">
            <User name={user.name} src={user.image ?? ''}>
              {user.username}
            </User>
            <Button auto type="abort" icon={<Plus color="green" />} onClick={() => addUserToProjectRequest(user.id)} />
          </div>
        );
      }) ?? []
    );
  };

  const clearAndInvalidate = () => {
    trpcContext.invalidateQueries(['user-search']);
    trpcContext.invalidateQueries(['project-requests-for-project']);
    setSearchInputState('');
  };

  return (
    <div className="flex flex-col gap-4">
      <Input {...searchInputBindings} width="100%" placeholder="Search users to add" />
      <div className="flex flex-col gap-2">{displayFoundUsers()}</div>
    </div>
  );
};

export const AddUserToProjectModal = dynamic(() => Promise.resolve(AddUserToProjectModalComponent), { ssr: false });
