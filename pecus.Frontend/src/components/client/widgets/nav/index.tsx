"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopNavbar() {
    const router = useRouter();
    const handleLogout = async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
        });
        router.push('/signin');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    return (
        <nav className="navbar bg-base-100 md:h-15 absolute start-0 top-0 z-1 shadow-base-300/20 shadow-sm">
            <div className="w-full md:flex md:items-center md:gap-2">
              <div className="flex items-center justify-between max-md:w-full">
                <div className="navbar-start items-center justify-between max-md:w-full">
                  <a className="link text-base-content link-neutral text-xl font-bold no-underline" href="#">Pecus</a>
                </div>
                <div className="md:hidden">
                  <button type="button" className="collapse-toggle btn btn-outline btn-secondary btn-sm btn-square" data-collapse="#sticky-navbar-collapse" aria-controls="sticky-navbar-collapse" aria-label="Toggle navigation" >
                    <span className="icon-[tabler--menu-2] collapse-open:hidden size-4"></span>
                    <span className="icon-[tabler--x] collapse-open:block hidden size-4"></span>
                  </button>
                </div>
              </div>
              <div id="sticky-navbar-collapse" className="md:navbar-end collapse hidden grow basis-full overflow-hidden transition-[height] duration-300 max-md:w-full" >
                <ul className="menu md:menu-horizontal gap-2 p-0 text-base max-md:mt-2">
                  <li><Link href="/">ダッシュボード</Link></li>
                  <li><Link href="/">ワークスペース</Link></li>
                  <li className="dropdown relative inline-flex [--auto-close:inside] [--offset:10] [--placement:bottom-end]">
                    <button id="dropdown-sticky" type="button" className="dropdown-toggle dropdown-open:bg-base-content/10 dropdown-open:text-base-content" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown" >
                      アカウント
                      <span className="icon-[tabler--chevron-down] dropdown-open:rotate-180 size-4"></span>
                    </button>
                    <ul className="dropdown-menu dropdown-open:opacity-100 hidden" role="menu" aria-orientation="vertical" aria-labelledby="dropdown-sticky" >
                      <li><Link className="dropdown-item" href="/profile">プロフィール</Link></li>
                      <li><Link className="dropdown-item" href="/settings">設定</Link></li>
                      <li><hr className="border-base-content/25 -mx-2" /></li>
                      <li><button type="button" className="dropdown-item w-full text-left" onClick={handleLogout}>ログアウト</button></li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
        </nav>
    )
};