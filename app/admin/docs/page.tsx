'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OpsShell from '@/app/components/OpsShell';
import { DOC_SECTIONS } from './content';
import type { DocSection, DocStep } from './types';
import '../admin.css';
import './docs.css';

const ICON_PROPS = { width: 16, height: 16, strokeWidth: 1.8, stroke: 'currentColor', fill: 'none' } as const;

const ICONS: Record<string, JSX.Element> = {
  key: <svg {...ICON_PROPS} viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.8 12.2 8.7-8.7"/><path d="m17 6 3 3"/></svg>,
  gauge: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>,
  layers: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>,
  users: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>,
  heart: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  banknote: <svg {...ICON_PROPS} viewBox="0 0 24 24"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  send: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  shield: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/></svg>,
  scroll: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/></svg>,
  sparkles: <svg {...ICON_PROPS} viewBox="0 0 24 24"><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></svg>,
  life: <svg {...ICON_PROPS} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.2.9-1.2 1.8"/><path d="M12 17h.01"/></svg>,
};

const NOTE_LABELS = {
  tip: 'Tip',
  warning: 'Important',
  info: 'Note',
};

function DocIcon({ name }: { name: string }) {
  return ICONS[name] || ICONS.key;
}

function StepCard({ step, position }: { step: DocStep; position: number }) {
  return (
    <article className="docs-step">
      <div className="docs-step-marker" aria-hidden="true">{String(position).padStart(2, '0')}</div>
      <div className="docs-step-body">
        <h3>{step.title}</h3>
        <p className="docs-step-description">{step.description}</p>
        <ol className="docs-actions">
          {step.actions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ol>
        {step.note ? (
          <div className={`docs-note docs-note--${step.note.tone}`}>
            <strong>{NOTE_LABELS[step.note.tone]}</strong>
            <span>{step.note.text}</span>
          </div>
        ) : null}
        {step.screenshot ? (
          <figure className="docs-figure">
            <div className="docs-figure-frame">
              <Image
                src={step.screenshot.src}
                alt={step.screenshot.alt}
                width={1200}
                height={750}
                sizes="(max-width: 900px) 100vw, 860px"
              />
              <span className="docs-figure-scan" aria-hidden="true" />
              {step.screenshot.focus ? (
                <span className={`docs-figure-focus docs-figure-focus--${step.screenshot.focus}`} aria-hidden="true">
                  <span>Look here</span>
                </span>
              ) : null}
            </div>
            <figcaption>{step.screenshot.caption}</figcaption>
          </figure>
        ) : null}
      </div>
    </article>
  );
}

export default function AdminDocsPage() {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState(DOC_SECTIONS[0].id);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState('');
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const sections = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return DOC_SECTIONS;
    return DOC_SECTIONS
      .map((section) => {
        const steps = section.steps.filter((step) => [
          section.title,
          section.summary,
          step.title,
          step.description,
          ...step.actions,
        ].join(' ').toLowerCase().includes(term));
        return steps.length ? { ...section, steps } : null;
      })
      .filter((section): section is DocSection => section !== null);
  }, [query]);

  const stepCount = DOC_SECTIONS.reduce((total, section) => total + section.steps.length, 0);
  const imageCount = DOC_SECTIONS.reduce(
    (total, section) => total + section.steps.filter((step) => step.screenshot).length,
    0,
  );

  useEffect(() => {
    const onScroll = () => {
      const element = document.documentElement;
      const scrollable = element.scrollHeight - element.clientHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.round((element.scrollTop / scrollable) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-doc-section]'));
    if (!nodes.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: '-120px 0px -65% 0px', threshold: 0 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('bff-docs-feedback');
      if (stored === 'yes' || stored === 'no') setFeedback(stored);
    } catch {
      setFeedback(null);
    }
  }, []);

  function toggleSection(id: string) {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  }

  async function copyLink(id: string) {
    const url = `${window.location.origin}/admin/docs#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  }

  function chooseFeedback(value: 'yes' | 'no') {
    setFeedback(value);
    try {
      window.localStorage.setItem('bff-docs-feedback', value);
    } catch {
      setFeedback(null);
    }
  }

  return (
    <OpsShell>
      <div className="docs-page">
        <div className="docs-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>

        <header className="docs-hero">
          <div className="docs-hero-copy">
            <p className="docs-kicker">FOUNDATION OPERATIONS · USER GUIDE</p>
            <h1>Admin console documentation</h1>
            <p className="docs-lede">
              Step-by-step instructions for running programs, people, volunteering, funding and administration
              from the Brighter Future Foundation operations console.
            </p>
            <div className="docs-hero-meta">
              <span>{DOC_SECTIONS.length} chapters</span>
              <span>{stepCount} guided steps</span>
              <span>{imageCount} annotated screens</span>
            </div>
          </div>
          <div className="docs-search-wrap">
            <label className="docs-search" htmlFor="docs-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input
                id="docs-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the guide…"
                autoComplete="off"
              />
            </label>
            <p className="docs-search-hint">Try “volunteer hours”, “publish” or “audit”.</p>
          </div>
        </header>

        {sections.length === 0 ? (
          <section className="docs-empty">
            <h2>No matches for “{query}”</h2>
            <p>Try a broader term or clear the search to see the full guide.</p>
            <button type="button" onClick={() => setQuery('')}>Clear search</button>
          </section>
        ) : (
          <div className="docs-layout">
            <nav className="docs-toc" aria-label="Documentation chapters">
              <span className="docs-toc-title">ON THIS PAGE</span>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={activeSection === section.id ? 'active' : ''}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <span>{section.index}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="docs-toc-read">
                <span>Reading progress</span>
                <strong>{progress}%</strong>
              </div>
            </nav>

            <main className="docs-content">
              {sections.map((section) => {
                const isCollapsed = Boolean(collapsed[section.id]) && !query;
                return (
                  <section className="docs-section" id={section.id} data-doc-section key={section.id}>
                    <div className="docs-section-header">
                      <span className="docs-section-icon"><DocIcon name={section.icon} /></span>
                      <div className="docs-section-title">
                        <span className="docs-section-index">CHAPTER {section.index}</span>
                        <h2>{section.title}</h2>
                        <p>{section.summary}</p>
                      </div>
                      <div className="docs-section-tools">
                        {section.link ? (
                          <Link href={section.link.href} className="docs-open-link">{section.link.label} ↗</Link>
                        ) : null}
                        <button type="button" className="docs-copy" onClick={() => copyLink(section.id)} aria-label={`Copy link to ${section.title}`}>
                          {copied === section.id ? 'Copied' : 'Copy link'}
                        </button>
                        <button
                          type="button"
                          className="docs-collapse"
                          onClick={() => toggleSection(section.id)}
                          aria-expanded={!isCollapsed}
                          aria-controls={`${section.id}-steps`}
                        >
                          {isCollapsed ? 'Expand' : 'Collapse'}
                        </button>
                      </div>
                    </div>
                    <div className={`docs-steps${isCollapsed ? ' collapsed' : ''}`} id={`${section.id}-steps`}>
                      <div className="docs-steps-inner">
                        {section.steps.map((step, index) => (
                          <StepCard step={step} position={index + 1} key={step.id} />
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })}

              <section className="docs-feedback" aria-label="Documentation feedback">
                <div>
                  <h2>Was this guide useful?</h2>
                  <p>Your answer helps us improve the internal documentation.</p>
                </div>
                <div className="docs-feedback-actions">
                  <button type="button" className={feedback === 'yes' ? 'selected' : ''} onClick={() => chooseFeedback('yes')}>Yes</button>
                  <button type="button" className={feedback === 'no' ? 'selected' : ''} onClick={() => chooseFeedback('no')}>No</button>
                  {feedback ? <span role="status">Thanks for the feedback.</span> : null}
                </div>
              </section>
            </main>
          </div>
        )}
      </div>
    </OpsShell>
  );
}
