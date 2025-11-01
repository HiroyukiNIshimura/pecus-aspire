"use client";

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

interface AppHeaderProps {
  userInfo: UserInfo | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  loading?: boolean;
  showAdminLink?: boolean;
  onLogout?: () => void;
}

export default function AppHeader({
  userInfo,
  sidebarOpen,
  setSidebarOpen,
  loading = false,
  showAdminLink = true,
  onLogout,
}: AppHeaderProps) {
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/signin";
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-base-100 shadow-sm border-b border-base-300">
      <nav className="navbar">
        <div className="navbar-start flex flex-col">
          <a href="/" className="text-3xl font-bold">
            Pecus
          </a>
          <div className="md:hidden mt-2">
            <button
              type="button"
              className="p-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="icon-[tabler--menu-2] size-5"></span>
            </button>
          </div>
        </div>

        <div className="navbar-center hidden md:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <a href="/">ダッシュボード</a>
            </li>
            <li>
              <a href="/workspaces">ワークスペース</a>
            </li>
            <li className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-start]">
              <button type="button" className="dropdown-toggle">
                機能
                <span className="icon-[tabler--chevron-down] dropdown-open:rotate-180 size-4"></span>
              </button>
              <ul className="dropdown-menu dropdown-open:opacity-100 hidden">
                <li>
                  <a className="dropdown-item" href="/tasks">
                    タスク管理
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/calendar">
                    カレンダー
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/reports">
                    レポート
                  </a>
                </li>
              </ul>
            </li>
            {!loading && showAdminLink && userInfo?.isAdmin && (
              <li className="bg-primary text-primary-content">
                <a href="/admin">管理者</a>
              </li>
            )}
          </ul>
        </div>

        <div className="navbar-end">
          <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end]">
            <button
              type="button"
              className="dropdown-toggle btn btn-ghost btn-circle avatar"
            >
              <div className="w-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                U
              </div>
            </button>
            <ul className="dropdown-menu dropdown-open:opacity-100 hidden">
              <li>
                <a className="dropdown-item" href="/profile">
                  プロフィール
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="/settings">
                  設定
                </a>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item w-full text-left"
                  onClick={handleLogout}
                >
                  ログアウト
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
