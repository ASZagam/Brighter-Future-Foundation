'use client';

import type { Settings } from '../hooks/useDashboard';

export default function InfrastructureOps({ settings }: { settings: Settings | null }) {
  const rows = settings ? [
    { label: 'Default timezone', value: settings.default_timezone },
    { label: 'File upload limit', value: `${settings.max_upload_size_mb} MB` },
    { label: 'Usage analytics', value: settings.analytics_enabled ? 'Enabled' : 'Disabled' },
  ] : [];

  return (
    <div className="db-infra-card">
      <div className="db-infra-header">
        <h2>Operational settings</h2>
      </div>
      <div className="db-infra-rows">
        {rows.length ? rows.map((row) => (
          <div className="db-infra-row" key={row.label}>
            <span className="db-infra-row-label">{row.label}</span>
            <span className="db-infra-row-value">{row.value}</span>
          </div>
        )) : <div className="db-infra-row"><span className="db-infra-row-label">Settings</span><span className="db-infra-row-value">Unavailable</span></div>}
        {settings?.maintenance_mode && (
              <div className="db-infra-row" style={{ background: 'var(--warning-soft)' }}>
                <span className="db-infra-row-label" style={{ color: 'var(--warning-text)', fontWeight: 600 }}>MAINTENANCE MODE</span>
                <span className="db-infra-row-value" style={{ color: 'var(--warning-text)' }}>Active</span>
              </div>
        )}
      </div>
      <div className="db-infra-footer">
        <span>Configured organization defaults</span>
      </div>
    </div>
  );
}
