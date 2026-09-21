'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import OpsShell from '../components/OpsShell';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

interface Donation {
  id: string;
  donor_name: string;
  donor_email: string;
  amount: string;
  campaign: string;
  reference: string;
  status: string;
  donated_at: string;
}

interface DonationStats {
  kpis: {
    total_donations: number;
    total_amount: string;
    completed_amount: string;
    completed: number;
    pending: number;
    failed: number;
    campaigns: number;
  };
  options: { campaigns: string[]; statuses: { value: string; label: string }[] };
}

const PAGE_SIZE = 20;
const STATUS_TONES: Record<string, string> = { completed: 'green', pending: 'amber', failed: 'red' };

function money(value: string | number): string {
  return `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function fmtDate(value: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function newReference(): string {
  return `DON-${Date.now().toString(36).toUpperCase()}`;
}

const emptyForm = {
  donor_name: '',
  donor_email: '',
  amount: '',
  campaign: '',
  reference: '',
  status: 'completed',
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [campaign, setCampaign] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (campaign) params.set('campaign', campaign);
    params.set('ordering', '-donated_at');
    params.set('page', String(page));
    return params.toString();
  }, [search, status, campaign, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, stat] = await Promise.all([
        apiGet<{ results: Donation[]; count: number }>(`/core/donations/?${query}`),
        apiGet<DonationStats>('/core/donations/stats/'),
      ]);
      setDonations(list.results ?? []);
      setCount(list.count ?? 0);
      setStats(stat);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load donations.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, campaign]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const kpis = stats?.kpis;

  function openForm() {
    setForm({ ...emptyForm, reference: newReference() });
    setShowForm(true);
    setNotice('');
    setError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.donor_name.trim() || !form.amount) {
      setError('Donor name and amount are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiPost('/core/donations/', {
        donor_name: form.donor_name.trim(),
        donor_email: form.donor_email.trim(),
        amount: form.amount,
        campaign: form.campaign.trim(),
        reference: form.reference.trim() || newReference(),
        status: form.status,
      });
      setShowForm(false);
      setNotice('Donation recorded.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to record donation.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(donation: Donation, next: string) {
    setBusy(true);
    try {
      await apiPatch(`/core/donations/${donation.id}/`, { status: next });
      setNotice(`${donation.donor_name} marked ${next}.`);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to update donation.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(donation: Donation) {
    if (!window.confirm(`Delete donation ${donation.reference}?`)) return;
    setBusy(true);
    try {
      await apiDelete(`/core/donations/${donation.id}/`);
      setNotice('Donation deleted.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to delete donation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OpsShell>
      <main className="ops-page">
        <div className="ops-kicker">
          <span>FUNDING &amp; GRANTS</span>
          <i>|</i>
          <span className="dim">Donation intake, campaigns &amp; reconciliation</span>
        </div>

        <div className="ops-head">
          <div>
            <h1>Donations &amp; Grants</h1>
            <p>Record and reconcile incoming gifts, track campaign performance and monitor settlement status.</p>
          </div>
          <div className="ops-head-actions">
            <button type="button" onClick={load} disabled={loading || busy}>{loading ? 'Loading…' : '↻ Refresh'}</button>
            <button type="button" className="primary" onClick={openForm}>+ Record Donation</button>
          </div>
        </div>

        {error ? <div className="ops-notice warn">API issue — {error}</div> : notice ? <div className="ops-notice">{notice}</div> : null}

        <div className="ops-kpis">
          <div className="ops-kpi accent">
            <span className="ops-kpi-label">Total raised</span>
            <strong className="ops-kpi-value">{kpis ? money(kpis.completed_amount) : '…'}</strong>
            <span className="ops-kpi-foot">completed gifts</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Donations</span>
            <strong className="ops-kpi-value">{kpis?.total_donations ?? '…'}</strong>
            <span className="ops-kpi-foot">all records</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Completed</span>
            <strong className="ops-kpi-value">{kpis?.completed ?? '…'}</strong>
            <span className="ops-kpi-foot">{kpis ? money(kpis.total_amount) + ' pledged' : ''}</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Pending</span>
            <strong className="ops-kpi-value">{kpis?.pending ?? '…'}</strong>
            <span className="ops-kpi-foot">{kpis?.failed ?? 0} failed</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Campaigns</span>
            <strong className="ops-kpi-value">{kpis?.campaigns ?? '…'}</strong>
            <span className="ops-kpi-foot">active designations</span>
          </div>
        </div>

        <section className="ops-panel">
          <div className="ops-toolbar">
            <strong>Donation ledger</strong>
            <div className="ops-toolbar-group">
              <input
                className="ops-input ops-search"
                placeholder="Search donor, reference, campaign…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select className="ops-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">All statuses</option>
                {(stats?.options.statuses ?? []).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <select className="ops-select" value={campaign} onChange={(event) => setCampaign(event.target.value)}>
                <option value="">All campaigns</option>
                {(stats?.options.campaigns ?? []).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Campaign</th>
                  <th>Reference</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="ops-empty-row">Loading donations…</td></tr>
                ) : donations.length === 0 ? (
                  <tr><td colSpan={7} className="ops-empty-row">No donations match the current filters.</td></tr>
                ) : (
                  donations.map((donation) => (
                    <tr key={donation.id}>
                      <td>
                        <span className="strong">{donation.donor_name}</span>
                        {donation.donor_email ? <><br /><span style={{ color: '#8993a0', fontSize: 11 }}>{donation.donor_email}</span></> : null}
                      </td>
                      <td>{donation.campaign || 'General Fund'}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }}>{donation.reference}</td>
                      <td className="num strong">{money(donation.amount)}</td>
                      <td><span className={`ops-chip ${STATUS_TONES[donation.status] || 'grey'}`}>{donation.status}</span></td>
                      <td>{fmtDate(donation.donated_at)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {donation.status !== 'completed' && (
                          <button type="button" className="ops-btn sm ghost" disabled={busy} onClick={() => changeStatus(donation, 'completed')}>Mark paid</button>
                        )}
                        <button type="button" className="ops-btn sm danger" disabled={busy} onClick={() => remove(donation)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ops-pager">
            <span>{count} record{count === 1 ? '' : 's'} · page {page} of {totalPages}</span>
            <div className="ops-pager-controls">
              <button type="button" className="ops-btn sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <button type="button" className="ops-btn sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        </section>

        <div className="ops-status-strip">
          <span className="go">● Ledger live</span>
          <span>GET <b>/api/core/donations/</b> · totals from <b>/donations/stats/</b></span>
          <span className="nl">Live via REST</span>
          <span>Page size {PAGE_SIZE}</span>
        </div>
      </main>

      {showForm ? (
        <div className="ops-modal-backdrop" onClick={() => !busy && setShowForm(false)}>
          <div className="ops-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ops-modal-head">
              <h2>Record Donation</h2>
              <button type="button" className="ops-modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submit}>
              <div className="ops-modal-body">
                <div className="ops-form-grid">
                  <label className="ops-field">
                    <span>Donor name *</span>
                    <input className="ops-input" value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} placeholder="Full name or organisation" />
                  </label>
                  <label className="ops-field">
                    <span>Donor email</span>
                    <input type="email" className="ops-input" value={form.donor_email} onChange={(e) => setForm({ ...form, donor_email: e.target.value })} placeholder="donor@example.org" />
                  </label>
                  <label className="ops-field">
                    <span>Amount (₦) *</span>
                    <input type="number" min="0" step="0.01" className="ops-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                  </label>
                  <label className="ops-field">
                    <span>Campaign</span>
                    <input className="ops-input" list="donation-campaigns" value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} placeholder="General Fund" />
                    <datalist id="donation-campaigns">
                      {(stats?.options.campaigns ?? []).map((item) => <option key={item} value={item} />)}
                    </datalist>
                  </label>
                  <label className="ops-field">
                    <span>Reference</span>
                    <input className="ops-input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                  </label>
                  <label className="ops-field">
                    <span>Status</span>
                    <select className="ops-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {(stats?.options.statuses ?? []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <div className="ops-modal-foot">
                <button type="button" className="ops-btn" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
                <button type="submit" className="ops-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Record donation'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </OpsShell>
  );
}
