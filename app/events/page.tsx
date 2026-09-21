'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import OpsShell from '../components/OpsShell';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number | null;
  is_public: boolean;
  created_at: string;
}

interface EventStats {
  kpis: { total_events: number; upcoming: number; past: number; public: number; total_capacity: number };
}

const PAGE_SIZE = 20;

function fmtDateTime(value: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function dayParts(value: string): { day: string; month: string } {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString('en-GB', { day: '2-digit' }),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
  };
}

function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

const emptyForm = { title: '', description: '', location: '', start: '', end: '', capacity: '', is_public: true };

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('');
  const [when, setWhen] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (visibility) params.set('is_public', visibility);
    params.set('ordering', 'start_date');
    params.set('page', String(page));
    return params.toString();
  }, [search, visibility, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, stat] = await Promise.all([
        apiGet<{ results: EventItem[]; count: number }>(`/core/events/?${query}`),
        apiGet<EventStats>('/core/events/stats/'),
      ]);
      setEvents(list.results ?? []);
      setCount(list.count ?? 0);
      setStats(stat);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, visibility]);

  const visible = useMemo(() => {
    if (!when) return events;
    const now = Date.now();
    return events.filter((event) => {
      const start = new Date(event.start_date).getTime();
      const end = new Date(event.end_date).getTime();
      return when === 'upcoming' ? start >= now : end < now;
    });
  }, [events, when]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const kpis = stats?.kpis;

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setError('');
    setNotice('');
  }

  function openEdit(event: EventItem) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start: toLocalInput(event.start_date),
      end: toLocalInput(event.end_date),
      capacity: event.capacity != null ? String(event.capacity) : '',
      is_public: event.is_public,
    });
    setShowForm(true);
    setError('');
    setNotice('');
  }

  async function submit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!form.title.trim()) {
      setError('Event title is required.');
      return;
    }
    if (!form.start) {
      setError('A start date & time is required.');
      return;
    }
    setBusy(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      start_date: new Date(form.start).toISOString(),
      end_date: new Date(form.end || form.start).toISOString(),
      capacity: form.capacity === '' ? null : Number(form.capacity),
      is_public: form.is_public,
    };
    try {
      if (editing) {
        await apiPatch(`/core/events/${editing.id}/`, payload);
        setNotice('Event updated.');
      } else {
        await apiPost('/core/events/', payload);
        setNotice('Event created.');
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to save event.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(event: EventItem) {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    setBusy(true);
    try {
      await apiDelete(`/core/events/${event.id}/`);
      setNotice('Event deleted.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to delete event.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OpsShell>
      <main className="ops-page">
        <div className="ops-kicker">
          <span>COMMUNITY ENGAGEMENT</span>
          <i>|</i>
          <span className="dim">Public events, field trips &amp; internal sessions</span>
        </div>

        <div className="ops-head">
          <div>
            <h1>Events &amp; Field Trips</h1>
            <p>Plan gatherings, track upcoming versus past activity and control what appears on the public calendar.</p>
          </div>
          <div className="ops-head-actions">
            <button type="button" onClick={load} disabled={loading || busy}>{loading ? 'Loading…' : '↻ Refresh'}</button>
            <button type="button" className="primary" onClick={openCreate}>+ New Event</button>
          </div>
        </div>

        {error ? <div className="ops-notice warn">API issue — {error}</div> : notice ? <div className="ops-notice">{notice}</div> : null}

        <div className="ops-kpis">
          <div className="ops-kpi accent">
            <span className="ops-kpi-label">Upcoming</span>
            <strong className="ops-kpi-value">{kpis?.upcoming ?? '…'}</strong>
            <span className="ops-kpi-foot">scheduled ahead</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Total events</span>
            <strong className="ops-kpi-value">{kpis?.total_events ?? '…'}</strong>
            <span className="ops-kpi-foot">{kpis?.past ?? 0} completed</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Public</span>
            <strong className="ops-kpi-value">{kpis?.public ?? '…'}</strong>
            <span className="ops-kpi-foot">visible on site</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Capacity</span>
            <strong className="ops-kpi-value">{(kpis?.total_capacity ?? 0).toLocaleString()}</strong>
            <span className="ops-kpi-foot">seats planned</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Past</span>
            <strong className="ops-kpi-value">{kpis?.past ?? '…'}</strong>
            <span className="ops-kpi-foot">delivered</span>
          </div>
        </div>

        <section className="ops-panel">
          <div className="ops-toolbar">
            <strong>Event calendar</strong>
            <div className="ops-toolbar-group">
              <input className="ops-input ops-search" placeholder="Search title, location…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="ops-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="">All visibility</option>
                <option value="true">Public</option>
                <option value="false">Internal</option>
              </select>
              <select className="ops-select" value={when} onChange={(e) => setWhen(e.target.value)}>
                <option value="">All dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="ops-state"><span className="dot" /> Loading events…</div>
          ) : visible.length === 0 ? (
            <div className="ops-state">No events match the current filters.</div>
          ) : (
            <div className="ops-card-grid">
              {visible.map((event) => {
                const stamp = dayParts(event.start_date);
                const isPast = new Date(event.end_date).getTime() < Date.now();
                return (
                  <article key={event.id} className="ops-card">
                    <div className="ops-card-head">
                      <div className="ops-date-badge"><strong>{stamp.day}</strong><span>{stamp.month}</span></div>
                      <span className={`ops-chip ${isPast ? 'grey' : event.is_public ? 'green' : 'blue'}`}>
                        {isPast ? 'past' : event.is_public ? 'public' : 'internal'}
                      </span>
                    </div>
                    <h3>{event.title}</h3>
                    {event.description ? <p>{event.description}</p> : null}
                    <div className="ops-card-meta">
                      <span>{event.location || 'Location TBA'}</span>
                      <span>{fmtDateTime(event.start_date)}</span>
                      {event.capacity != null ? <span>{event.capacity} seats</span> : null}
                    </div>
                    <div className="ops-card-foot">
                      <button type="button" className="ops-btn sm" onClick={() => openEdit(event)}>Edit</button>
                      <button type="button" className="ops-btn sm danger" disabled={busy} onClick={() => remove(event)}>Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="ops-pager">
            <span>{count} event{count === 1 ? '' : 's'} · page {page} of {totalPages}</span>
            <div className="ops-pager-controls">
              <button type="button" className="ops-btn sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <button type="button" className="ops-btn sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        </section>

        <div className="ops-status-strip">
          <span className="go">● Calendar live</span>
          <span>GET <b>/api/core/events/</b> · totals from <b>/events/stats/</b></span>
          <span className="nl">Live via REST</span>
        </div>
      </main>

      {showForm ? (
        <div className="ops-modal-backdrop" onClick={() => !busy && setShowForm(false)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ops-modal-head">
              <h2>{editing ? 'Edit Event' : 'New Event'}</h2>
              <button type="button" className="ops-modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submit}>
              <div className="ops-modal-body">
                <div className="ops-form-grid">
                  <label className="ops-field full">
                    <span>Title *</span>
                    <input className="ops-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event name" />
                  </label>
                  <label className="ops-field">
                    <span>Start *</span>
                    <input type="datetime-local" className="ops-input" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                  </label>
                  <label className="ops-field">
                    <span>End</span>
                    <input type="datetime-local" className="ops-input" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                  </label>
                  <label className="ops-field">
                    <span>Location</span>
                    <input className="ops-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Venue, city" />
                  </label>
                  <label className="ops-field">
                    <span>Capacity</span>
                    <input type="number" min="0" className="ops-input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Unlimited" />
                  </label>
                  <label className="ops-field full">
                    <span>Description</span>
                    <textarea className="ops-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happens at this event?" />
                  </label>
                  <label className="ops-field full ops-check">
                    <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
                    Publicly visible on the website calendar
                  </label>
                </div>
              </div>
              <div className="ops-modal-foot">
                <button type="button" className="ops-btn" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
                <button type="submit" className="ops-btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create event'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </OpsShell>
  );
}
