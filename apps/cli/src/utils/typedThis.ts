import { Command } from 'commander';

export type TypeThis = Pick<Command, 'processedArgs' | 'opts'>;
