import SecretLoader from '@components/loader';
import { ProjectCard } from '@components/project/ProjectCard';
import { Grid, Input, Spacer, useInput } from '@geist-ui/core';
import { trpc } from '@utils/shared/trpc';
import { ProjectPage } from '@utils/shared/types';
import React, { useEffect, useState } from 'react';

export const ProjectsDisplay: React.FC = () => {
  const { state, bindings } = useInput('');
  const projects = trpc.useQuery(['project-get']);
  const [projectList, setProjectList] = useState<ProjectPage[]>([]);

  useEffect(() => {
    if (!state || !projects.data) {
      return setProjectList(projects.data ?? []);
    }

    const lowercaseInput = state.toLowerCase();

    setProjectList(
      projects.data.filter(
        (p) => p.id.toLowerCase().includes(lowercaseInput) || p.name.toLowerCase().includes(lowercaseInput)
      )
    );
  }, [state, projects.data]);

  if (projects.isLoading) {
    return <SecretLoader loadingText="Loading projects" />;
  }

  if (projects.isError || !projects.data) {
    return <SecretLoader loadingText="Failed to load projects" />;
  }

  return (
    <>
      <div className="flex justify-end">
        <Input {...bindings} clearable placeholder="Search" />
      </div>
      <Spacer h={3} />
      <Grid.Container gap={2} justify="center" dir="row" wrap="wrap">
        {projectList.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </Grid.Container>
    </>
  );
};
