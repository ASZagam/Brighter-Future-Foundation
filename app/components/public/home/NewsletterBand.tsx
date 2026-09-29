import NewsletterForm from '../NewsletterForm';

/** Closing call to action for the newsletter signup. */
export function NewsletterBand() {
  return (
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
  );
}
