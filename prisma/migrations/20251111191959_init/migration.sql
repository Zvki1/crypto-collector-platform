-- CreateTable
CREATE TABLE "cryptocurrencies" (
    "id" UUID NOT NULL,
    "coingecko_id" VARCHAR(50) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "image" TEXT,
    "market_cap_rank" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cryptocurrencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" UUID NOT NULL,
    "cryptocurrency_id" UUID NOT NULL,
    "current_price" DECIMAL(20,8) NOT NULL,
    "high_24h" DECIMAL(20,8),
    "low_24h" DECIMAL(20,8),
    "price_change_24h" DECIMAL(20,8),
    "price_change_percentage_24h" DECIMAL(10,4),
    "price_change_percentage_1h" DECIMAL(10,4),
    "market_cap" DECIMAL(22,2),
    "fully_diluted_valuation" DECIMAL(22,2),
    "total_volume" DECIMAL(22,2),
    "market_cap_change_24h" DECIMAL(22,2),
    "market_cap_change_percentage_24h" DECIMAL(10,4),
    "circulating_supply" DECIMAL(20,2),
    "total_supply" DECIMAL(20,2),
    "max_supply" DECIMAL(20,2),
    "ath" DECIMAL(20,8),
    "ath_change_percentage" DECIMAL(10,4),
    "ath_date" TIMESTAMP(3),
    "atl" DECIMAL(20,8),
    "atl_change_percentage" DECIMAL(10,4),
    "atl_date" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cryptocurrencies_coingecko_id_key" ON "cryptocurrencies"("coingecko_id");

-- CreateIndex
CREATE INDEX "cryptocurrencies_symbol_idx" ON "cryptocurrencies"("symbol");

-- CreateIndex
CREATE INDEX "cryptocurrencies_market_cap_rank_idx" ON "cryptocurrencies"("market_cap_rank");

-- CreateIndex
CREATE INDEX "cryptocurrencies_coingecko_id_idx" ON "cryptocurrencies"("coingecko_id");

-- CreateIndex
CREATE INDEX "market_data_cryptocurrency_id_idx" ON "market_data"("cryptocurrency_id");

-- CreateIndex
CREATE INDEX "market_data_timestamp_idx" ON "market_data"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "market_data_cryptocurrency_id_timestamp_idx" ON "market_data"("cryptocurrency_id", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "market_data_cryptocurrency_id_timestamp_key" ON "market_data"("cryptocurrency_id", "timestamp");

-- AddForeignKey
ALTER TABLE "market_data" ADD CONSTRAINT "market_data_cryptocurrency_id_fkey" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
