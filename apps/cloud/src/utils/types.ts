import { Config as PrismaConfig, Project as PrismaProject } from '@prisma/client';
import { z } from 'zod';

export const ZConfigValue = z.record(z.string());

export type ConfigValue = z.infer<typeof ZConfigValue>;
export type Config = PrismaConfig & { values: ConfigValue };

export type Project = PrismaProject;
export type ConfigProject = Project & { configs: Config[] };
