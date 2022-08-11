import { Card, Grid, Text } from '@geist-ui/core';
import { Project } from '@prisma/client';
import Link from 'next/link';
import React from 'react';

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const linkTarget = `/projects/${project.id}`;

  return (
    <Grid>
      <Link href={linkTarget} passHref>
        <a>
          <Card hoverable>
            <Text h4>{project.name}</Text>
            <Text>Short project description</Text>
          </Card>
        </a>
      </Link>
    </Grid>
  );
};
