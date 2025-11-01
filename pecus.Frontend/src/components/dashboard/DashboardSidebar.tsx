"use client";

import { usePathname } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GridIcon from "@mui/icons-material/GridView";
import TaskIcon from "@mui/icons-material/Task";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAdmin: boolean;
}

const menuItems = [
  { href: "/dashboard", label: "概要", icon: DashboardIcon },
  { href: "/workspaces", label: "ワークスペース", icon: GridIcon },
  { href: "/my-items", label: "マイアイテム", icon: AssignmentIcon },
  { href: "/tasks", label: "タスク", icon: TaskIcon },
  { href: "/activity", label: "アクティビティ", icon: HistoryIcon },
];

const adminItem = { href: "/admin", label: "管理者", icon: AdminPanelSettingsIcon };

export default function DashboardSidebar({ sidebarOpen, setSidebarOpen, isAdmin }: DashboardSidebarProps) {
  const pathname = usePathname();
  const allMenuItems = isAdmin ? [...menuItems, adminItem] : menuItems;

  return (
    <aside className={`bg-base-200 min-h-full p-4 transition-all duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:block fixed md:relative z-20 lg:w-64 md:w-20 w-64`}>
      <h2 className="text-lg font-semibold mb-4 lg:block hidden whitespace-nowrap overflow-hidden text-ellipsis">機能メニュー</h2>
      <ul className="menu bg-base-100 rounded-box w-full">
        {allMenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li key={item.href} className="w-full">
              <a
                href={item.href}
                className={`${pathname === item.href ? "menu-active" : ""} lg:flex-row flex-col lg:!justify-start lg:!items-start !justify-center !items-center w-full`}
                title={item.label}
              >
                <IconComponent sx={{ fontSize: 20 }} />
                <span className="lg:inline hidden">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
