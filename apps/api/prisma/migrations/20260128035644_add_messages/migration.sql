-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Notification" ADD COLUMN "link" TEXT;

-- CreateTable
CREATE TABLE "ActivityLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityLike_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityComment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "goal" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "image" TEXT,
    "groupId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Challenge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChallengeParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "lastName" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "bikeModel" TEXT,
    "bio" TEXT,
    "image" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "dob" DATETIME,
    "gender" TEXT,
    "weight" REAL,
    "height" REAL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eventRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "totalDistance" REAL NOT NULL DEFAULT 0,
    "longestRideDistance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("bikeModel", "bio", "city", "country", "createdAt", "dob", "email", "firstName", "gender", "height", "id", "image", "isPublic", "lastName", "longestRideDistance", "password", "state", "totalDistance", "updatedAt", "username", "weight") SELECT "bikeModel", "bio", "city", "country", "createdAt", "dob", "email", "firstName", "gender", "height", "id", "image", "isPublic", "lastName", "longestRideDistance", "password", "state", "totalDistance", "updatedAt", "username", "weight" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "distance" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "calories" REAL,
    "avgPower" REAL,
    "maxPower" REAL,
    "avgHeartRate" REAL,
    "maxHeartRate" REAL,
    "elevationGain" REAL NOT NULL DEFAULT 0,
    "gpsData" TEXT,
    "images" TEXT,
    "source" TEXT,
    "isPersonalBest" BOOLEAN NOT NULL DEFAULT false,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("avgHeartRate", "avgPower", "calories", "createdAt", "description", "distance", "duration", "endTime", "gpsData", "id", "isPersonalBest", "maxHeartRate", "maxPower", "source", "startTime", "title", "updatedAt", "userId") SELECT "avgHeartRate", "avgPower", "calories", "createdAt", "description", "distance", "duration", "endTime", "gpsData", "id", "isPersonalBest", "maxHeartRate", "maxPower", "source", "startTime", "title", "updatedAt", "userId" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE TABLE "new_EventParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GOING',
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EventParticipant" ("eventId", "id", "joinedAt", "status", "userId") SELECT "eventId", "id", "joinedAt", "status", "userId" FROM "EventParticipant";
DROP TABLE "EventParticipant";
ALTER TABLE "new_EventParticipant" RENAME TO "EventParticipant";
CREATE UNIQUE INDEX "EventParticipant_userId_eventId_key" ON "EventParticipant"("userId", "eventId");
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "groupId" TEXT,
    "creatorId" TEXT NOT NULL DEFAULT 'legacy_user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdAt", "description", "endTime", "groupId", "id", "location", "startTime", "title", "updatedAt") SELECT "createdAt", "description", "endTime", "groupId", "id", "location", "startTime", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GROUP',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Group" ("createdAt", "description", "id", "image", "isPrivate", "name", "updatedAt") SELECT "createdAt", "description", "id", "image", "isPrivate", "name", "updatedAt" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLike_userId_activityId_key" ON "ActivityLike"("userId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeParticipant_userId_challengeId_key" ON "ChallengeParticipant"("userId", "challengeId");
