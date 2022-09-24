import SecretLoader from '@components/loader';
import { Dot, Text } from '@geist-ui/core';
import { DotTypes } from '@geist-ui/core/esm/dot';
import { trpc } from '@utils/shared/trpc';
import { Config, DBChange } from '@utils/shared/types';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';

const formatLogAsString = (data: DBChange) => {
  switch (data.update) {
    case 'Linked':
      return `Linked configuration to ${data.newLinkName} ${data.newLinkId}`;
    case 'Updated':
      return `Updated property ${data.changeKey} value to ${data.newValue}${
        data.originalValue ? `, previous value was ${data.originalValue || '-'}` : ''
      }`;
    case 'Deleted':
      return `Deleted property ${data.changeKey}${
        data.originalValue ? `, value was ${data.originalValue || '-'}` : ''
      }`;
    case 'Created':
      return `Created property ${data.changeKey}${data.newValue ? ` with value ${data.newValue}` : ''}`;
    case 'Changed Link':
      return `Changed configuration link to ${data.newLinkName} (${data.newLinkId})${
        data.oldLinkId ? `, was previously linked to ${data.oldLinkName} (${data.oldLinkId})` : ''
      }`;
    case 'Unlinked':
      return `Unlinked configuration from ${data.fromName} (${data.fromId})`;
    case 'Renamed':
      return `Renamed configuration from ${data.from} to ${data.to}`;
  }
};

const AuditLogComponent: React.FC<{ config: Config }> = ({ config }) => {
  const trpcContext = trpc.useContext();
  const audit = trpc.useQuery(['config-audit', { projectId: config.projectId, configId: config.id, page: 1 }]);

  useEffect(() => {
    trpcContext.invalidateQueries('config-audit');
  }, [config, config.id, trpcContext]);

  if (audit.isLoading) {
    return <SecretLoader loadingText="Loading logs" />;
  }

  const dotType = (changeType: DBChange['update']): DotTypes => {
    switch (changeType) {
      case 'Unlinked':
      case 'Deleted':
        return 'error';
      case 'Linked':
      case 'Created':
        return 'success';
      case 'Updated':
      case 'Renamed':
      case 'Changed Link':
        return 'warning';
    }
  };

  return (
    <div className="flex flex-col relative timeline">
      {audit.data!.map((log) => {
        return (
          <Dot className="z-10" key={`${log.at}-${Math.random()}`} type={dotType(log.update)}>
            <Text p>{`${log.username} (${log.userId}), ${formatLogAsString(log)}, at ${log.at}`}</Text>
          </Dot>
        );
      })}

      <style jsx>{`
        .timeline::before {
          content: '';
          width: 1px;
          left: 4.5px;
          top: 0;
          bottom: 0;
          margin: auto 0;
          height: calc(100% - 2em);
          position: absolute;
          background: #333;
          z-index: 0;
        }
      `}</style>
    </div>
  );
};

export const AuditLog = dynamic(() => Promise.resolve(AuditLogComponent), { ssr: false });
