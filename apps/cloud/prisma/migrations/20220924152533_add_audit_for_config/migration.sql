-- CreateTable
CREATE TABLE "ConfigAudit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "configProjectId" TEXT NOT NULL,

    CONSTRAINT "ConfigAudit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConfigAudit" ADD CONSTRAINT "ConfigAudit_configId_configProjectId_fkey" FOREIGN KEY ("configId", "configProjectId") REFERENCES "Config"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;
