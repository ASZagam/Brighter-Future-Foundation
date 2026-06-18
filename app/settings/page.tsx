'use client';

import { useEffect, useState } from 'react';
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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiGet<SettingsData>('/core/settings/current/');
        setSettings(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load organization settings.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function updateField<K extends keyof SettingsData>(field: K, value: SettingsData[K]) {
    if (!settings) return;
    setSaving(true);

    try {
      const updated = await apiPatch<SettingsData>(`/core/settings/${settings.id}/`, {
        [field]: value,
      });
      setSettings(updated);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  function buildField<T extends string | number | boolean>(label: string, value: T, onChange: (value: any) => void, type: string = 'text') {
    return (
      <div className='form-field'>
        <label className='field-label'>{label}</label>
        {type === 'textarea' ? (
          <textarea className='field-textarea' value={value as string} onChange={(event) => onChange(event.target.value)} />
        ) : type === 'checkbox' ? (
          <label style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type='checkbox' checked={value as boolean} onChange={(event) => onChange(event.target.checked)} />
            <span>{label}</span>
          </label>
        ) : (
          <input
            value={value as string | number}
            onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
            className='field-input'
            type={type}
          />
        )}
      </div>
    );
  }

  return (
    <div className='page-shell' style={{ padding: '3rem 0' }}>
      <div className='section-title'>
        <div>
          <p className='eyebrow'>Organization Settings</p>
          <h1>Manage system configuration</h1>
        </div>
        <Link href='/core' className='button-link'>Return to Core</Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p className='text-muted'>Update platform defaults and support contact settings for your organization.</p>
      </div>

      <div className='form-panel'>
        {loading ? (
          <p>Loading settings…</p>
        ) : settings ? (
          <>
            <div className='form-field'>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <label className='field-label'>Organization</label>
                  <p style={{ margin: 4, color: '#0f172a', fontWeight: 700 }}>{settings.organization_name}</p>
                </div>
                <span className='action-button' style={{ padding: '10px 16px', borderRadius: 14, minHeight: 'auto' }}>Saved live</span>
              </div>
            </div>

            {buildField('Default timezone', settings.default_timezone, (value) => updateField('default_timezone', value), 'text')}
            {buildField('Default language', settings.default_language, (value) => updateField('default_language', value), 'text')}
            {buildField('Support email', settings.support_email, (value) => updateField('support_email', value), 'email')}
            {buildField('Support phone', settings.support_phone, (value) => updateField('support_phone', value), 'text')}
            {buildField('Maintenance mode', settings.maintenance_mode, (value) => updateField('maintenance_mode', value), 'checkbox')}
            {buildField('Enable file uploads', settings.enable_file_uploads, (value) => updateField('enable_file_uploads', value), 'checkbox')}
            {buildField('Max upload size (MB)', settings.max_upload_size_mb, (value) => updateField('max_upload_size_mb', value), 'number')}
            {buildField('Notification sender', settings.notification_sender, (value) => updateField('notification_sender', value), 'text')}
            {buildField('Analytics enabled', settings.analytics_enabled, (value) => updateField('analytics_enabled', value), 'checkbox')}

            {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
            <div style={{ marginTop: 16 }}>
              <button
                type='button'
                className='button-link'
                style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
                onClick={() => settings && updateField('default_timezone', settings.default_timezone)}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Refresh values'}
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: '#64748b' }}>No settings found. Please configure an organization in the backend first.</p>
        )}
      </div>
    </div>
  );
}
