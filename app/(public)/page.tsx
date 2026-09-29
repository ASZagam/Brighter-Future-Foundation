import Link from 'next/link';
import type { Metadata } from 'next';
import NewsletterForm from '@/app/components/public/NewsletterForm';
import { EmptyState, PendingMetric, SectionHeading } from '@/app/components/public/Primitives';
import {
  absoluteMediaUrl,
  formatCount,
  formatCurrency,
  formatDate,
  getCapabilities,
  getFieldReports,
  getGallery,
  getImpactSummary,
  getNews,
  getOrganization,
  getPrograms,
  getTransparency,
} from '@/lib/publicApi';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrganization();
  const title = org?.name
    ? `${org.name} | Community development, health and outreach`
    : 'Brighter Future Foundation';
  const description =
    org?.mission ||
    'Field reports, program updates and financial transparency from Brighter Future Foundation.';
  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { title, description, type: 'website', url: '/' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function LandingPage() {
  const [org, impact, transparency, capabilities, programs, reports, news, gallery] =
    await Promise.all([
      getOrganization(),
      getImpactSummary(),
      getTransparency(),
      getCapabilities(),
      getPrograms(),
      getFieldReports(),
      getNews(),
      getGallery(),
    ]);

  const metrics = impact?.metrics ?? [];
  const metricFor = (label: string) => metrics.find((m) => m.label === label);
  const activePrograms = programs.filter((p) => p.status === 'active').slice(0, 3);
  const featuredReports = reports.filter((r) => r.is_featured);
  const shownReports = (featuredReports.length > 0 ? featuredReports : reports).slice(0, 3);
  const allocations = transparency?.allocations ?? [];
  const heroImage = absoluteMediaUrl(org?.hero_banner) ?? absoluteMediaUrl(gallery[0]?.image);
  const verifiedAt = new Date().toISOString();

  const articleJsonLd = news.slice(0, 3).map((post) => ({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    datePublished: post.published_at,
    image: absoluteMediaUrl(post.cover_image) ?? undefined,
    author: { '@type': 'Organization', name: org?.name || 'Brighter Future Foundation' },
  }));

  return (
    <>
      {/* Mission strip */}
      <div className="pub-utility">
        <p>
          {org?.mission ||
            'Clean water, health outreach and community development — reported from the field.'}
        </p>
      </div>

      {/* Hero */}
      <section className="pub-hero">
        <div className="pub-hero-inner">
          <div className="pub-hero-copy">
            <p className="pub-eyebrow">Field operations &amp; public reporting</p>
            <h1>
              {org?.name || 'Brighter Future Foundation'}
            </h1>
            {org?.slogan ? <p className="pub-hero-slogan">{org.slogan}</p> : null}
            <p className="pub-hero-lede">
              {org?.mission ||
                'We run water, health and outreach programmes and publish what we deliver — where it went, who it reached, and what it cost.'}
            </p>

            <div className="pub-hero-actions">
              <Link href="/donate" className="pub-btn pub-btn-solid pub-btn-lg">
                Donate
              </Link>
              <Link href="/programs" className="pub-btn pub-btn-outline pub-btn-lg">
                Explore Programs
              </Link>
            </div>

            <p className="pub-verify-chip" data-verified={Boolean(impact)}>
              <span className="pub-verify-dot" aria-hidden="true" />
              {impact
                ? `Records read from backend · ${formatCount(impact.transparency.total_programs)} programs tracked · checked ${new Date(verifiedAt).toISOString().slice(11, 16)} UTC`
                : 'Verification data temporarily unavailable'}
            </p>
          </div>

          <div className="pub-hero-media">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt="" className="pub-hero-img" />
            ) : (
              <div className="pub-hero-placeholder" role="img" aria-label="Field image pending publication">
                <span>Field image pending publication</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Impact counters */}
      <section className="pub-section pub-section-tight" aria-labelledby="impact-heading">
        <SectionHeading
          eyebrow="Our impact"
          title="What the records show"
          lede="Every figure below is read directly from program, donation and membership records. Figures without a published source are shown as pending rather than estimated."
        />
        <h2 id="impact-heading" className="pub-sr-only">
          Impact
        </h2>

        <div className="pub-metric-grid">
          {(['Programs delivered', 'People reached', 'Active volunteers', 'States reached'] as const).map(
            (label) => {
              const metric = metricFor(label === 'Programs delivered' ? 'Programs on record' : label);
              if (!metric || !metric.available) {
                return <PendingMetric key={label} label={label} />;
              }
              return (
                <div className="pub-metric" key={label}>
                  <p className="pub-metric-value">{formatCount(metric.value)}</p>
                  <p className="pub-metric-label">{label}</p>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* Capabilities */}
      <section className="pub-section pub-section-soft" aria-labelledby="capabilities-heading">
        <SectionHeading
          eyebrow="Platform capabilities"
          title="Six disciplines, one coordinated platform"
          lede="Programme management, field operations, finance and reporting share one system of record."
        />
        <h2 id="capabilities-heading" className="pub-sr-only">
          Platform capabilities
        </h2>

        {capabilities.length > 0 ? (
          <ul className="pub-card-grid">
            {capabilities.map((cap) => (
              <li className="pub-card" key={cap.id} style={cap.color ? { borderTopColor: cap.color } : undefined}>
                <h3>{cap.name}</h3>
                <p>{cap.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Capability pillars not published yet"
            detail="These six pillars are maintained in the platform and appear here once an administrator publishes them."
          />
        )}
      </section>

      {/* Flagship programs */}
      <section className="pub-section" aria-labelledby="programs-heading">
        <SectionHeading
          eyebrow="Flagship programs"
          title="Work currently in the field"
          lede="Active and planned programmes with their published budget and delivery status."
        />
        <h2 id="programs-heading" className="pub-sr-only">
          Flagship programs
        </h2>

        {activePrograms.length > 0 ? (
          <>
            <ul className="pub-program-grid">
              {activePrograms.map((program) => (
                <li className="pub-program-card" key={program.id}>
                  {absoluteMediaUrl(program.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={absoluteMediaUrl(program.image)!} alt="" className="pub-program-img" />
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
              ))}
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

      {/* Field reports */}
      <section className="pub-section pub-section-soft" aria-labelledby="reports-heading">
        <SectionHeading
          eyebrow="Field reports"
          title="Verified reporting from the field"
          lede="Reports are published only after review, so every entry below carries a real publication date and location."
        />
        <h2 id="reports-heading" className="pub-sr-only">
          Field reports
        </h2>

        {shownReports.length > 0 ? (
          <ul className="pub-report-grid">
            {shownReports.map((report) => (
              <li className="pub-report-card" key={report.id}>
                {absoluteMediaUrl(report.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={absoluteMediaUrl(report.image)!} alt="" className="pub-report-img" />
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
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No field reports published yet"
            detail="Field reports are written during programme delivery and published here once verified. See our transparency page for current reporting coverage."
            action={{ href: '/transparency', label: 'View transparency' }}
          />
        )}
      </section>

      {/* Allocation / transparency */}
      <section className="pub-section" aria-labelledby="allocation-heading">
        <SectionHeading
          eyebrow="Where funds go"
          title="Allocation and financial transparency"
          lede="Allocation shares and financial totals come from approved public records only."
        />
        <h2 id="allocation-heading" className="pub-sr-only">
          Allocation and financial transparency
        </h2>

        <div className="pub-transparency">
          <div className="pub-transparency-figures">
            <div className="pub-figure">
              <p className="pub-figure-label">Funds raised (completed donations)</p>
              <p className="pub-figure-value">
                {transparency?.funds_raised
                  ? formatCurrency(transparency.funds_raised)
                  : '—'}
              </p>
            </div>
            <div className="pub-figure">
              <p className="pub-figure-label">Budget committed</p>
              <p className="pub-figure-value">
                {transparency?.budget_committed
                  ? formatCurrency(transparency.budget_committed)
                  : '—'}
              </p>
            </div>
            <div className="pub-figure">
              <p className="pub-figure-label">Reporting coverage</p>
              <p className="pub-figure-value">
                {impact?.transparency.public_reporting_coverage !== null &&
                impact?.transparency.public_reporting_coverage !== undefined
                  ? `${impact.transparency.public_reporting_coverage}%`
                  : '—'}
              </p>
              <p className="pub-figure-note">
                Share of tracked programs with a published field report
              </p>
            </div>
          </div>

          {allocations.length > 0 ? (
            <div className="pub-allocation">
              <h3>Approved allocation</h3>
              <ul className="pub-allocation-list">
                {allocations.map((a) => (
                  <li key={a.id}>
                    <span className="pub-allocation-label">
                      {a.label}
                      {a.period_label ? ` (${a.period_label})` : ''}
                    </span>
                    <span className="pub-allocation-pct">{a.percentage}%</span>
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

      {/* Newsroom */}
      <section className="pub-section pub-section-soft" aria-labelledby="news-heading">
        <SectionHeading
          eyebrow="Newsroom"
          title="Latest updates"
          lede="Announcements and programme news published to the public feed."
        />
        <h2 id="news-heading" className="pub-sr-only">
          Newsroom
        </h2>

        {news.length > 0 ? (
          <>
            <ul className="pub-news-grid">
              {news.slice(0, 3).map((post) => (
                <li className="pub-news-card" key={post.id}>
                  {absoluteMediaUrl(post.cover_image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={absoluteMediaUrl(post.cover_image)!}
                      alt=""
                      className="pub-news-img"
                    />
                  ) : null}
                  <div className="pub-news-body">
                    <p className="pub-tag">{post.category || 'News'}</p>
                    <h3>{post.title}</h3>
                    <p>{post.body.length > 220 ? `${post.body.slice(0, 220)}…` : post.body}</p>
                    <p className="pub-news-date">{formatDate(post.published_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="pub-section-cta">
              <Link href="/news" className="pub-btn pub-btn-outline">
                All news
              </Link>
            </p>
          </>
        ) : (
          <EmptyState
            title="No published news yet"
            detail="Announcements appear here as soon as they are published."
            action={{ href: '/news', label: 'Newsroom' }}
          />
        )}
      </section>

      {/* Newsletter */}
      <section className="pub-section pub-newsletter-band" aria-labelledby="newsletter-heading">
        <div className="pub-newsletter-inner">
          <div>
            <p className="pub-eyebrow">Stay informed</p>
            <h2 id="newsletter-heading">Get programme updates in your inbox</h2>
            <p>
              Field reports, delivery updates and transparency notices. No more than one
              message per programme cycle.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      {articleJsonLd.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              articleJsonLd.map((a) => ({ ...a, '@context': undefined }))
            ),
          }}
        />
      ) : null}
    </>
  );
}
