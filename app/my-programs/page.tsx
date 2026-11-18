'use client';

import { useEffect, useState } from 'react';
import { apiCall, apiGet, apiPost } from '@/lib/api';
import OpsShell from '@/app/components/OpsShell';
import { Badge, Card, EmptyState, ErrorNote } from '@/app/components/workspace';
import '../members/members.css';
import './my-programs.css';

interface ProgramDetails {
  id: string;
  program_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string | null;
  state_name: string;
  lga: string;
  address: string;
  manager_name: string;
  coordinator_name: string;
  team_lead: string;
  team: Array<{ name: string; role: string }>;
}

interface ProgramAssignment {
  id: string;
  assignment_type: 'staff' | 'volunteer' | 'management';
  assigned_role: string;
  notes: string;
  can_manage: boolean;
  program: ProgramDetails;
}

function formatDate(value: string | null): string {
  if (!value) return 'To be confirmed';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function ProgramAssignmentActions({
  assignment,
  onChanged,
}: {
  assignment: ProgramAssignment;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState(assignment.program.status);
  const [caption, setCaption] = useState('');
  const [reminder, setReminder] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function updateStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiPost(`/core/programs/${assignment.program.id}/team-status/`, { status });
      setNotice('Program status updated.');
      onChanged();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update program status.');
    } finally {
      setBusy(false);
    }
  }

  async function sendReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await apiPost<{ recipient_count: number }>(
        `/core/programs/${assignment.program.id}/remind-team/`,
        { message: reminder },
      );
      setReminder('');
      setNotice(`Reminder sent to ${result.recipient_count} team members.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to send the team reminder.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0];
    if (!file) {
      setError('Choose an image to upload.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const body = new FormData();
    body.append('program', assignment.program.id);
    body.append('image', file);
    body.append('caption', caption);
    try {
      await apiCall('/core/program-gallery/', { method: 'POST', body });
      setCaption('');
      form.reset();
      setNotice('Program photo uploaded.');
      onChanged();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to upload the program photo.');
    } finally {
      setBusy(false);
    }
  }

  if (!assignment.can_manage) return <span className="assigned-program-meta">—</span>;

  return (
    <div className="assigned-program-actions">
      <form onSubmit={updateStatus}>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={busy}>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button type="submit" disabled={busy || status === assignment.program.status}>Update</button>
      </form>
      <form onSubmit={uploadPhoto}>
        <label>
          Progress photo
          <input type="file" accept="image/*" required disabled={busy} />
        </label>
        <input
          type="text"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Photo caption"
          aria-label="Photo caption"
          disabled={busy}
        />
        <button type="submit" disabled={busy}>Upload</button>
      </form>
      <form onSubmit={sendReminder}>
        <label>
          Team reminder
          <textarea
            value={reminder}
            onChange={(event) => setReminder(event.target.value)}
            placeholder="Write a reminder for your team"
            maxLength={2000}
            required
            disabled={busy}
          />
        </label>
        <button type="submit" disabled={busy || !reminder.trim()}>Send reminder</button>
      </form>
      {error ? <span className="assigned-program-action-error" role="alert">{error}</span> : null}
      {notice ? <span className="assigned-program-action-notice" role="status">{notice}</span> : null}
    </div>
  );
}

export default function MyProgramsPage() {
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    apiGet<ProgramAssignment[]>('/core/programs/assigned-to-me/')
      .then((data) => {
        if (active) setAssignments(data);
      })
      .catch(() => {
        if (active) setError('Your assigned programs could not be loaded. Please try again later.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <OpsShell>
      <main className="members-content assigned-program-content">
        <div className="members-kicker">
          <span>CORE OPERATIONS</span>
          <i aria-hidden="true">•</i>
          <span>MY PROGRAMS</span>
        </div>
        <header className="members-heading">
          <div>
            <h1>My Programs</h1>
            <p>Your role, schedule, location, and the team you will work with.</p>
          </div>
        </header>
        {error ? <ErrorNote message={error} /> : null}
        {loading ? (
          <Card title="Assigned programs"><EmptyState message="Loading your assignments..." /></Card>
        ) : assignments.length ? (
          <section className="member-list assigned-program-roster" aria-label="Assigned programs">
            <div className="member-roster-toolbar assigned-program-toolbar">
              <strong>Program assignments</strong>
              <span>Showing {assignments.length} {assignments.length === 1 ? 'program' : 'programs'}</span>
            </div>
            <div className="assigned-program-table-scroll">
              <div className="assigned-program-table" role="table" aria-label="Your program assignments">
                <div className="assigned-program-table-head" role="row">
                  <span role="columnheader">Program</span>
                  <span role="columnheader">Your role</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">Schedule</span>
                  <span role="columnheader">Location</span>
                  <span role="columnheader">Foundation team</span>
                  <span role="columnheader">Team actions</span>
                </div>
                {assignments.map((assignment) => {
                  const program = assignment.program;
                  const location = [program.address, program.lga, program.state_name].filter(Boolean).join(', ');
                  return (
                    <article className="assigned-program-row" role="row" key={`${assignment.assignment_type}-${assignment.id}`}>
                      <div className="assigned-program-identity" role="cell">
                        <strong>{program.title}</strong>
                        <span className="assigned-program-reference">#{program.program_id}</span>
                        {program.description ? <span className="assigned-program-meta">{program.description}</span> : null}
                        {assignment.notes ? <span className="assigned-program-meta">Assignment: {assignment.notes}</span> : null}
                      </div>
                      <div className="assigned-program-cell" role="cell">
                        <span className="assigned-program-cell-label">Your role</span>
                        <strong>{assignment.assigned_role}</strong>
                      </div>
                      <div className="assigned-program-cell" role="cell">
                        <span className="assigned-program-cell-label">Status</span>
                        <Badge>{program.status.replace(/_/g, ' ')}</Badge>
                        <span className="assigned-program-meta">{program.priority} priority</span>
                      </div>
                      <div className="assigned-program-cell" role="cell">
                        <span className="assigned-program-cell-label">Schedule</span>
                        <strong>{formatDate(program.start_date)}</strong>
                        <span className="assigned-program-meta">to {formatDate(program.end_date)}</span>
                      </div>
                      <div className="assigned-program-cell" role="cell">
                        <span className="assigned-program-cell-label">Location</span>
                        <strong>{location || 'To be confirmed'}</strong>
                      </div>
                      <div className="assigned-program-cell assigned-program-team" role="cell">
                        <span className="assigned-program-cell-label">Foundation team</span>
                        <strong>Lead: {program.team_lead || 'To be assigned'}</strong>
                        <span className="assigned-program-meta">Coordinator: {program.coordinator_name || 'To be assigned'}</span>
                        {program.team.map((member, index) => (
                          <span className="assigned-program-meta" key={`${member.name}-${member.role}-${index}`}>
                            {member.name} · {member.role}
                          </span>
                        ))}
                      </div>
                      <div className="assigned-program-cell assigned-program-actions-cell" role="cell">
                        <ProgramAssignmentActions
                          assignment={assignment}
                          onChanged={() => setRefreshKey((key) => key + 1)}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <Card title="Assigned programs">
            <EmptyState message="You do not have any program assignments yet. Your assignments will appear here when a coordinator adds you to a team." />
          </Card>
        )}
      </main>
    </OpsShell>
  );
}
