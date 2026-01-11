import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class CollectorMetricsService {
  constructor(
    @InjectMetric('crypto_price_usd')
    private readonly cryptoPriceGauge: Gauge<string>,
    @InjectMetric('crypto_collection_duration_seconds')
    private readonly collectionDurationHistogram: Histogram<string>,
    @InjectMetric('crypto_collection_errors_total')
    private readonly collectionErrorsCounter: Counter<string>,
    @InjectMetric('crypto_collection_success_total')
    private readonly collectionSuccessCounter: Counter<string>,
    @InjectMetric('bull_queue_waiting_jobs')
    private readonly queueWaitingGauge: Gauge<string>,
    @InjectMetric('bull_queue_active_jobs')
    private readonly queueActiveGauge: Gauge<string>,
  ) {}

  // Mettre à jour le prix d'une crypto
  updateCryptoPrice(symbol: string, name: string, price: number): void {
    this.cryptoPriceGauge.set({ symbol, name }, price);
  }

  // Enregistrer la durée d'une collection
  recordCollectionDuration(symbol: string, duration: number): void {
    this.collectionDurationHistogram.observe({ symbol }, duration);
  }

  // Incrémenter le compteur de succès
  incrementCollectionSuccess(symbol: string): void {
    this.collectionSuccessCounter.inc({ symbol });
  }

  // Incrémenter le compteur d'erreurs
  incrementCollectionError(symbol: string, errorType: string): void {
    this.collectionErrorsCounter.inc({ symbol, error_type: errorType });
  }

  // Mettre à jour les métriques de la queue
  updateQueueMetrics(queueName: string, waiting: number, active: number): void {
    this.queueWaitingGauge.set({ queue_name: queueName }, waiting);
    this.queueActiveGauge.set({ queue_name: queueName }, active);
  }
}
