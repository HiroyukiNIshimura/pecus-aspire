import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GrpcMetricsInterceptor } from './grpc-metrics.interceptor';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: GrpcMetricsInterceptor }],
})
export class MetricsModule {}
