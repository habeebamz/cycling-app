-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GOING',
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventParticipant" ("eventId", "id", "joinedAt", "notificationsEnabled", "role", "status", "userId") SELECT "eventId", "id", "joinedAt", "notificationsEnabled", "role", "status", "userId" FROM "EventParticipant";
DROP TABLE "EventParticipant";
ALTER TABLE "new_EventParticipant" RENAME TO "EventParticipant";
CREATE UNIQUE INDEX "EventParticipant_userId_eventId_key" ON "EventParticipant"("userId", "eventId");
CREATE TABLE "new_ViolationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reporterId" TEXT NOT NULL,
    "postId" TEXT,
    "targetUserId" TEXT,
    "activityId" TEXT,
    "groupId" TEXT,
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ViolationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViolationReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViolationReport_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ViolationReport_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViolationReport_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ViolationReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ViolationReport" ("createdAt", "details", "id", "postId", "reason", "reporterId", "status", "updatedAt") SELECT "createdAt", "details", "id", "postId", "reason", "reporterId", "status", "updatedAt" FROM "ViolationReport";
DROP TABLE "ViolationReport";
ALTER TABLE "new_ViolationReport" RENAME TO "ViolationReport";
CREATE INDEX "ViolationReport_reporterId_idx" ON "ViolationReport"("reporterId");
CREATE INDEX "ViolationReport_postId_idx" ON "ViolationReport"("postId");
CREATE INDEX "ViolationReport_targetUserId_idx" ON "ViolationReport"("targetUserId");
CREATE INDEX "ViolationReport_activityId_idx" ON "ViolationReport"("activityId");
CREATE INDEX "ViolationReport_groupId_idx" ON "ViolationReport"("groupId");
CREATE INDEX "ViolationReport_eventId_idx" ON "ViolationReport"("eventId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
