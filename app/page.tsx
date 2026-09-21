import Link from 'next/link';
import PublicShowcase from './components/PublicShowcase';

const cards = [
  {
    title: 'Membership management',
    description: 'Keep registrations, renewals, and communications organized in one secure workspace.',
  },
  {
    title: 'Volunteer coordination',
    description: 'Schedule activity, manage teams, and keep volunteers aligned with mission goals.',
  },
  {
    title: 'Donations and reporting',
    description: 'Collect contributions with confidence and share clear impact reporting.',
  },
  {
    title: 'Events and outreach',
    description: 'Plan events, manage attendees, and support every campaign with consistent tools.',
  },
];

export default function HomePage() {
  return (
    <div className='page-shell'>
      <section className='hero-section'>
        <div>
          <p className='eyebrow'>Brighter Future Foundation</p>
          <h1>Modern nonprofit operations designed for clarity and impact.</h1>
          <p className='intro-text'>A professional platform for memberships, volunteers, donations, events, and secure access control.</p>

          <div className='hero-actions'>
            <Link href='/auth/register' className='primary-button'>Get started</Link>
            <Link href='/auth/login' className='secondary-button'>Sign in</Link>
          </div>
        </div>
      </section>

      <section id='features' className='feature-section'>
        <div className='section-heading'>
          <div>
            <p className='eyebrow'>Platform capabilities</p>
            <h2>Tools that support both operations and growth.</h2>
          </div>
          <p className='section-copy'>Deliver consistent nonprofit services with simple workflows, transparent reporting, and secure team access.</p>
        </div>

        <div className='feature-grid'>
          {cards.map((card) => (
            <article key={card.title} className='feature-card'>
              <p className='feature-title'>{card.title}</p>
              <p className='feature-description'>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <PublicShowcase />
    </div>
  );
}
