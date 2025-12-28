import { notFound } from 'next/navigation';
import { HelpContent } from '@/components/help/HelpContent';
import { getAllHelpArticles, getHelpArticle } from '@/libs/help/getHelpContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllHelpArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getHelpArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="p-6">
      <HelpContent markdown={article.markdown} />
    </article>
  );
}
