import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GrpcMetricsInterceptor } from './grpc-metrics.interceptor.js';
import { MetricsController } from './metrics.controller.js';

@Module({
  controllers: [MetricsController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: GrpcMetricsInterceptor }],
})
export class MetricsModule {}
