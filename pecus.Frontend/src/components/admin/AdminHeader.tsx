"use client";

import AppHeader from "@/components/common/AppHeader";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface AdminHeaderProps {
  userInfo: UserInfo | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  loading?: boolean;
}

export default function AdminHeader({
  userInfo,
  sidebarOpen,
  setSidebarOpen,
  loading = false,
}: AdminHeaderProps) {
  return (
    <AppHeader
      userInfo={userInfo}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      loading={loading}
      showAdminLink={true}
    />
  );
}