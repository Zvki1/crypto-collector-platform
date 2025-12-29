-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE_ABOVE', 'PRICE_BELOW');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'TRIGGERED', 'DISABLED');

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cryptocurrency_id" UUID NOT NULL,
    "type" "AlertType" NOT NULL,
    "target_price" DECIMAL(20,8) NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alerts_user_id_status_idx" ON "alerts"("user_id", "status");

-- CreateIndex
CREATE INDEX "alerts_cryptocurrency_id_status_idx" ON "alerts"("cryptocurrency_id", "status");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_cryptocurrency_id_fkey" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
