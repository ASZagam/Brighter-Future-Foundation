'use client';

import './dashboard.css';
import { useDashboard } from './hooks/useDashboard';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import SystemStatusStrip from './components/SystemStatusStrip';
import DashboardPageHeader from './components/PageHeader';
import KPICards from './components/KPICards';
import AdministrativeOperations from './components/AdministrativeOperations';
import LiveProgramProgress from './components/LiveProgramProgress';
import AuditActivityStream from './components/AuditActivityStream';
import InfrastructureOps from './components/InfrastructureOps';
import GeographicCommand from './components/GeographicCommand';

export default function DashboardPage() {
  const {
    user,
    stats,
    programDashboard,
    activePrograms,
    volunteerDashboard,
    members,
    donations,
    activityLogs,
    notifications,
    settings,
    states,
    latency,
    loading,
    error,
  } = useDashboard();

  if (error) {
    return (
      <div className="db-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 14, color: '#DC2626', marginBottom: 12 }}>{error}</p>
          <a href="/auth/login" style={{ fontSize: 12, color: '#087F5B', fontWeight: 600 }}>Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="db-shell">
      <Sidebar user={user} />
      <div className="db-main">
        <TopHeader notificationCount={stats?.pending_notifications ?? notifications.filter((n) => !n.read).length} />
        <div className="db-content">
          <SystemStatusStrip latency={latency} />
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
              Loading dashboard data...
            </div>
          ) : (
            <>
              <DashboardPageHeader user={user} />
              <KPICards
                programDash={programDashboard}
                volDash={volunteerDashboard}
                members={members}
                donations={donations}
              />
              <AdministrativeOperations stats={stats} notifications={notifications} />
              <div className="db-content-grid">
                <div className="db-content-left">
                  <LiveProgramProgress programs={activePrograms} />
                  <GeographicCommand states={states} programDash={programDashboard} />
                </div>
                <div className="db-content-right">
                  <AuditActivityStream logs={activityLogs} />
                  <InfrastructureOps settings={settings} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
