'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import '../dashboard/dashboard.css';
import './admin.css';
import Sidebar from '../dashboard/components/Sidebar';
import TopHeader from '../dashboard/components/TopHeader';
import { apiGet } from '../../lib/api';
import type { DashboardUser } from '../dashboard/hooks/useDashboard';

interface ActivityRecord {
  id: string;
  user_name: string;
  organization_name: string;
  action: string;
  category: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, unknown>;
  created_at: string;
}

function tagTone(category: string): string {
  switch (category) {
    case 'auth': return 'amber';
    case 'program': return 'blue';
    case 'volunteer': return 'green';
    case 'donation': return 'green';
    case 'member': return 'slate';
    case 'system': return 'slate';
    default: return 'slate';
  }
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDetails(details: Record<string, unknown> | undefined | null): string {
  if (!details) return '';
  const text = JSON.stringify(details);
  return text.length > 110 ? `${text.slice(0, 110)}…` : text;
}

export default function AdminAudit() {
  const [logs, setLogs] = useState<ActivityRecord[]>([]);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [logData, me] = await Promise.all([
        apiGet<{ results: ActivityRecord[]; count: number }>('/core/activity-logs/?ordering=-created_at'),
        fetch('/api/auth/me', { credentials: 'include' }).then((response) => (response.ok ? response.json() : null)),
      ]);
      setLogs(logData.results ?? []);
      setUser(me);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load the audit log.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const categories = useMemo(() => Array.from(new Set(logs.map((log) => log.category).filter(Boolean))).sort(), [logs]);
  const usernames = useMemo(() => Array.from(new Set(logs.map((log) => log.user_name).filter(Boolean))).sort(), [logs]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return logs
      .filter((log) => !categoryFilter || log.category === categoryFilter)
      .filter((log) => !userFilter || log.user_name === userFilter)
      .filter((log) => {
        if (!term) return true;
        return (
          log.action.toLowerCase().includes(term) ||
          log.category.toLowerCase().includes(term) ||
          (log.user_name || '').toLowerCase().includes(term) ||
          formatDetails(log.details).toLowerCase().includes(term)
        );
      });
  }, [logs, searchTerm, categoryFilter, userFilter]);

  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function exportLogs() {
    const header = ['Time', 'User', 'Organization', 'Category', 'Action', 'IP', 'Details'];
    const rows = filtered.map((log) => [formatTime(log.created_at), log.user_name || 'System', log.organization_name || '', log.category, log.action, log.ip_address || '', formatDetails(log.details)]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bff-audit-log.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const todayCount = logs.filter((log) => {
    const day = new Date(log.created_at).toDateString();
    return day === new Date().toDateString();
  }).length;

  return (
    <div className="db-shell">
      <Sidebar user={user} />
      <div className="db-main">
        <TopHeader notificationCount={3} />
        <main className="admin-content">
          <div className="admin-kicker" style={{ fontSize: 12 }}>
            <span>SYSTEM &amp; ADMIN</span>
            <i>|</i>
            <span style={{ color: '#6b7584', fontWeight: 600 }}>Immutable activity ledger from /api/core/activity-logs/</span>
          </div>

          <div className="admin-heading">
            <div>
              <h1>Audit Activity Log</h1>
              <p>Every mutation across the platform is recorded here — authentication, programs, volunteers, donations, and members.</p>
            </div>
            <div className="admin-heading-actions">
              <button type="button" onClick={() => { setRefreshing(true); loadData(true); }} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh'}</button>
              <button type="button" onClick={exportLogs}>Export CSV</button>
            </div>
          </div>

          {error ? <div className="admin-live-notice warn">Audit feed issue — {error}</div> : !error && !loading && logs.length === 0 ? (
            <div className="admin-live-notice">Audit feed is live · no activity recorded yet</div>
          ) : !loading ? (
            <div className="admin-live-notice">● {logs.length} events recorded · {todayCount} today · {new Set(logs.map((log) => log.user_name)).size} contributors</div>
          ) : null}

          <div className="admin-toolbar">
            <input aria-label="Search audit log" placeholder={`Search ${logs.length} events by action, category, user, or details…`} value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} />
            <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select aria-label="Filter by user" value={userFilter} onChange={(event) => { setUserFilter(event.target.value); setPage(1); }}>
              <option value="">All users</option>
              {usernames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div className="admin-table-wrap">
            {loading ? (
              <div className="admin-empty">Loading the audit log…</div>
            ) : visible.length === 0 ? (
              <div className="admin-empty">No activity matched your filters.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>WHEN</th>
                    <th>WHO</th>
                    <th>CATEGORY</th>
                    <th>ACTION</th>
                    <th>DETAILS</th>
                    <th>SOURCE IP</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((log) => (
                    <tr key={log.id}>
                      <td className="admin-row-time">{formatTime(log.created_at)}</td>
                      <td>
                        <div className="admin-cell-user">
                          <b>{log.user_name || 'System'}</b>
                          {log.organization_name && <span>{log.organization_name}</span>}
                        </div>
                      </td>
                      <td><span className={`admin-tag ${tagTone(log.category)}`}>{log.category || 'system'}</span></td>
                      <td className="admin-row-action">{log.action}</td>
                      <td title={log.details ? JSON.stringify(log.details) : ''}><span className="admin-details">{formatDetails(log.details)}</span></td>
                      <td className="admin-row-time">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && filtered.length > 0 ? (
              <div className="admin-pager">
                <span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries</span>
                <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
              </div>
            ) : null}
          </div>

          <div className="admin-status">
            <span className="go">● Audit feed live</span>
            <span>REST GET /api/core/activity-logs/?ordering=-created_at</span>
            <span>Django 5.2 · DRF 3.17 · PostgreSQL <b>bff_db</b></span>
          </div>
        </main>
      </div>
    </div>
  );
}