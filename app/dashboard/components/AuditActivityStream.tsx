'use client';

import type { ActivityLog } from '../hooks/useDashboard';

const categoryColors: Record<string, string> = {
  auth: '#087F5B',
  program: '#2563EB',
  volunteer: '#E8590C',
  donation: '#087F5B',
  member: '#7C3AED',
  system: '#6B7280',
  default: '#087F5B',
};

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getCategoryIcon(category: string): JSX.Element {
  const s = { width: 12, height: 12 } as const;
  switch (category) {
    case 'auth':
      return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;
    case 'program':
      return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/></svg>;
    case 'volunteer':
      return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
    case 'donation':
      return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    default:
      return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>;
  }
}

export default function AuditActivityStream({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="db-audit-card">
      <div className="db-audit-header">
        <div className="db-audit-title">
          <span className="db-audit-dot" />
          <h2>Audit Activity Stream</h2>
        </div>
        <p className="db-audit-subtitle">Immutable event ledger from /api/core/activity-logs/</p>
      </div>
      <div className="db-audit-timeline">
        {logs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '11px' }}>
            No activity logs recorded yet.
          </div>
        ) : (
          logs.slice(0, 6).map((log) => {
            const color = categoryColors[log.category] || categoryColors.default;
            return (
              <div key={log.id} className="db-audit-item">
                <div className="db-audit-item-icon" style={{ background: color + '14', color }}>
                  {getCategoryIcon(log.category)}
                </div>
                <div className="db-audit-item-content">
                  <span className="db-audit-item-title">{log.action}</span>
                  <span className="db-audit-item-detail">
                    {log.category && <>{log.category} &bull; </>}
                    {log.user_name || 'System'}
                  </span>
                  <span className="db-audit-item-meta">
                    {getTimeAgo(log.created_at)}
                    {log.user_name && <> &bull; {log.user_name}</>}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <a href="/admin" className="db-audit-footer-link">View Full Activity Audit Log &#8599;</a>
    </div>
  );
}
