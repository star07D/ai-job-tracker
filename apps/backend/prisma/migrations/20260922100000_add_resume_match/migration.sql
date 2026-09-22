-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resumeText" TEXT,
ADD COLUMN     "resumeFileName" TEXT,
ADD COLUMN     "resumeUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "resumeMatch" JSONB,
ADD COLUMN     "resumeMatchAt" TIMESTAMP(3);
