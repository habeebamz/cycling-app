/*
  Warnings:

  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN "profileImage" TEXT;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN "profileImage" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Message";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ViolationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reporterId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ViolationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViolationReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'ACCUMULATIVE',
    "goal" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "image" TEXT,
    "trophyImage" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "groupId" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Challenge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("condition", "createdAt", "creatorId", "description", "endDate", "goal", "groupId", "id", "image", "startDate", "title", "trophyImage", "type", "updatedAt") SELECT "condition", "createdAt", "creatorId", "description", "endDate", "goal", "groupId", "id", "image", "startDate", "title", "trophyImage", "type", "updatedAt" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "ViolationReport_reporterId_idx" ON "ViolationReport"("reporterId");

-- CreateIndex
CREATE INDEX "ViolationReport_postId_idx" ON "ViolationReport"("postId");
