import { ProjectPage, ProjectWithUsers } from '@utils/shared/types';

export const projectWithUserIcons = (project: ProjectWithUsers): ProjectPage => {
  const { UsersOnProject, ...projectData } = project;

  return {
    ...projectData,
    userIcons: UsersOnProject.map((uop) => uop.user.image ?? ''),
  };
};
