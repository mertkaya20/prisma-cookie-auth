/*
  Warnings:

  - A unique constraint covering the columns `[organization_id,id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('manager', 'contributor');

-- DropIndex
DROP INDEX "users_organization_id_idx";

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'contributor',

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("project_id","user_id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "due_date" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignees" (
    "organization_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("task_id","user_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_tags" (
    "organization_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "task_tags_pkey" PRIMARY KEY ("task_id","tag_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_name_key" ON "projects"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organization_id_id_key" ON "projects"("organization_id", "id");

-- CreateIndex
CREATE INDEX "project_members_organization_id_user_id_idx" ON "project_members"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_status_idx" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "tasks_organization_id_created_by_id_idx" ON "tasks"("organization_id", "created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_organization_id_id_key" ON "tasks"("organization_id", "id");

-- CreateIndex
CREATE INDEX "task_assignees_organization_id_user_id_idx" ON "task_assignees"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organization_id_name_key" ON "tags"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organization_id_id_key" ON "tags"("organization_id", "id");

-- CreateIndex
CREATE INDEX "task_tags_organization_id_tag_id_idx" ON "task_tags"("organization_id", "tag_id");

-- CreateIndex
CREATE INDEX "comments_task_id_created_at_idx" ON "comments"("task_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_organization_id_author_id_idx" ON "comments"("organization_id", "author_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_id_key" ON "users"("organization_id", "id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_organization_id_project_id_fkey" FOREIGN KEY ("organization_id", "project_id") REFERENCES "projects"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_organization_id_user_id_fkey" FOREIGN KEY ("organization_id", "user_id") REFERENCES "users"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_project_id_fkey" FOREIGN KEY ("organization_id", "project_id") REFERENCES "projects"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_created_by_id_fkey" FOREIGN KEY ("organization_id", "created_by_id") REFERENCES "users"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_organization_id_task_id_fkey" FOREIGN KEY ("organization_id", "task_id") REFERENCES "tasks"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_organization_id_user_id_fkey" FOREIGN KEY ("organization_id", "user_id") REFERENCES "users"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_organization_id_task_id_fkey" FOREIGN KEY ("organization_id", "task_id") REFERENCES "tasks"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_organization_id_tag_id_fkey" FOREIGN KEY ("organization_id", "tag_id") REFERENCES "tags"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_task_id_fkey" FOREIGN KEY ("organization_id", "task_id") REFERENCES "tasks"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_author_id_fkey" FOREIGN KEY ("organization_id", "author_id") REFERENCES "users"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
