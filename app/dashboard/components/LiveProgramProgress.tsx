'use client';

import type { Program } from '../hooks/useDashboard';

const statusMap: Record<string, { label: string; color: 'green' | 'amber' | 'blue' }> = {
  active: { label: 'ON TRACK', color: 'green' },
  completed: { label: 'COMPLETED', color: 'green' },
  planning: { label: 'IN PLANNING', color: 'blue' },
  draft: { label: 'DRAFT', color: 'blue' },
  high: { label: 'HIGH PRIORITY', color: 'amber' },
  critical: { label: 'CRITICAL', color: 'amber' },
};

const colorMap: Record<string, string> = {
  active: '#087F5B',
  completed: '#087F5B',
  planning: '#2563EB',
  draft: '#6B7280',
  high: '#E8590C',
  critical: '#DC2626',
};

function getBadgeColor(index: number): string {
  return ['#087F5B', '#E8590C', '#2563EB', '#7C3AED', '#D97706'][index % 5];
}

function getProgramBadge(prog: Program, index: number): string {
  const catName = prog.category?.name?.toLowerCase() || '';
  if (catName.includes('wash')) return 'W' + (index + 1);
  if (catName.includes('health')) return 'H' + (index + 1);
  if (catName.includes('educ') || catName.includes('digital')) return 'E' + (index + 1);
  return prog.program_id?.slice(-2) || String(index + 1).padStart(2, '0');
}

function getTag(prog: Program): string {
  const catName = prog.category?.name?.toUpperCase() || 'GENERAL';
  const loc = prog.lga ? ` \u2022 ${prog.lga.toUpperCase()}` : '';
  return `${catName}${loc}`;
}

export default function LiveProgramProgress({ programs }: { programs: Program[] }) {
  const sorted = [...programs].sort((a, b) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
  });

  const top3 = sorted.slice(0, 3);

  return (
    <div className="db-programs-card">
      <div className="db-programs-header">
        <div className="db-programs-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#087F5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
          <div>
            <h2>Live Program Progress &amp; Health</h2>
            <p className="db-programs-subtitle">Active mission deployments across northern and central regional clusters</p>
          </div>
        </div>
        <div className="db-programs-filter">
          <span className="db-programs-filter-label">FILTER:</span>
          <button type="button" className="db-programs-filter-btn">All Active ({programs.length})</button>
        </div>
      </div>

      {top3.length === 0 ? (
        <div className="db-programs-empty" style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
          No active programs found. Create a program to get started.
        </div>
      ) : (
        <div className="db-programs-list">
          {top3.map((prog, i) => {
            const st = statusMap[prog.priority] || statusMap[prog.status] || { label: prog.status?.toUpperCase() || 'UNKNOWN', color: 'blue' as const };
            const pct = Math.round(prog.percentage_budget_used || 0);
            return (
              <div key={prog.id} className="db-program-row">
                <div className="db-program-left">
                  <div className="db-program-badge" style={{ background: prog.category?.color || getBadgeColor(i) }}>
                    {getProgramBadge(prog, i)}
                  </div>
                  <div className="db-program-info">
                    <h3 className="db-program-title">{prog.title}</h3>
                    <div className="db-program-tags">
                      <span className="db-program-tag">{prog.category?.name?.toUpperCase() || 'GENERAL'}</span>
                      <span className="db-program-tag-label">{prog.lga || prog.state || ''}</span>
                    </div>
                    <p className="db-program-subtitle">{prog.description?.slice(0, 80) || 'No description'}</p>
                  </div>
                </div>
                <div className="db-program-right">
                  <span className={`db-program-status db-program-status-${st.color}`}>
                    <span className="db-program-status-dot" />
                    {st.label}
                  </span>
                  <div className="db-program-progress-section">
                    <div className="db-program-progress-header">
                      <span className="db-program-progress-label">Milestone Completion</span>
                      <span className="db-program-progress-pct">{pct}%</span>
                    </div>
                    <div className="db-program-progress-track">
                      <div className="db-program-progress-fill" style={{ width: `${pct}%`, background: colorMap[prog.status] || '#087F5B' }} />
                    </div>
                    <div className="db-program-expenditure">
                      <span>Fiscal Expenditure:</span>
                      <strong> ${Number(prog.amount_spent || 0).toLocaleString()} / ${Number(prog.budget || 0).toLocaleString()}</strong>
                    </div>
                    <div className="db-program-personnel">
                      {prog.coordinator_name && <span className="db-program-personnel-role">Coordinator: {prog.coordinator_name}</span>}
                      {prog.manager_name && <span>Manager: {prog.manager_name}</span>}
                      {!prog.manager_name && !prog.coordinator_name && <span>No personnel assigned</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="db-programs-footer">
        <span className="db-programs-footer-text">Displaying top {top3.length} active priority initiatives</span>
        <a href="/core" className="db-programs-footer-link">View All {programs.length} Programs in Catalog &rarr;</a>
      </div>
    </div>
  );
}
