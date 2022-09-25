import { Change, ChangeType, ConfigValue, PotentialChange } from '@utils/shared/types';

type ConfigVType = ConfigValue[number] | undefined;

const valueDiff = (a: ConfigVType, b: ConfigVType): PotentialChange => {
  const compareValue = (v1: string | null | undefined, v2: string | null | undefined): ChangeType => {
    if (v1 === v2) {
      return 'Unchanged';
    }

    if (v1 === undefined) {
      return 'Created';
    }

    if (v2 === undefined) {
      return 'Deleted';
    }

    return 'Updated';
  };

  return {
    update: compareValue(a?.value, b?.value),
    originalHidden: a?.hidden,
    originalValue: a?.value,
    newValue: b?.value,
    newHidden: b?.hidden,
  };
};

export const diff = (original: ConfigValue, updated: ConfigValue): Change[] => {
  let diff: Record<PropertyKey, PotentialChange> = {};

  for (let k in original) {
    diff[k] = valueDiff(original[k], updated[k]);
  }
  for (let k in updated) {
    if (diff[k] !== undefined) {
      continue;
    }

    diff[k] = valueDiff(undefined, updated[k]);
  }

  return Object.entries(diff)
    .filter((value): value is [string, Omit<Change, 'changeKey'>] => value[1].update !== 'Unchanged')
    .map(([k, v]) => ({
      ...v,
      changeKey: k,
    }));
};
