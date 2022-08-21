import { Avatar, Card, Grid, Text } from '@geist-ui/core';
import { Project } from '@prisma/client';
import Link from 'next/link';
import React from 'react';

export const ProjectCard: React.FC<{ project: Project & { userIcons: string[] } }> = ({ project }) => {
  const linkTarget = `/projects/${project.id}`;

  return (
    <Grid>
      <Link href={linkTarget} passHref>
        <a>
          <Card hoverable>
            <Text h4>{project.name}</Text>
            <Text>Short project description</Text>
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
