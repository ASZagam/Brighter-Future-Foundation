import { apiGet, apiPost, fetchWithAuth } from './api';

export type DeploymentStatus =
  | 'deployed'
  | 'standby'
  | 'on_leave'
  | 'pending_signoff'
  | 'inactive'
  | 'suspended';

export type BackendVolunteer = {
  id: string;
  volunteer_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  state: string;
  lga: string;
  address: string;
  nationality: string;
  occupation: string;
  bio: string;
  organization: string;
  squad: string;
  status: string;
  joined_date: string;
  years_of_experience: number;
  latitude: string | null;
  longitude: string | null;
  last_gps_at: string | null;
  on_leave_until: string | null;
  skills_list: string[];
  specializations: string[];
  cluster: string;
  deployment_status: DeploymentStatus;
  compliance_score: number | null;
  total_hours: number | null;
  volunteer_hours: number;
  last_shift: {
    id: string;
    date: string;
    hours: number;
    activity: string;
    status: string;
    location: string;
  } | null;
  on_site_this_week: number;
  active_deployment: { program_id: string; title: string; status: string; priority: string } | null;
  notes: string;
  created_at?: string;
  updated_at?: string;
};

export type VolunteerStats = {
  kpis: {
    total_field_volunteers?: number;
    active?: number;
    active_deployment?: number;
    standby?: number;
    on_leave?: number;
    on_site_this_week?: number;
    clusters_active?: number;
    clusters?: Array<{ name: string; count: number }>;
    logged_hours_ytd?: number;
    shift_logs_count?: number;
    avg_hours_per_week?: number;
    pending_verification?: number;
    high_priority?: number;
    within_sla?: number;
    compliance?: number;
  };
  tabs?: {
    all?: number;
    active_deployment?: number;
    standby?: number;
    pending_signoff?: number;
    on_leave?: number;
    suspended?: number;
    pending?: number;
  };
  options?: {
    clusters?: string[];
    specializations?: string[];
    statuses?: Array<{ value: string; label: string }>;
  };
};

export type LocationPoint = {
  volunteer_id: string;
  full_name: string;
  cluster: string;
  squad: string;
  status: string;
  latitude: number;
  longitude: number;
  last_gps_at: string | null;
  deployment: string | null;
};

export type BackendHourLog = {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  full_name: string;
  volunteer_ref: string;
  program: string | null;
  program_title: string | null;
  activity: string;
  date: string;
  hours: number;
  shift_id: string;
  shift_start: string | null;
  shift_end: string | null;
  location: string;
  approval_status: string;
  query_note: string | null;
  queried_by_name: string | null;
  queried_at: string | null;
  reviewer_name: string | null;
  notes: string;
};

export type BackendProgram = {
  id: string;
  program_id: string;
  title: string;
  status: string;
  priority: string;
  state?: string | null;
};

export type BackendSkill = { id: string; name: string; description: string; is_active: boolean };

export type SystemInfo = {
  backend?: { host?: string[]; debug?: boolean; timezone?: string; settings_module?: string };
  frameworks?: { django?: string; drf?: string; python?: string };
  database?: { vendor?: string; engine?: string; name?: string; host?: string; port?: string };
  counts?: Record<string, number>;
};

export async function fetchVolunteers(params?: string): Promise<{ results: BackendVolunteer[]; count: number }> {
  return apiGet<{ results: BackendVolunteer[]; count: number }>(`/core/volunteers/${params ?? ''}`);
}

export async function fetchVolunteerStats(): Promise<VolunteerStats> {
  return apiGet<VolunteerStats>('/core/volunteers/stats/');
}

export async function fetchVolunteerLocations(): Promise<{ locations: LocationPoint[]; count: number }> {
  return apiGet<{ locations: LocationPoint[]; count: number }>('/core/volunteers/locations/');
}

export async function fetchVolunteerSkills(): Promise<BackendSkill[]> {
  return apiGet<BackendSkill[]>('/core/volunteer-skills/');
}

export async function fetchPrograms(): Promise<{ results: BackendProgram[]; count: number }> {
  return apiGet<{ results: BackendProgram[]; count: number }>('/core/programs/?status=active');
}

export async function fetchSystemInfo(): Promise<SystemInfo> {
  return apiGet<SystemInfo>('/core/system-info/');
}

export async function fetchHourLogs(volunteerId?: string): Promise<{ results: BackendHourLog[]; count: number }> {
  const qs = volunteerId ? `?volunteer_id=${encodeURIComponent(volunteerId)}` : '';
  return apiGet<{ results: BackendHourLog[]; count: number }>(`/core/volunteer-hours/${qs}`);
}

export async function registerVolunteer(payload: Record<string, unknown>): Promise<BackendVolunteer> {
  return apiPost<BackendVolunteer>('/core/volunteers/', payload);
}

export async function batchLogHours(payload: {
  volunteer_ids: string[];
  program_id: string;
  activity: string;
  hours: number;
  date: string;
  location: string;
}): Promise<{ created: BackendHourLog[]; count: number }> {
  return apiPost('/core/volunteers/batch-log-hours/', payload);
}

export async function reassignSquad(id: string, squad: string): Promise<{ status: string; squad: string }> {
  return apiPost(`/core/volunteers/${id}/reassign/`, { squad });
}

export async function suspendVolunteer(id: string, reason: string): Promise<{ status: string }> {
  return apiPost(`/core/volunteers/${id}/suspend/`, { reason });
}

export async function reactivateVolunteer(id: string): Promise<{ status: string }> {
  return apiPost(`/core/volunteers/${id}/reactivate/`, {});
}

export async function actOnShift(id: string, action: 'approve' | 'reject' | 'query', note?: string): Promise<BackendHourLog> {
  return apiPost(`/core/volunteer-hours/${id}/${action}/`, action === 'query' ? { query_note: note ?? '' } : {});
}

export async function exportVolunteersCsv(): Promise<void> {
  const response = await fetchWithAuth('/api/backend/core/volunteers/export/');
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bff-volunteer-roster.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadVolunteerIdCard(id: string): Promise<string> {
  const response = await fetchWithAuth(`/api/backend/core/volunteers/${id}/id-card/`);
  if (!response.ok) throw new Error('ID card generation failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return url;
}