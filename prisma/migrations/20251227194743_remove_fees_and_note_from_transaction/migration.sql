/*
  Warnings:

  - You are about to drop the column `fees` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "fees",
DROP COLUMN "notes";
