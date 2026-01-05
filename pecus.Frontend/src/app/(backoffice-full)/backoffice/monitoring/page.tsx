import { redirect } from 'next/navigation';
import type { MonitoringStatus, ServerResourceCurrent, SystemMetrics } from '@/actions/backoffice/monitoring';
import { getMonitoringStatus, getServerResourceCurrent, getSystemMetrics } from '@/actions/backoffice/monitoring';
import MonitoringClient from './MonitoringClient';

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  let data: MonitoringStatus | null = null;
  let metricsData: SystemMetrics | null = null;
  let resourcesData: ServerResourceCurrent | null = null;
  let fetchError: string | null = null;

  const [statusResult, metricsResult, resourcesResult] = await Promise.all([
    getMonitoringStatus(),
    getSystemMetrics(24),
    getServerResourceCurrent(),
  ]);

  if (statusResult.success) {
    data = statusResult.data;
  } else {
    if (statusResult.error === 'forbidden') {
      redirect('/');
    }
    fetchError = JSON.stringify({ message: statusResult.message, code: statusResult.error });
  }

  if (metricsResult.success) {
    metricsData = metricsResult.data;
  }

  if (resourcesResult.success) {
    resourcesData = resourcesResult.data;
  }

  return (
    <MonitoringClient
      initialData={data}
      initialMetrics={metricsData}
      initialResources={resourcesData}
      fetchError={fetchError}
    />
  );
}
