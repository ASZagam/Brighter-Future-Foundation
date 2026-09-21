'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import OpsShell from '../components/OpsShell';
import { apiGet } from '../../lib/api';

interface Country {
  id: number;
  name: string;
  iso_code: string;
  iso3_code: string;
  numeric_code: string;
  calling_code: string;
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

const PAGE_SIZE = 20;

export default function ReferencesPage() {
  const [tab, setTab] = useState<'countries' | 'states'>('states');
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryCount, setCountryCount] = useState(0);
  const [states, setStates] = useState<State[]>([]);
  const [stateCount, setStateCount] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const countryMap = useMemo(() => new Map(countries.map((item) => [item.id, item])), [countries]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('ordering', 'name');
      params.set('page', String(page));

      if (tab === 'countries') {
        const list = await apiGet<{ results: Country[]; count: number }>(`/core/countries/?${params.toString()}`);
        setCountries(list.results ?? []);
        setCountryCount(list.count ?? 0);
      } else {
        const stateParams = new URLSearchParams(params);
        if (selectedCountry) stateParams.set('country', selectedCountry);
        const list = await apiGet<{ results: State[]; count: number }>(`/core/states/?${stateParams.toString()}`);
        setStates(list.results ?? []);
        setStateCount(list.count ?? 0);
      }
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load reference data.');
    } finally {
      setLoading(false);
    }
  }, [tab, search, selectedCountry, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, selectedCountry]);

  useEffect(() => {
    apiGet<{ results: Country[]; count: number }>('/core/countries/?ordering=name')
      .then((data) => {
        setCountries(data.results ?? []);
        setCountryCount(data.count ?? 0);
      })
      .catch(() => {});
  }, []);

  const count = tab === 'countries' ? countryCount : stateCount;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <OpsShell>
      <main className="ops-page">
        <div className="ops-kicker">
          <span>PLATFORM CONFIG</span>
          <i>|</i>
          <span className="dim">Geographic lookup tables used across forms</span>
        </div>

        <div className="ops-head">
          <div>
            <h1>Reference Tables</h1>
            <p>Read-only geographic data powering address validation, regional assignment and reporting filters.</p>
          </div>
          <div className="ops-head-actions">
            <button type="button" onClick={load} disabled={loading}>{loading ? 'Loading…' : '↻ Refresh'}</button>
          </div>
        </div>

        {error ? <div className="ops-notice warn">API issue — {error}</div> : null}

        <div className="ops-kpis">
          <div className="ops-kpi accent">
            <span className="ops-kpi-label">Countries</span>
            <strong className="ops-kpi-value">{countryCount || '…'}</strong>
            <span className="ops-kpi-foot">active regions</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">States</span>
            <strong className="ops-kpi-value">{stateCount || '…'}</strong>
            <span className="ops-kpi-foot">geographic units</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Current view</span>
            <strong className="ops-kpi-value" style={{ fontSize: 18 }}>{tab === 'countries' ? 'Countries' : 'States'}</strong>
            <span className="ops-kpi-foot">{count} record{count === 1 ? '' : 's'}</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Region filter</span>
            <strong className="ops-kpi-value" style={{ fontSize: 18 }}>
              {selectedCountry ? countryMap.get(Number(selectedCountry))?.name || 'Selected' : 'All countries'}
            </strong>
            <span className="ops-kpi-foot">states scope</span>
          </div>
          <div className="ops-kpi">
            <span className="ops-kpi-label">Source</span>
            <strong className="ops-kpi-value" style={{ fontSize: 18 }}>REST</strong>
            <span className="ops-kpi-foot">/core lookup tables</span>
          </div>
        </div>

        <section className="ops-panel">
          <div className="ops-toolbar">
            <div className="ops-toolbar-group">
              <button type="button" className={`ops-btn${tab === 'states' ? ' primary' : ''}`} onClick={() => setTab('states')}>States</button>
              <button type="button" className={`ops-btn${tab === 'countries' ? ' primary' : ''}`} onClick={() => setTab('countries')}>Countries</button>
            </div>
            <div className="ops-toolbar-group">
              <input className="ops-input ops-search" placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
              {tab === 'states' ? (
                <select className="ops-select" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                  <option value="">All countries</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>

          <div className="ops-table-wrap">
            {tab === 'states' ? (
              <table className="ops-table">
                <thead>
                  <tr><th>State / Region</th><th>Code</th><th>Country</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="ops-empty-row">Loading states…</td></tr>
                  ) : states.length === 0 ? (
                    <tr><td colSpan={4} className="ops-empty-row">No states match the current filters.</td></tr>
                  ) : (
                    states.map((state) => (
                      <tr key={state.id}>
                        <td className="strong">{state.name}</td>
                        <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }}>{state.code || '—'}</td>
                        <td>{state.country_name}</td>
                        <td><span className={`ops-chip ${state.active ? 'green' : 'grey'}`}>{state.active ? 'active' : 'inactive'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="ops-table">
                <thead>
                  <tr><th>Country</th><th>ISO</th><th>ISO3</th><th>Calling code</th><th className="num">Numeric</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="ops-empty-row">Loading countries…</td></tr>
                  ) : countries.length === 0 ? (
                    <tr><td colSpan={6} className="ops-empty-row">No countries match the current filters.</td></tr>
                  ) : (
                    countries.map((country) => (
                      <tr key={country.id}>
                        <td className="strong">{country.name}</td>
                        <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }}>{country.iso_code}</td>
                        <td>{country.iso3_code || '—'}</td>
                        <td>{country.calling_code || '—'}</td>
                        <td className="num">{country.numeric_code || '—'}</td>
                        <td><span className={`ops-chip ${country.active ? 'green' : 'grey'}`}>{country.active ? 'active' : 'inactive'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="ops-pager">
            <span>{count} record{count === 1 ? '' : 's'} · page {page} of {totalPages}</span>
            <div className="ops-pager-controls">
              <button type="button" className="ops-btn sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <button type="button" className="ops-btn sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        </section>

        <div className="ops-status-strip">
          <span className="go">● Reference tables live</span>
          <span>GET <b>/api/core/countries/</b> · <b>/api/core/states/</b></span>
          <span className="nl">Read-only</span>
        </div>
      </main>
    </OpsShell>
  );
}
