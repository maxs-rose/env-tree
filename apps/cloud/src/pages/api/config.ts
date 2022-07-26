import { handleConfigExport } from '@backend/api/configExport';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return await handleConfigExport(req, res);
}
