'use client';

import OpsShell from './OpsShell';

export function WorkspaceShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <OpsShell>
      <div className="db-content">
        <header style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand-text)', fontWeight: 700 }}>{kicker.toUpperCase()}</p>
          <h1 style={{ fontSize: 24, margin: '6px 0 4px' }}>{title}</h1>
          {subtitle ? <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </OpsShell>
  );
}

export function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 13, letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>{title.toUpperCase()}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        letterSpacing: '0.08em',
        padding: '3px 8px',
        borderRadius: 999,
        background: 'var(--accent-soft)',
        color: 'var(--text-secondary)',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: 0 }}>{message}</p>;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--danger-text)', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 10, padding: '10px 12px' }}>
      {message}
    </p>
  );
}
