'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import OpsShell from '../components/OpsShell';
import { apiCall, apiDelete, apiGet } from '../../lib/api';

interface UploadRecord {
  id: number;
  user: number | null;
  uploaded_by: string;
  title: string;
  description: string;
  file_url: string;
  upload_type: string;
  content_type: string;
  size: number;
  is_active: boolean;
  created_at: string;
}

interface UploadStats {
  kpis: { total: number; images: number; documents: number; total_size_bytes: number };
}

const PAGE_SIZE = 20;

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function fmtDate(value: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FileUploadsPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('document');
  const [file, setFile] = useState<File | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (uploadType) params.set('upload_type', uploadType);
    params.set('ordering', '-created_at');
    params.set('page', String(page));
    return params.toString();
  }, [search, uploadType, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, stat] = await Promise.all([
        apiGet<{ results: UploadRecord[]; count: number }>(`/core/file-uploads/?${query}`),
        apiGet<UploadStats>('/core/file-uploads/stats/'),
      ]);
      setUploads(list.results ?? []);
      setCount(list.count ?? 0);
      setStats(stat);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load file uploads.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, uploadType]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const kpis = stats?.kpis;

  function openForm() {
    setTitle('');
    setDescription('');
    setType('document');
    setFile(null);
    setShowForm(true);
    setError('');
    setNotice('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Please choose a file before uploading.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title || file.name);
      formData.append('description', description);
      formData.append('upload_type', type);
      formData.append('file', file);
      await apiCall<UploadRecord>('/core/file-uploads/', { method: 'POST', body: formData });
      setShowForm(false);
      setNotice('File uploaded to the vault.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to complete file upload.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(upload: UploadRecord) {
    if (!window.confirm(`Delete "${upload.title || 'Untitled file'}"?`)) return;
    setBusy(true);
    try {
      await apiDelete(`/core/file-uploads/${upload.id}/`);
      setNotice('File removed.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to delete file.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <OpsShell>
      <main className="ops-page">
        <div className="ops-kicker">
          <span>ASSET LIBRARY</span>
          <i>|</i>
          <span className="dim">Documents, images &amp; organisation media</span>
        </div>

        <div className="ops-head">
          <div>
            <h1>File Vault</h1>
            <p>Upload and manage the documents and images attached to programmes, reports and the public site.</p>
          </div>
          <div className="ops-head-actions">
            <button type="button" onClick={load} disabled={loading || busy}>{loading ? 'Loading…' : '↻ Refresh'}</button>
            <button type="button" className="primary" onClick={openForm}>+ Upload File</button>
          </div>
        </div>

        {error ? <div className="ops-notice warn">API issue — {error}</div> : notice ? <div className="ops-notice">{notice}</div> : null}

        <div className="ops-kpis">
          <div className="ops-kpi accent">
            <span className="ops-kpi-label">Total files</span>
            <strong className="ops-kpi-value">{kpis?.total ?? '…'}</strong>
            <span className="ops-kpi-foot">in the vault</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Documents</span>
            <strong className="ops-kpi-value">{kpis?.documents ?? '…'}</strong>
            <span className="ops-kpi-foot">PDF, DOCX, XLSX</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Images</span>
            <strong className="ops-kpi-value">{kpis?.images ?? '…'}</strong>
            <span className="ops-kpi-foot">PNG, JPG</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Storage used</span>
            <strong className="ops-kpi-value">{kpis ? formatBytes(kpis.total_size_bytes) : '…'}</strong>
            <span className="ops-kpi-foot">combined size</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Showing</span>
            <strong className="ops-kpi-value">{count}</strong>
            <span className="ops-kpi-foot">matching assets</span>
          </div>
        </div>

        <section className="ops-panel">
          <div className="ops-toolbar">
            <strong>Asset library</strong>
            <div className="ops-toolbar-group">
              <input className="ops-input ops-search" placeholder="Search title, description…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="ops-select" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                <option value="">All types</option>
                <option value="document">Documents</option>
                <option value="image">Images</option>
              </select>
            </div>
          </div>

          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr><th>Asset</th><th>Type</th><th className="num">Size</th><th>Uploaded by</th><th>Date</th><th aria-label="Actions" /></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="ops-empty-row">Loading uploads…</td></tr>
                ) : uploads.length === 0 ? (
                  <tr><td colSpan={6} className="ops-empty-row">No files match the current filters.</td></tr>
                ) : (
                  uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td>
                        <span className="strong">{upload.title || 'Untitled file'}</span>
                        {upload.description ? <><br /><span style={{ color: '#8993a0', fontSize: 11 }}>{upload.description}</span></> : null}
                      </td>
                      <td><span className={`ops-chip ${upload.upload_type === 'image' ? 'blue' : 'grey'}`}>{upload.upload_type || 'file'}</span></td>
                      <td className="num">{formatBytes(upload.size)}</td>
                      <td>{upload.uploaded_by || '—'}</td>
                      <td>{fmtDate(upload.created_at)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <a className="ops-btn sm" href={upload.file_url} target="_blank" rel="noreferrer">Open</a>{' '}
                        <button type="button" className="ops-btn sm danger" disabled={busy} onClick={() => remove(upload)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ops-pager">
            <span>{count} file{count === 1 ? '' : 's'} · page {page} of {totalPages}</span>
            <div className="ops-pager-controls">
              <button type="button" className="ops-btn sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <button type="button" className="ops-btn sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        </section>

        <div className="ops-status-strip">
          <span className="go">● Vault live</span>
          <span>POST multipart to <b>/api/core/file-uploads/</b> · totals from <b>/file-uploads/stats/</b></span>
          <span className="nl">PDF · DOCX · XLSX · PNG · JPG</span>
        </div>
      </main>

      {showForm ? (
        <div className="ops-modal-backdrop" onClick={() => !busy && setShowForm(false)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ops-modal-head">
              <h2>Upload File</h2>
              <button type="button" className="ops-modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submit}>
              <div className="ops-modal-body">
                <div className="ops-form-grid">
                  <label className="ops-field full">
                    <span>Title</span>
                    <input className="ops-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leave blank to use the file name" />
                  </label>
                  <label className="ops-field">
                    <span>Upload type</span>
                    <select className="ops-select" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="document">Document</option>
                      <option value="image">Image</option>
                    </select>
                  </label>
                  <label className="ops-field">
                    <span>File *</span>
                    <input type="file" className="ops-input" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                  </label>
                  <label className="ops-field full">
                    <span>Description</span>
                    <textarea className="ops-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description for the uploaded file" />
                  </label>
                </div>
              </div>
              <div className="ops-modal-foot">
                <button type="button" className="ops-btn" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
                <button type="submit" className="ops-btn primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload file'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </OpsShell>
  );
}
