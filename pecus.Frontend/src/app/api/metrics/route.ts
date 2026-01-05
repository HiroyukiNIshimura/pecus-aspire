import { NextResponse } from 'next/server';
import client from 'prom-client';

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

export { httpRequestsTotal, httpRequestDuration, activeConnections, register };

export async function GET() {
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json({ error: 'Failed to generate metrics' }, { status: 500 });
  }
}
