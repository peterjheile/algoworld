-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "target_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible_to_client" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_milestones_project_id_is_visible_to_client_display__idx" ON "project_milestones"("project_id", "is_visible_to_client", "display_order");

-- CreateIndex
CREATE INDEX "project_milestones_project_id_status_idx" ON "project_milestones"("project_id", "status");

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
