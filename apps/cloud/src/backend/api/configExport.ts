import { getExpandedConfigs$ } from '@backend/api/config';
import { prisma } from '@backend/prisma';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { decrypt } from '@utils/backend/crypt';
import { configToEnvString, configToJsonGroupObject, configToJsonObject } from '@utils/shared/configExport';
import { flattenConfigValues } from '@utils/shared/flattenConfig';
import {
  AuthUser,
  ConfigExportType,
  ConfigType,
  zConfigExportOptionalAuth,
  zConfigExportParams,
} from '@utils/shared/types';
import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { firstValueFrom, map, Observable } from 'rxjs';

const exportConfig$ = <T extends ConfigType>(
  userId: string,
  projectId: string,
  configId: string,
  type: T
): Observable<ConfigExportType<T> | undefined> =>
  getExpandedConfigs$(userId, projectId).pipe(
    map((configs) => configs.find((c) => c.id === configId)),
    map((config) => {
      if (!config) {
        return undefined;
      }

      const flatValues = flattenConfigValues(config);

      switch (type) {
        case 'env':
          return configToEnvString(flatValues) as ConfigExportType<T>;
        case 'json':
          return configToJsonObject(flatValues) as ConfigExportType<T>;
        case 'json-grouped':
          return configToJsonGroupObject(flatValues) as ConfigExportType<T>;
      }
    })
  );

const getUserFromSessionOrRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  const userSession = (await unstable_getServerSession(req, res, authOptions))?.user as AuthUser | null;
  const parseResult = zConfigExportOptionalAuth.safeParse(req.body);

  console.log(parseResult);

  if (!userSession && !parseResult.success) {
    return 401;
  }

  if (userSession) {
    return userSession;
  }

  if (parseResult.success) {
    const dbUser = parseResult.data.userEmail
      ? await prisma.user.findUnique({
          where: {
            email: parseResult.data.userEmail,
          },
        })
      : undefined;

    if (dbUser) {
      if (decrypt(dbUser.authToken) === parseResult.data.userToken) {
        return dbUser as { id: string };
      }

      return 401;
    }
  }

  return 401;
};

export const handleConfigExport = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).send({});
    return;
  }

  const user = await getUserFromSessionOrRequest(req, res);

  if (user === 401) {
    res.status(401).send({});
    return;
  }

  const parseResult = zConfigExportParams.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).send(parseResult.error.issues);
    return;
  }

  const formData = parseResult.data;

  return await firstValueFrom(exportConfig$(user.id, formData.projectId, formData.configId, formData.type))
    .then((data) => {
      if (data === undefined) {
        res.status(404).send('Could not find config');
        return;
      }

      res.status(200);

      if (formData.type === 'env') {
        res.setHeader('Content-Type', 'plain/text');
        res.send(data ?? '');
      } else {
        res.json(data ?? {});
      }
    })
    .catch(() => {
      res.status(500).send({ message: 'Error when exporting config' });
    });
};
