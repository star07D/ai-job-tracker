-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: existing rows have no status history, so treat "added" as the last change.
UPDATE "Job" SET "statusChangedAt" = "createdAt";
