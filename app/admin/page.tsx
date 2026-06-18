export default function AdminPage() {
  return (
    <div style={{ maxWidth: 900, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(15,23,42,0.08)' }}>
      <h1>Admin Console</h1>
      <p style={{ color: '#475569' }}>Administrative control over the Foundation's modules, where roles and permissions are defined.</p>

      <section style={{ marginTop: 24, display: 'grid', gap: 16 }}>
        <div style={{ padding: 24, borderRadius: 20, background: '#eff6ff' }}>
          <h2>Supported Roles</h2>
          <ul style={{ color: '#334155', lineHeight: 1.8 }}>
            <li>Super Admin</li>
            <li>Executive Director</li>
            <li>Program Manager</li>
            <li>Volunteer Coordinator</li>
            <li>Content Manager</li>
          </ul>
        </div>

        <div style={{ padding: 24, borderRadius: 20, background: '#f8fafc' }}>
          <h2>Module Access</h2>
          <ul style={{ color: '#334155', lineHeight: 1.8 }}>
            <li>Membership management</li>
            <li>Volunteer assignments and tracking</li>
            <li>Donations and campaign management</li>
            <li>Event scheduling and registration</li>
            <li>News publishing and media uploads</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
