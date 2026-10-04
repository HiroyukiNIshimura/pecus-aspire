import { channel } from 'node:diagnostics_channel';
import { IncomingMessage, ServerResponse } from 'node:http';
import client from 'prom-client';

interface FrontendMetrics {
  register: client.Registry;
  httpRequestsTotal: client.Counter<string>;
  httpRequestDuration: client.Histogram<string>;
  activeConnections: client.Gauge<string>;
}

interface HttpRequestStartMessage {
  request: IncomingMessage;
  response: ServerResponse;
}

const staticAssetPath = /\.(?:avif|css|eot|gif|ico|jpe?g|js|map|png|svg|webp|woff2?)$/i;

declare global {
  var __coatiFrontendMetrics: FrontendMetrics | undefined;
  var __coatiHttpMetricsInstrumentationStarted: boolean | undefined;
}

function createMetrics(): FrontendMetrics {
  const register = new client.Registry();

  client.collectDefaultMetrics({
    register,
    prefix: 'nextjs_',
  });

  const httpRequestsTotal = new client.Counter({
    name: 'nextjs_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register],
  });

  const httpRequestDuration = new client.Histogram({
    name: 'nextjs_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
  });

  const activeConnections = new client.Gauge({
    name: 'nextjs_active_connections',
    help: 'Number of active connections',
    registers: [register],
  });

  return { register, httpRequestsTotal, httpRequestDuration, activeConnections };
}

const metrics: FrontendMetrics = globalThis.__coatiFrontendMetrics ?? createMetrics();
globalThis.__coatiFrontendMetrics = metrics;

function getMethodLabel(method: string | undefined): string {
  switch (method) {
    case 'GET':
    case 'HEAD':
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
    case 'OPTIONS':
      return method;
    default:
      return 'OTHER';
  }
}

function getPathLabel(url: string | undefined): string {
  const pathname = url?.split('?', 1)[0] ?? '/';

  if (pathname === '/api/metrics') {
    return pathname;
  }

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return '/api/*';
  }

  if (pathname === '/_next' || pathname.startsWith('/_next/')) {
    return '/_next/*';
  }

  return pathname === '/' ? '/' : '/*';
}

function isHttpRequestStartMessage(message: unknown): message is HttpRequestStartMessage {
  if (typeof message !== 'object' || message === null || !('request' in message) || !('response' in message)) {
    return false;
  }

  return message.request instanceof IncomingMessage && message.response instanceof ServerResponse;
}

function isStaticAssetRequest(url: string | undefined): boolean {
  const pathname = url?.split('?', 1)[0] ?? '/';
  return pathname.startsWith('/_next/static/') || staticAssetPath.test(pathname);
}

function instrumentHttpRequests(): void {
  if (globalThis.__coatiHttpMetricsInstrumentationStarted) {
    return;
  }

  channel('http.server.request.start').subscribe((message) => {
    if (!isHttpRequestStartMessage(message)) {
      return;
    }

    const { request, response } = message;
    if (isStaticAssetRequest(request.url)) {
      return;
    }

    const method = getMethodLabel(request.method);
    const path = getPathLabel(request.url);
    const startedAt = performance.now();
    let finished = false;

    metrics.activeConnections.inc();

    const finish = (status: string) => {
      if (finished) {
        return;
      }

      finished = true;
      metrics.httpRequestsTotal.labels(method, path, status).inc();
      metrics.httpRequestDuration.labels(method, path, status).observe((performance.now() - startedAt) / 1000);
      metrics.activeConnections.dec();
    };

    response.once('finish', () => finish(String(response.statusCode)));
    response.once('close', () => finish(response.writableFinished ? String(response.statusCode) : 'aborted'));
    response.once('error', () => finish('aborted'));
  });

  globalThis.__coatiHttpMetricsInstrumentationStarted = true;
}

export const { activeConnections, httpRequestDuration, httpRequestsTotal, register } = metrics;
export { instrumentHttpRequests };
