-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Config" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "projectId" TEXT NOT NULL,
    "linkedConfigId" TEXT,
    "linkedProjectConfigId" TEXT,

    PRIMARY KEY ("id", "projectId"),
    CONSTRAINT "Config_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Config_linkedConfigId_linkedProjectConfigId_fkey" FOREIGN KEY ("linkedConfigId", "linkedProjectConfigId") REFERENCES "Config" ("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Config" ("id", "linkedConfigId", "linkedProjectConfigId", "name", "projectId", "values") SELECT "id", "linkedConfigId", "linkedProjectConfigId", "name", "projectId", "values" FROM "Config";
DROP TABLE "Config";
ALTER TABLE "new_Config" RENAME TO "Config";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
