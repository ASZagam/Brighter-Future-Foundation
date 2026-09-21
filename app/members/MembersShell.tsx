'use client';

import { useEffect, useState } from 'react';
import '../dashboard/dashboard.css';
import './members.css';
import Sidebar from '../dashboard/components/Sidebar';
import TopHeader from '../dashboard/components/TopHeader';
import MembersRoster from './MembersRoster';
import type { DashboardUser } from '../dashboard/hooks/useDashboard';

export default function MembersShell({ preselectedId }: { preselectedId?: string }) {
  const [user, setUser] = useState<DashboardUser | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((me) => {
        if (mounted) setUser(me);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="db-shell members-shell">
      <Sidebar user={user} />
      <div className="db-main">
        <TopHeader notificationCount={3} />
        <MembersRoster initialMemberId={preselectedId} />
      </div>
    </div>
  );
}