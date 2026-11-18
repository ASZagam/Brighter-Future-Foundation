import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, PendingMetric, SectionHeading } from '@/app/components/public/Primitives';
import { formatCount, formatCurrency, getImpactSummary } from '@/lib/publicApi';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Our Impact | Verified programme results',
  description:
    'Programme, funding, volunteer and reach figures read directly from Brighter Future Foundation records.',
  alternates: { canonical: '/impact' },
};

const HEADLINE = [
  { label: 'Programs', source: 'Programs on record' },
  'People reached',
  { label: 'Volunteers', source: 'Active volunteers' },
  { label: 'Members', source: 'Active members' },
  { label: 'Locations', source: 'States reached' },
  'Funds raised',
  'Program budget committed',
  'Expenditure recorded',
];

const NOT_YET = 'Awaiting data';

export default async function ImpactPage() {
  const impact = await getImpactSummary();
  const metrics = impact?.metrics ?? [];
  const headline = HEADLINE.map((item) => {
    const label = typeof item === 'string' ? item : item.label;
    const source = typeof item === 'string' ? item : item.source;
    return { label, metric: metrics.find((m) => m.label === source) };
  });
  const coverage = impact?.transparency.public_reporting_coverage;

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <p className="pub-eyebrow">Impact</p>
          <h1>Verified results, not projections</h1>
          <p className="pub-page-lede">
            Every figure on this page is read directly from programme, donation and
            membership records. Where a record does not exist, the figure is marked
            &ldquo;{NOT_YET}&rdquo; rather than estimated.
          </p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading eyebrow="Headline figures" title="At a glance" />
          <div className="pub-metric-grid pub-impact-grid">
            {headline.map(({ label, metric }) =>
              metric?.available && metric.value !== null ? (
                <div className="pub-metric" key={label}>
                  <p className="pub-metric-value">
                    {metric.unit === 'NGN' ? formatCurrency(metric.value) : formatCount(metric.value)}
                  </p>
                  <p className="pub-metric-label">{label}</p>
                  {metric.source ? <p className="pub-metric-source">Source: {metric.source}</p> : null}
                </div>
              ) : (
                <PendingMetric key={label} label={label} />
              )
            )}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section-soft">
        <div className="pub-container">
          <SectionHeading
            eyebrow="Reporting discipline"
            title="How much of our work is publicly documented"
            lede="Transparency here means a measurable, honest thing: the share of tracked programs that have a published field report."
          />
          {coverage !== null && coverage !== undefined ? (
            <div className="pub-figure pub-figure-wide">
              <p className="pub-figure-value">
                {coverage}% of tracked programs have a published field report
              </p>
              <p className="pub-figure-note">
                {impact?.transparency.published_field_reports ?? 0} published report(s) across{' '}
                {impact?.transparency.total_programs ?? 0} tracked program(s).
              </p>
            </div>
          ) : (
            <EmptyState
              title="Reporting coverage not yet measurable"
              detail="Coverage can only be calculated once programs and published reports exist in the system."
            />
          )}

          <p className="pub-section-cta">
            <Link href="/transparency" className="pub-btn pub-btn-outline">
              Financial transparency
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
