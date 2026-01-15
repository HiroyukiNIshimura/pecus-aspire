'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { HelpArticle } from '@/libs/help/types';

interface HelpSidebarProps {
  articles: Pick<HelpArticle, 'slug' | 'title'>[];
}

function SidebarContent({ articles, pathname }: { articles: HelpSidebarProps['articles']; pathname: string }) {
  return (
    <div className="drawer-body px-2 pt-4">
      <div className="mb-4 px-2">
        <Link href="/help" className="flex items-center gap-2 text-lg font-semibold text-base-content">
          <span className="icon-[tabler--help-circle] size-5" />
          Coatiのヒント
        </Link>
      </div>

      <ul className="menu menu-sm gap-1 p-0">
        {articles.map((article) => {
          const isActive = pathname === `/help/${article.slug}`;
          return (
            <li key={article.slug}>
              <Link href={`/help/${article.slug}`} className={isActive ? 'active font-medium' : ''}>
                {article.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HelpSidebar({ articles }: HelpSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* デスクトップ用サイドバー（md以上で常時表示） */}
      <nav className="hidden w-64 shrink-0 border-r border-base-content/10 bg-base-200/50 md:block">
        <div className="sticky top-0 flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-4">
            <Link href="/help" className="flex items-center gap-2 text-lg font-semibold text-base-content">
              <span className="icon-[tabler--help-circle] size-5" />
              Coatiのヒント
            </Link>
          </div>

          <ul className="menu menu-sm gap-1 p-0">
            {articles.map((article) => {
              const isActive = pathname === `/help/${article.slug}`;
              return (
                <li key={article.slug}>
                  <Link href={`/help/${article.slug}`} className={isActive ? 'active font-medium' : ''}>
                    {article.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* モバイル用ドロワー（FlyonUI overlay） */}
      <aside
        id="help-sidebar"
        className="overlay overlay-open:translate-x-0 drawer drawer-start hidden max-w-64 md:hidden"
        role="dialog"
        tabIndex={-1}
      >
        <SidebarContent articles={articles} pathname={pathname} />
      </aside>
    </>
  );
}

export function HelpSidebarToggle() {
  return (
    <button
      type="button"
      className="btn btn-text btn-square md:hidden"
      aria-haspopup="dialog"
      aria-expanded="false"
      aria-controls="help-sidebar"
      data-overlay="#help-sidebar"
      aria-label="メニューを開く"
    >
      <span className="icon-[tabler--menu-2] size-5" />
    </button>
  );
}
