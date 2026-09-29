import { absoluteMediaUrl, formatDate } from '@/lib/publicApi';
import { EmptyState, SectionHeading } from '../Primitives';
import type { PublicFieldReport } from '@/lib/publicApi';

/**
 * Reviewed field reports. Everything listed here has passed publication review,
 * so each entry carries a real date and location.
 */
export function FieldReports({ reports }: { reports: PublicFieldReport[] }) {
  return (
    <section className="pub-section pub-section-soft" aria-labelledby="reports-heading">
      <SectionHeading
        id="reports-heading"
        eyebrow="Field reports"
        title="Verified reporting from the field"
        lede="Reports are published only after review, so every entry below carries a real publication date and location."
      />

      {reports.length > 0 ? (
        <ul className="pub-report-grid">
          {reports.map((report) => {
            const image = absoluteMediaUrl(report.image);
            return (
              <li className="pub-report-card" key={report.id}>
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="pub-report-img" />
                ) : null}
                <div className="pub-report-body">
                  <p className="pub-tag pub-tag-verified">
                    {report.is_featured ? 'Featured report' : 'Field report'}
                  </p>
                  <h3>{report.title}</h3>
                  <p>{report.summary || 'Summary pending publication.'}</p>
                  <p className="pub-report-meta">
                    <span>{report.program_title}</span>
                    {report.location ? <span> · {report.location}</span> : null}
                    <span> · {formatDate(report.submitted_at)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="No field reports published yet"
          detail="Field reports are written during programme delivery and published here once verified. See our transparency page for current reporting coverage."
          action={{ href: '/transparency', label: 'View transparency' }}
        />
      )}
    </section>
  );
}
