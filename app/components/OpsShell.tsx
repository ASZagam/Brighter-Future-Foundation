'use client';

import { useEffect, useState } from 'react';
import '../dashboard/dashboard.css';
import './ops-page.css';
import Sidebar from '../dashboard/components/Sidebar';
import TopHeader from '../dashboard/components/TopHeader';
import type { DashboardUser } from '../dashboard/hooks/useDashboard';

export default function OpsShell({
  children,
  notificationCount = 3,
}: {
  children: React.ReactNode;
  notificationCount?: number;
}) {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [sidebarHidden, setSidebarHidden] = useState(false);

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
    <div className={`db-shell${sidebarHidden ? ' sidebar-hidden' : ''}`}>
      <Sidebar user={user} hidden={sidebarHidden} />
      <div className="db-main">
        <TopHeader notificationCount={notificationCount} onToggleSidebar={() => setSidebarHidden((hidden) => !hidden)} />
        {children}
      </div>
    </div>
  );
}
