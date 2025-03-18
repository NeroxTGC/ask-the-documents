/*
  Warnings:

  - You are about to drop the column `content` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `embedding` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "content",
DROP COLUMN "embedding";

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_documentId_orderIndex_key" ON "Section"("documentId", "orderIndex");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
