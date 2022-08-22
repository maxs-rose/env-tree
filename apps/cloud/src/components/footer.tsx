import { Link } from '@geist-ui/core';
import { Github, Zap } from '@geist-ui/icons';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="flex items-center gap-2 justify-end p-3 border-t-[1px] border-[#333333]">
      <Link href="https://github.com/maxs-rose/secrets" target="_blank" title="Repo">
        <Github />
      </Link>
      <Link href="https://github.com/maxs-rose/secrets/issues" target="_blank" title="Bug Tracker">
        <Zap />
      </Link>
    </footer>
  );
};
