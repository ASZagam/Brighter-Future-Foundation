import { apiGet, apiPost, apiPatch, fetchWithAuth } from './api';

export type MemberTabKey = 'all' | 'pending' | 'active' | 'beneficiaries' | 'suspended';

export type BackendMember = {
  id: string;
  member_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
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
  notes: string;
  profile_photo: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
};

export type MemberStats = {
  kpis: {
    total_members?: number;
    active?: number;
    pending?: number;
    suspended?: number;
    inactive?: number;
    archived?: number;
    beneficiaries?: number;
    states_covered?: number;
  };
  tabs?: Record<MemberTabKey, number>;
  options?: {
    states?: string[];
    membership_types?: Array<{ value: string; label: string }>;
    statuses?: Array<{ value: string; label: string }>;
  };
};

export type MemberListParams = {
  page?: number;
  search?: string;
  state?: string;
  membershipType?: string;
  status?: string;
  ordering?: string;
};

export function buildMemberQuery(params: MemberListParams = {}): string {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set('page', String(params.page));
  if (params.search) query.set('search', params.search);
  if (params.state) query.set('state', params.state);
  if (params.membershipType) query.set('membership_type', params.membershipType);
  if (params.status) query.set('status', params.status);
  query.set('ordering', params.ordering ?? '-created_at');
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchMembers(
  params: MemberListParams = {},
): Promise<{ results: BackendMember[]; count: number }> {
  return apiGet<{ results: BackendMember[]; count: number }>(`/core/members/${buildMemberQuery(params)}`);
}

export async function fetchMemberStats(): Promise<MemberStats> {
  return apiGet<MemberStats>('/core/members/stats/');
}

export async function registerMember(payload: Record<string, unknown>): Promise<BackendMember> {
  return apiPost<BackendMember>('/core/members/', payload);
}

export async function updateMember(id: string, payload: Record<string, unknown>): Promise<BackendMember> {
  return apiPatch<BackendMember>(`/core/members/${id}/`, payload);
}

export async function deleteMember(id: string): Promise<void> {
  const response = await fetchWithAuth(`/api/backend/core/members/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(error.error || 'Failed to delete member');
  }
}

export async function setMemberStatus(
  id: string,
  status: string,
): Promise<{ status: string; member: BackendMember }> {
  return apiPost(`/core/members/${id}/set-status/`, { status });
}

export async function exportMembersCsv(params: MemberListParams = {}): Promise<void> {
  const response = await fetchWithAuth(`/api/backend/core/members/export/${buildMemberQuery(params)}`);
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bff-member-registry.csv';
  link.click();
  URL.revokeObjectURL(url);
}
