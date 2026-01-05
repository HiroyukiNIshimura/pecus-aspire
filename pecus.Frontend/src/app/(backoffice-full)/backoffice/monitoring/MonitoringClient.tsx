'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  getMonitoringStatus,
  getServerResourceCurrent,
  getSystemMetrics,
  type MetricTimeSeries,
  type MonitoringStatus,
  type ServerResourceCurrent,
  type ServiceStatus,
  type SystemMetrics,
} from '@/actions/backoffice/monitoring';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { type ApiErrorResponse, isAuthenticationError } from '@/types/errors';

interface MonitoringClientProps {
  initialData: MonitoringStatus | null;
  initialMetrics: SystemMetrics | null;
  initialResources: ServerResourceCurrent | null;
  fetchError?: string | null;
}

function HealthBadge({ health }: { health: 'up' | 'down' | 'unknown' }) {
  const styles = {
    up: 'badge-success',
    down: 'badge-error',
    unknown: 'badge-warning',
  };
  const labels = {
    up: 'UP',
    down: 'DOWN',
    unknown: '不明',
  };
  return <span className={`badge ${styles[health]}`}>{labels[health]}</span>;
}

function formatDuration(seconds: number): string {
  if (seconds < 0.001) {
    return `${(seconds * 1000000).toFixed(0)}µs`;
  }
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(1)}ms`;
  }
  return `${seconds.toFixed(2)}s`;
}

function formatLastScrape(isoString: string): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}秒前`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  return `${Math.floor(diffSec / 3600)}時間前`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getUsageColor(percent: number): string {
  if (percent >= 90) return 'text-error';
  if (percent >= 70) return 'text-warning';
  return 'text-success';
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return 'progress-error';
  if (percent >= 70) return 'progress-warning';
  return 'progress-success';
}

/**
 * サーバーリソースゲージ（CPU/メモリ/ディスク）
 */
function ResourceGauge({
  title,
  icon,
  percent,
  detail,
  subDetail,
}: {
  title: string;
  icon: string;
  percent: number;
  detail: string;
  subDetail?: string;
}) {
  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`${icon} size-5 text-base-content/70`} aria-hidden="true" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-3xl font-bold ${getUsageColor(percent)}`}>{percent.toFixed(1)}%</span>
        </div>
        <progress className={`progress ${getProgressColor(percent)} w-full h-3`} value={percent} max={100} />
        <p className="text-xs text-base-content/60 mt-1">{detail}</p>
        {subDetail && <p className="text-xs text-base-content/40">{subDetail}</p>}
      </div>
    </div>
  );
}

/**
 * コンパクトなサービス状況表示
 */
function CompactServiceStatus({ services }: { services: ServiceStatus[] }) {
  const healthy = services.filter((s) => s.health === 'up');
  const unhealthy = services.filter((s) => s.health !== 'up');

  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="icon-[mdi--server-network] size-5 text-base-content/70" aria-hidden="true" />
            サービス稼働状況
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success">{healthy.length} UP</span>
            {unhealthy.length > 0 && <span className="text-error">{unhealthy.length} DOWN</span>}
          </div>
        </div>

        {/* 異常があれば目立たせる */}
        {unhealthy.length > 0 && (
          <div className="mb-3 p-2 bg-error/10 rounded-lg">
            {unhealthy.map((s) => (
              <div key={`${s.job}-${s.instance}`} className="flex items-center gap-2 text-error text-sm">
                <span className="icon-[mdi--alert-circle] size-4" aria-hidden="true" />
                <span className="font-medium">{s.name}</span>
                {s.lastError && <span className="text-xs opacity-70 truncate">- {s.lastError}</span>}
              </div>
            ))}
          </div>
        )}

        {/* 正常サービス一覧（コンパクト） */}
        <div className="flex flex-wrap gap-2">
          {healthy.map((s) => (
            <div
              key={`${s.job}-${s.instance}`}
              className="flex items-center gap-1.5 px-2 py-1 bg-base-300 rounded text-xs"
              title={`${s.instance} - 応答時間: ${formatDuration(s.lastScrapeDuration)}`}
            >
              <span className="icon-[mdi--check-circle] size-3.5 text-success" aria-hidden="true" />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const isHealthy = service.health === 'up';

  return (
    <div className={`card bg-base-200 border-l-4 ${isHealthy ? 'border-l-success' : 'border-l-error'}`}>
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`icon-[mdi--server] size-8 ${isHealthy ? 'text-success' : 'text-error'}`}
              aria-hidden="true"
            />
            <div>
              <h3 className="font-bold text-base">{service.name}</h3>
              <p className="text-xs text-base-content/60 font-mono">{service.instance}</p>
            </div>
          </div>
          <HealthBadge health={service.health} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-base-content/60">最終スクレイプ:</span>
            <span className="ml-2">{formatLastScrape(service.lastScrape)}</span>
          </div>
          <div>
            <span className="text-base-content/60">応答時間:</span>
            <span className="ml-2">{formatDuration(service.lastScrapeDuration)}</span>
          </div>
        </div>

        {service.lastError && (
          <div className="mt-2 p-2 bg-error/10 rounded text-error text-xs font-mono break-all">{service.lastError}</div>
        )}
      </div>
    </div>
  );
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  prometheus: 'Prometheus',
  backend: 'Backend',
  frontend: 'Frontend',
  lexicalconverter: 'LexicalConverter',
};

function formatChartTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

interface MetricsChartProps {
  title: string;
  series: MetricTimeSeries[];
  unit: string;
  yAxisDomain?: [number | 'auto', number | 'auto'];
}

function MetricsChart({ title, series, unit, yAxisDomain = ['auto', 'auto'] }: MetricsChartProps) {
  if (series.length === 0) {
    return (
      <div className="card bg-base-200">
        <div className="card-body p-4">
          <h3 className="card-title text-base">{title}</h3>
          <div className="h-48 flex items-center justify-center text-base-content/50">
            <span>データがありません</span>
          </div>
        </div>
      </div>
    );
  }

  const allTimestamps = new Set<number>();
  for (const s of series) {
    for (const d of s.data) {
      allTimestamps.add(d.timestamp);
    }
  }
  const timestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  const chartData = timestamps.map((ts) => {
    const point: Record<string, number> = { timestamp: ts };
    for (const s of series) {
      const key = SERVICE_DISPLAY_NAMES[s.job] || s.job;
      const dataPoint = s.data.find((d) => d.timestamp === ts);
      point[key] = dataPoint?.value ?? 0;
    }
    return point;
  });

  const seriesKeys = Array.from(new Set(series.map((s) => SERVICE_DISPLAY_NAMES[s.job] || s.job)));

  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        <h3 className="card-title text-base">{title}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatChartTime}
                stroke="currentColor"
                opacity={0.5}
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="currentColor"
                opacity={0.5}
                fontSize={12}
                domain={yAxisDomain}
                tickFormatter={(v) => `${v.toFixed(1)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-base-200)',
                  border: '1px solid var(--color-base-300)',
                  borderRadius: '0.5rem',
                }}
                labelFormatter={(ts) => new Date(ts as number).toLocaleString('ja-JP')}
                formatter={(value) => [`${Number(value).toFixed(2)} ${unit}`, '']}
              />
              <Legend />
              {seriesKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

type TimeRange = '1h' | '6h' | '24h';
type MetricsTab = 'server' | 'process' | 'http';

export default function MonitoringClient({
  initialData,
  initialMetrics,
  initialResources,
  fetchError,
}: MonitoringClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [clientError, _setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);
  const [data, setData] = useState<MonitoringStatus | null>(initialData);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(initialMetrics);
  const [resources, setResources] = useState<ServerResourceCurrent | null>(initialResources);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsTab, setMetricsTab] = useState<MetricsTab>('server');

  const { showLoading } = useDelayedLoading();

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  // サービス状況とリソース現在値の自動更新（30秒）
  useEffect(() => {
    const interval = setInterval(async () => {
      const [statusResult, resourceResult] = await Promise.all([getMonitoringStatus(), getServerResourceCurrent()]);
      if (statusResult.success) {
        setData(statusResult.data);
      }
      if (resourceResult.success) {
        setResources(resourceResult.data);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [statusResult, metricsResult, resourceResult] = await Promise.all([
        getMonitoringStatus(),
        getSystemMetrics(timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24),
        getServerResourceCurrent(),
      ]);
      if (statusResult.success) {
        setData(statusResult.data);
      }
      if (metricsResult.success) {
        setMetrics(metricsResult.data);
      }
      if (resourceResult.success) {
        setResources(resourceResult.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTimeRangeChange = async (range: TimeRange) => {
    setTimeRange(range);
    setIsLoadingMetrics(true);
    try {
      const hours = range === '1h' ? 1 : range === '6h' ? 6 : 24;
      const result = await getSystemMetrics(hours);
      if (result.success) {
        setMetrics(result.data);
      }
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay isLoading={showLoading} message="読み込み中..." />

      <BackOfficeHeader
        userInfo={currentUser}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        loading={showLoading}
      />

      <div className="flex flex-1 overflow-hidden">
        <BackOfficeSidebar sidebarOpen={sidebarOpen} />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-6 bg-base-100 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">システム状況</h1>
              <div className="flex items-center gap-4">
                {resources?.timestamp && (
                  <span className="text-xs text-base-content/60">
                    最終更新: {new Date(resources.timestamp).toLocaleTimeString('ja-JP')}
                  </span>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <span
                    className={`icon-[mdi--refresh] size-5 ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  更新
                </button>
              </div>
            </div>

            {clientError ? (
              <div className="alert alert-soft alert-error mb-4">
                <div>
                  <span>モニタリング情報の取得に失敗しました: </span>
                  <span className="font-mono">{clientError.message || `エラーコード: ${clientError.code}`}</span>
                </div>
              </div>
            ) : !data?.prometheusAvailable ? (
              <div className="alert alert-soft alert-warning mb-4">
                <span className="icon-[mdi--alert-outline] size-6" aria-hidden="true" />
                <div>
                  <p className="font-bold">Prometheus に接続できません</p>
                  <p className="text-sm">モニタリングサーバーが起動していない可能性があります。</p>
                </div>
              </div>
            ) : (
              <>
                {/* サーバーリソース（最重要） */}
                <section className="mb-6">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="icon-[mdi--server] size-5" aria-hidden="true" />
                    サーバーリソース
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ResourceGauge
                      title="CPU 使用率"
                      icon="icon-[mdi--chip]"
                      percent={resources?.cpu.usagePercent ?? 0}
                      detail={`${resources?.cpu.cores ?? 0} コア`}
                    />
                    <ResourceGauge
                      title="メモリ使用率"
                      icon="icon-[mdi--memory]"
                      percent={resources?.memory.usagePercent ?? 0}
                      detail={`${formatBytes(resources?.memory.usedBytes ?? 0)} / ${formatBytes(resources?.memory.totalBytes ?? 0)}`}
                    />
                    {(resources?.disk ?? []).map((d) => (
                      <ResourceGauge
                        key={d.mountpoint}
                        title={`ディスク ${d.mountpoint}`}
                        icon="icon-[mdi--harddisk]"
                        percent={d.usagePercent}
                        detail={`${formatBytes(d.usedBytes)} / ${formatBytes(d.totalBytes)}`}
                      />
                    ))}
                    {(!resources?.disk || resources.disk.length === 0) && (
                      <ResourceGauge title="ディスク /" icon="icon-[mdi--harddisk]" percent={0} detail="データなし" />
                    )}
                  </div>
                </section>

                {/* サービス稼働状況（コンパクト） */}
                <section className="mb-6">
                  <CompactServiceStatus services={data.services} />
                </section>

                {/* メトリクス推移グラフ */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="icon-[mdi--chart-line] size-5" aria-hidden="true" />
                      リソース推移
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="join">
                        <button
                          type="button"
                          className={`join-item btn btn-sm ${timeRange === '1h' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleTimeRangeChange('1h')}
                          disabled={isLoadingMetrics}
                        >
                          1時間
                        </button>
                        <button
                          type="button"
                          className={`join-item btn btn-sm ${timeRange === '6h' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleTimeRangeChange('6h')}
                          disabled={isLoadingMetrics}
                        >
                          6時間
                        </button>
                        <button
                          type="button"
                          className={`join-item btn btn-sm ${timeRange === '24h' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleTimeRangeChange('24h')}
                          disabled={isLoadingMetrics}
                        >
                          24時間
                        </button>
                      </div>
                      {isLoadingMetrics && <span className="loading loading-spinner loading-sm" />}
                    </div>
                  </div>

                  {/* タブ切り替え */}
                  <div role="tablist" className="tabs tabs-border mb-4">
                    <button
                      type="button"
                      role="tab"
                      className={`tab ${metricsTab === 'server' ? 'tab-active' : ''}`}
                      onClick={() => setMetricsTab('server')}
                    >
                      サーバー
                    </button>
                    <button
                      type="button"
                      role="tab"
                      className={`tab ${metricsTab === 'process' ? 'tab-active' : ''}`}
                      onClick={() => setMetricsTab('process')}
                    >
                      プロセス別
                    </button>
                    <button
                      type="button"
                      role="tab"
                      className={`tab ${metricsTab === 'http' ? 'tab-active' : ''}`}
                      onClick={() => setMetricsTab('http')}
                    >
                      HTTP
                    </button>
                  </div>

                  {metricsTab === 'server' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <MetricsChart
                        title="システムCPU使用率"
                        series={metrics?.systemCpuUsage ?? []}
                        unit="%"
                        yAxisDomain={[0, 100]}
                      />
                      <MetricsChart
                        title="システムメモリ使用率"
                        series={metrics?.memoryUsage ?? []}
                        unit="%"
                        yAxisDomain={[0, 100]}
                      />
                      <MetricsChart
                        title="ディスク使用率"
                        series={metrics?.diskUsage ?? []}
                        unit="%"
                        yAxisDomain={[0, 100]}
                      />
                    </div>
                  )}

                  {metricsTab === 'process' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <MetricsChart
                        title="CPU使用率（プロセス）"
                        series={metrics?.cpuUsage ?? []}
                        unit="%"
                        yAxisDomain={[0, 'auto']}
                      />
                      <MetricsChart title="メモリ使用量（プロセス）" series={metrics?.processMemory ?? []} unit="MB" />
                    </div>
                  )}

                  {metricsTab === 'http' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <MetricsChart title="HTTPリクエストレート" series={metrics?.httpRequestRate ?? []} unit="req/s" />
                    </div>
                  )}

                  {!metrics && (
                    <div className="text-center py-12 text-base-content/60">
                      <span className="icon-[mdi--chart-line-variant] size-16 opacity-50" aria-hidden="true" />
                      <p className="mt-4">メトリクスデータを取得できませんでした</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
