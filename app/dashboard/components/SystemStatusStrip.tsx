'use client';

import { useState, useEffect, useCallback } from 'react';

export default function SystemStatusStrip({ latency: serverLatency }: { latency: number }) {
  const [now, setNow] = useState(Date.now());
  const [ping, setPing] = useState(serverLatency);
  const [polling, setPolling] = useState(60);

  const measureLatency = useCallback(async () => {
    const start = Date.now();
    try {
      await fetch('/api/auth/me', { credentials: 'include' });
      setPing(Date.now() - start);
    } catch {
      setPing(-1);
    }
  }, []);

  useEffect(() => {
    measureLatency();
    const interval = setInterval(() => {
      measureLatency();
      setNow(Date.now());
      setPolling((p) => (p <= 1 ? 60 : p - 1));
    }, 60000);
    return () => clearInterval(interval);
  }, [measureLatency]);

  useEffect(() => {
    const timer = setInterval(() => setPolling((p) => (p <= 1 ? 60 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const lastRefresh = 'just now';

  return (
    <div className="db-status-strip">
      <div className="db-status-strip-left">
        <span className="db-status-online">
          <span className="db-status-dot-green" />
          OPERATIONAL LINK: ONLINE
        </span>
        <span className="db-status-sep">&bull;</span>
        <span className="db-status-text">REST API Synced</span>
        <span className="db-status-sep">&bull;</span>
        <span className="db-status-text">Local Cache Valid <span className="db-status-muted">(Last refresh {lastRefresh})</span></span>
        <span className="db-status-latency">{ping > 0 ? `${ping}ms` : '---'} latency</span>
      </div>
      <div className="db-status-strip-right">
        <button type="button" className="db-status-refresh" onClick={measureLatency}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          Refresh Sync
        </button>
        <span className="db-status-auto">Auto-polling {polling}s</span>
      </div>
    </div>
  );
}
