'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Badge, Card, DataRow, EmptyState, ErrorNote, WorkspaceShell } from '@/app/components/workspace';

interface VolunteerProfile {
  volunteer_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  cluster: string;
  squad: string;
  availability: string;
  volunteer_hours: number;
  approved_hours: number;
  specializations: string[];
  last_shift: { date?: string; activity?: string } | null;
}

interface Assignment {
  id: number;
  program: string;
  program_title: string;
  program_ref: string;
  notes: string;
  is_active: boolean;
  assigned_at: string;
}

interface HourLog {
  id: string;
  shift_id: string;
  program_title: string | null;
  activity: string;
  date: string;
  hours: number;
  location: string;
  approval_status: string;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function VolunteerHubPage() {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [logs, setLogs] = useState<HourLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [profileResult, assignmentResult, logResult] = await Promise.allSettled([
        apiGet<VolunteerProfile>('/core/volunteers/me/'),
        apiGet<{ results: Assignment[] }>('/core/program-volunteer-assignments/me/'),
        apiGet<{ results: HourLog[] }>('/core/volunteer-hours/me/'),
      ]);
      if (!mounted) return;

      if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
      if (assignmentResult.status === 'fulfilled') setAssignments(assignmentResult.value?.results ?? []);
      if (logResult.status === 'fulfilled') setLogs(logResult.value?.results ?? []);

      if (profileResult.status === 'rejected') {
        setError('No volunteer profile is linked to this account yet. Contact a coordinator to complete your registration.');
      }
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const approved = logs.filter((log) => log.approval_status === 'approved').reduce((total, log) => total + Number(log.hours || 0), 0);
  const pending = logs.filter((log) => log.approval_status === 'pending').length;

  return (
    <WorkspaceShell
      kicker="Volunteer Hub"
      title="My volunteering"
      subtitle="Your profile, program assignments and logged shifts."
    >
      {error ? <ErrorNote message={error} /> : null}

      <Card title="Profile">
        {loading ? (
          <EmptyState message="Loading your profile…" />
        ) : profile ? (
          <>
            <DataRow label="Name" value={profile.full_name} />
            <DataRow label="Volunteer ID" value={profile.volunteer_id} />
            <DataRow label="Email" value={profile.email} />
            <DataRow label="Phone" value={profile.phone} />
            <DataRow label="Status" value={profile.status} />
            <DataRow label="Cluster" value={profile.cluster} />
            <DataRow label="Squad" value={profile.squad} />
            <DataRow label="Availability" value={profile.availability} />
            <DataRow label="Specializations" value={(profile.specializations ?? []).join(', ')} />
            <DataRow label="Approved hours" value={profile.approved_hours} />
            <DataRow label="Last shift" value={profile.last_shift?.date ?? '—'} />
          </>
        ) : (
          <EmptyState message="No volunteer profile is available for this account." />
        )}
      </Card>

      <Card title="My program assignments">
        {assignments.length ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {assignments.map((assignment) => (
              <li key={assignment.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <strong style={{ fontSize: 13 }}>{assignment.program_title || assignment.program_ref || 'Program'}</strong>
                  <Badge>{assignment.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>
                </div>
                {assignment.notes ? <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>{assignment.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="You have no program assignments yet." />
        )}
      </Card>

      <Card title="My shift logs">
        {logs.length ? (
          <>
            <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Approved hours: <strong>{approved}</strong></span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending review: <strong>{pending}</strong></span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {logs.map((log) => (
                <li key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 13, display: 'block' }}>{log.activity || 'Field operations'}</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                      {formatDate(log.date)}{log.program_title ? ` · ${log.program_title}` : ''}{log.location ? ` · ${log.location}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{log.hours}h</span>
                    <Badge>{log.approval_status?.toUpperCase()}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState message="No shifts have been logged for you yet." />
        )}
      </Card>
    </WorkspaceShell>
  );
}
