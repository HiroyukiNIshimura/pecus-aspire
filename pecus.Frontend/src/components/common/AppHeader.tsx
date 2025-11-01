"use client";

import { useTheme } from "@/hooks/useTheme";
import { usePathname } from "next/navigation";

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
  const { theme, changeTheme, mounted } = useTheme();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const handleThemeChange = (newTheme: "light" | "dark" | "auto") => {
    changeTheme(newTheme);
    // ドロップダウンを閉じる
    setTimeout(() => {
      const themeDropdown = document.querySelector(
        ".navbar-end > .dropdown:first-of-type"
      ) as HTMLElement;
      if (themeDropdown && (window as any).HSDropdown) {
        const { element } = (window as any).HSDropdown.getInstance(
          themeDropdown,
          true
        );
        if (element) {
          element.close();
        }
      }
    }, 0);
  };

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
            <li className={isActive("/") ? "bg-base-200" : ""}>
              <a href="/">ダッシュボード</a>
            </li>
            <li className={isActive("/workspaces") ? "bg-base-200" : ""}>
              <a href="/workspaces">ワークスペース</a>
            </li>
            {!loading && showAdminLink && userInfo?.isAdmin && (
              <li className={isActive("/admin") ? "bg-base-200" : ""}>
                <a href="/admin">管理者</a>
              </li>
            )}
          </ul>
        </div>

        <div className="navbar-end">
          {/* Theme Selector */}
          {mounted && (
            <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end] mr-2">
              <button
                type="button"
                className="dropdown-toggle bg-transparent hover:bg-transparent before:hidden p-2"
              >
                {theme === "light" && (
                  <span className="icon-[tabler--sun] size-5"></span>
                )}
                {theme === "dark" && (
                  <span className="icon-[tabler--moon] size-5"></span>
                )}
                {theme === "auto" && (
                  <span className="icon-[tabler--brightness-auto] size-5"></span>
                )}
              </button>
              <ul className="dropdown-menu dropdown-open:opacity-100 hidden min-w-32">
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === "light" ? "active" : ""}`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <span className="icon-[tabler--sun] size-4"></span>
                    ライト
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === "dark" ? "active" : ""}`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <span className="icon-[tabler--moon] size-4"></span>
                    ダーク
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`dropdown-item ${theme === "auto" ? "active" : ""}`}
                    onClick={() => handleThemeChange("auto")}
                  >
                    <span className="icon-[tabler--brightness-auto] size-4"></span>
                    自動
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* User Menu */}
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
