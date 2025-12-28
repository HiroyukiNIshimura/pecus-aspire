import fs from 'node:fs/promises';
import path from 'node:path';
import { HelpSearch } from '@/components/help/HelpSearch';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { getAllHelpArticles } from '@/libs/help/getHelpContent';
import type { HelpIndexEntry } from '@/libs/help/types';

async function getSearchIndex(): Promise<HelpIndexEntry[]> {
  const indexPath = path.join(process.cwd(), 'src/content/help/search-index.json');
  try {
    const data = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export default async function HelpLayout({ children }: { children: React.ReactNode }) {
  const [articles, searchIndex] = await Promise.all([getAllHelpArticles(), getSearchIndex()]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <HelpSidebar articles={articles} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-base-content/10 px-6 py-3">
          <h1 className="text-lg font-semibold">Coatiのヒント</h1>
          <HelpSearch searchIndex={searchIndex} />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
