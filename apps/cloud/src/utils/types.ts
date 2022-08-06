import { Config as PrismaConfig, Project as PrismaProject } from '@prisma/client';

export type Project = PrismaProject;
export type Config = PrismaConfig & { values: { [key: string]: string } };
export type ConfigProject = Project & { configs: Config[] };
