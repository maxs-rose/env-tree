/*
  Warnings:

  - Added the required column `updatedAt` to the `Config` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Config" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,

    PRIMARY KEY ("id", "projectId"),
    CONSTRAINT "Config_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Config" ("id", "name", "projectId", "values") SELECT "id", "name", "projectId", "values" FROM "Config";
DROP TABLE "Config";
ALTER TABLE "new_Config" RENAME TO "Config";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
