'use client';

import AppHeader from '@/components/common/layout/AppHeader';
import type { CurrentUserInfo } from '@/connectors/api/pecus';

interface BackOfficeHeaderProps {
  userInfo: CurrentUserInfo | null;
  onToggleSidebar?: () => void;
  loading?: boolean;
}

export default function BackOfficeHeader({ userInfo, onToggleSidebar, loading = false }: BackOfficeHeaderProps) {
  return (
    <AppHeader
      userInfo={userInfo}
      onToggleSidebar={onToggleSidebar}
      loading={loading}
      showAdminLink={true}
      showBackOfficeLink={true}
      showChat={false}
    />
  );
}
