import Link from 'next/link';

/**
 * Honest empty states. The public pages must never invent a number or a
 * placeholder claim, so sections with no backing data say so plainly.
 */

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="pub-empty" role="note">
      <p className="pub-empty-title">{title}</p>
      {detail ? <p className="pub-empty-detail">{detail}</p> : null}
      {action ? (
        <Link href={action.href} className="pub-btn pub-btn-ghost">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function PendingMetric({ label }: { label: string }) {
  return (
    <div className="pub-metric pub-metric-pending" title="Awaiting published data">
      <p className="pub-metric-value">—</p>
      <p className="pub-metric-label">{label}</p>
      <p className="pub-metric-pending-note">Data pending</p>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`pub-heading pub-heading-${align}`}>
      {eyebrow ? <p className="pub-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {lede ? <p className="pub-lede">{lede}</p> : null}
    </div>
  );
}
