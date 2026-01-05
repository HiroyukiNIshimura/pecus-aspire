import { redirect } from 'next/navigation';
import type { MonitoringStatus, SystemMetrics } from '@/actions/backoffice/monitoring';
import { getMonitoringStatus, getSystemMetrics } from '@/actions/backoffice/monitoring';
import MonitoringClient from './MonitoringClient';

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  let data: MonitoringStatus | null = null;
  let metricsData: SystemMetrics | null = null;
  let fetchError: string | null = null;

  const [statusResult, metricsResult] = await Promise.all([getMonitoringStatus(), getSystemMetrics(24)]);

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

  return <MonitoringClient initialData={data} initialMetrics={metricsData} fetchError={fetchError} />;
}
