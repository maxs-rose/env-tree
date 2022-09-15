import { Avatar, Card, Grid, Text } from '@geist-ui/core';
import { ProjectPage } from '@utils/shared/types';
import Link from 'next/link';
import React from 'react';

export const ProjectCard: React.FC<{ project: ProjectPage }> = ({ project }) => {
  const linkTarget = `/projects/${project.id}`;
  const imageSize = 2;

  return (
    <Grid>
      <Link href={linkTarget} passHref>
        <a>
          <Card hoverable className="!w-[24rem]">
            <div className="flex gap-2 items-center">
              <Avatar src={project.projectImage || undefined} width={imageSize} height={imageSize} />
              <Text h4 className="max-w-sm break-words">
                {project.name}
              </Text>
            </div>
            <Text className="max-w-sm break-words">{project.description ?? 'No description'}</Text>
            <Avatar.Group count={project.userIcons.length > 10 ? project.userIcons.length - 10 : undefined}>
              {project.userIcons.slice(0, 10).map((l) => (
                <Avatar key={l} src={l} stacked />
              ))}
            </Avatar.Group>
          </Card>
        </a>
      </Link>
    </Grid>
  );
};
