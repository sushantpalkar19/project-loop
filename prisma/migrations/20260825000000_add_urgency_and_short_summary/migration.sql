-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable: Add urgency and shortSummary to Feedback
ALTER TABLE "Feedback" ADD COLUMN "urgency" "Urgency" NOT NULL DEFAULT 'LOW';
ALTER TABLE "Feedback" ADD COLUMN "shortSummary" TEXT;
