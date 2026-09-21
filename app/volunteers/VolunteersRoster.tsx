'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  actOnShift,
  batchLogHours,
  downloadVolunteerIdCard,
  exportVolunteersCsv,
  fetchHourLogs,
  fetchPrograms,
  fetchVolunteerLocations,
  fetchVolunteerSkills,
  fetchVolunteerStats,
  fetchVolunteers,
  reactivateVolunteer,
  reassignSquad,
  registerVolunteer,
  suspendVolunteer,
} from '../../lib/volunteerApi';
import type {
  BackendHourLog,
  BackendProgram,
  BackendSkill,
  BackendVolunteer,
  LocationPoint,
  VolunteerStats,
} from '../../lib/volunteerApi';

export type VolunteerTabKey =
  | 'all'
  | 'active_deployment'
  | 'standby'
  | 'pending_signoff'
  | 'on_leave'
  | 'suspended';

export type VolunteerDetailTab = 'profile' | 'deployment' | 'hours' | 'compliance' | 'audit';

const DEPLOY_LABEL: Record<string, string> = {
  deployed: 'DEPLOYED',
  standby: 'STANDBY',
  on_leave: 'ON LEAVE',
  pending_signoff: 'PENDING SIGN-OFF',
  pending: 'PENDING SIGN-OFF',
  suspended: 'SUSPENDED',
  inactive: 'INACTIVE',
};

const TONE_CLASS: Record<string, string> = {
  deployed: 'mint',
  standby: 'blue',
  on_leave: 'amber',
  pending: 'violet',
  pending_signoff: 'violet',
  suspended: 'red',
  inactive: 'slate',
};

const TAB_META: Array<{ key: VolunteerTabKey; label: string }> = [
  { key: 'all', label: 'All Volunteers' },
  { key: 'active_deployment', label: 'Deployed' },
  { key: 'standby', label: 'Standby Pool' },
  { key: 'pending_signoff', label: 'Pending Sign-off' },
  { key: 'on_leave', label: 'On Leave' },
  { key: 'suspended', label: 'Suspended' },
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function dateOnly(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(value: string | null | undefined): string {
  if (!value) return '—';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function resolveVolunteerId(volunteers: BackendVolunteer[], slug: string | undefined): string | undefined {
  if (!slug) return undefined;
  const needle = slug.toLowerCase();
  const found = volunteers.find(
    (row) =>
      row.volunteer_id.toLowerCase().endsWith(needle) ||
      row.full_name?.toLowerCase().includes(needle)
  );
  return found?.id;
}

export default function VolunteersRoster({ initialVolunteerId }: { initialVolunteerId?: string }) {
  const [volunteers, setVolunteers] = useState<BackendVolunteer[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [hourLogs, setHourLogs] = useState<BackendHourLog[]>([]);
  const [skills, setSkills] = useState<BackendSkill[]>([]);
  const [programs, setPrograms] = useState<BackendProgram[]>([]);

  const [liveStatus, setLiveStatus] = useState<'loading' | 'ok' | 'empty' | 'offline'>('loading');
  const [liveCount, setLiveCount] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);

  const [selectedId, setSelectedId] = useState<string | undefined>(initialVolunteerId);
  const [activeTab, setActiveTab] = useState<VolunteerTabKey>('all');
  const [detailTab, setDetailTab] = useState<VolunteerDetailTab>('profile');
  const [searchTerm, setSearchTerm] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [squadFilter, setSquadFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'hours' | 'compliance'>('name');
  const [moreFilters, setMoreFilters] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [dossierOpen, setDossierOpen] = useState(false);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<BackendVolunteer | null>(null);
  const [queryLog, setQueryLog] = useState<BackendHourLog | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function syncLive() {
    try {
      const data = await fetchVolunteers('?ordering=full_name');
      const list = data?.results ?? [];
      setLiveCount(list.length);
      setLiveStatus(list.length > 0 ? 'ok' : 'empty');
      setVolunteers(list);
    } catch {
      setLiveStatus('offline');
    }
  }

  async function refreshVolunteerContext() {
    const [statsData, locData, progData] = await Promise.all([
      fetchVolunteerStats(),
      fetchVolunteerLocations(),
      fetchPrograms().catch(() => ({ results: [] as BackendProgram[], count: 0 })),
    ]);
    setStats(statsData);
    setLocations(locData?.locations ?? []);
    setPrograms(progData.results ?? []);
  }

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLiveStatus('loading');
      await Promise.all([syncLive(), fetchVolunteerSkills().then(setSkills).catch(() => {})]);
      await refreshVolunteerContext().catch(() => {});
      if (mounted) {
        setNotice(null);
      }
    };
    run();
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((me) => {
        if (me && mounted) setCanWrite(Boolean(me.is_superuser) || Array.isArray(me.role_names) && ['super_admin', 'admin', 'coordinator'].some((role) => me.role_names.includes(role)));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    fetchHourLogs(selectedId)
      .then((data) => {
        if (mounted) setHourLogs(data?.results ?? []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  useEffect(() => {
    const pollVolunteers = window.setInterval(() => {
      syncLive().catch(() => {});
      refreshVolunteerContext().catch(() => {});
    }, 60000);
    const pollLocations = window.setInterval(() => {
      fetchVolunteerLocations().then((data) => setLocations(data?.locations ?? [])).catch(() => {});
    }, 30000);
    return () => {
      window.clearInterval(pollVolunteers);
      window.clearInterval(pollLocations);
    };
  }, []);

  const sortedVolunteers = useMemo(() => {
    const rows = [...volunteers];
    if (sortBy === 'hours') rows.sort((a, b) => (b.total_hours ?? 0) - (a.total_hours ?? 0));
    else if (sortBy === 'compliance') rows.sort((a, b) => (b.compliance_score ?? 0) - (a.compliance_score ?? 0));
    else rows.sort((a, b) => String(a.full_name ?? '').localeCompare(String(b.full_name ?? '')));
    return rows;
  }, [volunteers, sortBy]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sortedVolunteers.filter((row) => {
      if (activeTab !== 'all' && row.deployment_status !== activeTab) return false;
      if (clusterFilter && row.cluster !== clusterFilter) return false;
      if (squadFilter && row.squad !== squadFilter) return false;
      if (specializationFilter && !row.skills_list.includes(specializationFilter)) return false;
      if (term) {
        const haystack = `${row.volunteer_id} ${row.full_name} ${row.phone} ${row.lga} ${row.state} ${row.email}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [sortedVolunteers, activeTab, clusterFilter, squadFilter, specializationFilter, searchTerm]);

  const rowsPerPage = 10;
  const totalRecords = stats?.tabs?.[activeTab] ?? filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const pageStart = (page - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(page * rowsPerPage, totalRecords);
  const visible = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [activeTab, clusterFilter, squadFilter, specializationFilter, searchTerm]);

  useEffect(() => {
    if (!initialVolunteerId || volunteers.length === 0) return;
    if (selectedId && selectedId !== initialVolunteerId) return;
    const resolved = resolveVolunteerId(volunteers, initialVolunteerId);
    if (resolved) {
      setSelectedId(resolved);
      setDossierOpen(true);
    }
  }, [initialVolunteerId, volunteers, selectedId]);

  const selected = selectedId ? volunteers.find((row) => row.id === selectedId) : undefined;

  function selectVolunteer(ref: string) {
    const target =
      volunteers.find((row) => row.id === ref) ??
      volunteers.find((row) => row.volunteer_id === ref);
    if (!target) return;
    setSelectedId(target.id);
    setDossierOpen(true);
    setFormError(null);
  }

  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetFilters() {
    setSearchTerm('');
    setClusterFilter('');
    setSquadFilter('');
    setSpecializationFilter('');
    setSortBy('name');
    setActiveTab('all');
  }

  const clusterOptions = useMemo(() => Array.from(new Set(volunteers.map((row) => row.cluster).filter(Boolean))).sort(), [volunteers]);
  const squadOptions = useMemo(() => Array.from(new Set(volunteers.map((row) => row.squad).filter(Boolean))).sort(), [volunteers]);
  const specializationOptions = useMemo(
    () => Array.from(new Set([...(stats?.options?.specializations ?? []), ...volunteers.flatMap((row) => row.skills_list)])).sort(),
    [volunteers, stats]
  );

  const k = stats?.kpis ?? {};

  async function register(data: Record<string, unknown>) {
    setSaving(true);
    setFormError(null);
    try {
      const created = await registerVolunteer(data);
      setNotice(`Registered ${created.full_name} (${created.volunteer_id}) in the Django volunteer registry.`);
      setRegisterOpen(false);
      await syncLive();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to register the volunteer.');
    } finally {
      setSaving(false);
    }
  }

  async function submitBatch(payload: { volunteer_ids: string[]; program_id: string; activity: string; hours: number; date: string; location: string }) {
    setSaving(true);
    setFormError(null);
    try {
      const result = await batchLogHours(payload);
      setNotice(`Logged ${result.count} shift record${result.count === 1 ? '' : 's'} for ${payload.volunteer_ids.length} volunteer${payload.volunteer_ids.length === 1 ? '' : 's'}.`);
      setBatchOpen(false);
      await Promise.all([syncLive(), refreshVolunteerContext()]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to log hours.');
    } finally {
      setSaving(false);
    }
  }

  async function reassign(target: BackendVolunteer, squad: string) {
    setSaving(true);
    setFormError(null);
    try {
      await reassignSquad(target.id, squad);
      setNotice(`${target.full_name} reassigned to squad ${squad}.`);
      await syncLive();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to reassign squad.');
    } finally {
      setSaving(false);
    }
  }

  async function suspend(target: BackendVolunteer, reason: string) {
    setSaving(true);
    setFormError(null);
    try {
      await suspendVolunteer(target.id, reason);
      setNotice(`${target.full_name} suspended (${reason}). Audit action: volunteer_suspended.`);
      setSuspendTarget(null);
      await syncLive();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to suspend volunteer.');
    } finally {
      setSaving(false);
    }
  }

  async function reactivate(target: BackendVolunteer) {
    setSaving(true);
    try {
      await reactivateVolunteer(target.id);
      setNotice(`${target.full_name} reactivated and returned to the active roster.`);
      await syncLive();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to reactivate volunteer.');
    } finally {
      setSaving(false);
    }
  }

  async function actShift(log: BackendHourLog, action: 'approve' | 'reject' | 'query', note?: string) {
    setSaving(true);
    try {
      const updated = await actOnShift(log.id, action, note);
      setHourLogs((prev) => prev.map((row) => (row.id === log.id ? updated : row)));
      setQueryLog(null);
      setNotice(`Shift ${updated.shift_id} ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged for query'} in the time registry.`);
      await Promise.all([syncLive(), refreshVolunteerContext()]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Shift action failed.');
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    setSaving(true);
    try {
      await exportVolunteersCsv();
      setNotice('Volunteer roster export triggered. Audit action: volunteer_timesheet_exported.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setSaving(false);
    }
  }

  function downloadId(target: BackendVolunteer) {
    downloadVolunteerIdCard(target.id)
      .then((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `id-card-${target.volunteer_id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => setFormError(error instanceof Error ? error.message : 'ID card generation failed.'));
  }

  const tabCount = (key: VolunteerTabKey) => stats?.tabs?.[key] ?? 0;

  return (
    <main className="vol-content">
      <div className="vol-kicker">
        <span>● CORE OPERATIONS</span>
        <i>•</i>
        <span>VOLUNTEERS &amp; DEPLOYMENT ROSTER</span>
      </div>
      <div className="vol-heading">
        <div>
          <h1>Volunteers &amp; Deployment Roster</h1>
          <p>
            Manage registered field volunteers, live deployment status, squads, GPS placements, shift verifications, and
            compliance across all federation outreach operations.
          </p>
        </div>
        <div className="vol-actions">
          <button type="button" onClick={exportCsv} disabled={saving}>Export Roster (CSV)</button>
          <button type="button" onClick={() => { setFormError(null); setBatchOpen(true); }} disabled={!canWrite || checked.size === 0}>Batch Log Hours ({checked.size})</button>
          <button type="button" className="primary" onClick={() => { setFormError(null); setRegisterOpen(true); }} disabled={!canWrite}>+ Register Field Volunteer</button>
        </div>
      </div>
      {notice && <div className="vol-live-notice">{notice}</div>}
      {formError && <div className="vol-live-notice warn">{formError}{' '}
        <button type="button" onClick={() => setFormError(null)} style={{ marginLeft: 6, border: 'none', background: 'none', color: '#896b22', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>Dismiss</button></div>}

      <div className="vol-dispatch">
        <LiveDeploymentMap locations={locations} liveStatus={liveStatus} onSelect={(id) => selectVolunteer(id)} />
        <LiveSiteFeed locations={locations} onSelect={(id) => selectVolunteer(id)} />
      </div>

      <div className="vol-kpis">
        <div className="member-kpi reveal-up">
          <span className="member-kpi-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#087f5b" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <span className="member-kpi-label">REGISTERED FIELD<br />VOLUNTEERS</span>
          <strong>{k.total_field_volunteers ?? '—'}</strong>
          <small>Active pool {k.active ?? 0}</small>
          <span className="member-kpi-foot">{liveStatus === 'loading' ? 'Syncing…' : `${liveCount} live in PostgreSQL`}</span>
        </div>
        <div className="member-kpi reveal-up">
          <span className="member-kpi-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#087f5b" strokeWidth="2"><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
          <span className="member-kpi-label">LIVE DEPLOYMENTS<br />IN THE FIELD</span>
          <strong>{k.active_deployment ?? '—'}</strong>
          <small>Across {k.clusters_active ?? 0} clusters</small>
          <span className="member-kpi-foot">{k.on_site_this_week ?? 0} on-site this week</span>
        </div>
        <div className="member-kpi reveal-up">
          <span className="member-kpi-top-badge green">READY</span>
          <span className="member-kpi-label">STANDBY<br />POOL</span>
          <strong>{k.standby ?? '—'}</strong>
          <small>Available for dispatch</small>
          <span className="member-progress"><i style={{ ['--bar' as string]: `${Math.min(100, ((k.standby ?? 0) / Math.max(k.total_field_volunteers ?? 1, 1)) * 100)}%` }} /></span>
        </div>
        <div className="member-kpi reveal-up">
          <span className="member-kpi-top-badge amber">{k.pending_verification ?? 0}</span>
          <span className="member-kpi-label">SHIFT LOGS<br />PENDING VERIFICATION</span>
          <strong>{k.avg_hours_per_week ?? '—'}<small style={{ display: 'inline', marginLeft: 4, fontSize: 11, color: '#7b8490' }}>avg hrs/wk</small></strong>
          <small>{k.logged_hours_ytd ?? 0} hrs logged YTD</small>
          <span className="member-kpi-foot">Compliance {k.compliance ?? 0}% · {k.within_sla ?? 0} w/in 7-day SLA</span>
        </div>
      </div>

      <div className="members-tabs" role="tablist" aria-label="Volunteer deployment status filters">
        {TAB_META.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`member-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="member-tab-count">{tabCount(tab.key)}</span>
          </button>
        ))}
      </div>

      <div className="members-filters">
        <span>⌕</span>
        <input aria-label="Search volunteers" placeholder="Search by Volunteer ID, Name, Phone, LGA, Email..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        <select aria-label="Cluster filter" value={clusterFilter} onChange={(event) => setClusterFilter(event.target.value)}>
          <option value="">All Clusters</option>
          {clusterOptions.map((cluster) => <option key={cluster} value={cluster}>{cluster}</option>)}
        </select>
        <select aria-label="Specialization filter" value={specializationFilter} onChange={(event) => setSpecializationFilter(event.target.value)}>
          <option value="">Specializations (All)</option>
          {specializationOptions.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
        </select>
        <select aria-label="Squad filter" value={squadFilter} onChange={(event) => setSquadFilter(event.target.value)}>
          <option value="">All Squads</option>
          {squadOptions.map((squad) => <option key={squad} value={squad}>{squad}</option>)}
        </select>
        <button type="button" className="members-more-btn" onClick={() => setMoreFilters((value) => !value)}>More Filters</button>
      </div>

      {moreFilters && (
        <div className="members-advanced">
          <label>SORT ROSTER BY
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'name' | 'hours' | 'compliance')}>
              <option value="name">Volunteer name (A–Z)</option>
              <option value="hours">Approved hours (high → low)</option>
              <option value="compliance">Compliance score (high → low)</option>
            </select>
          </label>
          <label className="members-advanced-reset">
            <button type="button" className="members-more-btn" onClick={resetFilters} style={{ width: '100%', padding: '6px 8px', border: '1px solid #e3e5ef', borderRadius: 4, background: '#fff' }}>Reset All Filters</button>
          </label>
        </div>
      )}

      <div className="members-layout">
        <section className="member-list">
          <div className="member-roster-toolbar">
            <span className="member-roster-check"><input type="checkbox" aria-label="Select all displayed" checked={filtered.length > 0 && filtered.length === checked.size} onChange={() => { if (filtered.every((row) => checked.has(row.id))) setChecked(new Set()); else setChecked(new Set(filtered.map((row) => row.id))); }} /></span>
            <strong>Active Roster</strong>
            <span>(Showing {filtered.length} of {statLabel(totalRecords, activeTab)} records)</span>
            <span className="member-roster-sort">Listed from PostgreSQL · live</span>
          </div>
          <div className="vol-table-head">
            <span />
            <span>VOLUNTEER IDENTITY</span>
            <span>CLUSTER &amp; SQUAD</span>
            <span>STATUS</span>
            <span>SPECIALIZATIONS</span>
            <span>DEPLOYMENT</span>
            <span>HOURS</span>
            <span>ACTIONS</span>
          </div>
          {visible.length === 0 && <div className="member-loading">No volunteer records match the current filters. Add a field volunteer or seed the demo registry.</div>}
          {visible.map((row) => (
            <div
              key={row.id}
              className={`vol-row${selectedId === row.id ? ' selected' : ''}`}
              onClick={() => selectVolunteer(row.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectVolunteer(row.id); }}
            >
              <span className="member-roster-check" onClick={(event) => event.stopPropagation()}>
                <input type="checkbox" checked={checked.has(row.id)} onChange={() => toggleChecked(row.id)} />
              </span>
              <div className="member-identity">
                <span className="member-id-line">
                  <span className="member-avatar">{initials(row.full_name ?? 'NV')}</span>
                  <span className="member-id-inner">
                    <strong className="member-name">{row.full_name || `${row.first_name} ${row.last_name}`}</strong>
                    <span className="member-ref">#{row.volunteer_id}</span>
                  </span>
                </span>
                <span className="member-meta">{row.gender} · {row.years_of_experience || 0} yrs exp</span>
              </div>
              <div className="member-cell">
                <strong>{row.cluster || row.state || '—'}</strong>
                <small>{row.lga || '—'} • {row.squad || 'No squad'}</small>
              </div>
              <div className="member-cell">
                <span className={`member-badge ${TONE_CLASS[row.deployment_status] ?? 'slate'}`}>
                  <i className={`vol-status-dot ${row.deployment_status}`} />
                  {DEPLOY_LABEL[row.deployment_status] ?? row.status}
                </span>
                {row.on_leave_until && <small className="member-meta" style={{ marginTop: 3 }}>until {dateOnly(row.on_leave_until)}</small>}
              </div>
              <div className="member-cell">
                <div className="vol-skill-chips">
                  {row.skills_list.length > 0 ? row.skills_list.slice(0, 2).map((skill) => (
                    <span key={skill} className="vol-skill-chip">{skill}</span>
                  )) : <small className="member-meta">No specializations</small>}
                </div>
              </div>
              <div className="member-cell">
                <span className={`vol-deploy-chip ${row.active_deployment ? '' : 'none'}`}>
                  {row.active_deployment ? row.active_deployment.title : 'Standby'}
                </span>
              </div>
              <div className="member-cell">
                <div className="vol-compliance">
                  <i><b style={{ width: `${Math.min(100, row.compliance_score ?? 0)}%` }} /></i>
                  <small><b style={{ color: '#172033' }}>{row.total_hours ?? 0}h</b> approved · {row.compliance_score ?? 0}%</small>
                </div>
              </div>
              <div className="member-actions">
                <button type="button" className="member-action" onClick={(event) => { event.stopPropagation(); selectVolunteer(row.id); }}>View</button>
                <button type="button" className="member-action" onClick={(event) => { event.stopPropagation(); setSelectedId(row.id); setDossierOpen(true); }}>More</button>
              </div>
            </div>
          ))}
          <div className="member-pagination">
            <span>Showing {pageStart} to {Math.min(pageEnd, Math.max(filtered.length, 1))} of {totalRecords} volunteers</span>
            <span>Rows: <b>{rowsPerPage}</b></span>
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            {Array.from({ length: Math.min(3, pageCount) }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" className={page === number ? 'current' : ''} onClick={() => setPage(number)}>{number}</button>
            ))}
            {pageCount > 3 && <span>...</span>}
            {pageCount > 3 && <button type="button" className={page === pageCount ? 'current' : ''} onClick={() => setPage(pageCount)}>{pageCount}</button>}
            <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
          </div>
        </section>

        {dossierOpen && selected ? (
          <VolunteerDossier
            volunteer={selected}
            hourLogs={hourLogs}
            detailTab={detailTab}
            canWrite={canWrite}
            saving={saving}
            onTabChange={setDetailTab}
            onClose={() => setDossierOpen(false)}
            onReassign={(squad) => reassign(selected, squad)}
            onSuspend={(reason) => suspend(selected, reason)}
            onReactivate={() => reactivate(selected)}
            onDownloadId={() => downloadId(selected)}
            onActShift={actShift}
            onQueryOpen={(log) => setQueryLog(log)}
          />
        ) : (
          <aside className="member-dossier" style={{ display: 'grid', placeItems: 'center', minHeight: 220, color: '#8a93a0', fontSize: 10 }}>
            Select a volunteer to open its dossier.
          </aside>
        )}
      </div>

      {registerOpen && (
        <RegisterVolunteerModal
          skills={skills}
          saving={saving}
          onClose={() => setRegisterOpen(false)}
          onSubmit={register}
        />
      )}
      {batchOpen && (
        <BatchHoursModal
          volunteers={volunteers.filter((row) => checked.has(row.id))}
          programs={programs}
          saving={saving}
          onClose={() => setBatchOpen(false)}
          onSubmit={submitBatch}
        />
      )}
      {suspendTarget && (
        <ConfirmModal
          title={`Suspend ${suspendTarget.full_name}`}
          prompt="Provide a reason for the suspension. This is written to the audit log (volunteer_suspended)."
          placeholder="e.g. Unverified safety certification — review before redeployment."
          confirmLabel={saving ? 'Suspending…' : 'Suspend Volunteer'}
          danger
          onCancel={() => setSuspendTarget(null)}
          onConfirm={(reason) => suspend(suspendTarget, reason)}
        />
      )}
      {queryLog && (
        <ConfirmModal
          title={`Query shift ${queryLog.shift_id}`}
          prompt="Explain what needs verification before this shift record is approved or rejected."
          placeholder="e.g. Cross-check hours against the site attendance register."
          confirmLabel={saving ? 'Submitting…' : 'Flag for Query'}
          danger={false}
          onCancel={() => setQueryLog(null)}
          onConfirm={(note) => actShift(queryLog, 'query', note)}
        />
      )}
    </main>
  );
}

function statLabel(total: number, tab: VolunteerTabKey): string {
  if (tab === 'all') return 'registered';
  const label = TAB_META.find((entry) => entry.key === tab)?.label ?? 'filtered';
  return `${label.toLowerCase()} (${total})`;
}

function LiveDeploymentMap({ locations, liveStatus, onSelect }: { locations: LocationPoint[]; liveStatus: string; onSelect: (id: string) => void }) {
  const box = useMemo(() => {
    if (locations.length === 0) return null;
    const lats = locations.map((point) => point.latitude);
    const lngs = locations.map((point) => point.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const span = Math.max(maxLat - minLat, maxLng - minLng, 0.001);
    return { minLat, minLng, span };
  }, [locations]);

  return (
    <section className="vol-map">
      <div className="vol-map-grid" />
      <div className="vol-map-canvas">
        {box && locations.map((point) => {
          const left = ((point.longitude - box.minLng) / box.span) * 86 + 7;
          const top = 88 - ((point.latitude - box.minLat) / box.span) * 78;
          const tone = point.status === 'on_leave' ? 'onleave' : point.status === 'suspended' || point.status === 'inactive' ? 'offline' : '';
          return (
            <button
              key={point.volunteer_id}
              type="button"
              className={`vol-map-pin ${tone}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`${point.full_name} — ${point.cluster}, ${point.squad || ''} (${point.status}). Deployed: ${point.deployment ?? '—'}. GPS ${timeAgo(point.last_gps_at)}`}
              onClick={() => onSelect(point.volunteer_id)}
            >
              {point.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </button>
          );
        })}
      </div>
      {!box && (
        <div className="vol-dispatch-empty">
          {liveStatus === 'loading' ? 'Fetching live GPS placements…' : 'No volunteers with live GPS coordinates have registered yet. Pins appear here when a volunteer reports a location.'}
        </div>
      )}
      <div className="vol-map-legend">
        <span className="deployed"><i />Deployed</span>
        <span className="onleave"><i />On Leave</span>
        <span className="offline"><i />Offline</span>
      </div>
    </section>
  );
}

function LiveSiteFeed({ locations, onSelect }: { locations: LocationPoint[]; onSelect: (id: string) => void }) {
  const feed = locations.slice(0, 6);
  return (
    <section className="vol-site-list">
      <div className="vol-dispatch-title">
        <strong>Live Deployment Feed</strong>
        <span>{locations.length} positioned</span>
      </div>
      {feed.length === 0 && <div className="member-loading">No live GPS positions have been reported. Standby volunteers appear here as they check in via ODK.</div>}
      {feed.map((point) => (
        <button key={point.volunteer_id} type="button" className="vol-site-row" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => onSelect(point.volunteer_id)}>
          <span className="vol-site-avatar">{point.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
          <div className="vol-site-main">
            <strong>{point.full_name}</strong>
            <small>{point.cluster} · {point.squad || 'No squad'} — <span className="vol-gps-live">GPS <b>{timeAgo(point.last_gps_at)}</b></span></small>
          </div>
          <div className="vol-site-side">
            <b>{DEPLOY_LABEL[point.status] ?? point.status}</b>
            <span>{point.deployment ?? 'Standby'}</span>
          </div>
        </button>
      ))}
    </section>
  );
}

function VolunteerDossier({
  volunteer,
  hourLogs,
  detailTab,
  canWrite,
  saving,
  onTabChange,
  onClose,
  onReassign,
  onSuspend,
  onReactivate,
  onDownloadId,
  onActShift,
  onQueryOpen,
}: {
  volunteer: BackendVolunteer;
  hourLogs: BackendHourLog[];
  detailTab: VolunteerDetailTab;
  canWrite: boolean;
  saving: boolean;
  onTabChange: (tab: VolunteerDetailTab) => void;
  onClose: () => void;
  onReassign: (squad: string) => void;
  onSuspend: (reason: string) => void;
  onReactivate: () => void;
  onDownloadId: () => void;
  onActShift: (log: BackendHourLog, action: 'approve' | 'reject' | 'query', note?: string) => void;
  onQueryOpen: (log: BackendHourLog) => void;
}) {
  const [squadValue, setSquadValue] = useState(volunteer.squad ?? '');
  const [suspendReason, setSuspendReason] = useState('');
  const [panel, setPanel] = useState<'idle' | 'reassign' | 'suspend'>('idle');
  const pendingLogs = hourLogs.filter((log) => log.approval_status === 'pending');

  const tone = TONE_CLASS[volunteer.deployment_status] ?? 'slate';
  const isSuspended = volunteer.status === 'suspended';

  return (
    <aside className="member-dossier">
      <div className="dossier-top">
        <div>
          <span className="dossier-ref">{`#${volunteer.volunteer_id} — FIELD VOLUNTEER`}</span>
          <h2>{volunteer.full_name || `${volunteer.first_name} ${volunteer.last_name}`}</h2>
        </div>
        <button type="button" className="dossier-close" aria-label="Close volunteer dossier" onClick={onClose}>×</button>
      </div>
      <div className="dossier-status-row">
        <span className="dossier-status-pill">{DEPLOY_LABEL[volunteer.deployment_status] ?? volunteer.status}</span>
        <span className="dossier-status-pill" style={{ background: tone === 'red' ? '#fde4e5' : '#dff6ec', color: tone === 'red' ? '#b52e42' : '#087f5b' }}>{volunteer.status.toUpperCase()} STATUS</span>
      </div>
      <div className="dossier-profile">
        <span className="member-avatar">{initials(volunteer.full_name ?? 'NV')}</span>
        <div className="dossier-profile-detail">
          <strong>{volunteer.full_name || `${volunteer.first_name} ${volunteer.last_name}`}</strong>
          <span>Phone: <b>{volunteer.phone || '—'}</b></span>
          <span>Email: <b>{volunteer.email || '—'}</b></span>
        </div>
        <div className="dossier-profile-side">{volunteer.gender}, {volunteer.years_of_experience || 0} yrs</div>
      </div>
      <div className="dossier-window">
        <div className="dossier-window-item"><span>Cluster</span><span>{volunteer.cluster || '—'}</span></div>
        <div className="dossier-window-item"><span>Squad</span><span>{volunteer.squad || 'Not assigned'}</span></div>
        <div className="dossier-window-item"><span>Deployment</span><span>{volunteer.active_deployment?.title ?? 'Standby (no active program)'}</span></div>
        {volunteer.on_leave_until && <div className="dossier-window-item ok"><span>On Leave</span><span>until {dateOnly(volunteer.on_leave_until)}</span></div>}
        <div className="dossier-window-item ok"><span>Live GPS</span><span>last ping {timeAgo(volunteer.last_gps_at)}</span></div>
      </div>
      <div className="dossier-tabs">
        <button type="button" className={detailTab === 'profile' ? 'active' : ''} onClick={() => onTabChange('profile')}>Profile</button>
        <button type="button" className={detailTab === 'deployment' ? 'active' : ''} onClick={() => onTabChange('deployment')}>Deployment</button>
        <button type="button" className={detailTab === 'hours' ? 'active' : ''} onClick={() => onTabChange('hours')}>Hours &amp; Shifts ({hourLogs.length})</button>
        <button type="button" className={detailTab === 'compliance' ? 'active' : ''} onClick={() => onTabChange('compliance')}>Compliance</button>
        <button type="button" className={detailTab === 'audit' ? 'active' : ''} onClick={() => onTabChange('audit')}>Audit</button>
      </div>

      {detailTab === 'profile' && (
        <section>
          <div className="dossier-section-header"><span>VOLUNTEER PROFILE</span><span>{volunteer.state || '—'} · {volunteer.lga || '—'}</span></div>
          <div className="verification-stage">
            <span className="stage-icon passed">✓</span>
            <div className="stage-body">
              <div className="stage-title"><span>Identity &amp; Contact</span><span className="stage-status passed">VERIFIED</span></div>
              <p className="stage-detail">Phone {volunteer.phone || '—'} · Email {volunteer.email || '—'} · {volunteer.gender || '—'} · Joined {dateOnly(volunteer.joined_date)} · {volunteer.years_of_experience || 0} years of field experience.</p>
            </div>
          </div>
          <div className="dossier-section-header"><span>VERIFIED SKILLS</span><span>{volunteer.skills_list.length} recorded</span></div>
          {volunteer.skills_list.length > 0 ? (
            <div className="vol-skill-chips" style={{ marginBottom: 8 }}>
              {volunteer.skills_list.map((skill) => <span key={skill} className="vol-skill-chip">{skill}</span>)}
            </div>
          ) : <p className="stage-detail">No credentials or skills recorded yet.</p>}
          {volunteer.occupation && <p className="stage-detail" style={{ marginTop: 8 }}>Occupation: {volunteer.occupation} {volunteer.organization ? `· ${volunteer.organization}` : ''}</p>}
          <button type="button" className="member-action" style={{ marginTop: 12, padding: '7px 11px' }} onClick={onDownloadId}>Download Field ID Card (PDF)</button>
        </section>
      )}

      {detailTab === 'deployment' && (
        <section>
          <div className="dossier-section-header"><span>DEPLOYMENT STATUS</span><span>{DEPLOY_LABEL[volunteer.deployment_status] ?? volunteer.status}</span></div>
          <div className="verification-stage">
            <span className="stage-icon passed">✓</span>
            <div className="stage-body">
              <div className="stage-title"><span>Current placement</span><span className="stage-status passed">ACTIVE</span></div>
              <p className="stage-detail">{volunteer.active_deployment ? `${volunteer.active_deployment.title} (${volunteer.active_deployment.program_id})` : 'Standby — no program assignment. Available for dispatch.'}</p>
            </div>
          </div>
          <div className="verification-stage">
            <span className="stage-icon inreview">↻</span>
            <div className="stage-body">
              <div className="stage-title"><span>Squad assignment</span><span className="stage-status inreview">{volunteer.squad || 'UNASSIGNED'}</span></div>
              <p className="stage-detail">{volunteer.on_site_this_week ?? 0} shift(s) on site this week. Last GPS fix {timeAgo(volunteer.last_gps_at)}.</p>
            </div>
          </div>
          {panel === 'reassign' ? (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'grid', gap: 5, color: '#536071', fontSize: 12, fontWeight: 700 }}>Reassign squad
                <input value={squadValue} onChange={(event) => setSquadValue(event.target.value)} placeholder="e.g. ZONE 6" style={{ padding: '9px 11px', border: '1px solid #dfe3ec', borderRadius: 4, background: '#fbfcfe', color: '#172033', fontSize: 13 }} />
              </label>
              <div className="dossier-actions">
                <button type="button" onClick={() => setPanel('idle')}>Cancel</button>
                <button type="button" className="primary" disabled={saving || !squadValue.trim()} onClick={() => { onReassign(squadValue.trim()); setPanel('idle'); }}>{saving ? 'Saving…' : 'Confirm Reassignment'}</button>
              </div>
            </div>
          ) : (
            <div className="dossier-actions">
              <button type="button" disabled={!canWrite} onClick={() => setPanel('reassign')}>Reassign Squad</button>
              <button type="button" className="primary" disabled={!canWrite} onClick={onDownloadId}>ID Card PDF</button>
            </div>
          )}
        </section>
      )}

      {detailTab === 'hours' && (
        <section>
          <div className="dossier-section-header"><span>SHIFT LOGS &amp; TIMESHEET</span><span>{hourLogs.length} records</span></div>
          {hourLogs.length === 0 && <p className="stage-detail">No shift logs recorded for this volunteer yet. Use “Batch Log Hours” to register a shift.</p>}
          {hourLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="vol-shift-row">
              <div className="vol-shift-main">
                <strong>{log.activity || 'Field operation'}</strong>
                <span>#{log.shift_id} · {dateOnly(log.date)} · {log.hours}h · {log.program_title ?? 'No program'} · {log.location || 'No location'}</span>
                {log.approval_status === 'pending' && log.query_note && <div className="vol-shift-note">Query: {log.query_note}</div>}
                {log.approval_status !== 'pending' && log.reviewer_name && <span className="vol-shift-note" style={{ background: '#f0faf6', borderColor: '#b9dccd', color: '#13735a' }}>Reviewed by {log.reviewer_name} · {log.approval_status.toUpperCase()}</span>}
              </div>
              {log.approval_status === 'pending' ? (
                <div className="vol-shift-actions">
                  <button type="button" className="green" disabled={!canWrite || saving} onClick={() => onActShift(log, 'approve')}>Approve</button>
                  <button type="button" className="amber" disabled={!canWrite || saving} onClick={() => onQueryOpen(log)}>Query</button>
                  <button type="button" disabled={!canWrite || saving} onClick={() => onActShift(log, 'reject')}>Reject</button>
                </div>
              ) : (
                <span className={`member-badge ${log.approval_status === 'approved' ? 'mint' : log.approval_status === 'rejected' ? 'red' : 'amber'}`}>{log.approval_status.toUpperCase()}</span>
              )}
            </div>
          ))}
          {pendingLogs.length > 0 && (
            <div className="dossier-banner"><span>SHIFT VERIFICATION</span><strong>{pendingLogs.length} log{pendings(pendingLogs)} awaiting review (7-day SLA)</strong></div>
          )}
        </section>
      )}

      {detailTab === 'compliance' && (
        <section>
          <div className="dossier-section-header"><span>COMPLIANCE SCORE</span><span>{volunteer.compliance_score ?? 0}%</span></div>
          <div className="vol-compliance" style={{ marginBottom: 10 }}>
            <i><b style={{ width: `${Math.min(100, volunteer.compliance_score ?? 0)}%` }} /></i>
          </div>
          <div className="household-blocks">
            <div className="household-block"><b>{volunteer.total_hours ?? 0}h</b><small>Approved hours recorded in the timesheet registry</small></div>
            <div className="household-block"><b>{volunteer.on_site_this_week ?? 0}</b><small>Shifts worked on site this week</small></div>
            <div className="household-block"><b>{volunteer.last_shift ? dateOnly(volunteer.last_shift.date) : '—'}</b><small>Most recent verified shift</small></div>
            <div className="household-block"><b>{volunteer.volunteer_hours ?? 0}h</b><small>Total logged hours incl. pending</small></div>
          </div>
          <div className="dossier-banner"><span>COMPLIANCE BASIS</span><strong>Approved hours ÷ expected field hours, updated per verified shift</strong></div>
        </section>
      )}

      {detailTab === 'audit' && (
        <section>
          <div className="dossier-section-header"><span>AUDIT TRAIL</span><span>{volunteer.volunteer_id}</span></div>
          <div className="verification-stage">
            <span className="stage-icon passed">✓</span>
            <div className="stage-body">
              <div className="stage-title"><span>Volunteer record created</span><span className="stage-status passed">SYNCED</span></div>
              <p className="stage-detail">Enrolled {dateOnly(volunteer.joined_date)}. Registry write audited via AuditService (accounts AuditLog).</p>
            </div>
          </div>
          <div className="verification-stage">
            <span className="stage-icon passed">✓</span>
            <div className="stage-body">
              <div className="stage-title"><span>Latest roster update</span><span className="stage-status passed">LOGGED</span></div>
              <p className="stage-detail">Record last updated {timeAgo(volunteer.updated_at)}. Every reassign, suspend, reactivate, or shift action is written to the audit log.</p>
            </div>
          </div>
          <div className="verification-stage">
            <span className="stage-icon inreview">↻</span>
            <div className="stage-body">
              <div className="stage-title"><span>Current status</span><span className="stage-status inreview">{volunteer.status.toUpperCase()}</span></div>
              <p className="stage-detail">Deployment: {volunteer.deployment_status}. Suspensions require a reason and are reversible via reactivate.</p>
            </div>
          </div>
        </section>
      )}

      {panel === 'suspend' ? (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'grid', gap: 5, color: '#536071', fontSize: 12, fontWeight: 700 }}>Suspension reason
            <textarea value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} rows={3} placeholder="Required — recorded to audit log" style={{ padding: '9px 11px', border: '1px solid #dfe3ec', borderRadius: 4, background: '#fbfcfe', color: '#172033', fontSize: 13 }} />
          </label>
          <div className="dossier-actions">
            <button type="button" onClick={() => { setPanel('idle'); setSuspendReason(''); }}>Cancel</button>
            <button type="button" className="danger" disabled={saving || !suspendReason.trim()} onClick={() => onSuspend(suspendReason.trim())}>{saving ? 'Suspending…' : 'Confirm Suspension'}</button>
          </div>
        </div>
      ) : (
        <div className="dossier-actions">
          <button type="button" disabled={!canWrite} onClick={() => setPanel('suspend')}>Suspend Volunteer</button>
          {isSuspended && <button type="button" className="primary" disabled={!canWrite || saving} onClick={onReactivate}>{saving ? '…' : 'Reactivate'}</button>}
        </div>
      )}
    </aside>
  );
}

function pendings(logs: BackendHourLog[]): string {
  return logs.length === 1 ? '' : 's';
}

function RegisterVolunteerModal({ skills, saving, onClose, onSubmit }: { skills: BackendSkill[]; saving: boolean; onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: 'female',
    state: '',
    lga: '',
    squad: '',
    status: 'active',
    years_of_experience: '0',
    skills: [] as string[],
  });

  return (
    <div className="member-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <form className="member-modal" onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...form,
          years_of_experience: Number(form.years_of_experience) || 0,
          skills: skills.filter((skill) => form.skills.includes(skill.name)).map((skill) => skill.id),
        });
      }}>
        <div className="member-modal-header">
          <div>
            <span className="details-ref">NEW FIELD VOLUNTEER</span>
            <h2>Register Field Volunteer</h2>
          </div>
          <button type="button" className="member-modal-close" aria-label="Close register form" onClick={onClose}>×</button>
        </div>
        <p className="member-modal-copy">Create the volunteer directly in the Django roster. Writes are permission-gated (super_admin/admin/coordinator) and audited.</p>
        <div className="member-form-grid">
          <label>First name<input required value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} placeholder="Amina" /></label>
          <label>Last name<input required value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} placeholder="Bello" /></label>
          <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="amina@example.ng" /></label>
          <label>Phone<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+2348031122290" /></label>
          <label>Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="female">Female</option><option value="male">Male</option></select></label>
          <label>Years of experience<input type="number" min="0" value={form.years_of_experience} onChange={(event) => setForm({ ...form, years_of_experience: event.target.value })} /></label>
          <label>State<input required value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="Kaduna State" /></label>
          <label>LGA<input required value={form.lga} onChange={(event) => setForm({ ...form, lga: event.target.value })} placeholder="Giwa LGA" /></label>
          <label>Squad<input value={form.squad} onChange={(event) => setForm({ ...form, squad: event.target.value })} placeholder="Zone 1" /></label>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="pending">Pending</option><option value="on_leave">On Leave</option></select></label>
        </div>
        <label style={{ display: 'grid', gap: 5, marginTop: 12, color: '#536071', fontSize: 12, fontWeight: 700 }}>Skills / specializations
          <div className="vol-skill-chips">
            {skills.map((skill) => (
              <button key={skill.id} type="button" className={`member-action${form.skills.includes(skill.name) ? ' selected' : ''}`} style={form.skills.includes(skill.name) ? { borderColor: '#087f5b', background: '#087f5b', color: '#fff' } : {}} onClick={() => setForm((prev) => ({ ...prev, skills: prev.skills.includes(skill.name) ? prev.skills.filter((name) => name !== skill.name) : [...prev.skills, skill.name] }))}>
                {skill.name}
              </button>
            ))}
            {skills.length === 0 && <span style={{ color: '#8993a0', fontSize: 11 }}>No skills registered yet (volunteer-skills registry empty).</span>}
          </div>
        </label>
        <div className="member-modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? 'Registering...' : 'Register Volunteer'}</button>
        </div>
      </form>
    </div>
  );
}

function BatchHoursModal({ volunteers, programs, saving, onClose, onSubmit }: { volunteers: BackendVolunteer[]; programs: BackendProgram[]; saving: boolean; onClose: () => void; onSubmit: (payload: { volunteer_ids: string[]; program_id: string; activity: string; hours: number; date: string; location: string }) => void }) {
  const [form, setForm] = useState({
    program_id: programs[0]?.program_id ?? '',
    activity: 'Field operations',
    hours: '4',
    date: new Date().toISOString().slice(0, 10),
    location: '',
  });

  return (
    <div className="member-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <form className="member-modal" onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ volunteer_ids: volunteers.map((row) => row.id), program_id: form.program_id, activity: form.activity, hours: Number(form.hours) || 0, date: form.date, location: form.location });
      }}>
        <div className="member-modal-header">
          <div>
            <span className="details-ref">BATCH SHIFT LOGGING</span>
            <h2>Log Hours for {volunteers.length} Volunteer{volunteers.length === 1 ? '' : 's'}</h2>
          </div>
          <button type="button" className="member-modal-close" aria-label="Close batch hours form" onClick={onClose}>×</button>
        </div>
        <p className="member-modal-copy">Creates shift log records (pending verification) for every selected volunteer against the chosen program. Audited via hours_logged.</p>
        <div className="member-form-grid">
          <label>Program<select required value={form.program_id} onChange={(event) => setForm({ ...form, program_id: event.target.value })}>
            <option value="">Select program</option>
            {programs.map((program) => <option key={program.id} value={program.program_id}>{program.title} ({program.program_id})</option>)}
          </select></label>
          <label>Activity<input required value={form.activity} onChange={(event) => setForm({ ...form, activity: event.target.value })} /></label>
          <label>Hours<input required type="number" min="1" value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })} /></label>
          <label>Shift date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
        </div>
        <label className="member-form-grid" style={{ gridTemplateColumns: '1fr', display: 'grid' }}>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. Giwa LGA demo site" /></label>
        <div className="member-modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={saving || volunteers.length === 0}>{saving ? 'Logging…' : `Log ${form.hours}h × ${volunteers.length}`}</button>
        </div>
      </form>
    </div>
  );
}

function ConfirmModal({ title, prompt, placeholder, confirmLabel, danger, onCancel, onConfirm }: { title: string; prompt: string; placeholder: string; confirmLabel: string; danger: boolean; onCancel: () => void; onConfirm: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="member-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onCancel(); }}>
      <form className="member-modal" onSubmit={(event) => { event.preventDefault(); if (value.trim()) onConfirm(value.trim()); }}>
        <div className="member-modal-header">
          <div>
            <span className="details-ref">FIELD ROSTER ACTION</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="member-modal-close" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <p className="member-modal-copy">{prompt}</p>
        <label style={{ display: 'grid', gap: 5, color: '#536071', fontSize: 12, fontWeight: 700 }}>Reason / note
          <textarea required value={value} onChange={(event) => setValue(event.target.value)} rows={3} placeholder={placeholder} style={{ padding: '9px 11px', border: '1px solid #dfe3ec', borderRadius: 4, background: '#fbfcfe', color: '#172033', fontSize: 13 }} />
        </label>
        <div className="member-modal-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit" className={danger ? undefined : 'primary'} style={danger ? { border: '1px solid #f3c8c4', background: '#fff5f3', color: '#b33520' } : undefined}>{confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}

export { resolveVolunteerId };