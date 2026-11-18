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
    <div className="pub-metric pub-metric-pending" title="Awaiting data">
      <p className="pub-metric-value">Awaiting data</p>
      <p className="pub-metric-label">{label}</p>
    </div>
  );
}

/**
 * `id` is forwarded to the rendered <h2> so a section can point
 * `aria-labelledby` at its own heading. Previously each section rendered a
 * second, visually hidden <h2> purely for that, which put two near-identical
 * headings for every section into the accessibility tree.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lede,
  align = 'left',
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`pub-heading pub-heading-${align}`}>
      {eyebrow ? <p className="pub-eyebrow">{eyebrow}</p> : null}
      <h2 id={id}>{title}</h2>
      {lede ? <p className="pub-lede">{lede}</p> : null}
    </div>
  );
}
