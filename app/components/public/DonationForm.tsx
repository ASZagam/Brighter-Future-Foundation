'use client';

import { useState } from 'react';

type State = 'idle' | 'submitting' | 'success' | 'error';

export default function DonationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [campaign, setCampaign] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === 'submitting') return;

    setState('submitting');
    setError('');
    setReference('');

    try {
      const response = await fetch('/api/backend/v2/public/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: name,
          donor_email: email,
          amount,
          campaign,
          source: 'donate_page',
          website: honeypot,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        setState('success');
        setReference(payload.reference || '');
        setName('');
        setEmail('');
        setAmount('');
        setCampaign('');
        return;
      }

      if (response.status === 429) {
        setState('error');
        setError('Too many submissions from this connection. Please try again later.');
        return;
      }

      const firstError =
        payload.donor_email?.[0] || payload.amount?.[0] || payload.donor_name?.[0];
      setState('error');
      setError(firstError || 'We could not record your pledge. Please check the form and try again.');
    } catch {
      setState('error');
      setError('We could not reach the server. Please try again.');
    }
  }

  if (state === 'success') {
    return (
      <div className="pub-donate-success" role="status">
        <h3>Thank you — your pledge is recorded</h3>
        <p>
          We have logged your intention to give. An administrator confirms each pledge once
          payment is actually received, so your record currently shows as
          <strong> pending</strong>. Nothing is marked as paid until that confirmation.
        </p>
        {reference ? (
          <p className="pub-donate-ref">
            Your reference: <code>{reference}</code>
          </p>
        ) : null}
        <p>
          Please keep this reference. Contact us with it if you need the record reconciled.
        </p>
        <button type="button" className="pub-btn pub-btn-outline" onClick={() => setState('idle')}>
          Record another pledge
        </button>
      </div>
    );
  }

  return (
    <form className="pub-donate-form" onSubmit={handleSubmit} noValidate>
      <div className="pub-field">
        <label htmlFor="donate-name">Full name</label>
        <input
          id="donate-name"
          name="donor_name"
          type="text"
          required
          autoComplete="name"
          value={name}
          disabled={state === 'submitting'}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="pub-field">
        <label htmlFor="donate-email">Email address</label>
        <input
          id="donate-email"
          name="donor_email"
          type="email"
          required
          autoComplete="email"
          value={email}
          disabled={state === 'submitting'}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="pub-field">
        <label htmlFor="donate-amount">Amount (NGN)</label>
        <input
          id="donate-amount"
          name="amount"
          type="number"
          required
          min="1"
          step="0.01"
          inputMode="decimal"
          value={amount}
          disabled={state === 'submitting'}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="pub-field">
        <label htmlFor="donate-campaign">
          Campaign <span className="pub-field-hint">(optional)</span>
        </label>
        <input
          id="donate-campaign"
          name="campaign"
          type="text"
          value={campaign}
          disabled={state === 'submitting'}
          onChange={(e) => setCampaign(e.target.value)}
        />
      </div>

      <div className="pub-hp" aria-hidden="true">
        <label htmlFor="donate-website">Website</label>
        <input
          id="donate-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <p className="pub-donate-error" role="alert" data-visible={state === 'error'}>
        {error}
      </p>

      <button type="submit" className="pub-btn pub-btn-solid pub-btn-lg" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Recording…' : 'Record my pledge'}
      </button>

      <p className="pub-donate-fineprint">
        This records your intention to give. No payment is taken on this page, and nothing is
        marked as received until an administrator confirms it.
      </p>
    </form>
  );
}
