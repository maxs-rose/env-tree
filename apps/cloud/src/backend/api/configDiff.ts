import { prisma } from '@backend/prisma';
import { encryptObject } from '@utils/backend/crypt';
import { Change } from '@utils/shared/types';

const cleanOldLogs = async (configId: string, projectId: string) => {
  const res = await prisma.configAudit.findFirst({
    where: { configId, configProjectId: projectId },
    orderBy: [{ createdAt: 'desc' }],
    select: { createdAt: true },
    skip: 10,
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
