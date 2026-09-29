'use client';

import type { State, ProgramDashboard } from '../hooks/useDashboard';

const hubLocations: Record<string, { x: number; y: number }> = {
  'Abuja': { x: 370, y: 340 },
  'Kaduna': { x: 260, y: 180 },
  'Kano': { x: 160, y: 110 },
  'Enugu': { x: 600, y: 360 },
  'Lagos': { x: 120, y: 380 },
  'Bauchi': { x: 470, y: 140 },
  'Katsina': { x: 180, y: 60 },
  'Sokoto': { x: 80, y: 70 },
  'Borno': { x: 560, y: 60 },
  'Niger': { x: 240, y: 240 },
  'Kwara': { x: 300, y: 310 },
  'Oyo': { x: 200, y: 360 },
};

function getStateCoord(name: string): { x: number; y: number } | null {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(hubLocations)) {
    if (lower.includes(key.toLowerCase())) return val;
  }
  return null;
}

export default function GeographicCommand({ states, programDash }: { states: State[]; programDash: ProgramDashboard | null }) {
  const programsByState = programDash?.programs_by_state || [];

  return (
    <div className="db-geo-card">
      <div className="db-geo-header">
        <div className="db-geo-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--brand-text)' }}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <div>
            <h2>Geographic Command &amp; State Footprint</h2>
            <p className="db-geo-subtitle">Real-time hub presence across northern/southern operational corridors</p>
          </div>
        </div>
        <span className="db-geo-badge">{states.filter((s) => s.active).length} Hubs Active</span>
      </div>
      <div className="db-geo-map">
        <div className="db-geo-map-inner">
          <svg viewBox="0 0 800 500" className="db-geo-map-svg">
            <rect width="800" height="500" style={{ fill: 'var(--bg-subtle)' }} />
            {[...Array(20)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 25} x2="800" y2={i * 25}  strokeWidth="0.5" style={{ stroke: 'var(--text-inverse-muted)' }} />
            ))}
            {[...Array(32)].map((_, i) => (
              <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="500"  strokeWidth="0.5" style={{ stroke: 'var(--text-inverse-muted)' }} />
            ))}
            <path d="M100 100 Q300 150 500 120 T750 200"  strokeWidth="3" fill="none" style={{ stroke: 'var(--text-inverse-muted)' }} />
            <path d="M50 300 Q200 250 400 280 T700 220"  strokeWidth="2.5" fill="none" style={{ stroke: 'var(--text-inverse-muted)' }} />
            <path d="M300 50 Q350 200 380 350 T400 480"  strokeWidth="2" fill="none" style={{ stroke: 'var(--text-inverse-muted)' }} />
            <path d="M150 200 Q250 280 350 260 T550 300"  strokeWidth="2" fill="none" style={{ stroke: 'var(--text-inverse-muted)' }} />
            <text x="200" y="95"  fontSize="8" fontFamily="Inter, sans-serif" style={{ fill: 'var(--text-faint)' }}>A2 Highway</text>
            <text x="420" y="275"  fontSize="8" fontFamily="Inter, sans-serif" style={{ fill: 'var(--text-faint)' }}>Kaduna-Abuja Express</text>
            <rect x="310" y="290" width="120" height="100" rx="8" fill="rgba(8,127,91,0.06)"  strokeWidth="1" strokeDasharray="4 3" style={{ stroke: 'var(--brand-text)' }} />
            <text x="335" y="310"  fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" style={{ fill: 'var(--brand-text)' }}>FCT Abuja</text>

            {/* Render state hubs from API */}
            {states.filter((s) => s.active).map((state) => {
              const coord = getStateCoord(state.name);
              if (!coord) return null;
              const progCount = programsByState.find((p) => p.state__name === state.name)?.count || 0;
              return (
                <g key={state.id}>
                  <circle cx={coord.x} cy={coord.y} r={10 + Math.min(progCount * 2, 10)} fill="rgba(8,127,91,0.08)" />
                  <circle cx={coord.x} cy={coord.y} r={5.5}   strokeWidth="1.5" style={{ fill: 'var(--brand-solid)', stroke: 'var(--text-inverse)' }} />
                  <text x={coord.x + 10} y={coord.y + 4}  fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600" style={{ fill: 'var(--text-primary)' }}>
                    {state.name}
                  </text>
                  {progCount > 0 && (
                    <text x={coord.x + 10} y={coord.y + 14}  fontSize="7" fontFamily="Inter, sans-serif" style={{ fill: 'var(--text-faint)' }}>
                      {progCount} program{progCount !== 1 ? 's' : ''}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Also show states without known coords as dots in a cluster */}
            {states.filter((s) => s.active && !getStateCoord(s.name)).slice(0, 6).map((state, i) => (
              <g key={state.id}>
                <circle cx={350 + (i % 3) * 40} cy={430 + Math.floor(i / 3) * 20} r={4}  opacity={0.5} style={{ fill: 'var(--brand-solid)' }} />
                <text x={358 + (i % 3) * 40} y={433 + Math.floor(i / 3) * 20}  fontSize="7" fontFamily="Inter, sans-serif" style={{ fill: 'var(--text-muted)' }}>
                  {state.name}
                </text>
              </g>
            ))}

            {/* Abuja primary marker */}
            <circle cx="370" cy="340" r="12"  opacity="0.15" style={{ fill: 'var(--brand-solid)' }} />
          </svg>
        </div>
        <div className="db-geo-map-overlay-left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span>Abuja Operations Nerve Center</span>
        </div>
        <div className="db-geo-map-overlay-right">
          GPS: 9.0765&deg; N, 7.3986&deg; E
        </div>
      </div>
    </div>
  );
}
