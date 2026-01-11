import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsInterceptor } from '../interceptors/metrics.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [PrometheusModule],
  providers: [
    // Counter pour les requêtes HTTP totales
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total des requêtes HTTP',
      labelNames: ['method', 'route', 'status'],
    }),
    // Histogram pour la durée des requêtes
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Durée des requêtes HTTP en secondes',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    // Enregistrer l'interceptor globalement
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class MetricsModule {}
