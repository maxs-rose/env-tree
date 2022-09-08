import { deleteAuthToken } from '@/utils/persist';
import { Command } from 'commander';

export const addLogout = (program: Command) => {
  program
    .command('logout')
    .description('Logout user from the cli')
    .action(() => {
      deleteAuthToken();
    });
};
