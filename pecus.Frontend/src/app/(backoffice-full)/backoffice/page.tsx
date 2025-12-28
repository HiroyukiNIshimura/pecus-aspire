import BackOfficeDashboardClient from './BackOfficeDashboardClient';

export const dynamic = 'force-dynamic';

export default async function BackOfficePage() {
  // 現時点ではダッシュボード用のデータ取得はなし
  // 将来的にシステム状況などを取得する場合はここで行う
  return <BackOfficeDashboardClient fetchError={null} />;
}
