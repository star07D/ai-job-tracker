-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "prep" JSONB,
ADD COLUMN     "prepGeneratedAt" TIMESTAMP(3);
