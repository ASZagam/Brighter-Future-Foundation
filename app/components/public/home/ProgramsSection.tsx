import Link from 'next/link';
import { absoluteMediaUrl, formatCurrency, formatDate } from '@/lib/publicApi';
import { EmptyState, SectionHeading } from '../Primitives';
import type { PublicProgram } from '@/lib/publicApi';

/** Active programmes with their published budget and delivery status. */
export function ProgramsSection({ programs }: { programs: PublicProgram[] }) {
  return (
    <section className="pub-section pub-section-soft" aria-labelledby="programs-heading">
      <SectionHeading
        id="programs-heading"
        eyebrow="Flagship programs"
        title="Work currently in the field"
        lede="Active and planned programmes with their published budget and delivery status."
      />

      {programs.length > 0 ? (
        <>
          <ul className="pub-program-grid">
            {programs.map((program) => {
              const image = absoluteMediaUrl(program.image);
              return (
                <li className="pub-program-card" key={program.id}>
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="pub-program-img" />
                  ) : null}
                  <div className="pub-program-body">
                    <p className="pub-tag">
                      {program.category_name || program.status}
                      {program.state_name ? ` · ${program.state_name}` : ''}
                    </p>
                    <h3>
                      <Link href={`/programs/${program.slug}`}>{program.title}</Link>
                    </h3>
                    <p className="pub-program-desc">
                      {program.description || 'Program description pending publication.'}
                    </p>
                    <dl className="pub-program-meta">
                      <div>
                        <dt>Budget</dt>
                        <dd>{formatCurrency(program.budget)}</dd>
                      </div>
                      <div>
                        <dt>Start</dt>
                        <dd>{formatDate(program.start_date)}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="pub-section-cta">
            <Link href="/programs" className="pub-btn pub-btn-outline">
              View all programs
            </Link>
          </p>
        </>
      ) : (
        <EmptyState
          title="No programs published yet"
          detail="Program records appear here once they are published for public viewing."
          action={{ href: '/programs', label: 'Programs overview' }}
        />
      )}
    </section>
  );
}
