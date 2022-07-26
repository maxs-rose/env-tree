import { Config as PrismaConfig, Project as PrismaProject } from '@prisma/client';
import { z } from 'zod';

// Config
const ZConfigObject = z.object({
  group: z.string().nullable().optional(),
  value: z.string().nullable(),
  hidden: z.boolean().optional(),
  parentName: z.string().optional(),
  overrides: z.string().optional(),
});

export const ZConfigValue = z.record(ZConfigObject);

export type ConfigValue = z.infer<typeof ZConfigValue>;
export type Config = Omit<PrismaConfig, 'values'> & { values: ConfigValue; linkedParent?: Config | null };

// Project
export type Project = PrismaProject;
export type ProjectWithConfigIds = Project & { configs: Array<{ id: string }> };
export type ProjectWithUsers = Project & {
  UsersOnProject: Array<{ user: { image: string | null; email: string | null } }>;
};
export type ProjectPage = Omit<Project, 'UsersOnProject'> & { userIcons: string[] };

// Config Export
export const zConfigExportOptionalAuth = z.object({
  userEmail: z.string().optional(),
  userToken: z.string().optional(),
});

export const zConfigExportParams = z
  .object({
    projectId: z.string().min(1),
    configId: z.string().min(1),
    type: z.union([z.literal('env'), z.literal('json'), z.literal('json-grouped')]),
  })
  .merge(zConfigExportOptionalAuth);

export type ConfigType = 'env' | 'json' | 'json-grouped';
export type ConfigExportType<T> = T extends 'env'
  ? string
  : T extends 'json'
  ? { [key: string]: string }
  : T extends 'json-grouped'
  ? { [group: string]: ConfigExportType<'json'> }
  : never;

// User
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  authToken: string | null;
}

// Diff
export type ChangeType = 'Updated' | 'Deleted' | 'Created' | 'Unchanged';

export type PotentialChange = {
  update: ChangeType;
  originalValue?: string | null;
  newValue?: string | null;
  originalHidden?: boolean;
  newHidden?: boolean;
};

export type Change = Omit<PotentialChange, 'update'> & { update: Exclude<ChangeType, 'Unchanged'>; changeKey: string };

type IDatabaseChange =
  | Change
  | { update: 'Changed Link'; newLinkId: string; newLinkName: string; oldLinkId: string; oldLinkName: string }
  | { update: 'Linked'; newLinkId: string; newLinkName: string }
  | { update: 'Unlinked'; fromName: string; fromId: string }
  | { update: 'Renamed'; from: string; to: string };

export type DBChange = IDatabaseChange & { userId: string; username: string | null };
