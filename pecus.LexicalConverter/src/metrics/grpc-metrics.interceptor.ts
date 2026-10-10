import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { finalize, type Observable, tap } from 'rxjs';
import { getGrpcMethodLabel, recordConversion, recordGrpcRequest } from './metrics.controller.js';

function isSuccessfulConversion(result: unknown): boolean {
  return (
    typeof result === 'object' && result !== null && 'success' in result && result.success === true
  );
}

@Injectable()
export class GrpcMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const conversionType = getGrpcMethodLabel(context.getHandler().name);
    const method = conversionType ?? 'Other';
    const startedAt = performance.now();
    let recorded = false;

    if (conversionType) {
      recordConversion(conversionType);
    }

    const record = (status: 'success' | 'error') => {
      if (recorded) {
        return;
      }

      recorded = true;
      recordGrpcRequest(method, status, (performance.now() - startedAt) / 1000);
    };

    return next.handle().pipe(
      tap({
        next: (result: unknown) =>
          record(!conversionType || isSuccessfulConversion(result) ? 'success' : 'error'),
        error: () => record('error'),
      }),
      finalize(() => record('error')),
    );
  }
}
