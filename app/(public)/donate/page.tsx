import type { Metadata } from 'next';
import Link from 'next/link';
import DonationForm from '@/app/components/public/DonationForm';
import { SectionHeading } from '@/app/components/public/Primitives';
import { formatCurrency, getTransparency } from '@/lib/publicApi';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Donate | Support Brighter Future Foundation',
  description:
    'Record your pledge to support Brighter Future Foundation water, health and outreach programs.',
  alternates: { canonical: '/donate' },
};

export default async function DonatePage() {
  const transparency = await getTransparency();

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <p className="pub-eyebrow">Support the work</p>
          <h1>Donate</h1>
          <p className="pub-page-lede">
            Record your pledge below. Each one is logged as pending and confirmed by an
            administrator once payment is actually received.
          </p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container pub-donate-layout">
          <div>
            <SectionHeading eyebrow="How this works" title="An honest donation record" />
            <ol className="pub-steps">
              <li>You submit your pledge with your name, email and amount.</li>
              <li>It is stored as <strong>pending</strong> and given a reference number.</li>
              <li>Payment is arranged and confirmed out of band.</li>
              <li>An administrator marks it received only after funds actually arrive.</li>
            </ol>
            <p className="pub-donate-note">
              We never mark a pledge as paid automatically, and this page does not claim a
              payment succeeded before it has.
            </p>

            {transparency ? (
              <div className="pub-donate-context">
                <p>
                  Funds raised to date:{' '}
                  <strong>
                    {transparency.funds_raised ? formatCurrency(transparency.funds_raised) : '—'}
                  </strong>
                </p>
                <p>
                  <Link href="/transparency">See full financial transparency</Link>
                </p>
              </div>
            ) : null}
          </div>

          <div className="pub-donate-panel">
            <DonationForm />
          </div>
        </div>
      </section>
    </>
  );
}
