'use client';

import { useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { Card, ErrorNote, WorkspaceShell } from '@/app/components/workspace';

const AUDIENCES = [
  { value: 'all', label: 'All active users' },
  { value: 'super_admin', label: 'Super admins' },
  { value: 'admin', label: 'Administrators' },
  { value: 'coordinator', label: 'Coordinators' },
  { value: 'volunteer', label: 'Volunteers' },
  { value: 'member', label: 'Members' },
  { value: 'donor', label: 'Donors' },
];

interface BroadcastPreview {
  audience: string;
  recipient_count: number;
}

type BroadcastResult = BroadcastPreview;

export default function BroadcastsPage() {
  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<BroadcastPreview | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);

  function invalidatePreview() {
    setPreview(null);
    setError('');
    setSuccess('');
  }

  async function loadPreview() {
    setPreviewLoading(true);
    setError('');
    setSuccess('');
    try {
      const params = new URLSearchParams({ audience });
      const data = await apiGet<BroadcastPreview>(`/core/notifications/broadcast-preview/?${params}`);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to preview broadcast recipients.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function sendBroadcast() {
    if (!preview || preview.audience !== audience) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const result = await apiPost<BroadcastResult>('/core/notifications/broadcast/', {
        audience,
        title,
        message,
      });
      const audienceLabel = AUDIENCES.find((option) => option.value === result.audience)?.label ?? result.audience;
      setSuccess(`Broadcast sent to ${result.recipient_count.toLocaleString()} ${audienceLabel.toLowerCase()}.`);
      setTitle('');
      setMessage('');
      setPreview(null);
      window.dispatchEvent(new Event('bff:notifications-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send the broadcast.');
    } finally {
      setSending(false);
    }
  }

  const canPreview = title.trim().length > 0 && message.trim().length > 0 && !previewLoading && !sending;

  return (
    <WorkspaceShell
      kicker='Admin communications'
      title='Broadcast a message'
      subtitle='Send an in-app notification to all active users or everyone with one selected role.'
    >
      {error ? <ErrorNote message={error} /> : null}
      {success ? <p className='ops-notice' role='status'>{success}</p> : null}
      <Card title='Compose broadcast'>
        <div className='broadcast-form'>
          <label className='broadcast-field'>
            <span>Audience</span>
            <select
              className='ops-select'
              value={audience}
              disabled={previewLoading || sending}
              onChange={(event) => {
                setAudience(event.target.value);
                invalidatePreview();
              }}
            >
              {AUDIENCES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className='broadcast-field'>
            <span>Message title</span>
            <input
              className='ops-input'
              type='text'
              maxLength={255}
              value={title}
              disabled={previewLoading || sending}
              onChange={(event) => {
                setTitle(event.target.value);
                invalidatePreview();
              }}
              placeholder='e.g. Foundation update'
            />
          </label>
          <label className='broadcast-field'>
            <span>Message</span>
            <textarea
              className='ops-textarea'
              maxLength={10000}
              value={message}
              disabled={previewLoading || sending}
              onChange={(event) => {
                setMessage(event.target.value);
                invalidatePreview();
              }}
              placeholder='Write the message recipients will see in their notification center.'
              rows={6}
            />
            <span className='broadcast-character-count'>{message.length.toLocaleString()} / 10,000</span>
          </label>
          <div className='broadcast-actions'>
            <button type='button' className='ops-btn primary' onClick={loadPreview} disabled={!canPreview}>
              {previewLoading ? 'Checking audience…' : 'Preview recipients'}
            </button>
          </div>
        </div>
      </Card>

      {preview ? (
        <Card title='Review before sending'>
          <div className='broadcast-review'>
            <p><strong>Audience:</strong> {AUDIENCES.find((option) => option.value === preview.audience)?.label}</p>
            <p><strong>Estimated recipients:</strong> {preview.recipient_count.toLocaleString()}</p>
            <div className='broadcast-message-preview'>
              <strong>{title}</strong>
              <p>{message}</p>
            </div>
            <p className='broadcast-warning'>This sends an in-app notification to every active user in this audience. It cannot be recalled.</p>
            <button
              type='button'
              className='ops-btn primary'
              onClick={sendBroadcast}
              disabled={sending || preview.recipient_count === 0}
            >
              {sending ? 'Sending…' : `Confirm and send to ${preview.recipient_count.toLocaleString()}`}
            </button>
          </div>
        </Card>
      ) : null}
    </WorkspaceShell>
  );
}
