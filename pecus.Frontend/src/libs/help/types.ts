/**
 * ヘルプ記事の型定義
 */
export interface HelpArticle {
  slug: string;
  title: string;
  markdown: string;
  order: number;
}

/**
 * 検索インデックスエントリの型定義
 */
export interface HelpIndexEntry {
  slug: string;
  title: string;
  description: string;
  content: string;
  headings: string[];
  order: number;
}

/**
 * 検索結果アイテムの型定義
 */
export interface HelpSearchResult {
  slug: string;
  title: string;
  description: string;
}
