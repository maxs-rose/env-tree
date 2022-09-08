#!/usr/bin/env node

import { addCurrentUser } from '@/commands/currentUser';
import { addLogin } from '@/commands/login';
import { addLogout } from '@/commands/logout';
import { program } from 'commander';
import { addClassic } from './commands/classic';

const cliProgram = program
  .name('envtree')
  .description('CLI tool to download secrets from Env Tree')
  .version('2.0.0', '-v');

addClassic(cliProgram);
addLogin(cliProgram);
addLogout(cliProgram);
addCurrentUser(cliProgram);

cliProgram.parse();
