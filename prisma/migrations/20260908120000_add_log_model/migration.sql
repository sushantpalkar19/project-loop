-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Log_workspaceId_createdAt_idx" ON "Log"("workspaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Log_workspaceId_action_idx" ON "Log"("workspaceId", "action");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
