import { Config, ConfigValue } from '@utils/shared/types';

const configNameAndId = (config: Config) => `${config.name} (${config.id})`;

const setValueOverrideStatus = (current: ConfigValue, flatParent: ConfigValue): [string, ConfigValue[string]][] => {
  return Object.entries(current).map(([k, v]) => {
    if (flatParent[k] !== undefined) {
      return [k, { ...v, overrides: flatParent[k].parentName }];
    }

    return [k, v];
  });
};

const collatorCompare = () => {
  const collatorCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'case', caseFirst: 'upper' })
    .compare as (a: unknown, b: unknown) => number;

  return (a: string | null | undefined, b: string | null | undefined) => {
    // Can't just use if(a) here since 0 is a valid input
    if (a === null || a === undefined) {
      return a === b ? 0 : -1;
    }

    if (b === null || b === undefined) {
      return 1;
    }

    return collatorCompare(a, b);
  };
};

const sortedValues = (values: ConfigValue) => {
  const data = Array.from(Object.entries(values));
  type DataEntry = typeof data[0];

  const compareFunc = collatorCompare();

  const sortByGroup = ([, a]: DataEntry, [, b]: DataEntry) => compareFunc(a.group, b.group);
  const sortByProperty = ([a]: DataEntry, [b]: DataEntry) => compareFunc(a, b);

  const composedSortFuncs = (a: DataEntry, b: DataEntry) => sortByGroup(a, b) || sortByProperty(a, b);

  return Object.fromEntries(data.sort(composedSortFuncs));
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

  const result = { ...parentValues, ...values };

  return sortedValues(result);
};
