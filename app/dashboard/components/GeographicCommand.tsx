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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#087F5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
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
            <rect width="800" height="500" fill="#F0F4F0" />
            {[...Array(20)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 25} x2="800" y2={i * 25} stroke="#E2E8E2" strokeWidth="0.5" />
            ))}
            {[...Array(32)].map((_, i) => (
              <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="500" stroke="#E2E8E2" strokeWidth="0.5" />
            ))}
            <path d="M100 100 Q300 150 500 120 T750 200" stroke="#CBD5E0" strokeWidth="3" fill="none" />
            <path d="M50 300 Q200 250 400 280 T700 220" stroke="#CBD5E0" strokeWidth="2.5" fill="none" />
            <path d="M300 50 Q350 200 380 350 T400 480" stroke="#CBD5E0" strokeWidth="2" fill="none" />
            <path d="M150 200 Q250 280 350 260 T550 300" stroke="#CBD5E0" strokeWidth="2" fill="none" />
            <text x="200" y="95" fill="#94A3B8" fontSize="8" fontFamily="Inter, sans-serif">A2 Highway</text>
            <text x="420" y="275" fill="#94A3B8" fontSize="8" fontFamily="Inter, sans-serif">Kaduna-Abuja Express</text>
            <rect x="310" y="290" width="120" height="100" rx="8" fill="rgba(8,127,91,0.06)" stroke="#087F5B" strokeWidth="1" strokeDasharray="4 3" />
            <text x="335" y="310" fill="#087F5B" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700">FCT Abuja</text>

            {/* Render state hubs from API */}
            {states.filter((s) => s.active).map((state) => {
              const coord = getStateCoord(state.name);
              if (!coord) return null;
              const progCount = programsByState.find((p) => p.state__name === state.name)?.count || 0;
              return (
                <g key={state.id}>
                  <circle cx={coord.x} cy={coord.y} r={10 + Math.min(progCount * 2, 10)} fill="rgba(8,127,91,0.08)" />
                  <circle cx={coord.x} cy={coord.y} r={5.5} fill="#087F5B" stroke="#fff" strokeWidth="1.5" />
                  <text x={coord.x + 10} y={coord.y + 4} fill="#1F2937" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600">
                    {state.name}
                  </text>
                  {progCount > 0 && (
                    <text x={coord.x + 10} y={coord.y + 14} fill="#9CA3AF" fontSize="7" fontFamily="Inter, sans-serif">
                      {progCount} program{progCount !== 1 ? 's' : ''}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Also show states without known coords as dots in a cluster */}
            {states.filter((s) => s.active && !getStateCoord(s.name)).slice(0, 6).map((state, i) => (
              <g key={state.id}>
                <circle cx={350 + (i % 3) * 40} cy={430 + Math.floor(i / 3) * 20} r={4} fill="#087F5B" opacity={0.5} />
                <text x={358 + (i % 3) * 40} y={433 + Math.floor(i / 3) * 20} fill="#6B7280" fontSize="7" fontFamily="Inter, sans-serif">
                  {state.name}
                </text>
              </g>
            ))}

            {/* Abuja primary marker */}
            <circle cx="370" cy="340" r="12" fill="#087F5B" opacity="0.15" />
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
