-- CreateTable
CREATE TABLE "project_updates" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "author_user_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_updates_project_id_published_at_id_idx" ON "project_updates"("project_id", "published_at", "id");

-- CreateIndex
CREATE INDEX "project_updates_author_user_id_idx" ON "project_updates"("author_user_id");

-- AddForeignKey
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
