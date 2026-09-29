import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, SectionHeading } from '@/app/components/public/Primitives';
import { formatCurrency, getImpactSummary, getTransparency } from '@/lib/publicApi';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Financial Transparency | Brighter Future Foundation',
  description:
    'Funds raised, budget committed, recorded expenditure and approved allocation of funds, drawn from foundation records.',
  alternates: { canonical: '/transparency' },
};

export default async function TransparencyPage() {
  const [transparency, impact] = await Promise.all([getTransparency(), getImpactSummary()]);
  const allocations = transparency?.allocations ?? [];
  const total = allocations.reduce((sum, a) => sum + Number(a.percentage), 0);

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <p className="pub-eyebrow">Transparency</p>
          <h1>Where the money goes</h1>
          <p className="pub-page-lede">
            Aggregated figures from completed donation records and published program data.
            Internal, pending and failed transactions are excluded.
          </p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            eyebrow="Financial summary"
            title="Aggregated figures"
            lede={transparency?.note}
          />
          {transparency ? (
            <div className="pub-figure-grid">
              <div className="pub-figure">
                <p className="pub-figure-label">Funds raised</p>
                <p className="pub-figure-value">
                  {transparency.funds_raised ? formatCurrency(transparency.funds_raised) : '—'}
                </p>
                <p className="pub-figure-note">Completed donations only</p>
              </div>
              <div className="pub-figure">
                <p className="pub-figure-label">Budget committed</p>
                <p className="pub-figure-value">
                  {transparency.budget_committed
                    ? formatCurrency(transparency.budget_committed)
                    : '—'}
                </p>
                <p className="pub-figure-note">Sum of published program budgets</p>
              </div>
              <div className="pub-figure">
                <p className="pub-figure-label">Expenditure recorded</p>
                <p className="pub-figure-value">
                  {transparency.expenditure_recorded
                    ? formatCurrency(transparency.expenditure_recorded)
                    : '—'}
                </p>
                <p className="pub-figure-note">
                  {transparency.expenditure_recorded
                    ? 'Recorded against programs'
                    : 'No expenditure has been recorded yet'}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Financial data temporarily unavailable"
              detail="The records service did not respond. Figures will return once it is reachable."
            />
          )}
        </div>
      </section>

      <section className="pub-section pub-section-soft">
        <div className="pub-container">
          <SectionHeading
            eyebrow="Allocation"
            title="Approved allocation of funds"
            lede="Allocation percentages are published only after approval by an administrator."
          />

          {allocations.length > 0 ? (
            <>
              <ul className="pub-allocation-bars">
                {allocations.map((a) => (
                  <li key={a.id}>
                    <div className="pub-allocation-bar-head">
                      <span>
                        {a.label}
                        {a.period_label ? ` (${a.period_label})` : ''}
                      </span>
                      <span>{a.percentage}%</span>
                    </div>
                    <div
                      className="pub-allocation-bar"
                      role="img"
                      aria-label={`${a.label}: ${a.percentage}% of allocated funds`}
                    >
                      <span style={{ width: `${Math.min(Number(a.percentage), 100)}%` }} />
                    </div>
                    {a.notes ? <p className="pub-allocation-note">{a.notes}</p> : null}
                  </li>
                ))}
              </ul>
              <p className="pub-figure-note">
                Published allocations total {total.toFixed(2)}%.
              </p>
            </>
          ) : (
            <EmptyState
              title="No approved allocation published"
              detail="We do not publish an estimated or illustrative split. An approved allocation will appear here once it is recorded."
            />
          )}
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading
            eyebrow="Documentation"
            title="Public reporting coverage"
            lede="The share of tracked programs for which a field report has been published."
          />
          {impact?.transparency.public_reporting_coverage !== null &&
          impact?.transparency.public_reporting_coverage !== undefined ? (
            <div className="pub-figure pub-figure-wide">
              <p className="pub-figure-value">
                {impact.transparency.public_reporting_coverage}%
              </p>
              <p className="pub-figure-note">
                {impact.transparency.published_field_reports} published report(s) across{' '}
                {impact.transparency.total_programs} tracked program(s).{' '}
                {impact.transparency.published_allocations} approved allocation statement(s)
                published.
              </p>
            </div>
          ) : (
            <EmptyState
              title="Coverage not yet measurable"
              detail="Coverage requires both tracked programs and published reports."
            />
          )}

          <p className="pub-section-cta">
            <Link href="/impact" className="pub-btn pub-btn-outline">
              See full impact data
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
