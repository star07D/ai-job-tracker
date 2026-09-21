-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusEvent_jobId_idx" ON "StatusEvent"("jobId");

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one event per existing job. We only know where each job is now and
-- when it got there, so the origin is left NULL ("path unknown") — the Insights
-- maths deliberately ignores these rows for transition timings.
INSERT INTO "StatusEvent" ("id", "jobId", "fromStatus", "toStatus", "at")
SELECT
    gen_random_uuid()::text,
    "id",
    NULL,
    "status",
    CASE WHEN "status" = 'Applied' THEN "appliedDate" ELSE "statusChangedAt" END
FROM "Job";
