'use client';

import { useEffect, useState } from 'react';
import './programs.css';
import Sidebar from '../dashboard/components/Sidebar';
import TopHeader from '../dashboard/components/TopHeader';
import { apiCall, apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import type { DashboardUser } from '../dashboard/hooks/useDashboard';

type GalleryImage = { id: number; image: string; caption: string; published: boolean; uploaded_by_name?: string; uploaded_at: string };

type Program = { id?: string; ref: string; sector: string; title: string; dates: string; elapsed: string; state: string; cluster: string; lead: string; coordinator: string; budget: string; grantor: string; status: string; priority: string; tone: string; beneficiaryCount: number; budgetValue: number; spentValue: number; utilization: number; beneficiaries?: Array<{ id: string; full_name: string }>; reports?: Array<{ id: number; title: string; summary: string }>; gallery?: GalleryImage[] };

const fallbackPrograms: Program[] = [
  { ref: '#PRG-2026-004', sector: 'WASH', title: 'Kaduna Clean Water & Sanitation', dates: '15 Jan 2026 - 30 Nov 2026', elapsed: '68% Elapsed', state: 'Kaduna State', cluster: 'Giwa & Igabi LGAs Cluster', lead: 'Dr. Aliyu M.', coordinator: 'Amina B.', budget: '$78,450 / $120k', grantor: 'UNICEF & Global Fund', status: 'ACTIVE', priority: 'HIGH PRIORITY', tone: 'green', beneficiaryCount: 1450, budgetValue: 120000, spentValue: 78450, utilization: 65.3 },
  { ref: '#PRG-2026-002', sector: 'HEALTH', title: 'Abuja Mobile Healthcare Outreach', dates: '01 Feb 2026 - 31 Dec 2026', elapsed: '24% Elapsed', state: 'Abuja FCT', cluster: 'Bwari & Kuje Satellite Wards', lead: 'Nurse C. Okoye', coordinator: 'K. Adeyemi', budget: '$45,000 / $60k', grantor: 'USAID Maternal Pool', status: 'ACTIVE', priority: 'HIGH PRIORITY', tone: 'green', beneficiaryCount: 0, budgetValue: 60000, spentValue: 45000, utilization: 75 },
  { ref: '#PRG-2026-007', sector: 'EDUCATION', title: 'Kano Youth Digital Literacy & Skills', dates: '10 Mar 2026 - 10 Dec 2026', elapsed: 'In Setup', state: 'Kano State', cluster: 'Fagge & Kano Technology Hubs', lead: 'Engr. I. Usman', coordinator: 'Amina B.', budget: '$15,000 / $85k', grantor: 'African Dev Bank Grant', status: 'PLANNING', priority: 'STANDARD', tone: 'blue', beneficiaryCount: 0, budgetValue: 85000, spentValue: 15000, utilization: 17.6 },
  { ref: '#PRG-2026-001', sector: 'EMERGENCY', title: 'Borno IDP Food Security & Resilience', dates: '01 Jan 2026 - 31 Dec 2026', elapsed: '90% Elapsed', state: 'Borno State', cluster: 'Maiduguri & Jere Transit Camps', lead: 'Z. Kyari (Field Lead)', coordinator: 'B. Umar', budget: '$188,000 / $280k', grantor: 'UN WFP Emergency Facility', status: 'ACTIVE', priority: 'CRITICAL', tone: 'red', beneficiaryCount: 0, budgetValue: 280000, spentValue: 188000, utilization: 67.1 },
  { ref: '#PRG-2026-005', sector: 'ECONOMIC', title: 'Enugu Rural Agribusiness Micro-Grants', dates: '01 Jan 2026 - 31 Aug 2026', elapsed: '65% Elapsed', state: 'Enugu State', cluster: 'Nsukka & Udi Farm & Cooperatives', lead: 'C. Eze', coordinator: 'Nwosu', budget: '$52,000 / $80k', grantor: 'BFF Seed Allocation', status: 'ACTIVE', priority: 'STANDARD', tone: 'teal', beneficiaryCount: 0, budgetValue: 80000, spentValue: 52000, utilization: 65 },
  { ref: '#PRG-2025-012', sector: 'HEALTH', title: 'Lagos Maternal Nutrition & Infant Care', dates: 'Completed & Handed Over (Dec 2025)', elapsed: 'Audit Reconciled 100%', state: 'Lagos State', cluster: 'Alimosho Primary Care Centers', lead: 'Dr. F. Adeleke', coordinator: '-', budget: '$95,000 / $95k', grantor: 'Audit Reconciled 100%', status: 'COMPLETED', priority: 'HANDOVER', tone: 'gray', beneficiaryCount: 0, budgetValue: 95000, spentValue: 95000, utilization: 100 },
];

type BackendProgram = {
  id: string;
  program_id: string;
  title: string;
  category: { name: string } | null;
  status: string;
  priority: string;
  state_name: string;
  lga: string;
  start_date: string;
  end_date: string | null;
  budget: string | number;
  amount_spent: string | number;
  percentage_budget_used: number;
  beneficiary_count: number;
  manager_name: string;
  coordinator_name: string;
  beneficiaries: Array<{ id: string; full_name: string }>;
  reports: Array<{ id: number; title: string; summary: string }>;
  gallery?: GalleryImage[];
};

type ProgramSummary = {
  total_programs: number;
  active_programs: number;
  completed_programs: number;
  cancelled_programs: number;
  total_budget: number;
  total_spent: number;
};

function formatMoney(value: string | number): string {
  return `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return 'No end date';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toneForProgram(program: BackendProgram): string {
  if (program.priority === 'critical') return 'red';
  if (program.status === 'planning') return 'blue';
  if (program.category?.name.toLowerCase().includes('economic')) return 'teal';
  if (program.status === 'completed' || program.status === 'archived') return 'gray';
  return 'green';
}

function mapProgram(program: BackendProgram): Program {
  const spent = Number(program.amount_spent || 0);
  const budget = Number(program.budget || 0);
  const percentage = Number(program.percentage_budget_used || (budget ? (spent / budget) * 100 : 0));
  return {
    id: program.id,
    ref: program.program_id,
    sector: program.category?.name?.toUpperCase() || 'GENERAL',
    title: program.title,
    dates: `${formatDate(program.start_date)} - ${formatDate(program.end_date)}`,
    elapsed: `${Math.round(percentage)}% Budget Used`,
    state: program.state_name || 'Unassigned state',
    cluster: program.lga || 'Regional cluster not assigned',
    lead: program.manager_name || 'Unassigned',
    coordinator: program.coordinator_name || 'Unassigned',
    budget: `${formatMoney(spent)} / ${formatMoney(budget)}`,
    grantor: 'Backend program record',
    status: program.status.toUpperCase(),
    priority: program.priority.toUpperCase(),
    tone: toneForProgram(program),
    beneficiaryCount: program.beneficiary_count,
    budgetValue: budget,
    spentValue: spent,
    utilization: percentage,
    beneficiaries: program.beneficiaries ?? [],
    reports: program.reports ?? [],
    gallery: program.gallery ?? [],
  };
}

function Badge({ children, tone = '' }: { children: React.ReactNode; tone?: string }) { return <span className={`program-badge ${tone}`}>{children}</span>; }

function ProgramRow({ program, selected, onSelect }: { program: Program; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`program-row ${selected ? 'selected' : ''}`} onClick={onSelect}>
    <div className="program-initiative"><span className={`program-ref ${program.tone}`}>{program.ref}</span><Badge tone={program.tone}>{program.sector}</Badge><strong>{program.title}</strong><small>{program.dates}</small><small>{program.elapsed}</small></div>
    <div className="program-cell"><strong>{program.state}</strong><small>{program.cluster}</small></div>
    <div className="program-cell"><strong>{program.lead}</strong><small>Coord: {program.coordinator}</small></div>
    <div className="program-cell budget-cell"><strong>{program.budget}</strong><small>{program.grantor}</small><span className="mini-progress"><i style={{ width: `${Math.min(program.utilization, 100)}%` }} /></span></div>
    <div className="program-status"><Badge tone={program.status === 'COMPLETED' ? 'gray' : program.tone}>{program.status}</Badge><Badge tone={program.priority === 'CRITICAL' ? 'red' : program.priority === 'HIGH PRIORITY' ? 'mint' : 'gray'}>{program.priority}</Badge></div>
  </button>;
}

function GalleryTab({ program, onChanged }: { program: Program; onChanged: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GalleryImage | null>(null);
  const images = program.gallery ?? [];

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!program.id) { setError('Select a live program before uploading photos.'); return; }
    if (!file) { setError('Choose an image to upload.'); return; }
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('program', program.id);
      body.append('caption', caption);
      body.append('published', 'true');
      body.append('image', file);
      await apiCall('/core/program-gallery/', { method: 'POST', body });
      setFile(null);
      setCaption('');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload the photo.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(image: GalleryImage) {
    setBusy(true);
    setError(null);
    try { await apiPatch(`/core/program-gallery/${image.id}/`, { published: !image.published }); onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update the photo.'); }
    finally { setBusy(false); }
  }

  async function remove(image: GalleryImage) {
    if (!window.confirm('Delete this photo and caption?')) return;
    setBusy(true);
    setError(null);
    try { await apiDelete(`/core/program-gallery/${image.id}/`); onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete the photo.'); }
    finally { setBusy(false); }
  }

  return <div className="program-gallery">
    <form className="program-gallery-form" onSubmit={upload}>
      <input type="file" accept="image/*" aria-label="Program photo" onChange={(event) => setFile(event.target.files ? event.target.files[0] : null)} />
      <input type="text" placeholder="Add a caption for the website" aria-label="Photo caption" value={caption} onChange={(event) => setCaption(event.target.value)} />
      <button type="submit" className="primary" disabled={busy}>{busy ? 'Saving…' : 'Upload photo'}</button>
    </form>
    {error ? <p className="program-gallery-error">{error}</p> : null}
    {images.length ? <div className="program-gallery-grid">{images.map((image) => <figure className="program-gallery-item" key={image.id}>
      <button type="button" className="program-gallery-thumb" onClick={() => setPreview(image)} aria-label="Open full image"><img src={image.image} alt={image.caption || 'Program photo'} loading="lazy" /></button>
      <figcaption><span>{image.caption || 'No caption'}</span><Badge tone={image.published ? 'mint' : 'gray'}>{image.published ? 'ON SITE' : 'HIDDEN'}</Badge></figcaption>
      <div className="program-gallery-actions"><button type="button" disabled={busy} onClick={() => toggle(image)}>{image.published ? 'Hide' : 'Publish'}</button><button type="button" disabled={busy} onClick={() => remove(image)}>Delete</button></div>
    </figure>)}</div> : <p className="program-gallery-empty">No photos uploaded yet. Add an image and caption to show this program on the website.</p>}
    {preview ? <div className="program-gallery-preview" onClick={() => setPreview(null)}>
      <button type="button" className="preview-close" aria-label="Close image" onClick={() => setPreview(null)}>×</button>
      <figure onClick={(event) => event.stopPropagation()}><img src={preview.image} alt={preview.caption || 'Program photo'} /><figcaption>{preview.caption || 'No caption'}</figcaption></figure>
    </div> : null}
  </div>;
}

function DetailsPanel({ program, detailTab, onTabChange, onEdit, onLogMilestone, onGalleryChange }: { program: Program; detailTab: 'overview' | 'beneficiaries' | 'reports' | 'gallery'; onTabChange: (tab: 'overview' | 'beneficiaries' | 'reports' | 'gallery') => void; onEdit: () => void; onLogMilestone: () => void; onGalleryChange: () => void }) {
  return <aside className="program-details">
    <div className="details-top"><div><span className="details-ref">{program.ref} - {program.sector} MANDATE</span><h2>{program.title}</h2></div><span className="details-close">×</span></div>
    <div className="details-badges"><Badge tone="mint">{program.status}</Badge><Badge tone="mint">{program.priority} DEPLOYMENT</Badge><Badge>Zone 1 Cluster</Badge></div>
    <div className="details-tabs"><button type="button" className={detailTab === 'overview' ? 'active' : ''} onClick={() => onTabChange('overview')}>Overview</button><button type="button" className={detailTab === 'beneficiaries' ? 'active' : ''} onClick={() => onTabChange('beneficiaries')}>Beneficiaries ({program.beneficiaries?.length ?? program.beneficiaryCount})</button><button type="button" className={detailTab === 'reports' ? 'active' : ''} onClick={() => onTabChange('reports')}>Reports ({program.reports?.length ?? 0})</button><button type="button" className={detailTab === 'gallery' ? 'active' : ''} onClick={() => onTabChange('gallery')}>Photos ({program.gallery?.length ?? 0})</button></div>
    {detailTab === 'beneficiaries' && <div className="detail-related-list">{program.beneficiaries?.length ? program.beneficiaries.map((beneficiary) => <div key={beneficiary.id}>{beneficiary.full_name}</div>) : <span>No beneficiary records have been added.</span>}</div>}
    {detailTab === 'reports' && <div className="detail-related-list">{program.reports?.length ? program.reports.map((report) => <div key={report.id}><b>{report.title}</b><small>{report.summary}</small></div>) : <span>No milestone reports have been logged.</span>}</div>}
    {detailTab === 'gallery' && <GalleryTab program={program} onChanged={onGalleryChange} />}
    <div className="program-banner"><span>FIELD OPERATIONS</span><strong>{program.state} {program.cluster !== 'Regional cluster not assigned' ? `/ ${program.cluster}` : ''}</strong></div>
    <div className="detail-stats"><div><strong>{program.beneficiaryCount.toLocaleString()}</strong><small>VERIFIED BENEFICIARIES</small></div><div><strong>{(program.beneficiaries ?? []).length}</strong><small>BENEFICIARY RECORDS</small></div><div><strong>{(program.reports ?? []).length}</strong><small>MILESTONE REPORTS</small></div></div>
    <section className="ledger"><div className="section-label-row"><strong>GRANT ALLOCATION LEDGER</strong><span>{program.utilization.toFixed(1)}% Utilized</span></div><div className="ledger-values"><div><small>COMMITTED</small><strong>{formatMoney(program.budgetValue)}</strong></div><div><small>DISBURSED</small><strong>{formatMoney(program.spentValue)}</strong></div><div><small>BALANCE</small><strong>{formatMoney(program.budgetValue - program.spentValue)}</strong></div></div><div className="detail-progress"><i style={{ width: `${Math.min(program.utilization, 100)}%` }} /></div><p>Primary Grantor: <b>{program.grantor}</b><span>Backend program record</span></p></section>
    <section className="milestones"><div className="section-label-row"><strong>IMPLEMENTATION MILESTONES</strong><span>{(program.reports ?? []).length} reports</span></div>{(program.reports ?? []).length ? program.reports?.map((report) => <div className="milestone" key={report.id}><b>{report.title || 'Milestone report'}</b><small>{report.summary}</small></div>) : <span style={{ color: '#8a93a0', fontSize: 11 }}>No milestone reports logged yet.</span>}</section>
    <div className="details-actions"><button type="button" onClick={onEdit}>Edit Mandate</button><button type="button" className="primary" onClick={onLogMilestone}>Log Milestone</button></div>
  </aside>;
}

type ProgramForm = {
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  budget: string;
  amount_spent: string;
  beneficiary_count: string;
};

const initialProgramForm: ProgramForm = {
  title: '',
  description: '',
  status: 'planning',
  priority: 'medium',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  budget: '',
  amount_spent: '0',
  beneficiary_count: '0',
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>(fallbackPrograms);
  const [summary, setSummary] = useState<ProgramSummary | null>(null);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [selectedRef, setSelectedRef] = useState(fallbackPrograms[0].ref);
  const [loading, setLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<ProgramForm>(initialProgramForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [detailTab, setDetailTab] = useState<'overview' | 'beneficiaries' | 'reports' | 'gallery'>('overview');

  useEffect(() => {
    let mounted = true;
    const query = new URLSearchParams({ ordering: '-created_at', page_size: '100' });
    if (searchTerm) query.set('search', searchTerm);
    if (statusFilter) query.set('status', statusFilter);
    if (priorityFilter) query.set('priority', priorityFilter);
    Promise.allSettled([
      apiGet<{ results: BackendProgram[]; count: number }>(`/core/programs/?${query.toString()}`),
      apiGet<ProgramSummary>('/core/programs/dashboard/'),
      fetch('/api/auth/me', { credentials: 'include' }).then((response) => response.ok ? response.json() : null),
    ]).then(([programResult, summaryResult, userResult]) => {
      if (!mounted) return;
      if (programResult.status === 'fulfilled' && Array.isArray(programResult.value.results)) {
        const livePrograms = programResult.value.results.map(mapProgram);
        if (livePrograms.length > 0) {
          setPrograms(livePrograms);
          setSelectedRef(livePrograms[0].ref);
        }
      } else {
        setLiveError('Live program data is unavailable. Showing the latest workspace snapshot.');
      }
      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
      if (userResult.status === 'fulfilled') setUser(userResult.value);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [refreshKey, searchTerm, statusFilter, priorityFilter]);

  async function createProgram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await apiPost('/core/programs/', {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date,
        end_date: form.end_date || null,
        budget: Number(form.budget),
        amount_spent: Number(form.amount_spent || 0),
        beneficiary_count: Number(form.beneficiary_count || 0),
      });
      setIsCreateOpen(false);
      setForm(initialProgramForm);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create the program.');
    } finally {
      setSaving(false);
    }
  }

  async function editSelectedProgram() {
    if (!selected.id) return;
    const title = window.prompt('Program title', selected.title);
    if (!title || title === selected.title) return;
    try {
      await apiPatch(`/core/programs/${selected.id}/`, { title });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to update the program.');
    }
  }

  async function logMilestone() {
    if (!selected.id) return;
    const title = window.prompt('Milestone title');
    if (!title) return;
    const summary = window.prompt('Milestone summary', 'Milestone logged from BFF Operations.');
    try {
      await apiPost('/core/program-reports/', { program: selected.id, title, summary: summary || '' });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to log the milestone.');
    }
  }

  async function batchUpdateStatus() {
    const nextStatus = window.prompt('New status: active, planning, completed, or archived', 'active');
    if (!nextStatus || !visiblePrograms.length) return;
    try {
      await Promise.all(visiblePrograms.filter((program) => program.id).map((program) => apiPatch(`/core/programs/${program.id}/`, { status: nextStatus })));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to update the selected programs.');
    }
  }

  function exportPrograms() {
    const header = ['Reference', 'Initiative', 'Sector', 'State', 'Status', 'Priority', 'Budget', 'Spent'];
    const rows = visiblePrograms.map((program) => [program.ref, program.title, program.sector, program.state, program.status, program.priority, program.budgetValue, program.spentValue]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bff-programs.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const selected = programs.find((program) => program.ref === selectedRef) ?? programs[0];
  const totalPrograms = summary?.total_programs ?? programs.length;
  const activePrograms = summary?.active_programs ?? programs.filter((program) => program.status === 'ACTIVE').length;
  const planningPrograms = programs.filter((program) => program.status === 'PLANNING').length;
  const completedPrograms = summary?.completed_programs ?? programs.filter((program) => program.status === 'COMPLETED').length;
  const totalBudget = summary?.total_budget ?? 0;
  const totalSpent = summary?.total_spent ?? 0;
  const spendPercentage = totalBudget ? `${Math.round((totalSpent / totalBudget) * 1000) / 10}%` : '0%';
  const filteredPrograms = programs.filter((program) => (!sectorFilter || program.sector === sectorFilter) && (!stateFilter || program.state === stateFilter));
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredPrograms.length / pageSize));
  const visiblePrograms = filteredPrograms.slice((page - 1) * pageSize, page * pageSize);

  return <div className="db-shell programs-shell"><Sidebar user={user} /><div className="db-main"><TopHeader notificationCount={3} /><main className="programs-content">
    <div className="programs-kicker"><span>● OPERATIONAL PORTFOLIO</span><i>•</i><span>36 FEDERATED STATE CLUSTERS</span></div>
    <div className="programs-heading"><div><h1>Programs &amp; Field Initiatives</h1><p>Manage programmatic mandates, grant disbursement schedules, designated field officers, and multi-sectoral cluster rollouts.</p></div><div className="programs-actions"><button type="button" onClick={exportPrograms}>Export CSV / Audit Log</button><button type="button" onClick={batchUpdateStatus}>Batch Status Update</button><button type="button" className="primary" onClick={() => { setFormError(null); setIsCreateOpen(true); }}>+ Create New Program</button></div></div>
    {liveError && <div className="program-live-notice">{liveError}</div>}
    <div className="programs-kpis">{[['TOTAL PROGRAMS', String(totalPrograms), 'All program portfolios'], ['ACTIVE INITIATIVES', String(activePrograms), `${totalPrograms ? Math.round((activePrograms / totalPrograms) * 1000) / 10 : 0}% Live`], ['IN PLANNING PHASE', String(planningPrograms), 'Planning records'], ['ARCHIVED / HANDOVER', String(completedPrograms), 'Completed programs'], ['COMMITTED GRANT BUDGET', formatMoney(totalBudget), `Disbursed: ${formatMoney(totalSpent)}`]].map(([label, value, detail], index) => <div className="program-kpi" key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small>{(index === 1 || index === 4) && <i className="kpi-progress"><b style={{ width: index === 1 ? `${totalPrograms ? (activePrograms / totalPrograms) * 100 : 0}%` : spendPercentage }} /></i>}</div>)}</div>
    <div className="program-filters"><span>⌕</span><input aria-label="Search programs" placeholder="Kaduna" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} /><select value={sectorFilter} onChange={(event) => { setSectorFilter(event.target.value); setPage(1); }}><option value="">All sectors</option>{Array.from(new Set(programs.map((program) => program.sector))).map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select><select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setPage(1); }}><option value="">All states</option>{Array.from(new Set(programs.map((program) => program.state))).map((state) => <option key={state} value={state}>{state}</option>)}</select><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="planning">Planning</option><option value="completed">Completed</option><option value="archived">Archived</option></select><select value={priorityFilter} onChange={(event) => { setPriorityFilter(event.target.value); setPage(1); }}><option value="">All priorities</option><option value="high">High</option><option value="critical">Critical</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
    <div className="programs-layout"><section className="program-list"><div className="program-table-head"><span>REF CODE &amp;<br />INITIATIVE</span><span>ZONE &amp;<br />REGION</span><span>TEAM LEADS</span><span>BUDGET DISBURSED</span><span>STATUS &amp;<br />LEVEL</span></div>{loading ? <div className="program-loading">Loading live program portfolio...</div> : visiblePrograms.map((program) => <ProgramRow key={program.ref} program={program} selected={program.ref === selected.ref} onSelect={() => setSelectedRef(program.ref)} />)}<div className="program-pagination"><span>Showing {visiblePrograms.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredPrograms.length)} of {filteredPrograms.length} entries</span><span>Rows: <b>10</b></span><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>{Array.from({ length: Math.min(pageCount, 3) }, (_, index) => index + 1).map((number) => <button type="button" key={number} className={page === number ? 'current' : ''} onClick={() => setPage(number)}>{number}</button>)}<button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div></section><DetailsPanel program={selected} detailTab={detailTab} onTabChange={setDetailTab} onEdit={editSelectedProgram} onLogMilestone={logMilestone} onGalleryChange={() => setRefreshKey((value) => value + 1)} /></div>
    <footer className="program-api-status"><span>● REST Endpoint Active:</span><code>GET /api/core/programs/?ordering=-created_at</code><span>Django 5.2 · DRF 3.17<br /><b>Live via REST</b></span><span>Database<br /><b>postgresql · bff_db</b></span><span>Live records<br /><b>{totalPrograms} in Postgres</b></span></footer>
    {isCreateOpen && <div className="program-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsCreateOpen(false); }}><form className="program-modal" onSubmit={createProgram}><div className="program-modal-header"><div><span className="details-ref">NEW PROGRAM MANDATE</span><h2>Create New Program</h2></div><button type="button" className="modal-close" aria-label="Close create program form" onClick={() => setIsCreateOpen(false)}>×</button></div><p className="program-modal-copy">Create a program directly in the Django operations portfolio.</p><label>Program title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Kaduna Clean Water Initiative" /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} placeholder="Describe the mandate and field objective" /></label><div className="program-form-grid"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="planning">Planning</option><option value="active">Active</option><option value="draft">Draft</option></select></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label><label>Start date<input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} /></label><label>End date<input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} /></label><label>Budget (USD)<input required min="0" type="number" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} /></label><label>Beneficiaries<input min="0" type="number" value={form.beneficiary_count} onChange={(event) => setForm({ ...form, beneficiary_count: event.target.value })} /></label></div>{formError && <p className="program-form-error">{formError}</p>}<div className="program-modal-actions"><button type="button" onClick={() => setIsCreateOpen(false)}>Cancel</button><button type="submit" className="primary" disabled={saving}>{saving ? 'Creating...' : 'Create Program'}</button></div></form></div>}
  </main></div></div>;
}