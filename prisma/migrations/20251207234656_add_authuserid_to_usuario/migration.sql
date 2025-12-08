/*
  Warnings:

  - A unique constraint covering the columns `[AuthUserId]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `AuthUserId` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Usuario" ADD COLUMN     "AuthUserId" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_AuthUserId_key" ON "public"."Usuario"("AuthUserId");
