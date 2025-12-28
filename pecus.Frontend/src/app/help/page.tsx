import Link from 'next/link';
import { getAllHelpArticles } from '@/libs/help/getHelpContent';

export default async function HelpPage() {
  const articles = await getAllHelpArticles();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-base-content">Coatiのヒント</h2>
        <p className="mt-2 text-base-content/70">Coatiの使い方や機能について学びましょう。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/help/${article.slug}`}
            className="card bg-base-200 transition-shadow hover:shadow-md"
          >
            <div className="card-body">
              <h3 className="card-title text-base">{article.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
