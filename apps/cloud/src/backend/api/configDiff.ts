import { getProjectConfig$ } from '@backend/api/config';
import { prisma } from '@backend/prisma';
import { decryptObject, encryptObject } from '@utils/backend/crypt';
import { Change, DBChange } from '@utils/shared/types';
import { map, mergeMap, switchMap, toArray } from 'rxjs';

const cleanOldLogs = async (configId: string, projectId: string) => {
  const res = await prisma.configAudit.findFirst({
    where: { configId, configProjectId: projectId },
    orderBy: [{ createdAt: 'desc' }],
    select: { createdAt: true },
    skip: parseInt(process.env.CONFIG_AUDIT_RETENTION ?? '0', 10),
  });

  if (res) {
    await prisma.configAudit.deleteMany({
      where: { configId, configProjectId: projectId, createdAt: { lte: res.createdAt } },
    });
  }
};

export const insertValueDiff = async (
  change: Change,
  userId: string,
  username: string | null,
  projectId: string,
  configId: string
) => {
  await prisma.configAudit.create({
    data: {
      data: encryptObject({ ...change, userId, username }),
      configId,
      configProjectId: projectId,
    },
  });

  await cleanOldLogs(configId, projectId);
};

export const changeLinkConfig = async (
  userId: string,
  username: string | null,
  configId: string,
  projectId: string,
  newLinkId: string,
  newLinkName: string,
  oldLinkId: string | null,
  oldLinkName: string | null
) => {
  await prisma.configAudit.create({
    data: {
      data: encryptObject({
        update: oldLinkId ? 'Changed Link' : 'Linked',
        newLinkId,
        newLinkName,
        oldLinkId,
        oldLinkName,
        userId,
        username,
      }),
      configId,
      configProjectId: projectId,
    },
  });

  await cleanOldLogs(configId, projectId);
};

export const unlinkConfig = async (
  userId: string,
  username: string | null,
  projectId: string,
  configId: string,
  unlinkedFromName: string,
  unlinkedFromId: string
) => {
  await prisma.configAudit.create({
    data: {
      data: encryptObject({ update: 'Unlinked', fromName: unlinkedFromName, fromId: unlinkedFromId, userId, username }),
      configId,
      configProjectId: projectId,
    },
  });

  await cleanOldLogs(configId, projectId);
};

export const renameConfig = async (
  userId: string,
  username: string | null,
  projectId: string,
  configId: string,
  from: string,
  to: string
) => {
  await prisma.configAudit.create({
    data: {
      data: encryptObject({ update: 'Renamed', from, to, userId, username }),
      configId,
      configProjectId: projectId,
    },
  });

  await cleanOldLogs(configId, projectId);
};

const pageSize = 6;

export const getConfigAudit$ = (userId: string, projectId: string, configId: string, page?: string | null) =>
  getProjectConfig$(userId, projectId, configId).pipe(
    switchMap(() => {
      return prisma.configAudit.findMany({
        where: {
          configId,
          configProjectId: projectId,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: pageSize + 1,
        cursor: page ? { id: page } : undefined,
      });
    }),
    mergeMap((data) => data),
    map((item) => ({ ...decryptObject<DBChange>(item.data), at: item.createdAt.toString(), id: item.id })),
    toArray(),
    map((data) => {
      if (data.length > pageSize) {
        const last = data.pop();

        return { logs: data, nextCursor: last?.id };
      }

      return { logs: data, nextCursor: undefined };
    })
  );
