import React, { useMemo } from 'react';

type Config = {
  onThemeChange: (theme: 'light' | 'dark') => void;
};

type ConfigProviderProps = {
  onThemeChange: (theme: 'light' | 'dark') => void;
};

const ConfigContext = React.createContext<Config>({ onThemeChange: () => {} });

const defaultProps = {};

export const ConfigProvider: React.FC<React.PropsWithChildren<ConfigProviderProps>> = React.memo(
  ({ onThemeChange, children }: React.PropsWithChildren<ConfigProviderProps> & typeof defaultProps) => {
    const initialValue = useMemo<Config>(() => ({ onThemeChange }), [onThemeChange]);

    return <ConfigContext.Provider value={initialValue}>{children}</ConfigContext.Provider>;
  }
);

ConfigProvider.defaultProps = defaultProps;
ConfigProvider.displayName = 'SecretsConfigProvider';

export const useConfigs = (): Config => React.useContext(ConfigContext);
