#!/usr/bin/env node

import { program } from 'commander';
import { addClassic } from './commands/classic';

const cliProgram = program
  .name('envtree')
  .description('CLI tool to download secrets from Env Tree')
  .version('1.1.0', '-v');

addClassic(cliProgram);

cliProgram.parse();
