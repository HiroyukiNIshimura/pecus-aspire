'use client';

import AppHeader from '@/components/common/layout/AppHeader';
import type { CurrentUserInfo } from '@/connectors/api/pecus';

interface AdminHeaderProps {
  userInfo: CurrentUserInfo | null;
  onToggleSidebar?: () => void;
  loading?: boolean;
}

export default function AdminHeader({ userInfo, onToggleSidebar, loading = false }: AdminHeaderProps) {
  return <AppHeader userInfo={userInfo} onToggleSidebar={onToggleSidebar} loading={loading} showAdminLink={true} />;
}
