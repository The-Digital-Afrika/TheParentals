-- AlterTable
ALTER TABLE "ProviderProfile" ALTER COLUMN "languages" DROP DEFAULT,
ALTER COLUMN "secondaryCategories" DROP DEFAULT,
ALTER COLUMN "ageGroups" DROP DEFAULT,
ALTER COLUMN "availabilityDays" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
