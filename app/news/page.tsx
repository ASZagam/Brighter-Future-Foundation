'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Post {
  id: number;
  title: string;
  category_name: string;
  author_name: string;
  body: string;
  published: boolean;
  published_at: string;
  created_at: string;
}

export default function NewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadNews() {
      try {
        const response = await fetch('/api/news');
        if (!response.ok) {
          setError('Please sign in to view news.');
          return;
        }
        const data = await response.json();
        setPosts(data.results || []);
      } catch (err) {
        setError('Failed to load news.');
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  return (
    <div className='page-shell'>
      <section style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div>
            <h1>News</h1>
            <p style={{ color: '#475569' }}>Latest news and updates.</p>
          </div>
          <Link href='/dashboard' style={{ color: '#2563eb' }}>Back to dashboard</Link>
        </div>

        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}

        {loading ? (
          <p>Loading news...</p>
        ) : posts.length === 0 ? (
          <p style={{ color: '#64748b', marginTop: 16 }}>No news found.</p>
        ) : (
          <div style={{ marginTop: 24, display: 'grid', gap: 24 }}>
            {posts.map((post) => (
              <article key={post.id} style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{post.title}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                      By {post.author_name} • {new Date(post.published_at || post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {post.category_name && (
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: '#eff6ff',
                      color: '#0c4a6e',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {post.category_name}
                    </span>
                  )}
                </div>
                <p style={{ margin: '12px 0 0 0', color: '#475569', lineHeight: 1.6 }}>
                  {post.body.substring(0, 200)}...
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
