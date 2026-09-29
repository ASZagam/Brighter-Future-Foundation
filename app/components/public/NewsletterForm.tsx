'use client';

import { useState } from 'react';

type State = 'idle' | 'submitting' | 'success' | 'already' | 'error';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === 'submitting') return;

    setState('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/backend/v2/public/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_page', website: honeypot }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        if (payload.detail === 'already_subscribed') {
          setState('already');
          setMessage('You are already on our list. Thank you.');
        } else {
          setState('success');
          setMessage('Thank you. Please check your inbox to confirm your subscription.');
          setEmail('');
        }
        return;
      }

      if (response.status === 400 && payload.email) {
        setState('error');
        setMessage('Please enter a valid email address.');
        return;
      }

      if (response.status === 429) {
        setState('error');
        setMessage('Too many attempts. Please try again later.');
        return;
      }

      setState('error');
      setMessage('We could not complete your subscription. Please try again.');
    } catch {
      setState('error');
      setMessage('We could not reach the server. Please try again.');
    }
  }

  const busy = state === 'submitting';

  return (
    <form className="pub-newsletter" onSubmit={handleSubmit} noValidate>
      <label className="pub-sr-only" htmlFor="newsletter-email">
        Email address
      </label>

      {/* Honeypot: hidden from users, tempting to bots. */}
      <div className="pub-hp" aria-hidden="true">
        <label htmlFor="newsletter-website">Website</label>
        <input
          id="newsletter-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="pub-newsletter-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          disabled={busy}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== 'idle') setState('idle');
          }}
        />
        <button type="submit" className="pub-btn pub-btn-solid" disabled={busy}>
          {busy ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>

      <p
        className="pub-newsletter-status"
        role="status"
        aria-live="polite"
        data-state={state}
      >
        {message}
      </p>

      <p className="pub-newsletter-fineprint">
        We only send programme updates and field reports. Unsubscribe at any time.
      </p>
    </form>
  );
}
