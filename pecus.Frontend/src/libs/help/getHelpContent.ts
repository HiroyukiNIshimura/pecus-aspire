import fs from 'node:fs/promises';
import path from 'node:path';
import type { HelpArticle } from './types';

/**
 * 単一のヘルプ記事を取得する
 */
export async function getHelpArticle(slug: string, locale = 'ja'): Promise<HelpArticle | null> {
  const helpDir = path.join(process.cwd(), 'src/content/help', locale);

  try {
    const files = await fs.readdir(helpDir);
    const file = files.find((f) => f.endsWith('.md') && f.replace('.md', '') === slug);

    if (!file) return null;

    const filePath = path.join(helpDir, file);
    const markdown = await fs.readFile(filePath, 'utf-8');

    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    const orderMatch = file.match(/^(\d+)/);
    const order = orderMatch ? Number.parseInt(orderMatch[1], 10) : 999;

    return { slug, title, markdown, order };
  } catch {
    return null;
  }
}

/**
 * すべてのヘルプ記事を取得する
 */
export async function getAllHelpArticles(locale = 'ja'): Promise<HelpArticle[]> {
  const helpDir = path.join(process.cwd(), 'src/content/help', locale);

  try {
    const files = await fs.readdir(helpDir);
    const articles: HelpArticle[] = [];

    for (const file of files.filter((f) => f.endsWith('.md'))) {
      const slug = file.replace('.md', '');
      const article = await getHelpArticle(slug, locale);
      if (article) articles.push(article);
    }

    return articles.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}
