-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN     "balance" DECIMAL(20,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "portfolio_id" UUID NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "stripe_payment_id" VARCHAR(255),
    "stripe_session_id" VARCHAR(255),
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposits_stripe_payment_id_key" ON "deposits"("stripe_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_stripe_session_id_key" ON "deposits"("stripe_session_id");

-- CreateIndex
CREATE INDEX "deposits_portfolio_id_idx" ON "deposits"("portfolio_id");

-- CreateIndex
CREATE INDEX "deposits_status_idx" ON "deposits"("status");

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
