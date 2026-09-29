import Link from 'next/link';
import { absoluteMediaUrl, formatDate } from '@/lib/publicApi';
import { EmptyState, SectionHeading } from '../Primitives';
import type { PublicNews } from '@/lib/publicApi';

const EXCERPT_LENGTH = 220;

/** Published announcements and programme news. */
export function NewsroomSection({ posts }: { posts: PublicNews[] }) {
  return (
    <section className="pub-section pub-section-soft" aria-labelledby="news-heading">
      <SectionHeading
        id="news-heading"
        eyebrow="Newsroom"
        title="Latest updates"
        lede="Announcements and programme news published to the public feed."
      />

      {posts.length > 0 ? (
        <>
          <ul className="pub-news-grid">
            {posts.map((post) => {
              const cover = absoluteMediaUrl(post.cover_image);
              const excerpt =
                post.body.length > EXCERPT_LENGTH
                  ? `${post.body.slice(0, EXCERPT_LENGTH)}…`
                  : post.body;
              return (
                <li className="pub-news-card" key={post.id}>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="pub-news-img" />
                  ) : null}
                  <div className="pub-news-body">
                    <p className="pub-tag">{post.category || 'News'}</p>
                    <h3>{post.title}</h3>
                    <p>{excerpt}</p>
                    <p className="pub-news-date">{formatDate(post.published_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="pub-section-cta">
            <Link href="/news" className="pub-btn pub-btn-outline">
              All news
            </Link>
          </p>
        </>
      ) : (
        <EmptyState
          title="No published news yet"
          detail="Announcements appear here as soon as they are published."
          action={{ href: '/news', label: 'Newsroom' }}
        />
      )}
    </section>
  );
}
