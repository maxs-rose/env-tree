import React, { useMemo } from 'react';

type Config = {
  onThemeChange: (theme: 'light' | 'dark') => void;
};

const ConfigContext = React.createContext<Config>({
  onThemeChange: () => {},
});

const defaultProps = {};

export const ConfigProvider: React.FC<React.PropsWithChildren<Config>> = React.memo(
  ({ onThemeChange, children }: React.PropsWithChildren<Config> & typeof defaultProps) => {
    const initialValue = useMemo<Config>(() => ({ onThemeChange }), [onThemeChange]);

    return <ConfigContext.Provider value={initialValue}>{children}</ConfigContext.Provider>;
  }
);

ConfigProvider.defaultProps = defaultProps;
ConfigProvider.displayName = 'ConfigProvider';

export const useConfigs = (): Config => React.useContext(ConfigContext);
