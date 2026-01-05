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
  systemCpuUsage: MetricTimeSeries[];
  memoryUsage: MetricTimeSeries[];
  diskUsage: MetricTimeSeries[];
  processMemory: MetricTimeSeries[];
  httpRequestRate: MetricTimeSeries[];
}

/**
 * サーバーリソースの現在値（ゲージ表示用）
 */
export interface ServerResourceCurrent {
  cpu: {
    usagePercent: number;
    cores: number;
  };
  memory: {
    usagePercent: number;
    usedBytes: number;
    totalBytes: number;
  };
  disk: Array<{
    mountpoint: string;
    usagePercent: number;
    usedBytes: number;
    totalBytes: number;
  }>;
  timestamp: string;
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

interface PrometheusInstantResponse {
  status: 'success' | 'error';
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
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
 * Prometheus instant query API を呼び出す（現在値取得用）
 */
async function fetchPrometheusInstant(query: string): Promise<PrometheusInstantResponse | null> {
  try {
    const params = new URLSearchParams({ query });

    const response = await fetch(`${prometheusUrl}/api/v1/query?${params}`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Prometheus instant query failed: ${response.status}`);
      return null;
    }

    return (await response.json()) as PrometheusInstantResponse;
  } catch (error) {
    console.error('Failed to fetch Prometheus instant:', error);
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
 * - Backend (.NET): dotnet_process_cpu_time_seconds_total, dotnet_process_memory_working_set_bytes
 * - Frontend (Next.js): nextjs_process_cpu_user_seconds_total, nextjs_process_resident_memory_bytes
 * - LexicalConverter (NestJS): lexicalconverter_process_cpu_user_seconds_total, lexicalconverter_process_resident_memory_bytes
 */
export async function getSystemMetrics(hoursBack = 24): Promise<ApiResponse<SystemMetrics>> {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - hoursBack * 3600;
    const step = hoursBack <= 1 ? '15s' : hoursBack <= 6 ? '1m' : '5m';

    // 監視対象マウントポイント（環境変数から取得、デフォルトは / のみ）
    const diskMountPoints = (process.env.DISK_MOUNT_POINTS || '/').split(',').map((p) => p.trim());
    const diskMountPointsRegex = diskMountPoints.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

    const [
      backendCpuRes,
      frontendCpuRes,
      lexicalCpuRes,
      backendMemRes,
      frontendMemRes,
      lexicalMemRes,
      httpRateRes,
      systemMemRes,
      systemCpuRes,
      diskUsageRes,
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
      fetchPrometheusRange(
        '100 - (avg(rate(node_cpu_seconds_total{job="node",mode="idle"}[5m])) * 100)',
        start,
        end,
        step,
      ),
      fetchPrometheusRange(
        `100 - ((node_filesystem_avail_bytes{job="node",mountpoint=~"${diskMountPointsRegex}"} / node_filesystem_size_bytes{job="node",mountpoint=~"${diskMountPointsRegex}"}) * 100)`,
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

    // ディスク使用率: mountpointをjobとして扱う
    const diskUsage: MetricTimeSeries[] =
      diskUsageRes?.data?.result?.map((result) => ({
        job: result.metric.mountpoint || 'unknown',
        instance: result.metric.instance || 'unknown',
        metric: 'ディスク使用率',
        data: result.values.map(([timestamp, value]) => ({
          timestamp: timestamp * 1000,
          value: Number.parseFloat(value),
        })),
      })) ?? [];

    return {
      success: true,
      data: {
        cpuUsage,
        systemCpuUsage: parseRangeResponse(systemCpuRes, 'システムCPU使用率'),
        memoryUsage: parseRangeResponse(systemMemRes, 'システムメモリ使用率'),
        diskUsage,
        processMemory,
        httpRequestRate: parseRangeResponse(httpRateRes, 'HTTPリクエスト/秒'),
      },
    };
  } catch (error) {
    console.error('Failed to get system metrics:', error);
    return serverError('システムメトリクスの取得に失敗しました');
  }
}

/**
 * Server Action: サーバーリソースの現在値を取得（ゲージ表示用）
 */
export async function getServerResourceCurrent(): Promise<ApiResponse<ServerResourceCurrent>> {
  try {
    // 監視対象マウントポイント（環境変数から取得）
    const diskMountPoints = (process.env.DISK_MOUNT_POINTS || '/').split(',').map((p) => p.trim());
    const diskMountPointsRegex = diskMountPoints.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

    const [cpuRes, cpuCoresRes, memUsedRes, memTotalRes, diskAvailRes, diskTotalRes] = await Promise.all([
      fetchPrometheusInstant('100 - (avg(rate(node_cpu_seconds_total{job="node",mode="idle"}[5m])) * 100)'),
      fetchPrometheusInstant('count(node_cpu_seconds_total{job="node",mode="idle"})'),
      fetchPrometheusInstant('node_memory_MemTotal_bytes{job="node"} - node_memory_MemAvailable_bytes{job="node"}'),
      fetchPrometheusInstant('node_memory_MemTotal_bytes{job="node"}'),
      fetchPrometheusInstant(`node_filesystem_avail_bytes{job="node",mountpoint=~"${diskMountPointsRegex}"}`),
      fetchPrometheusInstant(`node_filesystem_size_bytes{job="node",mountpoint=~"${diskMountPointsRegex}"}`),
    ]);

    // CPU
    const cpuUsagePercent = cpuRes?.data?.result?.[0]?.value?.[1]
      ? Number.parseFloat(cpuRes.data.result[0].value[1])
      : 0;
    const cpuCores = cpuCoresRes?.data?.result?.[0]?.value?.[1]
      ? Number.parseInt(cpuCoresRes.data.result[0].value[1], 10)
      : 0;

    // メモリ
    const memUsedBytes = memUsedRes?.data?.result?.[0]?.value?.[1]
      ? Number.parseFloat(memUsedRes.data.result[0].value[1])
      : 0;
    const memTotalBytes = memTotalRes?.data?.result?.[0]?.value?.[1]
      ? Number.parseFloat(memTotalRes.data.result[0].value[1])
      : 0;
    const memUsagePercent = memTotalBytes > 0 ? (memUsedBytes / memTotalBytes) * 100 : 0;

    // ディスク（マウントポイントごと）
    const diskData: ServerResourceCurrent['disk'] = [];
    if (diskAvailRes?.data?.result && diskTotalRes?.data?.result) {
      for (const availResult of diskAvailRes.data.result) {
        const mountpoint = availResult.metric.mountpoint;
        const totalResult = diskTotalRes.data.result.find((r) => r.metric.mountpoint === mountpoint);
        if (totalResult) {
          const availBytes = Number.parseFloat(availResult.value[1]);
          const totalBytes = Number.parseFloat(totalResult.value[1]);
          const usedBytes = totalBytes - availBytes;
          diskData.push({
            mountpoint,
            usagePercent: totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0,
            usedBytes,
            totalBytes,
          });
        }
      }
    }

    return {
      success: true,
      data: {
        cpu: {
          usagePercent: cpuUsagePercent,
          cores: cpuCores,
        },
        memory: {
          usagePercent: memUsagePercent,
          usedBytes: memUsedBytes,
          totalBytes: memTotalBytes,
        },
        disk: diskData,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to get server resource current:', error);
    return serverError('サーバーリソースの取得に失敗しました');
  }
}
