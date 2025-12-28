import FlexSearch from 'flexsearch';
import type { HelpIndexEntry, HelpSearchResult } from './types';

// FlexSearch v0.8 ではドキュメント検索用の型が厳密
// biome-ignore lint/suspicious/noExplicitAny: FlexSearch.Document型が複雑なため
let searchIndex: any = null;

export function initHelpSearch(docs: HelpIndexEntry[]) {
  searchIndex = new FlexSearch.Document({
    document: {
      id: 'slug',
      index: ['title', 'content', 'headings'],
      store: ['slug', 'title', 'description'],
    },
    tokenize: 'forward',
    context: true,
  });

  for (const doc of docs) {
    searchIndex.add({
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      content: doc.content,
      headings: doc.headings.join(' '),
    });
  }
}

export function searchHelp(query: string, limit = 10): HelpSearchResult[] {
  if (!searchIndex || query.length < 2) return [];

  const results = searchIndex.search(query, { limit, enrich: true });

  const slugSet = new Set<string>();
  const items: HelpSearchResult[] = [];

  for (const field of results) {
    for (const result of field.result) {
      const doc = result.doc as HelpSearchResult;
      if (!slugSet.has(doc.slug)) {
        slugSet.add(doc.slug);
        items.push(doc);
      }
    }
  }

  return items;
}
