'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Donation {
  id: number;
  donor_name: string;
  campaign_title: string;
  amount: number;
  status: string;
  donated_at: string;
  reference: string;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDonations() {
      try {
        const response = await fetch('/api/donations');
        if (!response.ok) {
          setError('Please sign in to view donations.');
          return;
        }
        const data = await response.json();
        setDonations(data.results || []);
      } catch (err) {
        setError('Failed to load donations.');
      } finally {
        setLoading(false);
      }
    }

    loadDonations();
  }, []);

  return (
    <div className='page-shell'>
      <section style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div>
            <h1>Donations</h1>
            <p style={{ color: '#475569' }}>Track donations and campaigns.</p>
          </div>
          <Link href='/dashboard' style={{ color: '#2563eb' }}>Back to dashboard</Link>
        </div>

        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}

        {loading ? (
          <p>Loading donations...</p>
        ) : donations.length === 0 ? (
          <p style={{ color: '#64748b', marginTop: 16 }}>No donations found.</p>
        ) : (
          <div style={{ marginTop: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Donor</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Campaign</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12 }}>{donation.donor_name}</td>
                    <td style={{ padding: 12 }}>{donation.campaign_title || 'General'}</td>
                    <td style={{ padding: 12 }}>${donation.amount.toFixed(2)}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: donation.status === 'completed' ? '#dcfce7' : '#fee2e2',
                        color: donation.status === 'completed' ? '#166534' : '#991b1b'
                      }}>
                        {donation.status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{new Date(donation.donated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
