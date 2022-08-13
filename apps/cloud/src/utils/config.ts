import { Config, ConfigValue } from '@utils/types';

const configNameAndId = (config: Config) => `${config.name} (${config.id})`;

const setValueOverrideStatus = (current: ConfigValue, flatParent: ConfigValue): [string, ConfigValue[string]][] => {
  return Object.entries(current).map(([k, v]) => {
    if (flatParent[k] !== undefined) {
      return [k, { ...v, overrides: flatParent[k].parentName }];
    }

    return [k, v];
  });
};

export const flattenConfigValues = (config: Config) => {
  const getParentValues = (parent?: Config | null): ConfigValue => {
    if (parent) {
      const parentValues = getParentValues(parent.linkedParent);
      const valueWithParentName = Object.fromEntries(
        setValueOverrideStatus(parent.values, parentValues).map(([k, v]) => [
          k,
          { ...v, parentName: configNameAndId(parent) },
        ])
      );

      return { ...parentValues, ...valueWithParentName };
    }

    return {};
  };

  const parentValues = getParentValues(config.linkedParent);
  const values = Object.fromEntries(setValueOverrideStatus(config.values, parentValues));

  return { ...parentValues, ...values };
};
