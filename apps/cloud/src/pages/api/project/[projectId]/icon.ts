import { updateProjectImage$ } from '@backend/api/project';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { TRPCError } from '@trpc/server';
import { AuthUser } from '@utils/shared/types';
import { File, IncomingForm } from 'formidable';
import * as fs from 'fs';
import { isArray } from 'lodash-es';
import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth';

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method?.toLowerCase() !== 'post') {
    res.status(405).send('');
    return;
  }

  const session = (await unstable_getServerSession(req, res, authOptions))?.user as AuthUser | null;
  if (!session) {
    res.status(401).send('');
    return;
  }

  const form = new IncomingForm();

  form.parse(req, function (_, __, files) {
    const file = files['file'] as File | File[];

    if (!file || isArray(file) || file.size > 100000 || !/image\/./.test(file.mimetype ?? '')) {
      return res.status(400).send('');
    }

    const readFile = fs.readFileSync(file.filepath);
    fs.unlinkSync(file.filepath);
    const base64Image = `data:${file.mimetype};base64, ${readFile.toString('base64')}`;

    updateProjectImage$(session.id, (req.query.projectId as string | null) || '', base64Image).subscribe({
      next: () => {
        res.status(200).send('');
      },
      error: (e) => {
        if (e instanceof TRPCError) {
          res.status(404).send(e.message);
        } else {
          res.status(500).send('');
        }
      },
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
