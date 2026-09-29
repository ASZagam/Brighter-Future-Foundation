/**
 * NewsArticle structured data for the homepage newsroom feed.
 *
 * Emitted as a single `@graph` with one top-level `@context`. The previous
 * inline version stripped `@context` from every entry (it was spread as
 * `'@context': undefined`, which JSON.stringify then dropped), so the block
 * described articles without ever declaring a context. Renders nothing at all
 * when there is no published news.
 */
export function NewsArticleJsonLd({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return null;

  const graph = items.map(({ '@context': _context, ...article }) => article);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': graph,
        }),
      }}
    />
  );
}
