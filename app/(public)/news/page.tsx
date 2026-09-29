import type { Metadata } from 'next';
import { EmptyState, SectionHeading } from '@/app/components/public/Primitives';
import { absoluteMediaUrl, formatDate, getEvents, getFieldReports, getNews } from '@/lib/publicApi';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Newsroom & Field Reports | Brighter Future Foundation',
  description:
    'Published announcements, programme news and verified field reports from Brighter Future Foundation.',
  alternates: { canonical: '/news' },
};

export default async function NewsPage() {
  const [news, reports, events] = await Promise.all([getNews(), getFieldReports(), getEvents()]);

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <p className="pub-eyebrow">Newsroom</p>
          <h1>Updates, announcements and field reports</h1>
          <p className="pub-page-lede">
            Only published items appear here. Drafts and internal reports are never exposed.
          </p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading eyebrow="Latest" title="News" />
          {news.length > 0 ? (
            <ul className="pub-news-grid">
              {news.map((post) => (
                <li className="pub-news-card" key={post.id}>
                  {absoluteMediaUrl(post.cover_image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={absoluteMediaUrl(post.cover_image)!} alt="" className="pub-news-img" />
                  ) : null}
                  <div className="pub-news-body">
                    <p className="pub-tag">{post.category || 'News'}</p>
                    <h3>{post.title}</h3>
                    <p>{post.body}</p>
                    <p className="pub-news-date">{formatDate(post.published_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No published news yet"
              detail="Announcements will appear here as soon as they are published."
            />
          )}
        </div>
      </section>

      <section className="pub-section pub-section-soft">
        <div className="pub-container">
          <SectionHeading
            eyebrow="From the field"
            title="Published field reports"
            lede="Reports carry a publication date and location, and are shown only after review."
          />
          {reports.length > 0 ? (
            <ul className="pub-report-grid">
              {reports.map((report) => (
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
              detail="Field reports are written during delivery and published here once verified."
            />
          )}
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <SectionHeading eyebrow="Calendar" title="Upcoming public events" />
          {events.length > 0 ? (
            <ul className="pub-event-list">
              {events.map((event) => (
                <li key={event.id} className="pub-event">
                  <p className="pub-event-date">{formatDate(event.start_date)}</p>
                  <div>
                    <h3>{event.title}</h3>
                    {event.description ? <p>{event.description}</p> : null}
                    {event.location ? <p className="pub-event-loc">{event.location}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No upcoming public events"
              detail="Public events appear here once scheduled with a public listing."
            />
          )}
        </div>
      </section>
    </>
  );
}
