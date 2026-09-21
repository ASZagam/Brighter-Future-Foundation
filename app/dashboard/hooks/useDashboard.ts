'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';

export interface DashboardUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  status: string;
  email_verified: boolean;
  roles: Array<{ id: string; name: string; description: string }>;
  role_names: string[];
  is_super_admin: boolean;
  date_joined: string;
}

export interface DashboardStats {
  organizations: number;
  countries: number;
  states: number;
  active_uploads: number;
  pending_notifications: number;
  activity_logs: number;
  settings_count: number;
  uploads_by_type: Array<{ upload_type: string; total: number }>;
}

export interface ProgramDashboard {
  total_programs: number;
  active_programs: number;
  completed_programs: number;
  cancelled_programs: number;
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  total_beneficiaries: number;
  programs_by_category: Array<{ category__name: string | null; count: number }>;
  programs_by_status: Array<{ status: string; count: number }>;
  programs_by_state: Array<{ state__name: string | null; count: number }>;
}

export interface Program {
  id: string;
  program_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  lga: string;
  budget: number;
  amount_spent: number;
  remaining_budget: number;
  percentage_budget_used: number;
  beneficiary_count: number;
  manager_name: string;
  coordinator_name: string;
  category: { name: string; color: string } | null;
  state: string | null;
  start_date: string;
  end_date: string | null;
}

export interface VolunteerDashboard {
  total_volunteers: number;
  active_volunteers: number;
  pending_volunteers: number;
  inactive_volunteers: number;
  suspended_volunteers: number;
  archived_volunteers: number;
  total_hours: number;
  volunteers_by_status: Array<{ status: string; count: number }>;
}

export interface Member {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  state: string;
  status: string;
  membership_type: string;
}

export interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  campaign: string;
  status: string;
  donated_at: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  category: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  category: string;
  read: boolean;
  sent_at: string;
}

export interface Settings {
  id: string;
  organization: string;
  organization_name: string;
  default_timezone: string;
  default_language: string;
  support_email: string;
  support_phone: string;
  maintenance_mode: boolean;
  enable_file_uploads: boolean;
  max_upload_size_mb: number;
  notification_sender: string;
  analytics_enabled: boolean;
}

export interface State {
  id: string;
  name: string;
  code: string;
  active: boolean;
  country_name: string;
}

export interface DashboardData {
  user: DashboardUser | null;
  stats: DashboardStats | null;
  programDashboard: ProgramDashboard | null;
  activePrograms: Program[];
  volunteerDashboard: VolunteerDashboard | null;
  members: Member[];
  donations: Donation[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  settings: Settings | null;
  states: State[];
  latency: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboard(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    user: null,
    stats: null,
    programDashboard: null,
    activePrograms: [],
    volunteerDashboard: null,
    members: [],
    donations: [],
    activityLogs: [],
    notifications: [],
    settings: null,
    states: [],
    latency: 0,
    loading: true,
    error: null,
    refresh: () => {},
  });

  const fetchData = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    const start = Date.now();

    try {
      const [userRes, stats, progDash, programs, volDash, membersRes, donations, logs, notifs, settings, states] =
        await Promise.allSettled([
          fetch('/api/auth/me', { credentials: 'include' }),
          apiGet<DashboardStats>('/core/dashboard-statistics/'),
          apiGet<ProgramDashboard>('/core/programs/dashboard/'),
          apiGet<{ results: Program[]; count: number }>('/core/programs/?status=active&ordering=-created_at'),
          apiGet<VolunteerDashboard>('/core/volunteers/dashboard/'),
          apiGet<{ results: Member[]; count: number }>('/core/members/?status=active'),
          apiGet<{ results: Donation[]; count: number }>('/core/donations/'),
          apiGet<{ results: ActivityLog[]; count: number }>('/core/activity-logs/?ordering=-created_at'),
          apiGet<{ results: Notification[]; count: number }>('/core/notifications/'),
          apiGet<Settings>('/core/settings/current/'),
          apiGet<{ results: State[]; count: number }>('/core/states/'),
        ]);

      const latency = Date.now() - start;

      const user =
        userRes.status === 'fulfilled' && userRes.value.ok
          ? await userRes.value.json()
          : null;

      setData({
        user,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        programDashboard: progDash.status === 'fulfilled' ? progDash.value : null,
        activePrograms: programs.status === 'fulfilled' ? (programs.value?.results ?? []) : [],
        volunteerDashboard: volDash.status === 'fulfilled' ? volDash.value : null,
        members: membersRes.status === 'fulfilled' ? (membersRes.value?.results ?? []) : [],
        donations: donations.status === 'fulfilled' ? (donations.value?.results ?? []) : [],
        activityLogs: logs.status === 'fulfilled' ? (logs.value?.results ?? []) : [],
        notifications: notifs.status === 'fulfilled' ? (notifs.value?.results ?? []) : [],
        settings: settings.status === 'fulfilled' ? settings.value : null,
        states: states.status === 'fulfilled' ? (states.value?.results ?? []) : [],
        latency,
        loading: false,
        error: null,
        refresh: fetchData,
      });
    } catch (err) {
      console.error('Dashboard load failed:', err);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data. Please refresh.',
        refresh: fetchData,
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refresh: fetchData };
}
