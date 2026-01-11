import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const labels = {
            method: request.method,
            route: (request as any).route?.path || request.url,
            status: response.statusCode.toString(),
          };

          this.httpRequestsCounter.inc(labels);
          this.httpRequestDuration.observe(labels, duration);
        },
        error: (error: any) => {
          const duration = (Date.now() - start) / 1000;
          const labels = {
            method: request.method,
            route: (request as any).route?.path || request.url,
            status: error.status?.toString() || '500',
          };

          this.httpRequestsCounter.inc(labels);
          this.httpRequestDuration.observe(labels, duration);
        },
      }),
    );
  }
}
