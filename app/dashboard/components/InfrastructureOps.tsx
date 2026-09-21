'use client';

import type { Settings } from '../hooks/useDashboard';

export default function InfrastructureOps({ settings }: { settings: Settings | null }) {
  const rows = [
    { label: 'Cluster Deployment', value: 'Prod-Cluster-01 (Lagos DC)' },
    { label: 'Framework Core', value: 'Django 5.2 LTS' },
    { label: 'Spatial Database', value: 'PostgreSQL 16 Geojango' },
    { label: 'Edge CDN Status', value: 'Active (Cloudflare)' },
  ];

  return (
    <div className="db-infra-card">
      <div className="db-infra-header">
        <h2>Infrastructure &amp; Ops</h2>
        <span className="db-infra-uptime">99.98% UPTIME</span>
      </div>
      <div className="db-infra-rows">
        {rows.map((r) => (
          <div key={r.label} className="db-infra-row">
            <span className="db-infra-row-label">{r.label}</span>
            <span className="db-infra-row-value">{r.value}</span>
          </div>
        ))}
        {settings && (
          <>
            <div className="db-infra-row">
              <span className="db-infra-row-label">Default Timezone</span>
              <span className="db-infra-row-value">{settings.default_timezone}</span>
            </div>
            <div className="db-infra-row">
              <span className="db-infra-row-label">Upload Limit</span>
              <span className="db-infra-row-value">{settings.max_upload_size_mb} MB</span>
            </div>
            <div className="db-infra-row">
              <span className="db-infra-row-label">Analytics</span>
              <span className="db-infra-row-value">{settings.analytics_enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            {settings.maintenance_mode && (
              <div className="db-infra-row" style={{ background: '#FEF3C7' }}>
                <span className="db-infra-row-label" style={{ color: '#92400E', fontWeight: 600 }}>MAINTENANCE MODE</span>
                <span className="db-infra-row-value" style={{ color: '#92400E' }}>Active</span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="db-infra-footer">
        <span>Security Key Rotation: Oct 2026</span>
        <span>SSL/TLS 1.3 Strict</span>
      </div>
    </div>
  );
}
