// common/interceptors/response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Ne pas wrapper la réponse pour l'endpoint /metrics (Prometheus)
    if (request.url === '/metrics') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        message: 'Request successful',
        data,
      })),
    );
  }
}
