import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className='page-header reveal-up'>
      <div>
        {eyebrow ? <p className='eyebrow'>{eyebrow}</p> : null}
        <h1 className='page-title'>{title}</h1>
        {description ? <p className='page-description'>{description}</p> : null}
      </div>
      {action ? <div className='page-header-action'>{action}</div> : null}
    </header>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className='state-panel' role='status' aria-live='polite'>
      <span className='loading-dot' aria-hidden='true' />
      <span>{label}...</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className='state-panel empty-state'>
      <span className='empty-mark' aria-hidden='true'>+</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className='state-panel error-state' role='alert'>
      <div>
        <h2>Something went wrong</h2>
        <p>{message}</p>
      </div>
      {onRetry ? <button type='button' className='secondary-button compact-button' onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/_/g, '-');
  const tone = ['active', 'completed', 'published', 'approved', 'read'].includes(normalized)
    ? 'success'
    : ['pending', 'draft', 'planning', 'warning'].includes(normalized)
      ? 'warning'
      : ['failed', 'cancelled', 'rejected', 'suspended', 'inactive'].includes(normalized)
        ? 'danger'
        : 'info';

  return <span className={`status-badge status-${tone}`}>{status.replace(/_/g, ' ')}</span>;
}

export function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <article className='stat-card reveal-up'>
      <p className='stat-label'>{label}</p>
      <p className='stat-value'>{value}</p>
      {detail ? <p className='stat-detail'>{detail}</p> : null}
    </article>
  );
}