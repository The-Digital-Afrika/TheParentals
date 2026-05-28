--  Create enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROVIDER', 'USER');
CREATE TYPE "ProviderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create User table
CREATE TABLE "User" (
    "id"          TEXT        NOT NULL,
    "email"       TEXT        NOT NULL,
    "password"    TEXT        NOT NULL,
    "role"        "Role"      NOT NULL,
    "name"        TEXT,
    "accountType" TEXT        DEFAULT 'user',
    "lastLogin"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Create ProviderProfile table
CREATE TABLE "ProviderProfile" (
    "id"                  TEXT             NOT NULL,
    "userId"              TEXT             NOT NULL,
    "fullName"            TEXT             NOT NULL,
    "accountType"         TEXT             NOT NULL,
    "bio"                 TEXT,
    "experience"          INTEGER,
    "languages"           TEXT[]           NOT NULL DEFAULT '{}',
    "primaryCategory"     TEXT,
    "secondaryCategories" TEXT[]           NOT NULL DEFAULT '{}',
    "serviceTitle"        TEXT,
    "serviceDesc"         TEXT,
    "subjects"            TEXT,
    "ageGroups"           TEXT[]           NOT NULL DEFAULT '{}',
    "deliveryMode"        TEXT,
    "city"                TEXT,
    "province"            TEXT,
    "serviceAreaType"     TEXT,
    "radius"              INTEGER,
    "pricingModel"        TEXT,
    "startingPrice"       TEXT,
    "availabilityDays"    TEXT[]           NOT NULL DEFAULT '{}',
    "availabilityNotes"   TEXT,
    "phone"               TEXT,
    "whatsapp"            TEXT,
    "inquiryEmail"        TEXT,
    "website"             TEXT,
    "facebook"            TEXT,
    "twitter"             TEXT,
    "instagram"           TEXT,
    "linkedin"            TEXT,
    "pinterest"           TEXT,
    "tiktok"              TEXT,
    "status"              "ProviderStatus" NOT NULL DEFAULT 'PENDING',
    "listingPlan"         TEXT             NOT NULL DEFAULT 'free',
    "publicDisplay"       BOOLEAN          NOT NULL DEFAULT false,
    "certifications"      TEXT,
    "degrees"             TEXT,
    "memberships"         TEXT,
    "clearance"           TEXT,
    "createdAt"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

-- Step 4: Create Review table
CREATE TABLE "Review" (
    "id"         TEXT         NOT NULL,
    "providerId" TEXT         NOT NULL,
    "reviewer"   TEXT         NOT NULL,
    "rating"     INTEGER      NOT NULL,
    "text"       TEXT         NOT NULL,
    "status"     TEXT         NOT NULL DEFAULT 'pending',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create FeaturedSlot table
CREATE TABLE "FeaturedSlot" (
    "id"         TEXT         NOT NULL,
    "providerId" TEXT,
    "addedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"  TIMESTAMP(3),

    CONSTRAINT "FeaturedSlot_pkey" PRIMARY KEY ("id")
);

-- Step 6: Add foreign keys
ALTER TABLE "ProviderProfile"
    ADD CONSTRAINT "ProviderProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review"
    ADD CONSTRAINT "Review_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeaturedSlot"
    ADD CONSTRAINT "FeaturedSlot_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Seed the 4 default featured slots (empty)
INSERT INTO "FeaturedSlot" ("id", "providerId", "addedAt")
VALUES
    ('slot_1', NULL, CURRENT_TIMESTAMP),
    ('slot_2', NULL, CURRENT_TIMESTAMP),
    ('slot_3', NULL, CURRENT_TIMESTAMP),
    ('slot_4', NULL, CURRENT_TIMESTAMP);

