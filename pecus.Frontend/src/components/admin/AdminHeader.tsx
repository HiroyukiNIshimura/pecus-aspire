'use client';

import AppHeader from '@/components/common/AppHeader';
import type { UserInfo } from '@/types/userInfo';

interface AdminHeaderProps {
  userInfo: UserInfo | null;
  onToggleSidebar?: () => void;
  loading?: boolean;
}

export default function AdminHeader({ userInfo, onToggleSidebar, loading = false }: AdminHeaderProps) {
  return <AppHeader userInfo={userInfo} onToggleSidebar={onToggleSidebar} loading={loading} showAdminLink={true} />;
}
