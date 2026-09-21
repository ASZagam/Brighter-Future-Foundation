'use client';

import type { ProgramDashboard, VolunteerDashboard, Member, Donation } from '../hooks/useDashboard';

interface KPICardData {
  programDash: ProgramDashboard | null;
  volDash: VolunteerDashboard | null;
  members: Member[];
  donations: Donation[];
}

function KpiIcon({ children }: { children: React.ReactNode }) {
  return <div className="db-kpi-icon">{children}</div>;
}

export default function KPICards({ programDash, volDash, members, donations }: KPICardData) {
  const totalDonated = donations
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const donationTarget = programDash?.total_budget || 120000;
  const donationPct = donationTarget > 0 ? Math.round((totalDonated / donationTarget) * 1000) / 10 : 0;

  const categories = programDash?.programs_by_category || [];
  const wash = categories.find((c) => c.category__name?.toLowerCase().includes('wash'));
  const health = categories.find((c) => c.category__name?.toLowerCase().includes('health'));
  const edu = categories.find((c) => c.category__name?.toLowerCase().includes('educ') || c.category__name?.toLowerCase().includes('digital'));
  const otherCount = (programDash?.active_programs || 0) - (wash?.count || 0) - (health?.count || 0) - (edu?.count || 0);

  const uniqueStates = new Set(members.map((m) => m.state).filter(Boolean));
  const memberStates = [...uniqueStates].slice(0, 4);

  const pendingMembers = members.filter((m) => m.status === 'pending').length;

  return (
    <div className="db-kpi-grid">
      {/* Active Programs */}
      <div className="db-kpi-card">
        <div className="db-kpi-header">
          <div>
            <span className="db-kpi-label">ACTIVE PROGRAMS</span>
            <span className="db-kpi-sub">FY 2026 Mandates</span>
          </div>
          <KpiIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </KpiIcon>
        </div>
        <div className="db-kpi-value-row">
          <span className="db-kpi-value">{programDash?.active_programs ?? '—'}</span>
          <span className="db-kpi-total">/{programDash?.total_programs ?? '—'} Total</span>
        </div>
        <div className="db-kpi-progress-bar">
          <div className="db-kpi-progress-track">
            <div className="db-kpi-progress-fill" style={{ width: programDash ? `${(programDash.active_programs / Math.max(programDash.total_programs, 1)) * 100}%` : '0%' }} />
          </div>
        </div>
        <div className="db-kpi-breakdown">
          {wash && <span><span className="db-dot db-dot-wash" /> {wash.count} WASH</span>}
          {health && <span><span className="db-dot db-dot-health" /> {health.count} Health</span>}
          {edu && <span><span className="db-dot db-dot-digital" /> {edu.count} Digital</span>}
          {otherCount > 0 && <span><span className="db-dot" style={{ background: '#7C3AED' }} /> {otherCount} Other</span>}
          {!wash && !health && !edu && <span style={{ color: '#9CA3AF' }}>No programs yet</span>}
        </div>
      </div>

      {/* Field Volunteers */}
      <div className="db-kpi-card">
        <div className="db-kpi-header">
          <div>
            <span className="db-kpi-label">FIELD VOLUNTEERS</span>
            <span className="db-kpi-sub">Grassroots Deployment</span>
          </div>
          <KpiIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </KpiIcon>
        </div>
        <div className="db-kpi-value-row">
          <span className="db-kpi-value">{volDash?.total_volunteers ?? '—'}</span>
          <span className="db-kpi-total">Registered</span>
        </div>
        <div className="db-kpi-chip-row">
          <span className="db-kpi-chip">{volDash?.active_volunteers ?? 0} Active</span>
          <span className="db-kpi-chip-muted">{volDash?.pending_volunteers ?? 0} pending</span>
        </div>
        <div className="db-kpi-change">
          {volDash?.total_hours ? <span className="db-kpi-change-up">{volDash.total_hours} total hours logged</span> : <span>{volDash?.inactive_volunteers ?? 0} inactive</span>}
        </div>
      </div>

      {/* Community Members */}
      <div className="db-kpi-card">
        <div className="db-kpi-header">
          <div>
            <span className="db-kpi-label">COMMUNITY MEMBERS</span>
            <span className="db-kpi-sub">{uniqueStates.size} State Hub Clusters</span>
          </div>
          <KpiIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
          </KpiIcon>
        </div>
        <div className="db-kpi-value-row">
          <span className="db-kpi-value">{members.length || '—'}</span>
          <span className="db-kpi-total">Enrolled</span>
        </div>
        <p className="db-kpi-location">
          {memberStates.length > 0 ? memberStates.join(', ') + (uniqueStates.size > 4 ? '...' : '') : 'No location data'}
        </p>
        <div className="db-kpi-chip-row">
          {pendingMembers > 0 && <span className="db-kpi-chip db-kpi-chip-amber">{pendingMembers} review</span>}
        </div>
      </div>

      {/* Disbursed Funds */}
      <div className="db-kpi-card">
        <div className="db-kpi-header">
          <div>
            <span className="db-kpi-label">DISBURSED FUNDS</span>
            <span className="db-kpi-sub">Audited Grant Drawdown</span>
          </div>
          <KpiIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </KpiIcon>
        </div>
        <div className="db-kpi-value-row">
          <span className="db-kpi-value">${totalDonated.toLocaleString()}</span>
          <span className="db-kpi-total">/ ${(donationTarget / 1000).toFixed(0)}k</span>
        </div>
        <p className="db-kpi-location">
          {donations.length > 0
            ? [...new Set(donations.map((d) => d.campaign).filter(Boolean))].slice(0, 2).join(', ') || 'Multiple donors'
            : 'No donations yet'}
        </p>
        <div className="db-kpi-funds-progress">
          <div className="db-kpi-progress-track">
            <div className="db-kpi-progress-fill" style={{ width: `${Math.min(donationPct, 100)}%` }} />
          </div>
          <span className="db-kpi-funds-pct">{donationPct}%</span>
        </div>
      </div>
    </div>
  );
}
