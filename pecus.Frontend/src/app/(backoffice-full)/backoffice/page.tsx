import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import BackOfficeDashboardClient from './BackOfficeDashboardClient';

export const dynamic = 'force-dynamic';

export default async function BackOfficePage() {
  const api = createPecusApiClients();

  // BackOffice権限チェックを兼ねてHangfire統計を取得
  const result = await handleServerFetch(() => api.monitoring.getApiBackendMonitoringHangfireStats());

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
  }

  return <BackOfficeDashboardClient fetchError={null} hangfireStats={result.success ? result.data : null} />;
}
