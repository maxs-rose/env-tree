/*
  Warnings:

  - The required column `username` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "authToken" TEXT
);
INSERT INTO "new_User" ("authToken", "email", "emailVerified", "id", "image", "name") SELECT "authToken", "email", "emailVerified", "id", "image", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_authToken_key" ON "User"("email", "authToken");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
