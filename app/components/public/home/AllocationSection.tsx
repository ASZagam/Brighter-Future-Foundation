import { formatCurrency } from '@/lib/publicApi';
import { EmptyState, SectionHeading } from '../Primitives';
import type { PublicAllocation, TransparencyData } from '@/lib/publicApi';

function Figure({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="pub-figure">
      <p className="pub-figure-label">{label}</p>
      <p className="pub-figure-value">{value}</p>
      {note ? <p className="pub-figure-note">{note}</p> : null}
    </div>
  );
}

/**
 * Financial figures and the approved allocation split.
 *
 * Totals come from completed donations and committed budgets; an unapproved
 * allocation shows an explicit pending state instead of an estimated split.
 */
export function AllocationSection({
  transparency,
  coverage,
  allocations,
}: {
  transparency: TransparencyData | null;
  coverage: number | null;
  allocations: PublicAllocation[];
}) {
  return (
    <section className="pub-section pub-section-soft" aria-labelledby="allocation-heading">
      <SectionHeading
        id="allocation-heading"
        eyebrow="Where funds go"
        title="Allocation and financial transparency"
        lede="Allocation shares and financial totals come from approved public records only."
      />

      <div className="pub-transparency">
        <div className="pub-transparency-figures">
          <Figure
            label="Funds raised (completed donations)"
            value={formatCurrency(transparency?.funds_raised)}
          />
          <Figure
            label="Budget committed"
            value={formatCurrency(transparency?.budget_committed)}
          />
          <Figure
            label="Reporting coverage"
            value={coverage !== null && coverage !== undefined ? `${coverage}%` : 'Awaiting data'}
            note="Share of tracked programs with a published field report"
          />
        </div>

        {allocations.length > 0 ? (
          <div className="pub-allocation">
            <h3>Approved allocation</h3>
            <ul className="pub-allocation-list">
              {allocations.map((allocation) => (
                <li key={allocation.id}>
                  <span className="pub-allocation-label">
                    {allocation.label}
                    {allocation.period_label ? ` (${allocation.period_label})` : ''}
                  </span>
                  <span className="pub-allocation-pct">{allocation.percentage}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            title="Allocation statement pending approval"
            detail="An administrator must publish an approved allocation before it can be shown here. No estimated split is displayed in the meantime."
            action={{ href: '/transparency', label: 'Transparency details' }}
          />
        )}
      </div>
    </section>
  );
}
