'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import OpsShell from '../components/OpsShell';
import { apiCall, apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  category: string;
  cover_image: string | null;
  image_caption: string;
  published: boolean;
  published_at: string | null;
  author_name: string;
  created_at: string;
}

interface NewsStats {
  kpis: { total_posts: number; published: number; drafts: number; categories: number };
  options: { categories: string[] };
}

const PAGE_SIZE = 20;
const FALLBACK_CATEGORIES = ['Programs', 'Volunteers', 'Partnerships', 'Reports', 'Events', 'Announcements'];

function fmtDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function excerpt(body: string): string {
  if (!body) return 'No content yet.';
  return body.length > 180 ? `${body.slice(0, 180).trimEnd()}…` : body;
}

const emptyForm = { title: '', body: '', category: '', image_caption: '', published: false };

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (state) params.set('published', state);
    if (category) params.set('category', category);
    params.set('ordering', '-created_at');
    params.set('page', String(page));
    return params.toString();
  }, [search, state, category, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, stat] = await Promise.all([
        apiGet<{ results: NewsItem[]; count: number }>(`/core/news/?${query}`),
        apiGet<NewsStats>('/core/news/stats/'),
      ]);
      setPosts(list.results ?? []);
      setCount(list.count ?? 0);
      setStats(stat);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load news.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, state, category]);

  const categories = stats?.options.categories?.length ? stats.options.categories : FALLBACK_CATEGORIES;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const kpis = stats?.kpis;

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setCoverFile(null);
    setShowForm(true);
    setError('');
    setNotice('');
  }

  function openEdit(post: NewsItem) {
    setEditing(post);
    setForm({ title: post.title, body: post.body || '', category: post.category || '', image_caption: post.image_caption || '', published: post.published });
    setCoverFile(null);
    setShowForm(true);
    setError('');
    setNotice('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('A headline is required.');
      return;
    }
    setBusy(true);
    setError('');
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category.trim() || 'Announcements',
      image_caption: form.image_caption.trim(),
      published: form.published,
      published_at: form.published ? (editing?.published_at || new Date().toISOString()) : null,
    };
    try {
      let body: BodyInit;
      if (coverFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          formData.append(key, typeof value === 'boolean' ? String(value) : String(value));
        });
        formData.append('cover_image', coverFile);
        body = formData;
      } else {
        body = JSON.stringify(payload);
      }
      if (editing) {
        await apiCall(`/core/news/${editing.id}/`, { method: 'PATCH', body });
        setNotice('Story updated.');
      } else {
        await apiCall('/core/news/', { method: 'POST', body });
        setNotice('Story created.');
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to save story.');
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(post: NewsItem) {
    setBusy(true);
    try {
      await apiPatch(`/core/news/${post.id}/`, {
        published: !post.published,
        published_at: !post.published ? (post.published_at || new Date().toISOString()) : post.published_at,
      });
      setNotice(post.published ? 'Story unpublished.' : 'Story published.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to update story.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(post: NewsItem) {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    setBusy(true);
    try {
      await apiDelete(`/core/news/${post.id}/`);
      setNotice('Story deleted.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to delete story.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OpsShell>
      <main className="ops-page">
        <div className="ops-kicker">
          <span>COMMS &amp; MEDIA</span>
          <i>|</i>
          <span className="dim">Press releases, field stories &amp; announcements</span>
        </div>

        <div className="ops-head">
          <div>
            <h1>News &amp; Media</h1>
            <p>Draft, review and publish updates. Drafts stay internal until you push them live.</p>
          </div>
          <div className="ops-head-actions">
            <button type="button" onClick={load} disabled={loading || busy}>{loading ? 'Loading…' : '↻ Refresh'}</button>
            <button type="button" className="primary" onClick={openCreate}>+ New Story</button>
          </div>
        </div>

        {error ? <div className="ops-notice warn">API issue — {error}</div> : notice ? <div className="ops-notice">{notice}</div> : null}

        <div className="ops-kpis">
          <div className="ops-kpi accent">
            <span className="ops-kpi-label">Published</span>
            <strong className="ops-kpi-value">{kpis?.published ?? '…'}</strong>
            <span className="ops-kpi-foot">visible on site</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Total posts</span>
            <strong className="ops-kpi-value">{kpis?.total_posts ?? '…'}</strong>
            <span className="ops-kpi-foot">all stories</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Drafts</span>
            <strong className="ops-kpi-value">{kpis?.drafts ?? '…'}</strong>
            <span className="ops-kpi-foot">awaiting review</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Categories</span>
            <strong className="ops-kpi-value">{kpis?.categories ?? '…'}</strong>
            <span className="ops-kpi-foot">topics covered</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Coverage</span>
            <strong className="ops-kpi-value">
              {kpis && kpis.total_posts ? `${Math.round((kpis.published / kpis.total_posts) * 100)}%` : '…'}
            </strong>
            <span className="ops-kpi-foot">published ratio</span>
          </div>
        </div>

        <section className="ops-panel">
          <div className="ops-toolbar">
            <strong>Newsroom</strong>
            <div className="ops-toolbar-group">
              <input className="ops-input ops-search" placeholder="Search headlines, body…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="ops-select" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">All states</option>
                <option value="true">Published</option>
                <option value="false">Drafts</option>
              </select>
              <select className="ops-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="ops-state"><span className="dot" /> Loading newsroom…</div>
          ) : posts.length === 0 ? (
            <div className="ops-state">No stories match the current filters.</div>
          ) : (
            <div className="ops-card-grid">
              {posts.map((post) => (
                <article key={post.id} className="ops-card">
                  {post.cover_image ? <span className="ops-cover"><img src={post.cover_image} alt={post.image_caption || post.title} loading="lazy" /></span> : null}
                  {post.cover_image && post.image_caption ? <p className="ops-cover-caption">{post.image_caption}</p> : null}
                  <div className="ops-card-head">
                    <span className={`ops-chip ${post.published ? 'green' : 'amber'}`}>{post.published ? 'published' : 'draft'}</span>
                    <span className="ops-chip grey">{post.category || 'General'}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{excerpt(post.body)}</p>
                  <div className="ops-card-meta">
                    <span>{post.author_name || 'Staff'}</span>
                    <span>{fmtDate(post.published ? post.published_at : post.created_at)}</span>
                  </div>
                  <div className="ops-card-foot">
                    <button type="button" className="ops-btn sm" onClick={() => openEdit(post)}>Edit</button>
                    <button type="button" className="ops-btn sm ghost" disabled={busy} onClick={() => togglePublish(post)}>
                      {post.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" className="ops-btn sm danger" disabled={busy} onClick={() => remove(post)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="ops-pager">
            <span>{count} stor{count === 1 ? 'y' : 'ies'} · page {page} of {totalPages}</span>
            <div className="ops-pager-controls">
              <button type="button" className="ops-btn sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <button type="button" className="ops-btn sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        </section>

        <div className="ops-status-strip">
          <span className="go">● Newsroom live</span>
          <span>GET <b>/api/core/news/</b> · totals from <b>/news/stats/</b></span>
          <span className="nl">Live via REST</span>
        </div>
      </main>

      {showForm ? (
        <div className="ops-modal-backdrop" onClick={() => !busy && setShowForm(false)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ops-modal-head">
              <h2>{editing ? 'Edit Story' : 'New Story'}</h2>
              <button type="button" className="ops-modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submit}>
              <div className="ops-modal-body">
                <div className="ops-form-grid">
                  <label className="ops-field full">
                    <span>Headline *</span>
                    <input className="ops-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Story headline" />
                  </label>
                  <label className="ops-field">
                    <span>Category</span>
                    <input className="ops-input" list="news-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Announcements" />
                    <datalist id="news-categories">
                      {categories.map((item) => <option key={item} value={item} />)}
                    </datalist>
                  </label>
                  <label className="ops-field">
                    <span>Cover image</span>
                    <input type="file" accept="image/*" className="ops-input" onChange={(e) => setCoverFile(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  <label className="ops-field full">
                    <span>Image caption</span>
                    <input className="ops-input" value={form.image_caption} onChange={(e) => setForm({ ...form, image_caption: e.target.value })} placeholder="Caption shown under the image on the website" />
                  </label>
                  {editing?.cover_image ? (
                    <div className="ops-field full">
                      <span>Current image</span>
                      <span className="ops-cover-preview"><img src={editing.cover_image} alt={editing.image_caption || editing.title} /></span>
                    </div>
                  ) : null}
                  <label className="ops-field full ops-check">
                    <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                    Publish immediately
                  </label>
                  <label className="ops-field full">
                    <span>Body</span>
                    <textarea className="ops-textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the story…" />
                  </label>
                </div>
              </div>
              <div className="ops-modal-foot">
                <button type="button" className="ops-btn" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
                <button type="submit" className="ops-btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create story'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </OpsShell>
  );
}
