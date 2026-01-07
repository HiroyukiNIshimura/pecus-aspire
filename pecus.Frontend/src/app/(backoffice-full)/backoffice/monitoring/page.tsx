import type { ServerResourceCurrent, SystemMetrics } from '@/actions/backoffice/monitoring';
import { getMonitoringStatus, getServerResourceCurrent, getSystemMetrics } from '@/actions/backoffice/monitoring';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import MonitoringClient from './MonitoringClient';

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  const [statusResult, metricsResult, resourcesResult] = await Promise.all([
    getMonitoringStatus(),
    getSystemMetrics(24),
    getServerResourceCurrent(),
  ]);

  if (!statusResult.success) {
    if (statusResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/backoffice" backLabel="BackOfficeダッシュボードに戻る" />;
    }
    return (
      <FetchError message={statusResult.message} backUrl="/backoffice" backLabel="BackOfficeダッシュボードに戻る" />
    );
  }

  let metricsData: SystemMetrics | null = null;
  let resourcesData: ServerResourceCurrent | null = null;

  if (metricsResult.success) {
    metricsData = metricsResult.data;
  }

  if (resourcesResult.success) {
    resourcesData = resourcesResult.data;
  }

  return (
    <MonitoringClient
      initialData={statusResult.data}
      initialMetrics={metricsData}
      initialResources={resourcesData}
      fetchError={null}
    />
  );
}
