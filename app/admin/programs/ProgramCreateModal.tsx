'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

interface AssignableUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role_names: string[];
}

interface StateOption {
  id: string | number;
  name: string;
}

interface TeamAssignment {
  user: string;
  role_in_program: string;
  notes: string;
}

interface ProgramCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialProgram?: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    start_date: string;
    end_date: string | null;
    budget: number;
    amount_spent: number;
    beneficiary_count: number;
    state: string | number | null;
    lga: string;
    address: string;
    team_assignments: Array<{ user: string; role_in_program: string; notes?: string }>;
  };
}

const roleOptions = [
  ['program_coordinator', 'Program Coordinator'],
  ['team_lead', 'Team Lead'],
  ['volunteer', 'Volunteer'],
  ['field_officer', 'Field Officer'],
  ['medical_officer', 'Medical Officer'],
  ['logistics', 'Logistics Officer'],
  ['finance', 'Finance Officer'],
  ['communication', 'Communication Officer'],
  ['monitoring', 'Monitoring & Evaluation Officer'],
  ['other', 'Other'],
];

export default function ProgramCreateModal({ onClose, onCreated, initialProgram }: ProgramCreateModalProps) {
  const [title, setTitle] = useState(initialProgram?.title ?? '');
  const [description, setDescription] = useState(initialProgram?.description ?? '');
  const [status, setStatus] = useState(initialProgram?.status ?? 'planning');
  const [priority, setPriority] = useState(initialProgram?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(initialProgram?.start_date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(initialProgram?.end_date ?? '');
  const [budget, setBudget] = useState(String(initialProgram?.budget ?? ''));
  const [amountSpent, setAmountSpent] = useState(String(initialProgram?.amount_spent ?? '0'));
  const [beneficiaryCount, setBeneficiaryCount] = useState(String(initialProgram?.beneficiary_count ?? '0'));
  const [stateId, setStateId] = useState(initialProgram?.state == null ? '' : String(initialProgram.state));
  const [lga, setLga] = useState(initialProgram?.lga ?? '');
  const [address, setAddress] = useState(initialProgram?.address ?? '');
  const [team, setTeam] = useState<TeamAssignment[]>(initialProgram?.team_assignments.map((item) => ({
    ...item,
    notes: item.notes ?? '',
  })) ?? []);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [lgasByState, setLgasByState] = useState<Record<string, string[]>>({});
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<AssignableUser[]>('/core/program-staff-assignments/eligible-users/'),
      apiGet<{ results: StateOption[] }>('/core/states/'),
      fetch('/data/nigeria_lgas.csv').then(async (response) => {
        if (!response.ok) throw new Error('Could not load Nigerian local government areas.');
        return response.text();
      }),
    ]).then(([eligibleUsers, stateResult, csv]) => {
      if (!active) return;
      setUsers(eligibleUsers);
      setStates(stateResult.results ?? []);
      const byState: Record<string, string[]> = {};
      for (const [index, line] of csv.split(/\r?\n/).entries()) {
        if (index === 0 || !line.trim()) continue;
        const [stateName, lgaName] = line.split(',');
        const normalizedState = stateName === 'FCT' ? 'Federal Capital Territory' : stateName;
        if (normalizedState && lgaName) (byState[normalizedState] ??= []).push(lgaName);
      }
      setLgasByState(byState);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load the program team directory.');
    }).finally(() => {
      if (active) setDirectoryLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function updateAssignment(index: number, patch: Partial<TeamAssignment>) {
    setTeam((current) => current.map((assignment, rowIndex) => rowIndex === index
      ? { ...assignment, ...patch }
      : assignment));
  }

  async function saveProgram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description,
        status,
        priority,
        start_date: startDate,
        end_date: endDate || null,
        budget: Number(budget),
        amount_spent: Number(amountSpent || 0),
        beneficiary_count: Number(beneficiaryCount || 0),
        state: stateId || null,
        lga,
        address,
        team_assignments: team.filter((assignment) => assignment.user),
      };
      if (initialProgram) {
        await apiPatch(`/core/programs/${initialProgram.id}/`, payload);
      } else {
        await apiPost('/core/programs/', payload);
      }
      onCreated();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create the program.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="program-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <form className="program-modal" onSubmit={saveProgram}>
        <div className="program-modal-header">
          <div><span className="details-ref">{initialProgram ? 'PROGRAM DETAILS' : 'NEW PROGRAM MANDATE'}</span><h2>{initialProgram ? 'Edit Program' : 'Create New Program'}</h2></div>
          <button type="button" className="modal-close" aria-label="Close create program form" onClick={onClose}>×</button>
        </div>
        <p className="program-modal-copy">{initialProgram ? 'Update the program details, location, schedule, and assigned team.' : 'Add program details and assign the foundation team.'}</p>
        <label>Program title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Kaduna Clean Water Initiative" /></label>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Describe the program and its goals" /></label>

        <div className="program-form-grid">
          <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="planning">Planning</option><option value="active">Active</option><option value="draft">Draft</option></select></label>
          <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
          <label>Start date<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label>End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <label>State<select value={stateId} onChange={(event) => { setStateId(event.target.value); setLga(''); }}><option value="">Select a state</option>{states.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label>
          <label>Local government area<select value={lga} onChange={(event) => setLga(event.target.value)} disabled={!stateId}><option value="">{stateId ? 'Select an LGA' : 'Select a state first'}</option>{(lgasByState[states.find((item) => String(item.id) === stateId)?.name ?? ''] ?? []).map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
          <label className="program-form-wide">Street address<textarea rows={2} value={address} onChange={(event) => setAddress(event.target.value)} /></label>
          <label>Budget (₦)<input required min="0" type="number" value={budget} onChange={(event) => setBudget(event.target.value)} /></label>
          {initialProgram ? <label>Amount spent (₦)<input min="0" type="number" value={amountSpent} onChange={(event) => setAmountSpent(event.target.value)} /></label> : null}
          <label>Beneficiaries<input min="0" type="number" value={beneficiaryCount} onChange={(event) => setBeneficiaryCount(event.target.value)} /></label>
        </div>

        <fieldset className="program-team-fieldset">
          <legend>Foundation team</legend>
          <p>Assign staff and volunteers to this program. A Program Coordinator can update this program, upload photos, and remind its team.</p>
          {directoryLoading ? <p>Loading available team members…</p> : users.length ? (
            <div className="program-team-rows">
              {team.map((assignment, index) => (
                <div className="program-team-row" key={`team-${index}`}>
                  <label>
                    Team member
                    <select required value={assignment.user} onChange={(event) => updateAssignment(index, { user: event.target.value })}>
                      <option value="">Choose a person</option>
                      {users.map((user) => {
                        const selectedElsewhere = team.some((item, rowIndex) => rowIndex !== index && item.user === user.id);
                        const accountRoles = user.role_names.length ? user.role_names.join(', ') : 'account';
                        return <option key={user.id} value={user.id} disabled={selectedElsewhere}>{user.full_name || user.username} · {accountRoles} · {user.email}</option>;
                      })}
                    </select>
                  </label>
                  <label>
                    Assigned role
                    <select value={assignment.role_in_program} onChange={(event) => updateAssignment(index, { role_in_program: event.target.value })}>
                      {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <button type="button" aria-label="Remove team member" onClick={() => setTeam((current) => current.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
                </div>
              ))}
              <button type="button" className="program-add-team" onClick={() => setTeam((current) => [...current, { user: '', role_in_program: 'other', notes: '' }])}>+ Add team member</button>
            </div>
          ) : <p>No active accounts are available to assign.</p>}
        </fieldset>

        {error ? <p className="program-form-error">{error}</p> : null}
        <div className="program-modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={saving || directoryLoading}>{saving ? 'Saving…' : initialProgram ? 'Save Changes' : 'Create Program'}</button>
        </div>
      </form>
    </div>
  );
}
