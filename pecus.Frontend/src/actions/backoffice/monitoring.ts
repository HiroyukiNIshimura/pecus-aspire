'use server';

/**
 * Server Action: BackOffice - システムモニタリング
 * Prometheus API経由でシステム状態を取得
 */

import type { ApiResponse } from '../types';
import { serverError } from '../types';

export interface PrometheusTarget {
  labels: {
    job: string;
    instance: string;
    [key: string]: string;
  };
  scrapePool: string;
  scrapeUrl: string;
  globalUrl: string;
  lastError: string;
  lastScrape: string;
  lastScrapeDuration: number;
  health: 'up' | 'down' | 'unknown';
  scrapeInterval: string;
  scrapeTimeout: string;
}

export interface PrometheusTargetsResponse {
  status: 'success' | 'error';
  data: {
    activeTargets: PrometheusTarget[];
    droppedTargets: unknown[];
  };
}

export interface ServiceStatus {
  name: string;
  job: string;
  instance: string;
  health: 'up' | 'down' | 'unknown';
  lastScrape: string;
  lastScrapeDuration: number;
  lastError: string;
}

export interface MonitoringStatus {
  services: ServiceStatus[];
  prometheusAvailable: boolean;
  timestamp: string;
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

export interface MetricTimeSeries {
  job: string;
  instance: string;
  metric: string;
  data: TimeSeriesDataPoint[];
}

export interface SystemMetrics {
  cpuUsage: MetricTimeSeries[];
  memoryUsage: MetricTimeSeries[];
  processMemory: MetricTimeSeries[];
  httpRequestRate: MetricTimeSeries[];
}

interface PrometheusRangeResponse {
  status: 'success' | 'error';
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      values: Array<[number, string]>;
    }>;
  };
}

const SERVICE_NAMES: Record<string, string> = {
  prometheus: 'Prometheus',
  backend: 'WebAPI (Backend)',
  frontend: 'Frontend (Next.js)',
  lexicalconverter: 'LexicalConverter',
  'node-exporter': 'Node Exporter',
  'blackbox-exporter': 'Blackbox Exporter',
};

/**
 * Prometheus API からターゲット状態を取得
 * 開発環境: Aspire 経由でlocalhost:9090
 * 本番環境: docker内部ネットワーク経由
 */
async function fetchPrometheusTargets(): Promise<PrometheusTargetsResponse | null> {
  const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';

  try {
    const response = await fetch(`${prometheusUrl}/api/v1/targets`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Prometheus API returned status: ${response.status}`);
      return null;
    }

    return (await response.json()) as PrometheusTargetsResponse;
  } catch (error) {
    console.error('Failed to fetch Prometheus targets:', error);
    return null;
  }
}

/**
 * Server Action: システムモニタリング状態を取得
 */
export async function getMonitoringStatus(): Promise<ApiResponse<MonitoringStatus>> {
  try {
    const targetsResponse = await fetchPrometheusTargets();

    if (!targetsResponse || targetsResponse.status !== 'success') {
      return {
        success: true,
        data: {
          services: [],
          prometheusAvailable: false,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const services: ServiceStatus[] = targetsResponse.data.activeTargets.map((target) => ({
      name: SERVICE_NAMES[target.labels.job] || target.labels.job,
      job: target.labels.job,
      instance: target.labels.instance,
      health: target.health,
      lastScrape: target.lastScrape,
      lastScrapeDuration: target.lastScrapeDuration,
      lastError: target.lastError,
    }));

    return {
      success: true,
      data: {
        services,
        prometheusAvailable: true,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to get monitoring status:', error);
    return serverError('モニタリング状態の取得に失敗しました');
  }
}

const prometheusUrl = process.env.PROMETHEUS_URL || 'http://localhost:9090';

/**
 * Prometheus range query API を呼び出す
 */
async function fetchPrometheusRange(
  query: string,
  start: number,
  end: number,
  step: string,
): Promise<PrometheusRangeResponse | null> {
  try {
    const params = new URLSearchParams({
      query,
      start: start.toString(),
      end: end.toString(),
      step,
    });

    const response = await fetch(`${prometheusUrl}/api/v1/query_range?${params}`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`Prometheus range query failed: ${response.status}`);
      return null;
    }

    return (await response.json()) as PrometheusRangeResponse;
  } catch (error) {
    console.error('Failed to fetch Prometheus range:', error);
    return null;
  }
}

/**
 * Prometheus レスポンスを MetricTimeSeries 配列に変換
 */
function parseRangeResponse(response: PrometheusRangeResponse | null, metricName: string): MetricTimeSeries[] {
  if (!response || response.status !== 'success') return [];

  return response.data.result.map((result) => ({
    job: result.metric.job || 'unknown',
    instance: result.metric.instance || 'unknown',
    metric: metricName,
    data: result.values.map(([timestamp, value]) => ({
      timestamp: timestamp * 1000,
      value: Number.parseFloat(value),
    })),
  }));
}

/**
 * Prometheus レスポンスを MetricTimeSeries 配列に変換（job名を上書き指定）
 */
function parseRangeResponseWithJobOverride(
  response: PrometheusRangeResponse | null,
  metricName: string,
  jobOverride: string,
): MetricTimeSeries[] {
  if (!response || response.status !== 'success' || response.data.result.length === 0) return [];

  return response.data.result.map((result) => ({
    job: jobOverride,
    instance: result.metric.instance || 'unknown',
    metric: metricName,
    data: result.values.map(([timestamp, value]) => ({
      timestamp: timestamp * 1000,
      value: Number.parseFloat(value),
    })),
  }));
}

/**
 * Server Action: システムメトリクス（時系列）を取得
 * 過去24時間のCPU/メモリ使用率など
 *
 * 各サービスのメトリクス形式:
 * - Backend (.NET): process_cpu_seconds_total, process_resident_memory_bytes (OpenTelemetry)
 * - Frontend (Next.js): nextjs_process_cpu_user_seconds_total, nextjs_process_resident_memory_bytes (prom-client)
 * - Backend (.NET): dotnet_process_cpu_time_seconds_total, dotnet_process_memory_working_set_bytes
 * - Frontend (Next.js): nextjs_process_cpu_user_seconds_total, nextjs_process_resident_memory_bytes
 * - LexicalConverter (NestJS): lexicalconverter_process_cpu_user_seconds_total, lexicalconverter_process_resident_memory_bytes
 */
export async function getSystemMetrics(hoursBack = 24): Promise<ApiResponse<SystemMetrics>> {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - hoursBack * 3600;
    const step = hoursBack <= 1 ? '15s' : hoursBack <= 6 ? '1m' : '5m';

    const [
      backendCpuRes,
      frontendCpuRes,
      lexicalCpuRes,
      backendMemRes,
      frontendMemRes,
      lexicalMemRes,
      httpRateRes,
      systemMemRes,
    ] = await Promise.all([
      fetchPrometheusRange('rate(dotnet_process_cpu_time_seconds_total{job="backend"}[5m]) * 100', start, end, step),
      fetchPrometheusRange(
        '(rate(nextjs_process_cpu_user_seconds_total[5m]) + rate(nextjs_process_cpu_system_seconds_total[5m])) * 100',
        start,
        end,
        step,
      ),
      fetchPrometheusRange(
        '(rate(lexicalconverter_process_cpu_user_seconds_total[5m]) + rate(lexicalconverter_process_cpu_system_seconds_total[5m])) * 100',
        start,
        end,
        step,
      ),
      fetchPrometheusRange('dotnet_process_memory_working_set_bytes{job="backend"} / 1024 / 1024', start, end, step),
      fetchPrometheusRange('nextjs_process_resident_memory_bytes / 1024 / 1024', start, end, step),
      fetchPrometheusRange('lexicalconverter_process_resident_memory_bytes / 1024 / 1024', start, end, step),
      fetchPrometheusRange('sum by (job) (rate(http_server_request_duration_seconds_count[5m]))', start, end, step),
      fetchPrometheusRange(
        '100 - ((node_memory_MemAvailable_bytes{job="node"} / node_memory_MemTotal_bytes{job="node"}) * 100)',
        start,
        end,
        step,
      ),
    ]);

    const cpuUsage = [
      ...parseRangeResponseWithJobOverride(backendCpuRes, 'CPU使用率', 'backend'),
      ...parseRangeResponseWithJobOverride(frontendCpuRes, 'CPU使用率', 'frontend'),
      ...parseRangeResponseWithJobOverride(lexicalCpuRes, 'CPU使用率', 'lexicalconverter'),
    ];

    const processMemory = [
      ...parseRangeResponseWithJobOverride(backendMemRes, 'プロセスメモリ', 'backend'),
      ...parseRangeResponseWithJobOverride(frontendMemRes, 'プロセスメモリ', 'frontend'),
      ...parseRangeResponseWithJobOverride(lexicalMemRes, 'プロセスメモリ', 'lexicalconverter'),
    ];

    return {
      success: true,
      data: {
        cpuUsage,
        memoryUsage: parseRangeResponse(systemMemRes, 'システムメモリ使用率'),
        processMemory,
        httpRequestRate: parseRangeResponse(httpRateRes, 'HTTPリクエスト/秒'),
      },
    };
  } catch (error) {
    console.error('Failed to get system metrics:', error);
    return serverError('システムメトリクスの取得に失敗しました');
  }
}
