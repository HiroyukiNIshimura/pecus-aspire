'use client';

import AppHeader from '@/components/common/layout/AppHeader';
import type { CurrentUserInfo } from '@/connectors/hey-api-axios/types.gen';

interface AdminHeaderProps {
  userInfo: CurrentUserInfo | null;
  onToggleSidebar?: () => void;
  loading?: boolean;
}

export default function AdminHeader({ userInfo, onToggleSidebar, loading = false }: AdminHeaderProps) {
  return (
    <AppHeader
      userInfo={userInfo}
      onToggleSidebar={onToggleSidebar}
      loading={loading}
      showAdminLink={true}
      showBackOfficeLink={userInfo?.isBackOffice ?? false}
      showChat={false}
    />
  );
}
