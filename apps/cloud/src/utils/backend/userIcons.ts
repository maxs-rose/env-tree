import { createHash } from 'crypto';

export const getUserIcon = (userEmail: string | null, pictureUrl?: string | null) => {
  return `https://www.gravatar.com/avatar/${createHash('md5')
    .update(userEmail || 'a')
    .digest('hex')}?${pictureUrl ? `d=${encodeURIComponent(pictureUrl)}` : 'd=retro&s=100'}&r=g`;
};
