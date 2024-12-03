/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Reference` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Reference_id_key" ON "Reference"("id");
