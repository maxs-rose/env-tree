-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UsersOnProject" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("projectId", "userId"),
    CONSTRAINT "UsersOnProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsersOnProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UsersOnProject" ("projectId", "userId") SELECT "projectId", "userId" FROM "UsersOnProject";
DROP TABLE "UsersOnProject";
ALTER TABLE "new_UsersOnProject" RENAME TO "UsersOnProject";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
