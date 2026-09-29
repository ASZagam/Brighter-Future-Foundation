'use client';

import Image from 'next/image';
import { useId } from 'react';
import logo from '../../../BFF_logo-removebg-preview.png';
import './auth-card.css';

/**
 * Shell for the standalone pages (the auth family plus /forbidden).
 *
 * These pages all have the same shape: a single centred white card, the brand
 * lockup, a heading, and either a short form or a short message. The shell is
 * defined once here so the width, radius, shadow, field and button styling cannot
 * drift page to page.
 */
export function AuthCard({
  children,
  center = false,
  lockupSubtitle = 'Secure platform access',
  showLockup = true,
  className = '',
}: {
  children: React.ReactNode;
  /** Centre the contents. Used by the confirmation-style pages. */
  center?: boolean;
  lockupSubtitle?: string;
  showLockup?: boolean;
  className?: string;
}) {
  return (
    <main className={`ac-card${center ? ' ac-card--center' : ''}${className ? ` ${className}` : ''}`}>
      {showLockup ? <AuthLockup center={center} subtitle={lockupSubtitle} /> : null}
      {children}
    </main>
  );
}

function AuthLockup({ center, subtitle }: { center: boolean; subtitle: string }) {
  return (
    <div className={`ac-lockup${center ? ' ac-lockup--center' : ''}`}>
      <span className="ac-lockup__mark">
        {/*
          Decorative: the wordmark immediately beside it already names the
          organisation, so an alt text would just be announced twice.
        */}
        <Image className="ac-lockup__logo" src={logo} alt="" width={30} height={30} priority />
      </span>
      <span className="ac-lockup__text">
        <span className="ac-lockup__kicker">BRIGHTER FUTURE FOUNDATION</span>
        <span className="ac-lockup__sub">{subtitle}</span>
      </span>
    </div>
  );
}

/** Label + input pair, so every field gets identical padding, border and focus ring. */
export function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
  placeholder,
  disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <label className="ac-field" htmlFor={id}>
      {label}
      <input
        id={id}
        className="ac-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

/**
 * Feedback line. `tone` is passed explicitly rather than inferred from the
 * message text, which is how these pages used to decide between success and
 * error styling.
 */
export function AuthStatus({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  if (tone === 'success') {
    return (
      <p className="ac-success" role="status">
        {children}
      </p>
    );
  }

  return (
    <p className="ac-error" role="alert">
      {children}
    </p>
  );
}

/** Full-width submit button. `loading` keeps the label and the disabled state in sync. */
export function AuthSubmit({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <button className="ac-button ac-button--block" type="submit" disabled={loading}>
      {children}
    </button>
  );
}
