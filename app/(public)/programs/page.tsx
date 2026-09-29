import type { Metadata } from 'next';
import { EmptyState, SectionHeading } from '@/app/components/public/Primitives';
import {
  absoluteMediaUrl,
  formatCount,
  formatCurrency,
  formatDate,
  getPrograms,
} from '@/lib/publicApi';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Our Programs | Water, health and outreach',
  description:
    'Browse Brighter Future Foundation programs with location, status, budget and delivery progress.',
  alternates: { canonical: '/programs' },
};

const STATUS_LABEL: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
};

export default async function ProgramsPage() {
  const programs = await getPrograms();
  const active = programs.filter((p) => p.status === 'active').length;
  const completed = programs.filter((p) => p.status === 'completed').length;
  const planning = programs.filter((p) => p.status === 'planning').length;

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <p className="pub-eyebrow">Our programs</p>
          <h1>Everything we are running</h1>
          <p className="pub-page-lede">
            {programs.length > 0
              ? `${programs.length} program${programs.length === 1 ? '' : 's'} on record — ${active} active, ${planning} in planning, ${completed} completed.`
              : 'Program records appear here once they are published for public viewing.'}
          </p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading eyebrow="Portfolio" title="Program directory" />
          {programs.length > 0 ? (
            <ul className="pub-program-grid">
              {programs.map((program) => (
                <li className="pub-program-card" key={program.id}>
                  {absoluteMediaUrl(program.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={absoluteMediaUrl(program.image)!}
                      alt=""
                      className="pub-program-img"
                    />
                  ) : null}
                  <div className="pub-program-body">
                    <p className="pub-tag">
                      {program.category_name || 'Program'} ·{' '}
                      {STATUS_LABEL[program.status] || program.status}
                    </p>
                    <h3>
                      <a href={`/programs/${program.slug}`}>{program.title}</a>
                    </h3>
                    <p className="pub-program-desc">
                      {program.description || 'Program description pending publication.'}
                    </p>
                    <dl className="pub-program-meta">
                      <div>
                        <dt>Location</dt>
                        <dd>{[program.state_name, program.lga].filter(Boolean).join(', ') || '—'}</dd>
                      </div>
                      <div>
                        <dt>Budget</dt>
                        <dd>{formatCurrency(program.budget)}</dd>
                      </div>
                      <div>
                        <dt>People reached</dt>
                        <dd>
                          {program.beneficiary_count > 0
                            ? formatCount(program.beneficiary_count)
                            : 'Not yet recorded'}
                        </dd>
                      </div>
                      <div>
                        <dt>Start</dt>
                        <dd>{formatDate(program.start_date)}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No programs published yet"
              detail="Nothing has been published to the public catalogue. Check back soon."
            />
          )}
        </div>
      </section>
    </>
  );
}
