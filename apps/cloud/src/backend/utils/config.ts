import { decryptConfig } from '@backend/utils/crypt';
import { Config as PrismaConfig } from '@prisma/client';
import { Config, ConfigValue } from '@utils/types';
import { groupBy, map } from 'lodash-es';

export type PrismaConfigWithParent = PrismaConfig & { linkedParent: PrismaConfig | null };

export const transformConfigs = (config: PrismaConfigWithParent[]) => config.map(transformConfigWithParent);

export const transformConfigWithParent = (config: PrismaConfigWithParent): Config => {
  return {
    ...config,
    linkedParent: config.linkedParent ? transformConfigWithParent(config.linkedParent as PrismaConfigWithParent) : null,
    values: transformConfigValues(config.values),
  };
};

export const transformConfigValues = (values: string): ConfigValue => decryptConfig(values);

const writeGroupToString = (group: string | null, config: ConfigValue) => {
  const groupName = `\n#\n# ${group || 'Ungrouped'}\n`;

  return (
    groupName +
    Object.entries(config)
      .map(([k, v]) => `${k}=${v.value}`)
      .join('\n')
  );
};

export const configToEnvString = (config: ConfigValue) => {
  return map(
    // Group the values by group
    groupBy(Object.entries(config), ([, values]) => values.group),
    // Write groups to the env string
    (v, k) => writeGroupToString(k, Object.fromEntries(v))
  )
    .join('\n')
    .trimStart();
};

export const configToJsonObject = (config: ConfigValue) => {
  return Object.fromEntries(Object.entries(config).map(([k, v]) => [k, v.value ?? '']));
};

export const configToJsonGroupObject = (config: ConfigValue) =>
  Object.fromEntries(
    map(
      groupBy(Object.entries(config), ([, data]) => data.group),
      (v, k) => [k, configToJsonObject(Object.fromEntries(v))]
    )
  );
