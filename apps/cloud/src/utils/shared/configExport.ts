import { ConfigValue } from '@utils/shared/types';
import { groupBy, map } from 'lodash-es';

const formatValueForEnv = (value: string | null) => {
  if (!value) {
    return '';
  }

  // Dont double wrap with " or '
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value;
  }

  if (value.includes('#') || value.includes('=')) {
    return `"${value}"`;
  }

  return value;
};

const formatValueForJson = (value: string | null) => {
  if (!value) {
    return null;
  }

  // Dont double wrap with " or '
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, value.length - 1) || null;
  }

  return value;
};

const writeGroupToString = (group: string | null, config: ConfigValue) => {
  const groupName = `\n#\n# ${group || 'Ungrouped'}\n`;

  return (
    groupName +
    Object.entries(config)
      .map(([k, v]) => `${k}=${formatValueForEnv(v.value)}`)
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
  return Object.fromEntries(Object.entries(config).map(([k, v]) => [k, formatValueForJson(v.value)]));
};

export const configToJsonGroupObject = (config: ConfigValue) =>
  Object.fromEntries(
    map(
      groupBy(Object.entries(config), ([, data]) => data.group),
      (v, k) => [k, configToJsonObject(Object.fromEntries(v))]
    )
  );
