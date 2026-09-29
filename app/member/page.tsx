'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { Badge, Card, DataRow, EmptyState, ErrorNote, WorkspaceShell } from '@/app/components/workspace';

interface MemberProfile {
  member_id: string;
  full_name: string;
  email: string;
  phone: string;
  state: string;
  lga: string;
  membership_type: string;
  status: string;
  joined_at: string | null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MemberWorkspacePage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiGet<MemberProfile>('/core/members/me/')
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch(() => {
        if (mounted) setError('No member profile is linked to this account yet.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <WorkspaceShell
      kicker="My Membership"
      title="Membership details"
      subtitle="Your registration record and current standing with the foundation."
    >
      {error ? <ErrorNote message={error} /> : null}

      <Card title="My record">
        {loading ? (
          <EmptyState message="Loading your membership…" />
        ) : profile ? (
          <>
            <DataRow label="Name" value={profile.full_name} />
            <DataRow label="Member ID" value={profile.member_id} />
            <DataRow label="Email" value={profile.email} />
            <DataRow label="Phone" value={profile.phone} />
            <DataRow label="State" value={profile.state} />
            <DataRow label="LGA" value={profile.lga} />
            <DataRow label="Membership type" value={profile.membership_type} />
            <DataRow label="Status" value={<Badge>{(profile.status ?? '').toUpperCase()}</Badge>} />
            <DataRow label="Joined" value={formatDate(profile.joined_at)} />
          </>
        ) : (
          <EmptyState message="No membership record is available for this account." />
        )}
      </Card>

      <Card title="Stay engaged">
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <li>Browse current programs and field updates on the public site.</li>
          <li>Register as a volunteer to join program assignments and log field hours.</li>
          <li>Contact the foundation office to update your contact details.</li>
        </ul>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--brand-text)', fontWeight: 600 }}>Back to the public site</Link>
        </div>
      </Card>
    </WorkspaceShell>
  );
}
