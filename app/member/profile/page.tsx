'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api';
import { Badge, Card, DataRow, EmptyState, ErrorNote, WorkspaceShell } from '@/app/components/workspace';
import '../member-dashboard.css';

interface MemberProfile {
  member_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  email_verified: boolean;
  phone: string;
  gender: string;
  date_of_birth: string | null;
  address: string;
  state: string;
  lga: string;
  occupation: string;
  skills: string;
  membership_type: string;
  status: string;
  joined_at: string | null;
}

type ProfileDraft = Pick<
  MemberProfile,
  'first_name' | 'last_name' | 'phone' | 'gender' | 'date_of_birth' | 'address' | 'state' | 'lga' | 'occupation' | 'skills'
>;

function toDraft(profile: MemberProfile): ProfileDraft {
  return {
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    phone: profile.phone ?? '',
    gender: profile.gender ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    address: profile.address ?? '',
    state: profile.state ?? '',
    lga: profile.lga ?? '',
    occupation: profile.occupation ?? '',
    skills: profile.skills ?? '',
  };
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MemberProfilePage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    apiGet<MemberProfile>('/core/members/me/')
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setDraft(toDraft(data));
      })
      .catch(() => {
        if (active) setError('Your membership profile is not linked yet. Contact the foundation office for help.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField<K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setNotice('');
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await apiPatch<MemberProfile>('/core/members/me/', draft);
      setProfile(updated);
      setDraft(toDraft(updated));
      setNotice('Your profile has been updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      kicker="My Profile"
      title="My Profile"
      subtitle="Keep your contact and profile information up to date."
    >
      <div className="member-profile-layout">
        <Card title="Personal information">
          {loading ? <EmptyState message="Loading your profile..." /> : error && !profile ? (
            <ErrorNote message={error} />
          ) : draft ? (
            <form className="member-profile-form" onSubmit={saveProfile}>
              <label className="member-profile-field">
                First name
                <input required value={draft.first_name} onChange={(event) => updateField('first_name', event.target.value)} autoComplete="given-name" />
              </label>
              <label className="member-profile-field">
                Last name
                <input required value={draft.last_name} onChange={(event) => updateField('last_name', event.target.value)} autoComplete="family-name" />
              </label>
              <label className="member-profile-field">
                Phone
                <input type="tel" value={draft.phone} onChange={(event) => updateField('phone', event.target.value)} autoComplete="tel" />
              </label>
              <label className="member-profile-field">
                Gender
                <input value={draft.gender} onChange={(event) => updateField('gender', event.target.value)} />
              </label>
              <label className="member-profile-field">
                Date of birth
                <input type="date" value={draft.date_of_birth ?? ''} onChange={(event) => updateField('date_of_birth', event.target.value)} />
              </label>
              <label className="member-profile-field">
                Occupation
                <input value={draft.occupation} onChange={(event) => updateField('occupation', event.target.value)} />
              </label>
              <label className="member-profile-field">
                State
                <input value={draft.state} onChange={(event) => updateField('state', event.target.value)} autoComplete="address-level1" />
              </label>
              <label className="member-profile-field">
                LGA
                <input value={draft.lga} onChange={(event) => updateField('lga', event.target.value)} />
              </label>
              <label className="member-profile-field member-profile-field--wide">
                Address
                <textarea rows={3} value={draft.address} onChange={(event) => updateField('address', event.target.value)} autoComplete="street-address" />
              </label>
              <label className="member-profile-field member-profile-field--wide">
                Skills and interests
                <textarea rows={3} value={draft.skills} onChange={(event) => updateField('skills', event.target.value)} />
              </label>

              {error ? <div className="member-profile-field--wide"><ErrorNote message={error} /></div> : null}
              {notice ? <p className="member-profile-notice" role="status">{notice}</p> : null}

              <div className="member-profile-actions member-profile-field--wide">
                <Link className="member-dashboard__panel-link" href="/member">Back to membership</Link>
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
              </div>
            </form>
          ) : null}
        </Card>

        <Card title="Membership account">
          {loading ? <EmptyState message="Loading account details..." /> : profile ? (
            <>
              <DataRow label="Member ID" value={profile.member_id} />
              <DataRow label="Email" value={profile.email} />
              <DataRow label="Email verified" value={profile.email_verified ? 'Yes' : 'Not yet'} />
              <DataRow label="Membership type" value={profile.membership_type} />
              <DataRow label="Status" value={<Badge>{profile.status.toUpperCase()}</Badge>} />
              <DataRow label="Joined" value={formatDate(profile.joined_at)} />
              <p className="member-profile-note">To change your email or membership status, contact the foundation office.</p>
            </>
          ) : <EmptyState message="Account details are unavailable." />}
        </Card>
      </div>
    </WorkspaceShell>
  );
}