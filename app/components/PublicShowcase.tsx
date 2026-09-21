'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';

type ShowcaseNews = {
  id: string;
  title: string;
  body: string;
  category: string;
  cover_image: string | null;
  image_caption: string | null;
  published_at: string;
};

type ShowcasePhoto = {
  id: number;
  image: string | null;
  caption: string | null;
  program: string;
  program_title: string;
};

type ShowcaseData = {
  news: ShowcaseNews[];
  gallery: ShowcasePhoto[];
};

function excerpt(text: string, limit = 140): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit).trimEnd()}…` : clean;
}

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PublicShowcase() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    apiGet<ShowcaseData>('/core/public-showcase/')
      .then((result) => {
        if (!active) return;
        setData({ news: result.news || [], gallery: result.gallery || [] });
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const photos = (data?.gallery || []).filter((photo) => photo.image);
  const news = data?.news || [];

  if (status === 'loading') {
    return (
      <section className='showcase-section'>
        <p className='showcase-state'>Loading our latest stories and moments…</p>
      </section>
    );
  }

  if (status === 'error' || (!photos.length && !news.length)) {
    return null;
  }

  return (
    <>
      {photos.length > 0 && (
        <section className='showcase-section' id='gallery'>
          <div className='section-heading'>
            <div>
              <p className='eyebrow'>From the field</p>
              <h2>Moments from our programs.</h2>
            </div>
            <p className='section-copy'>A look at the work happening across our communities, captured on the ground.</p>
          </div>

          <div className='showcase-gallery'>
            {photos.map((photo) => (
              <figure key={photo.id} className='showcase-figure'>
                <img src={photo.image as string} alt={photo.caption || photo.program_title || 'Program photo'} loading='lazy' />
                <figcaption>
                  {photo.caption && <span className='showcase-caption'>{photo.caption}</span>}
                  {photo.program_title && <span className='showcase-credit'>{photo.program_title}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {news.length > 0 && (
        <section className='showcase-section' id='news'>
          <div className='section-heading'>
            <div>
              <p className='eyebrow'>Newsroom</p>
              <h2>Latest news and updates.</h2>
            </div>
            <p className='section-copy'>Announcements, reports, and stories from Brighter Future Foundation.</p>
          </div>

          <div className='showcase-news'>
            {news.map((post) => (
              <article key={post.id} className='showcase-news-card'>
                {post.cover_image && (
                  <figure className='showcase-figure showcase-figure-wide'>
                    <img src={post.cover_image} alt={post.image_caption || post.title} loading='lazy' />
                    {post.image_caption && <figcaption><span className='showcase-caption'>{post.image_caption}</span></figcaption>}
                  </figure>
                )}
                <div className='showcase-news-body'>
                  <span className='showcase-chip'>{post.category || 'General'}</span>
                  <h3>{post.title}</h3>
                  <p>{excerpt(post.body)}</p>
                  <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
