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
