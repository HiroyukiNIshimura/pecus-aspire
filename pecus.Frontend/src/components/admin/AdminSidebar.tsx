"use client";

import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const menuItems = [
  { href: "/admin", label: "組織" },
  { href: "/admin/workspaces", label: "ワークスペース" },
  { href: "/admin/users", label: "ユーザー" },
  { href: "/admin/skills", label: "スキル" },
  { href: "/admin/tags", label: "タグ" },
];

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`bg-base-200 w-64 min-h-full p-4 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:block fixed md:relative z-20`}>
      <div className="md:hidden flex justify-end mb-4">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="icon-[tabler--x] size-5"></span>
        </button>
      </div>
      <h2 className="text-lg font-semibold mb-4">管理者メニュー</h2>
      <ul className="menu bg-base-100 rounded-box w-full">
        {menuItems.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className={pathname === item.href ? "menu-active" : ""}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}