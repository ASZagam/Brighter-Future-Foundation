import Link from 'next/link';

const DEFAULT_LEDE =
  'To empower individuals and communities through inclusive development initiatives, education, healthcare awareness, social support, capacity building, and sustainable community programmes that improve livelihoods, promote human dignity, and create lasting positive change. We are committed to identifying community needs, developing practical solutions, and working with stakeholders to ensure that opportunities for growth and development reach those who need them most.';

/**
 * Landing-page hero. Copy comes from the published organisation profile.
 */
export function Hero({
  name,
  slogan,
  mission,
  heroImage,
  mobileHeroImage,
}: {
  name: string;
  slogan: string | null;
  mission: string | null;
  heroImage: string | null;
  mobileHeroImage: string;
}) {
  const fallbackImage = heroImage ? (
    <picture className="pub-hero-media">
      <source media="(max-width: 980px)" srcSet={mobileHeroImage} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImage}
        alt="Brighter Future Foundation team with students at a community school outreach."
        className="pub-hero-img"
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  ) : (
    <div
      className="pub-hero-placeholder pub-hero-media"
      role="img"
      aria-label="Field image pending publication"
    >
      <span>Field image pending publication</span>
    </div>
  );

  return (
    <section className="pub-hero">
      {fallbackImage}
      <div className="pub-hero-inner">
        <div className="pub-hero-copy">
          <p className="pub-eyebrow">{name || 'Brighter Future Foundation'}</p>
          <h1>{slogan || 'Toward A Brighter Future.'}</h1>
          <p className="pub-hero-lede">{mission || DEFAULT_LEDE}</p>

          <div className="pub-hero-actions">
            <Link href="/donate" className="pub-btn pub-btn-solid pub-btn-lg">
              Donate
            </Link>
            <Link href="/programs" className="pub-btn pub-btn-outline pub-btn-lg">
              Explore Programs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
