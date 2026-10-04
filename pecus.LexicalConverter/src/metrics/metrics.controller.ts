import { Controller, Get, Header } from '@nestjs/common';
import * as client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'lexicalconverter_',
});

const grpcRequestsTotal = new client.Counter({
  name: 'lexicalconverter_grpc_requests_total',
  help: 'Total number of gRPC requests',
  labelNames: ['method', 'status'],
  registers: [register],
});

const grpcRequestDuration = new client.Histogram({
  name: 'lexicalconverter_grpc_request_duration_seconds',
  help: 'Duration of gRPC requests in seconds',
  labelNames: ['method'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const conversionCounter = new client.Counter({
  name: 'lexicalconverter_conversions_total',
  help: 'Total number of Lexical conversions',
  labelNames: ['type'],
  registers: [register],
});

const conversionMethods = new Map([
  ['toHtml', 'ToHtml'],
  ['toMarkdown', 'ToMarkdown'],
  ['toPlainText', 'ToPlainText'],
  ['fromMarkdown', 'FromMarkdown'],
]);

function getGrpcMethodLabel(handlerName: string): string | undefined {
  return conversionMethods.get(handlerName);
}

function recordGrpcRequest(
  method: string,
  status: 'success' | 'error',
  durationSeconds: number,
): void {
  grpcRequestsTotal.labels(method, status).inc();
  grpcRequestDuration.labels(method).observe(durationSeconds);
}

function recordConversion(type: string): void {
  conversionCounter.labels(type).inc();
}

export {
  conversionCounter,
  getGrpcMethodLabel,
  grpcRequestDuration,
  grpcRequestsTotal,
  recordConversion,
  recordGrpcRequest,
  register,
};

@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
