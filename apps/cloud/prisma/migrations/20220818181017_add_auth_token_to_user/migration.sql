/*
  Warnings:

  - A unique constraint covering the columns `[email,authToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "authToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_authToken_key" ON "User"("email", "authToken");
