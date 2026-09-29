import Link from 'next/link';
import { formatCount } from '@/lib/publicApi';
import type { ImpactSummary } from '@/lib/publicApi';

const DEFAULT_LEDE =
  'We run water, health and outreach programmes and publish what we deliver — where it went, who it reached, and what it cost.';

/**
 * Landing-page hero. All copy comes from the published organisation profile;
 * the "records read from backend" chip only claims verification when the impact
 * endpoint actually answered.
 */
export function Hero({
  name,
  slogan,
  mission,
  heroImage,
  impact,
}: {
  name: string;
  slogan: string | null;
  mission: string | null;
  heroImage: string | null;
  impact: ImpactSummary | null;
}) {
  const verified = Boolean(impact);
  const checkedAt = new Date().toISOString().slice(11, 16);

  return (
    <section className="pub-hero">
      <div className="pub-hero-inner">
        <div className="pub-hero-copy">
          <p className="pub-eyebrow">Field operations &amp; public reporting</p>
          <h1>{name}</h1>
          {slogan ? <p className="pub-hero-slogan">{slogan}</p> : null}
          <p className="pub-hero-lede">{mission || DEFAULT_LEDE}</p>

          <div className="pub-hero-actions">
            <Link href="/donate" className="pub-btn pub-btn-solid pub-btn-lg">
              Donate
            </Link>
            <Link href="/programs" className="pub-btn pub-btn-outline pub-btn-lg">
              Explore Programs
            </Link>
          </div>

          <p className="pub-verify-chip" data-verified={verified}>
            <span className="pub-verify-dot" aria-hidden="true" />
            {verified
              ? `Records read from backend · ${formatCount(impact!.transparency.total_programs)} programs tracked · checked ${checkedAt} UTC`
              : 'Verification data temporarily unavailable'}
          </p>
        </div>

        <div className="pub-hero-media">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" className="pub-hero-img" />
          ) : (
            <div
              className="pub-hero-placeholder"
              role="img"
              aria-label="Field image pending publication"
            >
              <span>Field image pending publication</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
