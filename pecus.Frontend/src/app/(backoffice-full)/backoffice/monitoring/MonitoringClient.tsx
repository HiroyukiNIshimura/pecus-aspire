'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  getMonitoringStatus,
  getSystemMetrics,
  type MetricTimeSeries,
  type MonitoringStatus,
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

export default function MonitoringClient({ initialData, initialMetrics, fetchError }: MonitoringClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [clientError, _setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);
  const [data, setData] = useState<MonitoringStatus | null>(initialData);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(initialMetrics);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'metrics'>('status');

  const { showLoading } = useDelayedLoading();

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getMonitoringStatus();
      if (result.success) {
        setData(result.data);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [statusResult, metricsResult] = await Promise.all([
        getMonitoringStatus(),
        getSystemMetrics(timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24),
      ]);
      if (statusResult.success) {
        setData(statusResult.data);
      }
      if (metricsResult.success) {
        setMetrics(metricsResult.data);
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

  const healthyCount = data?.services.filter((s) => s.health === 'up').length ?? 0;
  const unhealthyCount = data?.services.filter((s) => s.health !== 'up').length ?? 0;
  const totalCount = data?.services.length ?? 0;

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
                <div className="stats shadow mb-6 w-full">
                  <div className="stat">
                    <div className="stat-figure text-success">
                      <span className="icon-[mdi--check-circle] size-8" aria-hidden="true" />
                    </div>
                    <div className="stat-title">正常</div>
                    <div className="stat-value text-success">{healthyCount}</div>
                    <div className="stat-desc">サービス</div>
                  </div>

                  <div className="stat">
                    <div className="stat-figure text-error">
                      <span className="icon-[mdi--alert-circle] size-8" aria-hidden="true" />
                    </div>
                    <div className="stat-title">異常</div>
                    <div className="stat-value text-error">{unhealthyCount}</div>
                    <div className="stat-desc">サービス</div>
                  </div>

                  <div className="stat">
                    <div className="stat-figure text-base-content">
                      <span className="icon-[mdi--server-network] size-8" aria-hidden="true" />
                    </div>
                    <div className="stat-title">合計</div>
                    <div className="stat-value">{totalCount}</div>
                    <div className="stat-desc">監視対象</div>
                  </div>

                  <div className="stat">
                    <div className="stat-title">最終更新</div>
                    <div className="stat-value text-lg">
                      {data.timestamp ? new Date(data.timestamp).toLocaleTimeString('ja-JP') : '-'}
                    </div>
                    <div className="stat-desc">30秒ごとに自動更新</div>
                  </div>
                </div>

                <div role="tablist" className="tabs tabs-border mb-6">
                  <button
                    type="button"
                    role="tab"
                    className={`tab ${activeTab === 'status' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('status')}
                  >
                    <span className="icon-[mdi--server] size-4 mr-2" aria-hidden="true" />
                    サービス状況
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`tab ${activeTab === 'metrics' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                  >
                    <span className="icon-[mdi--chart-line] size-4 mr-2" aria-hidden="true" />
                    メトリクス推移
                  </button>
                </div>

                {activeTab === 'status' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.services.map((service) => (
                        <ServiceCard key={`${service.job}-${service.instance}`} service={service} />
                      ))}
                    </div>

                    {data.services.length === 0 && (
                      <div className="text-center py-12 text-base-content/60">
                        <span className="icon-[mdi--server-off] size-16 opacity-50" aria-hidden="true" />
                        <p className="mt-4">監視対象のサービスがありません</p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'metrics' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <MetricsChart
                        title="CPU使用率（プロセス）"
                        series={metrics?.cpuUsage ?? []}
                        unit="%"
                        yAxisDomain={[0, 'auto']}
                      />
                      <MetricsChart title="プロセスメモリ使用量" series={metrics?.processMemory ?? []} unit="MB" />
                      <MetricsChart title="HTTPリクエストレート" series={metrics?.httpRequestRate ?? []} unit="req/s" />
                      <MetricsChart
                        title="システムメモリ使用率"
                        series={metrics?.memoryUsage ?? []}
                        unit="%"
                        yAxisDomain={[0, 100]}
                      />
                    </div>

                    {!metrics && (
                      <div className="text-center py-12 text-base-content/60">
                        <span className="icon-[mdi--chart-line-variant] size-16 opacity-50" aria-hidden="true" />
                        <p className="mt-4">メトリクスデータを取得できませんでした</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
