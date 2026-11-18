'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiCall, apiGet, apiPatch, apiPost } from '@/lib/api';
import OpsShell from '@/app/components/OpsShell';
import { DEFAULT_ABOUT } from './defaultAbout';
import type { AboutDiscipline, AboutDraft, AboutResponse } from './types';
import '../../core/core.css';
import '../admin.css';
import './about.css';

function initialDraft(data: AboutResponse): AboutDraft {
  if (data.has_draft) return data.draft;
  return {
    ...DEFAULT_ABOUT,
    name: data.published.name || DEFAULT_ABOUT.name,
    slogan: data.published.slogan || DEFAULT_ABOUT.slogan,
    founder_name: data.published.founder_name,
    founder_title: data.published.founder_title,
    email: data.published.email,
    phone: data.published.phone,
    address: data.published.address,
  };
}

function ParagraphPreview({ value }: { value: string }) {
  return (
    <>
      {value.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </>
  );
}

export default function AboutEditorPage() {
  const [draft, setDraft] = useState<AboutDraft | null>(null);
  const [published, setPublished] = useState<AboutDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<AboutDraft | null>(null);
  const [publishedBannerUrl, setPublishedBannerUrl] = useState('');
  const [draftBannerUrl, setDraftBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<AboutResponse>('/core/organization/about/');
      const nextDraft = initialDraft(data);
      setDraft(nextDraft);
      setPublished(data.published);
      setPublishedBannerUrl(data.published_banner_url);
      setDraftBannerUrl(data.draft_banner_url);
      setSavedDraft(data.has_draft ? data.draft : null);
      setHasDraft(data.has_draft);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load About Us content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => Boolean(draft && (!savedDraft || JSON.stringify(draft) !== JSON.stringify(savedDraft))),
    [draft, savedDraft],
  );

  function updateField<K extends keyof Omit<AboutDraft, 'disciplines'>>(field: K, value: AboutDraft[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setNotice('');
  }

  function updateDiscipline(id: string, update: Partial<AboutDiscipline>) {
    setDraft((current) => current ? {
      ...current,
      disciplines: current.disciplines.map((item) => item.id === id ? { ...item, ...update } : item),
    } : current);
    setNotice('');
  }

  function moveDiscipline(index: number, offset: -1 | 1) {
    setDraft((current) => {
      if (!current) return current;
      const target = index + offset;
      if (target < 0 || target >= current.disciplines.length) return current;
      const disciplines = [...current.disciplines];
      [disciplines[index], disciplines[target]] = [disciplines[target], disciplines[index]];
      return {
        ...current,
        disciplines: disciplines.map((item, display_order) => ({ ...item, display_order })),
      };
    });
  }

  async function saveDraft(): Promise<AboutResponse | null> {
    if (!draft) return null;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await apiPatch<AboutResponse>('/core/organization/about/', draft);
      setDraft(response.draft);
      setSavedDraft(response.draft);
      setPublished(response.published);
      setPublishedBannerUrl(response.published_banner_url);
      setDraftBannerUrl(response.draft_banner_url);
      setHasDraft(true);
      setNotice('Draft saved. It is not visible on the public website until published.');
      return response;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the draft.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!draft) return;
    if (!window.confirm('Publish this About Us content to the public website?')) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (dirty || !hasDraft) {
        await apiPatch<AboutResponse>('/core/organization/about/', draft);
      }
      const response = await apiPost<AboutResponse>('/core/organization/about/publish/');
      setDraft(response.draft);
      setSavedDraft(response.draft);
      setPublished(response.published);
      setPublishedBannerUrl(response.published_banner_url);
      setDraftBannerUrl(response.draft_banner_url);
      setHasDraft(true);
      setNotice('About Us content published successfully.');
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Unable to publish About Us content.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadBanner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!bannerFile) {
      setError('Choose an image to upload.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (!hasDraft) {
        const draftResponse = await apiPatch<AboutResponse>('/core/organization/about/', draft);
        setDraft(draftResponse.draft);
        setSavedDraft(draftResponse.draft);
        setPublished(draftResponse.published);
        setPublishedBannerUrl(draftResponse.published_banner_url);
        setDraftBannerUrl(draftResponse.draft_banner_url);
        setHasDraft(true);
      }

      const body = new FormData();
      body.append('hero_banner', bannerFile);
      const response = await apiCall<{ draft_banner_url: string }>('/core/organization/about/banner/', {
        method: 'POST',
        body,
      });
      setDraftBannerUrl(response.draft_banner_url);
      setBannerFile(null);
      form.reset();
      setNotice('Banner uploaded to the draft. Publish the About Us content to make it public.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload the banner.');
    } finally {
      setSaving(false);
    }
  }

  async function removeDraftBanner() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiCall('/core/organization/about/banner/', { method: 'DELETE' });
      setDraftBannerUrl('');
      setNotice('The unpublished banner was removed. The current public banner is unchanged.');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove the draft banner.');
    } finally {
      setSaving(false);
    }
  }

  function addDiscipline() {
    setDraft((current) => current ? {
      ...current,
      disciplines: [
        ...current.disciplines,
        {
          id: `discipline-${Date.now()}`,
          name: '',
          description: '',
          display_order: current.disciplines.length,
          is_published: false,
        },
      ],
    } : current);
  }

  function removeDiscipline(id: string) {
    setDraft((current) => current ? {
      ...current,
      disciplines: current.disciplines
        .filter((item) => item.id !== id)
        .map((item, display_order) => ({ ...item, display_order })),
    } : current);
  }

  return (
    <OpsShell>
      <main className="core-content about-editor">
        <div className="core-kicker">
          <span>FOUNDATION &amp; ADMINISTRATION</span>
          <i>|</i>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Organization profile · About Us</span>
        </div>
        <div className="core-heading">
          <div>
            <h1>About Us content</h1>
            <p>Edit the public organization story, mission, vision, disciplines, and contact information.</p>
          </div>
          <div className="core-heading-actions">
            <a href="/about" target="_blank" rel="noreferrer">View public page</a>
            <button type="button" onClick={() => setPreviewing((value) => !value)} disabled={!draft}>
              {previewing ? 'Hide preview' : 'Preview draft'}
            </button>
            <button type="button" onClick={saveDraft} disabled={!draft || loading || saving || !dirty}>
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" className="primary" onClick={publish} disabled={!draft || loading || saving}>
              {saving ? 'Working…' : 'Publish'}
            </button>
          </div>
        </div>
        <p className="about-editor-status" role="status">
          {loading ? 'Loading organization profile…' : hasDraft ? 'A saved draft is available.' : 'Starter content is ready as an unpublished draft.'}
          {published ? ` Public version: ${published.name || 'Organization profile'}.` : ''}
        </p>
        {error ? <div className="core-live-notice warn" role="alert">{error}</div> : null}
        {notice ? <div className="core-live-notice" role="status">{notice}</div> : null}

        {loading || !draft ? (
          <section className="core-panel about-editor-loading">
            {loading ? 'Loading About Us editor…' : 'The editor could not be loaded. Refresh the page to try again.'}
          </section>
        ) : previewing ? (
          <section className="core-panel about-preview" aria-label="About Us draft preview">
            <div className="core-panel-toolbar">
              <strong>Draft preview</strong>
              <span>This preview is not public until you publish it.</span>
            </div>
            <div className="about-preview-body">
              <p className="about-preview-eyebrow">About us</p>
              <h2>{draft.name}</h2>
              {draft.slogan ? <p className="about-preview-lede">{draft.slogan}</p> : null}
              <ParagraphPreview value={draft.about_intro} />
              <h3>Our Mission</h3>
              <ParagraphPreview value={draft.mission} />
              <h3>Our Vision</h3>
              <ParagraphPreview value={draft.vision} />
              <h3>Our History</h3>
              <ParagraphPreview value={draft.history} />
              {draft.founder_name ? <p><strong>{draft.founder_name}</strong>{draft.founder_title ? ` — ${draft.founder_title}` : ''}</p> : null}
              <h3>Our Disciplines</h3>
              <ParagraphPreview value={draft.disciplines_intro} />
              {draftBannerUrl || publishedBannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="about-preview-banner" src={draftBannerUrl || publishedBannerUrl} alt="Draft homepage banner" />
              ) : null}
              <div className="about-preview-disciplines">
                {draft.disciplines.filter((item) => item.is_published).map((item) => (
                  <article key={item.id}>
                    <h4>{item.name || 'Untitled discipline'}</h4>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
              <h3>Reach the Foundation</h3>
              <ParagraphPreview value={draft.contact_intro} />
              <p>{[draft.email, draft.phone, draft.address].filter(Boolean).join(' · ')}</p>
            </div>
          </section>
        ) : (
          <div className="about-editor-grid">
            <section className="core-panel">
              <div className="core-panel-toolbar"><strong>Organization story</strong><span>Public About Us page</span></div>
              <div className="about-editor-fields">
                <label className="about-field">
                  <span>Organization name</span>
                  <input value={draft.name} onChange={(event) => updateField('name', event.target.value)} maxLength={255} />
                </label>
                <label className="about-field">
                  <span>Motto or slogan</span>
                  <input value={draft.slogan} onChange={(event) => updateField('slogan', event.target.value)} maxLength={255} />
                </label>
                <label className="about-field about-field-wide">
                  <span>About the foundation</span>
                  <textarea rows={9} value={draft.about_intro} onChange={(event) => updateField('about_intro', event.target.value)} />
                </label>
                <label className="about-field about-field-wide">
                  <span>Our mission</span>
                  <textarea rows={6} value={draft.mission} onChange={(event) => updateField('mission', event.target.value)} />
                </label>
                <label className="about-field about-field-wide">
                  <span>Our vision</span>
                  <textarea rows={6} value={draft.vision} onChange={(event) => updateField('vision', event.target.value)} />
                </label>
                <label className="about-field about-field-wide">
                  <span>Our history</span>
                  <textarea rows={8} value={draft.history} onChange={(event) => updateField('history', event.target.value)} />
                </label>
                <label className="about-field about-field-wide">
                  <span>Disciplines introduction</span>
                  <textarea rows={3} value={draft.disciplines_intro} onChange={(event) => updateField('disciplines_intro', event.target.value)} />
                </label>
                <label className="about-field">
                  <span>Founder / leader name</span>
                  <input value={draft.founder_name} onChange={(event) => updateField('founder_name', event.target.value)} maxLength={255} />
                </label>
                <label className="about-field">
                  <span>Founder / leader title</span>
                  <input value={draft.founder_title} onChange={(event) => updateField('founder_title', event.target.value)} maxLength={255} />
                </label>
              </div>
            </section>

            <section className="core-panel">
              <div className="core-panel-toolbar">
                <strong>Home page banner</strong>
                <span>{draftBannerUrl ? 'Unpublished draft image' : publishedBannerUrl ? 'Current public image' : 'No banner published'}</span>
              </div>
              <div className="about-banner-editor">
                {draftBannerUrl || publishedBannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="about-banner-preview"
                    src={draftBannerUrl || publishedBannerUrl}
                    alt={draftBannerUrl ? 'Unpublished banner preview' : 'Current public banner'}
                  />
                ) : <p>No banner is currently published. Upload an image to replace the Home page placeholder.</p>}
                <form className="about-banner-upload" onSubmit={uploadBanner}>
                  <label className="about-field">
                    <span>Upload a banner image (maximum 10 MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setBannerFile(event.target.files?.[0] ?? null)}
                      disabled={saving}
                      required
                    />
                  </label>
                  <button type="submit" disabled={saving || !bannerFile}>
                    {saving ? 'Uploading…' : 'Upload to draft'}
                  </button>
                </form>
                {!hasDraft ? <p className="about-banner-hint">Uploading will save the current About Us content as a draft first.</p> : null}
                {draftBannerUrl ? (
                  <button type="button" className="about-remove-banner" onClick={removeDraftBanner} disabled={saving}>
                    Remove draft banner
                  </button>
                ) : null}
              </div>
            </section>

            <section className="core-panel">
              <div className="core-panel-toolbar">
                <strong>Our disciplines</strong>
                <button type="button" onClick={addDiscipline}>Add discipline</button>
              </div>
              <div className="about-discipline-list">
                {draft.disciplines.map((discipline, index) => (
                  <article className="about-discipline-editor" key={discipline.id}>
                    <div className="about-discipline-toolbar">
                      <strong>Discipline {index + 1}</strong>
                      <div>
                        <button type="button" onClick={() => moveDiscipline(index, -1)} disabled={index === 0} aria-label={`Move ${discipline.name || 'discipline'} up`}>↑</button>
                        <button type="button" onClick={() => moveDiscipline(index, 1)} disabled={index === draft.disciplines.length - 1} aria-label={`Move ${discipline.name || 'discipline'} down`}>↓</button>
                        <button type="button" className="about-remove-button" onClick={() => removeDiscipline(discipline.id)}>Remove</button>
                      </div>
                    </div>
                    <label className="about-field">
                      <span>Discipline name</span>
                      <input value={discipline.name} onChange={(event) => updateDiscipline(discipline.id, { name: event.target.value })} maxLength={150} />
                    </label>
                    <label className="about-field">
                      <span>Description</span>
                      <textarea rows={4} value={discipline.description} onChange={(event) => updateDiscipline(discipline.id, { description: event.target.value })} />
                    </label>
                    <label className="about-publish-toggle">
                      <input type="checkbox" checked={discipline.is_published} onChange={(event) => updateDiscipline(discipline.id, { is_published: event.target.checked })} />
                      <span>Include on public About Us page</span>
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="core-panel">
              <div className="core-panel-toolbar"><strong>Contact information</strong><span>Displayed on public About Us page</span></div>
              <div className="about-editor-fields">
                <label className="about-field">
                  <span>Email</span>
                  <input type="email" value={draft.email} onChange={(event) => updateField('email', event.target.value)} />
                </label>
                <label className="about-field">
                  <span>Phone</span>
                  <input value={draft.phone} onChange={(event) => updateField('phone', event.target.value)} maxLength={30} />
                </label>
                <label className="about-field about-field-wide">
                  <span>Address</span>
                  <textarea rows={3} value={draft.address} onChange={(event) => updateField('address', event.target.value)} />
                </label>
                <label className="about-field about-field-wide">
                  <span>Contact introduction</span>
                  <textarea rows={5} value={draft.contact_intro} onChange={(event) => updateField('contact_intro', event.target.value)} />
                </label>
              </div>
            </section>
          </div>
        )}
      </main>
    </OpsShell>
  );
}
