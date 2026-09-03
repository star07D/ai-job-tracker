-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDue" TIMESTAMP(3);
