import SecretLoader from '@components/loader';
import { Button, Dot } from '@geist-ui/core';
import { DotTypes } from '@geist-ui/core/esm/dot';
import { ArrowUp, Clock, Delete, Italic, Link, Plus, Scissors, Shuffle, User } from '@geist-ui/icons';
import { trpc } from '@utils/shared/trpc';
import { Config, DBChange } from '@utils/shared/types';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

const FormatLogAsString: React.FC<{ log: DBChange }> = ({ log }) => {
  const classes = 'flex items-center gap-2 flex-wrap';

  switch (log.update) {
    case 'Linked':
      return (
        <span className={classes}>
          <Link />
          <b>Linked</b> configuration to <b>{log.newLinkName}</b> (<b>{log.newLinkId}</b>)
        </span>
      );
    case 'Updated':
      return (
        <span className={classes}>
          <ArrowUp />
          <b>Updated</b> property <b>{log.changeKey}</b> value to <b>{log.newValue}</b>
          {log.originalValue && (
            <>
              , previous value was <b>{log.originalValue || '-'}</b>
            </>
          )}
        </span>
      );
    case 'Deleted':
      return (
        <span className={classes}>
          <Delete />
          <b>Deleted</b> property <b>{log.changeKey}</b>
          {log.originalValue && (
            <>
              , value was <b>{log.originalValue || '-'}</b>
            </>
          )}
        </span>
      );
    case 'Created':
      return (
        <span className={classes}>
          <Plus />
          <b>Created</b> property <b>{log.changeKey}</b>
          {log.newValue && (
            <>
              {' '}
              with value <b>{log.newValue}</b>
            </>
          )}
        </span>
      );
    case 'Changed Link':
      return (
        <span className={classes}>
          <Shuffle />
          <b>Changed</b> configuration link to <b>{log.newLinkName}</b> (<b>{log.newLinkId}</b>)
          {log.oldLinkId && (
            <>
              , was previously linked to <b>{log.oldLinkName}</b> (<b>{log.oldLinkId}</b>)
            </>
          )}
        </span>
      );
    case 'Unlinked':
      return (
        <span className={classes}>
          <Scissors />
          <b>Unlinked</b> configuration from <b>{log.fromName}</b> (<b>{log.fromId}</b>)
        </span>
      );
    case 'Renamed':
      return (
        <span className={classes}>
          <Italic />
          <b>Renamed</b> configuration from <b>{log.from}</b> to <b>{log.to}</b>
        </span>
      );
  }
};

const TimeDisplay: React.FC<{ time: string }> = ({ time }) => {
  const getLag = () => {
    if (navigator.languages !== undefined) {
      return navigator.languages[0];
    }

    return navigator.language ?? 'en';
  };

  const timeFormat = () => {
    return Intl.DateTimeFormat(getLag(), { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(time));
  };

  return (
    <span className="flex items-center gap-2">
      <Clock /> {timeFormat()}
    </span>
  );
};

const UserDisplay: React.FC<{ username?: string | null; userId: string }> = ({ username, userId }) => {
  return (
    <span className="flex items-center gap-2">
      <User /> {username || 'Unknown'} ({userId})
    </span>
  );
};

const AuditLogComponent: React.FC<{ config: Config }> = ({ config }) => {
  const trpcContext = trpc.useContext();
  const audit = trpc.useInfiniteQuery(['config-audit', { projectId: config.projectId, configId: config.id }], {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const [logData, setLogData] = useState<Exclude<typeof audit['data'], null | undefined>['pages'][number]['logs']>([]);

  useEffect(() => {
    if (!audit.isLoading) {
      audit.remove();
      audit.fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, config.id, config.version, trpcContext]);

  useEffect(() => {
    if (audit.isLoading) {
      return;
    }

    setLogData(
      audit
        .data!.pages.flatMap((data) => data)
        .map((d) => d.logs)
        .flatMap((l) => l)
    );
  }, [audit.data, audit.isLoading]);

  useEffect(() => {
    return () => {
      // Clear the old data when we move away
      audit.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {logData.map((log) => {
        return (
          <Dot className="z-10" key={`${log.at}-${Math.random()}`} type={dotType(log.update)}>
            <div className="my-4 flex flex-col gap-2">
              <TimeDisplay time={log.at} />
              <UserDisplay userId={log.userId} username={log.username} />
              <FormatLogAsString log={log} />
            </div>
          </Dot>
        );
      })}

      {audit.hasNextPage && <Button onClick={() => audit.fetchNextPage()}>Load More</Button>}

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
          border-radius: 1em;
          z-index: 0;
        }
      `}</style>
    </div>
  );
};

export const AuditLog = dynamic(() => Promise.resolve(AuditLogComponent), { ssr: false });
