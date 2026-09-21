'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BackendMember,
  MemberStats,
  MemberTabKey,
  deleteMember,
  exportMembersCsv,
  fetchMembers,
  fetchMemberStats,
  registerMember,
  setMemberStatus,
  updateMember,
} from '../../lib/memberApi';

export type MemberDetailTab = 'registry' | 'contact' | 'profile' | 'timeline';

export type MemberStage = { title: string; status: 'passed' | 'inreview' | 'locked'; details: string };

export type MemberRow = BackendMember & {
  age: number | null;
  stages: MemberStage[];
  stageLabel: string;
};

const TAB_META: Array<{ key: MemberTabKey; label: string }> = [
  { key: 'all', label: 'All Members' },
  { key: 'pending', label: 'Pending Enrollment' },
  { key: 'active', label: 'Active Members' },
  { key: 'beneficiaries', label: 'Beneficiaries' },
  { key: 'suspended', label: 'Suspended' },
];

const STATUS_TONE: Record<string, string> = {
  active: 'mint',
  pending: 'amber',
  suspended: 'red',
  inactive: 'blue',
  archived: 'blue',
};

const FALLBACK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

const FALLBACK_TYPES = [
  { value: 'regular', label: 'Regular Member' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'donor', label: 'Donor' },
  { value: 'beneficiary', label: 'Beneficiary' },
  { value: 'staff', label: 'Staff' },
  { value: 'board', label: 'Board Member' },
  { value: 'partner', label: 'Partner' },
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function computeAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

function buildStages(status: string): { stages: MemberStage[]; label: string } {
  const normalized = status.toLowerCase();
  const enrolled: MemberStage = {
    title: 'Stage 1: Enrollment & Capture',
    status: 'passed',
    details: 'Registry record created and member identity details captured.',
  };
  const review: MemberStage =
    normalized === 'pending'
      ? {
          title: 'Stage 2: Coordinator Review',
          status: 'inreview',
          details: 'Awaiting coordinator verification of the submitted registry details.',
        }
      : {
          title: 'Stage 2: Coordinator Review',
          status: 'passed',
          details: 'Registry details verified by a program coordinator.',
        };

  let active: MemberStage;
  if (normalized === 'active') {
    active = {
      title: 'Stage 3: Active Status',
      status: 'passed',
      details: 'Member is active and eligible for program benefits.',
    };
  } else if (normalized === 'suspended' || normalized === 'inactive' || normalized === 'archived') {
    active = {
      title: 'Stage 3: Active Status',
      status: 'locked',
      details: `Membership is ${normalized}. Update the status to restore eligibility.`,
    };
  } else {
    active = {
      title: 'Stage 3: Active Status',
      status: 'inreview',
      details: 'Pending final activation of the membership.',
    };
  }

  const stages = [enrolled, review, active];
  const passed = stages.filter((stage) => stage.status === 'passed').length;
  return { stages, label: `${Math.min(passed + 1, 3)} of 3` };
}

function toRow(member: BackendMember): MemberRow {
  const { stages, label } = buildStages(member.status);
  return {
    ...member,
    age: computeAge(member.date_of_birth),
    stages,
    stageLabel: label,
  };
}

export function resolveMemberId(slugs: string[] | undefined): string | undefined {
  if (!slugs || slugs.length === 0) return undefined;
  return slugs[0].toLowerCase();
}

function memberMatchesSlug(member: BackendMember, slug: string): boolean {
  const needle = slug.toLowerCase();
  const memberId = member.member_id?.toLowerCase() ?? '';
  return (
    member.id.toLowerCase() === needle ||
    memberId === needle ||
    memberId.endsWith(`-${needle}`) ||
    memberId.endsWith(needle)
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type MemberForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  state: string;
  lga: string;
  occupation: string;
  skills: string;
  address: string;
  membership_type: string;
  status: string;
  notes: string;
};

const EMPTY_FORM: MemberForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  gender: 'female',
  date_of_birth: '',
  state: '',
  lga: '',
  occupation: '',
  skills: '',
  address: '',
  membership_type: 'beneficiary',
  status: 'pending',
  notes: '',
};

export default function MembersRoster({ initialMemberId }: { initialMemberId?: string }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<MemberTabKey>('all');
  const [detailTab, setDetailTab] = useState<MemberDetailTab>('registry');
  const [dossierOpen, setDossierOpen] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [moreFilters, setMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rowsPerPage = 20;

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedSearch(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [list, statsResult] = await Promise.all([
          fetchMembers({
            page,
            search: appliedSearch,
            state: stateFilter,
            membershipType: typeFilter,
            status: statusFilter,
            ordering,
          }),
          fetchMemberStats(),
        ]);
        if (!active) return;
        setMembers((list.results ?? []).map(toRow));
        setCount(list.count ?? 0);
        setStats(statsResult ?? null);
        setOffline(false);
      } catch {
        if (active) {
          setOffline(true);
          setMembers([]);
          setCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [page, appliedSearch, stateFilter, typeFilter, statusFilter, ordering, refreshKey]);

  useEffect(() => {
    if (members.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev && members.some((member) => member.id === prev)) return prev;
      const match = initialMemberId ? members.find((member) => memberMatchesSlug(member, initialMemberId)) : undefined;
      return (match ?? members[0]).id;
    });
  }, [members, initialMemberId]);

  const selected = useMemo(
    () => members.find((member) => member.id === selectedId) ?? members[0] ?? null,
    [members, selectedId],
  );

  const pageCount = Math.max(1, Math.ceil(count / rowsPerPage));
  const pageStart = count === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(page * rowsPerPage, count);

  const kpis = stats?.kpis ?? {};
  const totalMembers = kpis.total_members ?? 0;
  const activeMembers = kpis.active ?? 0;
  const activePercent = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 1000) / 10 : 0;

  const statusOptions = stats?.options?.statuses?.length ? stats.options.statuses : FALLBACK_STATUSES;
  const typeOptions = stats?.options?.membership_types?.length ? stats.options.membership_types : FALLBACK_TYPES;
  const stateOptions = stats?.options?.states ?? [];

  const tabCount = (key: MemberTabKey) => stats?.tabs?.[key] ?? 0;

  function selectMember(id: string) {
    setSelectedId(id);
    setDossierOpen(true);
  }

  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setTab(tab: MemberTabKey) {
    setActiveTab(tab);
    setPage(1);
    if (tab === 'all') {
      setStatusFilter('');
      setTypeFilter('');
    } else if (tab === 'beneficiaries') {
      setTypeFilter('beneficiary');
      setStatusFilter('');
    } else {
      setStatusFilter(tab);
      setTypeFilter('');
    }
  }

  function resetFilters() {
    setSearchTerm('');
    setAppliedSearch('');
    setStateFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setOrdering('-created_at');
    setActiveTab('all');
    setPage(1);
  }

  function openCreate() {
    setModalMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function openEdit(member: MemberRow) {
    setModalMode('edit');
    setEditingId(member.id);
    setForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      gender: member.gender || 'female',
      date_of_birth: member.date_of_birth ?? '',
      state: member.state,
      lga: member.lga,
      occupation: member.occupation ?? '',
      skills: member.skills ?? '',
      address: member.address ?? '',
      membership_type: member.membership_type || 'regular',
      status: member.status || 'pending',
      notes: member.notes ?? '',
    });
    setFormError(null);
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
    setFormError(null);
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload: Record<string, unknown> = { ...form, date_of_birth: form.date_of_birth || null };
    try {
      if (modalMode === 'edit' && editingId) {
        await updateMember(editingId, payload);
        setNotice(`Updated ${form.first_name} ${form.last_name}.`);
      } else {
        await registerMember(payload);
        setNotice(`Registered ${form.first_name} ${form.last_name} in the member registry.`);
      }
      closeModal();
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save the member.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(member: MemberRow, status: string) {
    setSaving(true);
    try {
      await setMemberStatus(member.id, status);
      setNotice(`${member.full_name} marked ${status}.`);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update status.');
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(member: MemberRow) {
    if (!window.confirm(`Delete ${member.full_name} (${member.member_id})? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteMember(member.id);
      setNotice(`Deleted ${member.full_name}.`);
      setSelectedId(null);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to delete member.');
    } finally {
      setSaving(false);
    }
  }

  async function batchActivate() {
    const targets = members.filter((member) => checked.has(member.id));
    if (targets.length === 0) {
      setNotice('No members selected. Tick a checkbox to select.');
      return;
    }
    setSaving(true);
    try {
      for (const member of targets) {
        await setMemberStatus(member.id, 'active');
      }
      setNotice(`Activated ${targets.length} selected member${targets.length === 1 ? '' : 's'}.`);
      setChecked(new Set());
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Batch activation failed.');
    } finally {
      setSaving(false);
    }
  }

  async function exportRegistry() {
    try {
      await exportMembersCsv({
        search: appliedSearch,
        state: stateFilter,
        membershipType: typeFilter,
        status: statusFilter,
      });
      setNotice('Member registry exported.');
    } catch {
      setNotice('Unable to export the registry.');
    }
  }

  return (
    <main className="members-content">
      <div className="members-kicker">
        <span>● CORE OPERATIONS</span>
        <i>•</i>
        <span>MEMBERS &amp; BENEFICIARIES REGISTRY</span>
      </div>
      <div className="members-heading">
        <div>
          <h1>Members &amp; Community Roster</h1>
          <p>
            Manage community enrollments, membership verification states, programmatic allocations, and contact profiles
            across all state federations.
          </p>
        </div>
        <div className="members-actions">
          <button type="button" onClick={exportRegistry}>Export Registry (CSV)</button>
          <button type="button" onClick={batchActivate} disabled={saving}>Batch Activate</button>
          <button type="button" className="primary" onClick={openCreate}>+ Register New Member</button>
        </div>
      </div>
      {notice && <div className="members-live-notice">{notice}</div>}

      <div className="members-kpis">
        <div className="member-kpi reveal-up">
          <span className="member-kpi-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#087f5b" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <span className="member-kpi-label">TOTAL ENROLLED<br />MEMBERS</span>
          <strong>{totalMembers}</strong>
          <small>Enrolled</small>
          <span className="member-kpi-foot">{loading ? 'Syncing…' : `${kpis.states_covered ?? 0} states covered`}</span>
        </div>
        <div className="member-kpi reveal-up">
          <span className="member-kpi-top-badge amber">ACTION<br />REQUIRED</span>
          <span className="member-kpi-label">VERIFICATION<br />BACKLOG</span>
          <strong className="warn">{kpis.pending ?? 0}</strong>
          <small>Pending Review</small>
          <span className="member-kpi-foot">Awaiting coordinator verification</span>
        </div>
        <div className="member-kpi reveal-up">
          <span className="member-kpi-top-badge green">{activePercent}%<br />ACTIVE</span>
          <span className="member-kpi-label">ACTIVE<br />MEMBERS</span>
          <strong>{activeMembers}</strong>
          <small>Active</small>
          <span className="member-progress"><i style={{ ['--bar' as string]: `${activePercent}%` }} /></span>
        </div>
        <div className="member-kpi reveal-up">
          <span className="member-kpi-icon orange"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2600a" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13"/><path d="M9 21v-8h6v8"/><path d="M12 6V3"/><path d="m8 4 4-2 4 2"/></svg></span>
          <span className="member-kpi-label">BENEFICIARY<br />MEMBERS</span>
          <strong>{kpis.beneficiaries ?? 0}</strong>
          <small>beneficiaries</small>
          <span className="member-kpi-foot">Enrolled on beneficiary membership</span>
        </div>
      </div>

      <div className="members-tabs" role="tablist" aria-label="Member status filters">
        {TAB_META.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`member-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setTab(tab.key)}
          >
            {tab.label}
            <span className="member-tab-count">{tabCount(tab.key)}</span>
          </button>
        ))}
      </div>

      <div className="members-filters">
        <span>⌕</span>
        <input aria-label="Search members" placeholder="Search by Member ID, Name, Email, Phone..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        <select aria-label="State filter" value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }}>
          <option value="">All States</option>
          {stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
        <select aria-label="Membership type filter" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}>
          <option value="">All Membership Types</option>
          {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select aria-label="Status filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button type="button" className="members-more-btn" onClick={() => setMoreFilters((value) => !value)}>More Filters</button>
      </div>

      {moreFilters && (
        <div className="members-advanced">
          <label>SORT BY
            <select value={ordering} onChange={(event) => { setOrdering(event.target.value); setPage(1); }}>
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="-joined_at">Recently joined</option>
              <option value="first_name">Name A–Z</option>
            </select>
          </label>
          <label>LIVE FILTERS
            <span style={{ fontSize: 11, color: '#7c8794', fontWeight: 600 }}>
              {[appliedSearch && `“${appliedSearch}”`, stateFilter, typeFilter, statusFilter].filter(Boolean).join(' · ') || 'No filters applied'}
            </span>
          </label>
          <label className="members-advanced-reset">
            <button type="button" className="members-more-btn" onClick={resetFilters} style={{ width: '100%', padding: '6px 8px', border: '1px solid #e3e5ef', borderRadius: 4, background: '#fff' }}>Reset All Filters</button>
          </label>
        </div>
      )}

      <div className="members-layout">
        <section className="member-list">
          <div className="member-roster-toolbar">
            <span className="member-roster-check"><input type="checkbox" aria-label="Select all displayed" checked={members.length > 0 && members.every((row) => checked.has(row.id))} onChange={() => { if (members.every((row) => checked.has(row.id))) setChecked(new Set()); else setChecked(new Set(members.map((row) => row.id))); }} /></span>
            <strong>Active Roster</strong>
            <span>(Showing {members.length} of {count} records)</span>
            <span className="member-roster-sort">{loading ? 'Syncing…' : 'Live from PostgreSQL'}</span>
          </div>
          <div className="member-table-head">
            <span />
            <span>MEMBER IDENTITY</span>
            <span>LOCATION</span>
            <span>MEMBERSHIP TYPE</span>
            <span>OCCUPATION</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>
          {members.map((row) => (
            <div
              key={row.id}
              className={`member-row${selectedId === row.id ? ' selected' : ''}`}
              onClick={() => selectMember(row.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectMember(row.id); }}
            >
              <span className="member-roster-check" onClick={(event) => event.stopPropagation()}>
                <input type="checkbox" checked={checked.has(row.id)} onChange={() => toggleChecked(row.id)} />
              </span>
              <div className="member-identity">
                <span className="member-id-line">
                  <span className="member-avatar">{initials(row.full_name)}</span>
                  <span className="member-id-inner">
                    <strong className="member-name">{row.full_name}</strong>
                    <span className="member-ref">{`#${row.member_id}`}</span>
                  </span>
                </span>
                <span className="member-meta">{row.gender || '—'}{row.age != null ? ` · ${row.age} yrs` : ''}</span>
              </div>
              <div className="member-cell">
                <strong>{row.state || '—'}</strong>
                <small>{row.lga || '—'}</small>
              </div>
              <div className="member-cell">
                <span className="member-badge blue">{(row.membership_type || 'regular').toUpperCase()}</span>
              </div>
              <div className="member-cell">
                <strong>{row.occupation || '—'}</strong>
                <small>{row.skills ? row.skills.split(',')[0].trim() : '—'}</small>
              </div>
              <div className="member-stage">
                <span className={`member-badge ${STATUS_TONE[row.status] ?? 'blue'}`}>{(row.status || 'pending').toUpperCase()}</span>
                <span className="member-progress-cells"><i><b style={{ width: `${(Number(row.stageLabel.split(' of ')[0]) / 3) * 100}%` }} /></i></span>
              </div>
              <div className="member-actions">
                <button type="button" className="member-action" onClick={(event) => { event.stopPropagation(); selectMember(row.id); }}>View</button>
                <button type="button" className="member-action" onClick={(event) => { event.stopPropagation(); openEdit(row); }}>Edit</button>
              </div>
            </div>
          ))}
          {loading && members.length === 0 && <div className="member-loading">Loading member registry…</div>}
          {!loading && members.length === 0 && (
            <div className="member-loading">
              {offline ? 'Member API offline. Unable to reach the Django registry.' : 'No member records match the current filters.'}
            </div>
          )}
          <div className="member-pagination">
            <span>Showing {pageStart} to {pageEnd} of {count} members</span>
            <span>Rows: <b>{rowsPerPage}</b></span>
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => (
              <button key={number} type="button" className={page === number ? 'current' : ''} onClick={() => setPage(number)}>{number}</button>
            ))}
            {pageCount > 5 && <span>...</span>}
            <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
          </div>
        </section>

        {dossierOpen && selected ? (
          <MemberDossier
            member={selected}
            detailTab={detailTab}
            saving={saving}
            onTabChange={setDetailTab}
            onClose={() => setDossierOpen(false)}
            onEdit={() => openEdit(selected)}
            onStatus={(status) => changeStatus(selected, status)}
            onDelete={() => removeMember(selected)}
          />
        ) : (
          <aside className="member-dossier" style={{ display: 'grid', placeItems: 'center', minHeight: 220, color: '#8a93a0', fontSize: 10 }}>
            Select a member to open its dossier.
          </aside>
        )}
      </div>

      {modalMode && (
        <div className="member-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeModal(); }}>
          <form className="member-modal" onSubmit={saveMember}>
            <div className="member-modal-header">
              <div>
                <span className="details-ref">{modalMode === 'edit' ? 'UPDATE MEMBER RECORD' : 'NEW MEMBER ENROLLMENT'}</span>
                <h2>{modalMode === 'edit' ? 'Edit Member' : 'Register New Member'}</h2>
              </div>
              <button type="button" className="member-modal-close" aria-label="Close form" onClick={closeModal}>×</button>
            </div>
            <p className="member-modal-copy">
              {modalMode === 'edit'
                ? 'Update the member record in the Django community registry.'
                : 'Create a member directly in the Django community registry.'}
            </p>
            <div className="member-form-grid">
              <label>First name<input required value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} placeholder="Amina" /></label>
              <label>Last name<input required value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} placeholder="Bello" /></label>
              <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="amina@example.ng" /></label>
              <label>Phone<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+234 803 000 0000" /></label>
              <label>Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
              <label>Date of birth<input type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} /></label>
              <label>State<input required value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="Kaduna State" /></label>
              <label>LGA<input required value={form.lga} onChange={(event) => setForm({ ...form, lga: event.target.value })} placeholder="Giwa LGA" /></label>
              <label>Occupation<input value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} placeholder="Petty trader" /></label>
              <label>Skills<input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Tailoring, Data entry" /></label>
              <label>Membership type<select value={form.membership_type} onChange={(event) => setForm({ ...form, membership_type: event.target.value })}>{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label style={{ gridColumn: '1 / -1' }}>Address<textarea rows={2} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="House address / community" /></label>
              <label style={{ gridColumn: '1 / -1' }}>Notes<textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Case notes" /></label>
            </div>
            {formError && <div className="member-form-error">{formError}</div>}
            <div className="member-modal-actions">
              <button type="button" onClick={closeModal}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : 'Register Member'}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function MemberDossier({
  member,
  detailTab,
  saving,
  onTabChange,
  onClose,
  onEdit,
  onStatus,
  onDelete,
}: {
  member: MemberRow;
  detailTab: MemberDetailTab;
  saving: boolean;
  onTabChange: (tab: MemberDetailTab) => void;
  onClose: () => void;
  onEdit: () => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const passedStages = member.stages.filter((stage) => stage.status === 'passed').length;

  return (
    <aside className="member-dossier">
      <div className="dossier-top">
        <div>
          <span className="dossier-ref">{`#${member.member_id}`} — COMMUNITY MEMBER</span>
          <h2>{member.full_name}</h2>
        </div>
        <button type="button" className="dossier-close" aria-label="Close member dossier" onClick={onClose}>×</button>
      </div>
      <div className="dossier-status-row">
        <span className={`member-badge ${STATUS_TONE[member.status] ?? 'blue'}`}>{(member.status || 'pending').toUpperCase()}</span>
        <span className="member-badge blue">{(member.membership_type || 'regular').toUpperCase()}</span>
      </div>
      <div className="dossier-profile">
        <span className="member-avatar">{initials(member.full_name)}</span>
        <div className="dossier-profile-detail">
          <strong>{member.full_name}</strong>
          <span>Phone: <b>{member.phone || '—'}</b></span>
          <span>Email: <b>{member.email || '—'}</b></span>
        </div>
        <div className="dossier-profile-side">{member.gender || '—'}{member.age != null ? `, ${member.age}` : ''}</div>
      </div>
      <div className="dossier-window">
        <div className="dossier-window-item"><span>Location</span><span>{member.state || '—'} • {member.lga || '—'}</span></div>
        <div className="dossier-window-item"><span>Occupation</span><span>{member.occupation || '—'}</span></div>
        <div className="dossier-window-item"><span>Joined</span><span>{formatDate(member.joined_at)}</span></div>
        <div className="dossier-window-item ok"><span>Live Sync</span><span>Linked to Django registry</span></div>
      </div>
      <div className="dossier-tabs">
        <button type="button" className={detailTab === 'registry' ? 'active' : ''} onClick={() => onTabChange('registry')}>Registry &amp; Verification</button>
        <button type="button" className={detailTab === 'contact' ? 'active' : ''} onClick={() => onTabChange('contact')}>Contact</button>
        <button type="button" className={detailTab === 'profile' ? 'active' : ''} onClick={() => onTabChange('profile')}>Profile</button>
        <button type="button" className={detailTab === 'timeline' ? 'active' : ''} onClick={() => onTabChange('timeline')}>Timeline</button>
      </div>

      {detailTab === 'registry' && (
        <section>
          <div className="dossier-section-header">
            <span>MEMBERSHIP<br />LIFECYCLE</span>
            <span>Stage {Math.min(passedStages + 1, 3)} of 3</span>
          </div>
          {member.stages.map((stage, index) => (
            <div key={index} className="verification-stage">
              <span className={`stage-icon ${stage.status}`}>{stage.status === 'passed' ? '✓' : stage.status === 'inreview' ? '↻' : '🔒'}</span>
              <div className="stage-body">
                <div className="stage-title">
                  <span>{stage.title}</span>
                  <span className={`stage-status ${stage.status}`}>{stage.status === 'passed' ? 'PASSED' : stage.status === 'inreview' ? 'IN REVIEW' : 'LOCKED'}</span>
                </div>
                <p className="stage-detail">{stage.details}</p>
              </div>
            </div>
          ))}
          <div className="dossier-banner">
            <span>REGISTRY REFERENCE</span>
            <strong>{member.member_id} • {(member.state || 'UNSPECIFIED').toUpperCase()}</strong>
          </div>
        </section>
      )}

      {detailTab === 'contact' && (
        <section>
          <div className="dossier-section-header"><span>CONTACT &amp; LOCATION</span><span>{member.lga || '—'}</span></div>
          <div className="household-blocks">
            <div className="household-block"><b>Phone</b><small>{member.phone || 'Not provided'}</small></div>
            <div className="household-block"><b>Email</b><small>{member.email || 'Not provided'}</small></div>
            <div className="household-block"><b>State</b><small>{member.state || '—'}</small></div>
            <div className="household-block"><b>LGA</b><small>{member.lga || '—'}</small></div>
          </div>
          <div className="dossier-banner"><span>ADDRESS</span><strong>{member.address || 'No address on file'}</strong></div>
        </section>
      )}

      {detailTab === 'profile' && (
        <section>
          <div className="dossier-section-header"><span>OCCUPATION &amp; SKILLS</span><span>{(member.membership_type || 'regular').toUpperCase()}</span></div>
          <div className="household-blocks">
            <div className="household-block"><b>Occupation</b><small>{member.occupation || 'Not recorded'}</small></div>
            <div className="household-block"><b>Gender</b><small>{member.gender || '—'}</small></div>
            <div className="household-block"><b>Date of birth</b><small>{formatDate(member.date_of_birth)}</small></div>
            <div className="household-block"><b>Age</b><small>{member.age != null ? `${member.age} years` : '—'}</small></div>
          </div>
          <div className="dossier-banner"><span>SKILLS</span><strong>{member.skills || 'No skills recorded'}</strong></div>
          {member.notes && <div className="dossier-banner"><span>NOTES</span><strong>{member.notes}</strong></div>}
        </section>
      )}

      {detailTab === 'timeline' && (
        <section>
          <div className="dossier-section-header"><span>RECORD TIMELINE</span><span>PostgreSQL</span></div>
          <div className="verification-stage">
            <span className="stage-icon passed">✓</span>
            <div className="stage-body">
              <div className="stage-title"><span>Joined the registry</span><span className="stage-status passed">JOINED</span></div>
              <p className="stage-detail">Member record added on {formatDate(member.joined_at)}.</p>
            </div>
          </div>
          <div className="verification-stage">
            <span className="stage-icon passed">✓</span>
            <div className="stage-body">
              <div className="stage-title"><span>Record created</span><span className="stage-status passed">CREATED</span></div>
              <p className="stage-detail">Dossier created at {member.created_at ? new Date(member.created_at).toLocaleString() : '—'}.</p>
            </div>
          </div>
          <div className="verification-stage">
            <span className="stage-icon inreview">↻</span>
            <div className="stage-body">
              <div className="stage-title"><span>Last updated</span><span className="stage-status inreview">RECENT</span></div>
              <p className="stage-detail">Most recent change at {member.updated_at ? new Date(member.updated_at).toLocaleString() : '—'}.</p>
            </div>
          </div>
        </section>
      )}

      <div className="dossier-actions">
        <button type="button" onClick={onEdit} disabled={saving}>Edit</button>
        {member.status === 'active' ? (
          <button type="button" className="danger" onClick={() => onStatus('suspended')} disabled={saving}>Suspend</button>
        ) : (
          <button type="button" className="primary" onClick={() => onStatus('active')} disabled={saving}>Activate</button>
        )}
        <button type="button" onClick={onDelete} disabled={saving}>Delete</button>
      </div>
    </aside>
  );
}
