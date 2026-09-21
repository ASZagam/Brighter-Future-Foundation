'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch } from '../../lib/api';

interface SettingsData {
  id: number;
  organization: number;
  organization_name: string;
  default_timezone: string;
  default_language: string;
  support_email: string;
  support_phone: string;
  maintenance_mode: boolean;
  enable_file_uploads: boolean;
  max_upload_size_mb: number;
  notification_sender: string;
  analytics_enabled: boolean;
  updated_at?: string;
}

type Draft = {
  default_timezone: string;
  default_language: string;
  support_email: string;
  support_phone: string;
  notification_sender: string;
  max_upload_size_mb: number;
  enable_file_uploads: boolean;
  maintenance_mode: boolean;
  analytics_enabled: boolean;
};

const TIMEZONES = ['UTC', 'Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Europe/London', 'America/New_York'];
const LANGUAGES = [
  { value: 'en', label: 'English (en)' },
  { value: 'fr', label: 'French (fr)' },
  { value: 'es', label: 'Spanish (es)' },
  { value: 'ar', label: 'Arabic (ar)' },
  { value: 'ha', label: 'Hausa (ha)' },
  { value: 'yo', label: 'Yoruba (yo)' },
  { value: 'ig', label: 'Igbo (ig)' },
];

function toDraft(settings: SettingsData): Draft {
  return {
    default_timezone: settings.default_timezone,
    default_language: settings.default_language,
    support_email: settings.support_email,
    support_phone: settings.support_phone,
    notification_sender: settings.notification_sender,
    max_upload_size_mb: settings.max_upload_size_mb,
    enable_file_uploads: settings.enable_file_uploads,
    maintenance_mode: settings.maintenance_mode,
    analytics_enabled: settings.analytics_enabled,
  };
}

export default function SettingsContent() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<SettingsData>('/core/settings/current/');
      setSettings(data);
      setDraft(toDraft(data));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load organization settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!settings || !draft) return false;
    return JSON.stringify(toDraft(settings)) !== JSON.stringify(draft);
  }, [settings, draft]);

  function set<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    setNotice('');
  }

  async function save() {
    if (!settings || !draft || !dirty) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await apiPatch<SettingsData>(`/core/settings/${settings.id}/`, draft);
      setSettings(updated);
      setDraft(toDraft(updated));
      setNotice('Settings saved to the Django backend.');
    } catch (err: any) {
      setError(err.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="core-content">
      <div className="core-kicker">
        <span>FOUNDATION &amp; ADMINISTRATION</span>
        <i>|</i>
        <span style={{ color: '#6b7584', fontWeight: 600 }}>Platform defaults, support &amp; upload configuration</span>
      </div>

      <div className="core-heading">
        <div>
          <h1>Organization Settings</h1>
          <p>Manage platform defaults, support contacts, and upload policy for the registered organization workspace.</p>
        </div>
        <div className="core-heading-actions">
          <button type="button" onClick={load} disabled={loading || saving}>{loading ? 'Loading…' : '↻ Refresh'}</button>
          <Link href="/admin">Audit Activity Logs</Link>
          <Link href="/core" className="primary">Back to Core</Link>
        </div>
      </div>

      {error ? <div className="core-live-notice warn">API issue — {error}</div> : notice ? (
        <div className="core-live-notice">{notice}</div>
      ) : null}

      {loading && !settings ? (
        <section className="core-panel"><div className="settings-loading">Loading organization settings…</div></section>
      ) : settings && draft ? (
        <>
          <section className="core-panel">
            <div className="core-panel-toolbar">
              <strong>Organization</strong>
              <span>Live from Django · {settings.organization_name}</span>
            </div>
            <div className="settings-grid">
              <label className="settings-field">
                <span className="settings-label">Organization name</span>
                <input className="settings-input" value={settings.organization_name} readOnly />
              </label>
              <label className="settings-field">
                <span className="settings-label">Last updated</span>
                <input className="settings-input" value={settings.updated_at ? new Date(settings.updated_at).toLocaleString() : '—'} readOnly />
              </label>
            </div>
          </section>

          <section className="core-panel" style={{ marginTop: 12 }}>
            <div className="core-panel-toolbar"><strong>Platform defaults</strong><span>Locale &amp; language</span></div>
            <div className="settings-grid">
              <label className="settings-field">
                <span className="settings-label">Default timezone</span>
                <select className="settings-input" value={draft.default_timezone} onChange={(event) => set('default_timezone', event.target.value)}>
                  {!TIMEZONES.includes(draft.default_timezone) && <option value={draft.default_timezone}>{draft.default_timezone}</option>}
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </label>
              <label className="settings-field">
                <span className="settings-label">Default language</span>
                <select className="settings-input" value={draft.default_language} onChange={(event) => set('default_language', event.target.value)}>
                  {!LANGUAGES.some((l) => l.value === draft.default_language) && <option value={draft.default_language}>{draft.default_language}</option>}
                  {LANGUAGES.map((lang) => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="core-panel" style={{ marginTop: 12 }}>
            <div className="core-panel-toolbar"><strong>Support &amp; notifications</strong><span>Contact channels</span></div>
            <div className="settings-grid">
              <label className="settings-field">
                <span className="settings-label">Support email</span>
                <input type="email" className="settings-input" value={draft.support_email} onChange={(event) => set('support_email', event.target.value)} placeholder="support@example.org" />
              </label>
              <label className="settings-field">
                <span className="settings-label">Support phone</span>
                <input className="settings-input" value={draft.support_phone} onChange={(event) => set('support_phone', event.target.value)} placeholder="+234 800 000 0000" />
              </label>
              <label className="settings-field">
                <span className="settings-label">Notification sender</span>
                <input type="email" className="settings-input" value={draft.notification_sender} onChange={(event) => set('notification_sender', event.target.value)} placeholder="no-reply@example.org" />
              </label>
              <label className="settings-field">
                <span className="settings-label">Max upload size (MB)</span>
                <input type="number" min={1} max={500} className="settings-input" value={draft.max_upload_size_mb} onChange={(event) => set('max_upload_size_mb', Number(event.target.value))} />
              </label>
            </div>
          </section>

          <section className="core-panel" style={{ marginTop: 12 }}>
            <div className="core-panel-toolbar"><strong>Operational toggles</strong><span>Feature flags</span></div>
            <div className="settings-toggles">
              <label className="settings-toggle">
                <input type="checkbox" checked={draft.enable_file_uploads} onChange={(event) => set('enable_file_uploads', event.target.checked)} />
                <span><strong>Enable file uploads</strong><small>Allow members and staff to upload documents and images.</small></span>
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={draft.maintenance_mode} onChange={(event) => set('maintenance_mode', event.target.checked)} />
                <span><strong>Maintenance mode</strong><small>Show a maintenance notice and pause non-admin traffic.</small></span>
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={draft.analytics_enabled} onChange={(event) => set('analytics_enabled', event.target.checked)} />
                <span><strong>Analytics enabled</strong><small>Collect platform usage analytics for reporting.</small></span>
              </label>
            </div>
          </section>

          <div className="settings-actions">
            <span className={`settings-dirty${dirty ? ' active' : ''}`}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
            <button type="button" onClick={() => setDraft(toDraft(settings))} disabled={!dirty || saving}>Discard</button>
            <button type="button" className="primary" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>

          <div className="core-api-status">
            <span className="go">● System Good</span>
            <span>PATCH <b>/api/core/settings/{settings.id}/</b></span>
            <span className="nl">Live via REST</span>
            <span>{settings.default_timezone}</span>
          </div>
        </>
      ) : (
        <section className="core-panel"><div className="settings-loading">No settings available.</div></section>
      )}
    </main>
  );
}
