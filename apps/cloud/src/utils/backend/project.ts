import { getUserIcon } from '@utils/backend/userIcons';
import { ProjectPage, ProjectWithUsers } from '@utils/shared/types';

export const projectWithUserIcons = (project: ProjectWithUsers): ProjectPage => {
  const { UsersOnProject, ...projectData } = project;

  return {
    ...projectData,
    userIcons: UsersOnProject.map((uop) => getUserIcon(uop.user.email, uop.user.image)),
  };
};
