import { ConfigValue } from '@utils/shared/types';
import { groupBy, map } from 'lodash-es';

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
