-- CreateTable
CREATE TABLE "UsersOnProject" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("projectId", "userId"),
    CONSTRAINT "UsersOnProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsersOnProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
