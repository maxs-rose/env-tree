import SecretLoader from '@components/loader';
import { ProjectCard } from '@components/project/ProjectCard';
import { Grid } from '@geist-ui/core';
import { trpc } from '@utils/trpc';
import React from 'react';

export const ProjectsDisplay: React.FC = () => {
  const projects = trpc.useQuery(['project-get']);

  if (projects.isLoading) {
    return <SecretLoader loadingText="Loading projects" />;
  }

  if (projects.isError || !projects.data) {
    return <SecretLoader loadingText="Failed to load projects" />;
  }

  return (
    <Grid.Container gap={2} justify="center" dir="row" wrap="wrap">
      {projects.data.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </Grid.Container>
  );
};
