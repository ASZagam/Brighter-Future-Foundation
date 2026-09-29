import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EmptyState, SectionHeading } from '@/app/components/public/Primitives';
import {
  absoluteMediaUrl,
  formatCount,
  formatCurrency,
  formatDate,
  getFieldReports,
  getProgram,
} from '@/lib/publicApi';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) return { title: 'Program not found' };
  return {
    title: `${program.title} | Brighter Future Foundation`,
    description: program.description || `Details of the ${program.title} program.`,
    alternates: { canonical: `/programs/${program.slug}` },
    openGraph: {
      title: program.title,
      description: program.description,
      images: absoluteMediaUrl(program.image) ? [absoluteMediaUrl(program.image)!] : undefined,
    },
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) notFound();

  const reports = (await getFieldReports()).filter(
    (r) => r.program_slug === program.slug
  );
  const location = [program.state_name, program.lga].filter(Boolean).join(', ');

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <p className="pub-eyebrow">
            {program.category_name || 'Program'} · {program.program_id}
          </p>
          <h1>{program.title}</h1>
          {location ? <p className="pub-page-lede">{location}</p> : null}
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          {absoluteMediaUrl(program.image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={absoluteMediaUrl(program.image)!}
              alt=""
              className="pub-detail-img"
            />
          ) : null}

          <div className="pub-prose">
            <h2>About this program</h2>
            {program.description ? (
              <p>{program.description}</p>
            ) : (
              <EmptyState
                title="Description pending publication"
                detail="This program has not had a public description published yet."
              />
            )}

            {program.objectives ? (
              <>
                <h2>Objectives</h2>
                <p>{program.objectives}</p>
              </>
            ) : null}

            {program.expected_outcomes ? (
              <>
                <h2>Expected outcomes</h2>
                <p>{program.expected_outcomes}</p>
              </>
            ) : null}
          </div>

          <div className="pub-detail-stats">
            <div className="pub-figure">
              <p className="pub-figure-label">Status</p>
              <p className="pub-figure-value pub-figure-value-sm">{program.status}</p>
            </div>
            <div className="pub-figure">
              <p className="pub-figure-label">Budget</p>
              <p className="pub-figure-value pub-figure-value-sm">
                {formatCurrency(program.budget)}
              </p>
            </div>
            <div className="pub-figure">
              <p className="pub-figure-label">Expenditure</p>
              <p className="pub-figure-value pub-figure-value-sm">
                {formatCurrency(program.amount_spent)}
              </p>
            </div>
            <div className="pub-figure">
              <p className="pub-figure-label">People reached</p>
              <p className="pub-figure-value pub-figure-value-sm">
                {program.beneficiary_count > 0
                  ? formatCount(program.beneficiary_count)
                  : 'Not yet recorded'}
              </p>
            </div>
            <div className="pub-figure">
              <p className="pub-figure-label">Start date</p>
              <p className="pub-figure-value pub-figure-value-sm">
                {formatDate(program.start_date)}
              </p>
            </div>
            <div className="pub-figure">
              <p className="pub-figure-label">End date</p>
              <p className="pub-figure-value pub-figure-value-sm">
                {formatDate(program.end_date)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section pub-section-soft">
        <div className="pub-container">
          <SectionHeading eyebrow="Field reports" title="Reporting on this program" />
          {reports.length > 0 ? (
            <ul className="pub-report-grid">
              {reports.map((report) => (
                <li className="pub-report-card" key={report.id}>
                  <div className="pub-report-body">
                    <p className="pub-tag pub-tag-verified">
                      {report.is_featured ? 'Featured report' : 'Field report'}
                    </p>
                    <h3>{report.title}</h3>
                    <p>{report.summary || 'Summary pending publication.'}</p>
                    <p className="pub-report-meta">
                      {report.location ? <span>{report.location} · </span> : null}
                      <span>{formatDate(report.submitted_at)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No published field reports for this program"
              detail="Reports appear here once they have been written and published."
            />
          )}

          <p className="pub-section-cta">
            <Link href="/programs" className="pub-btn pub-btn-outline">
              Back to all programs
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
