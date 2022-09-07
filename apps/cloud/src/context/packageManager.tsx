import React, { useMemo } from 'react';

type Config = {
  onPackageManagerChange: (manager: 'npm' | 'yarn' | 'global') => void;
  packageManager: 'npm' | 'yarn' | 'global';
};

const PMContext = React.createContext<Config>({
  onPackageManagerChange: () => {},
  packageManager: 'npm',
});

const defaultProps = {};

export const PMProvider: React.FC<React.PropsWithChildren<Config>> = React.memo(
  ({ onPackageManagerChange, packageManager, children }: React.PropsWithChildren<Config> & typeof defaultProps) => {
    const initialValue = useMemo<Config>(
      () => ({ onPackageManagerChange, packageManager }),
      [onPackageManagerChange, packageManager]
    );

    return <PMContext.Provider value={initialValue}>{children}</PMContext.Provider>;
  }
);

PMProvider.defaultProps = defaultProps;
PMProvider.displayName = 'PMProvider';

export const usePackageManager = (): Config => React.useContext(PMContext);
