import { Loading, Text } from '@geist-ui/core';

const SecretLoader: React.FC<{ loadingText: string }> = ({ loadingText }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <Text p>{loadingText}</Text>
      <Loading spaceRatio={2.5} />
    </div>
  );
};

export default SecretLoader;
