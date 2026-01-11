import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { CollectorMetricsService } from './collector-metrics.service';

@Module({
  imports: [PrometheusModule],
  providers: [
    // Prix actuel des cryptos en USD
    makeGaugeProvider({
      name: 'crypto_price_usd',
      help: 'Prix actuel des cryptomonnaies en USD',
      labelNames: ['symbol', 'name'],
    }),
    // Durée de la collection
    makeHistogramProvider({
      name: 'crypto_collection_duration_seconds',
      help: 'Durée de la collection de données crypto en secondes',
      labelNames: ['symbol'],
      buckets: [1, 5, 10, 30, 60, 120],
    }),
    // Erreurs de collection
    makeCounterProvider({
      name: 'crypto_collection_errors_total',
      help: "Nombre total d'erreurs lors de la collection",
      labelNames: ['symbol', 'error_type'],
    }),
    // Collections réussies
    makeCounterProvider({
      name: 'crypto_collection_success_total',
      help: 'Nombre total de collections réussies',
      labelNames: ['symbol'],
    }),
    // Jobs Bull en attente
    makeGaugeProvider({
      name: 'bull_queue_waiting_jobs',
      help: 'Nombre de jobs en attente dans la queue Bull',
      labelNames: ['queue_name'],
    }),
    // Jobs Bull actifs
    makeGaugeProvider({
      name: 'bull_queue_active_jobs',
      help: 'Nombre de jobs actifs dans la queue Bull',
      labelNames: ['queue_name'],
    }),
    CollectorMetricsService,
  ],
  exports: [CollectorMetricsService],
})
export class CollectorMetricsModule {}
