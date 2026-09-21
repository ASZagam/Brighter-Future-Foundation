'use client';

import { useEffect, useState } from 'react';
import '../dashboard/dashboard.css';
import '../core/core.css';
import './settings.css';
import Sidebar from '../dashboard/components/Sidebar';
import TopHeader from '../dashboard/components/TopHeader';
import SettingsContent from './SettingsContent';
import type { DashboardUser } from '../dashboard/hooks/useDashboard';

export default function SettingsShell() {
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
    <div className="db-shell">
      <Sidebar user={user} />
      <div className="db-main">
        <TopHeader notificationCount={3} />
        <SettingsContent />
      </div>
    </div>
  );
}
