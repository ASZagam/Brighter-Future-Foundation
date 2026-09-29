import { formatCount } from '@/lib/publicApi';
import { PendingMetric, SectionHeading } from '../Primitives';
import type { ResolvedMetricSlot } from './selectors';

/**
 * The four headline figures.
 *
 * Any slot without a published, available metric renders the "Data pending"
 * tile — the section never fills a gap with an estimate.
 */
export function ImpactMetrics({ slots }: { slots: ResolvedMetricSlot[] }) {
  return (
    <section className="pub-section pub-section-soft pub-section-tight" aria-labelledby="impact-heading">
      <SectionHeading
        id="impact-heading"
        eyebrow="Our impact"
        title="What the records show"
        lede="Every figure below is read directly from program, donation and membership records. Figures without a published source are shown as pending rather than estimated."
      />

      <div className="pub-metric-grid">
        {slots.map(({ label, metric }) =>
          metric && metric.available ? (
            <div className="pub-metric" key={label}>
              <p className="pub-metric-value">{formatCount(metric.value)}</p>
              <p className="pub-metric-label">{label}</p>
            </div>
          ) : (
            <PendingMetric key={label} label={label} />
          ),
        )}
      </div>
    </section>
  );
}
