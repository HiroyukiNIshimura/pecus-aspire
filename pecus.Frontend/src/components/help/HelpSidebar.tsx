'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { HelpArticle } from '@/libs/help/types';

interface HelpSidebarProps {
  articles: Pick<HelpArticle, 'slug' | 'title'>[];
}

export function HelpSidebar({ articles }: HelpSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 border-r border-base-content/10 bg-base-200/50">
      <div className="sticky top-0 flex h-full flex-col overflow-y-auto p-4">
        <div className="mb-4">
          <Link href="/help" className="flex items-center gap-2 text-lg font-semibold text-base-content">
            <span className="icon-[tabler--help-circle] size-5" />
            Coatiのヒント
          </Link>
        </div>

        <ul className="menu menu-sm gap-1">
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
  );
}
