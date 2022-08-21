import { Project } from '@prisma/client';

export const projectWithUserIcons = (project: Project & { UsersOnProject: { user: { image: string | null } }[] }) => {
  return {
    ...project,
    UsersOnProject: undefined,
    userIcons: project.UsersOnProject.map((uop) => uop.user.image ?? ''),
  };
};
