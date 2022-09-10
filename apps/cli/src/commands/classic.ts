import { defaultUrl } from '@/utils/consts';
import { downloadConfig } from '@/utils/download-config';
import { DownloadType, isValidFiletype } from '@/utils/downloadType';
import { getFilename } from '@/utils/getFilename';
import { validURL } from '@/utils/url';
import { Command } from 'commander';

export const addClassic = (program: Command) => {
  program
    .command('classic', { isDefault: true })
    .description(
      'Classic version of Env Tree CLI. Intended for use in CI like environments and is the default if no command is specified'
    )
    .argument('<projectId>', 'ID for project to get config from')
    .argument('<configId>', 'ID for config')
    .argument('<userEmail>', 'User email')
    .argument('<userToken>', 'User auth token')
    .option('--format <fileFormat>', 'File format to download', isValidFiletype, 'env')
    .option('-d, --download-directory <directory>', 'Directory to download file to', '.')
    .option('-f, --filename <filename>', 'Filename for created secrets file (default ".env")')
    .option('-u, --url <url>', 'URL of Env Tree', validURL, defaultUrl)
    .action(
      async (
        projectId,
        configId,
        userEmail,
        userToken,
        options: { format: DownloadType; downloadDirectory: string; filename?: string; url: string }
      ) => {
        const type = options.format;
        const filename = getFilename(options.filename, type);
        const filepath = `${options.downloadDirectory}/${filename}`;
        const url = options.url;

        await downloadConfig(projectId, configId, type, url, { email: userEmail, userToken }, filepath);
      }
    );
};
