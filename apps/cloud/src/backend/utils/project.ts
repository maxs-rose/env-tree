import { User } from '@backend/api/user';
import { Project } from '@prisma/client';

export const projectWithUserIcons = (project: Project & { UsersOnProject: { user: User }[] }) => {
  return { ...project, userIcons: project.UsersOnProject.map((uop) => uop.user.image ?? '') };
};
