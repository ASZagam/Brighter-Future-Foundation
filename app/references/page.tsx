'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';

interface Country {
  id: number;
  name: string;
  iso_code: string;
  active: boolean;
}

interface State {
  id: number;
  name: string;
  code: string;
  country: number;
  country_name: string;
  active: boolean;
}

export default function ReferencesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [countryData, stateData] = await Promise.all([
          apiGet<Country[]>('/core/countries/'),
          apiGet<State[]>('/core/states/'),
        ]);
        setCountries(countryData);
        setStates(stateData);
        setSelectedCountry(countryData[0]?.id ?? null);
      } catch (err: any) {
        setError(err.message || 'Unable to load reference data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredStates = selectedCountry ? states.filter((item) => item.country === selectedCountry) : states;

  return (
    <div className='page-shell' style={{ padding: '3rem 0' }}>
      <div className='section-title'>
        <div>
          <p className='eyebrow'>Reference Data</p>
          <h1>Countries and state lookup</h1>
        </div>
        <Link href='/core' className='button-link'>Return to Core</Link>
      </div>

      <p className='text-muted' style={{ marginBottom: 24 }}>Browse active countries and states used by the platform for address validation and regional configuration.</p>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {loading ? (
        <p>Loading reference data…</p>
      ) : (
        <div className='card-grid'>
          <div className='card'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <p className='eyebrow'>Country list</p>
                <h2 style={{ margin: '0.75rem 0 0' }}>{countries.length} active countries</h2>
              </div>
              <span className='action-button' style={{ minHeight: 'auto', padding: '10px 14px' }}>Stable data</span>
            </div>
            <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
              {countries.map((country) => (
                <div key={country.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                  <span>{country.name}</span>
                  <span style={{ color: '#475569' }}>{country.iso_code}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='card'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <p className='eyebrow'>State list</p>
                <h2 style={{ margin: '0.75rem 0 0' }}>{filteredStates.length} states shown</h2>
              </div>
              <select className='field-select' value={selectedCountry ?? ''} onChange={(event) => setSelectedCountry(Number(event.target.value))}>
                <option value=''>All countries</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
              {filteredStates.map((state) => (
                <div key={state.id} style={{ display: 'grid', gap: 6, padding: 14, borderRadius: 14, background: '#f8fafc', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <span>{state.name}</span>
                    <span style={{ color: '#475569' }}>{state.code || '—'}</span>
                  </div>
                  <p style={{ margin: 0, color: '#64748b' }}>{state.country_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
