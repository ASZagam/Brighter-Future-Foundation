import { EmptyState, SectionHeading } from '../Primitives';
import type { PublicCapability } from '@/lib/publicApi';

/**
 * The platform's six discipline pillars. Backed by administrator-maintained
 * capability records; empty until they are published.
 */
export function Capabilities({ capabilities }: { capabilities: PublicCapability[] }) {
  return (
    <section className="pub-section pub-section-soft" aria-labelledby="capabilities-heading">
      <SectionHeading
        id="capabilities-heading"
        eyebrow="Platform capabilities"
        title="Six disciplines, one coordinated platform"
        lede="Programme management, field operations, finance and reporting share one system of record."
      />

      {capabilities.length > 0 ? (
        <ul className="pub-card-grid">
          {capabilities.map((cap) => (
            <li
              className="pub-card"
              key={cap.id}
            >
              <span className="pub-capability-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
              </span>
              <h3>{cap.name}</h3>
              <p>{cap.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Capability pillars not published yet"
          detail="These six pillars are maintained in the platform and appear here once an administrator publishes them."
        />
      )}
    </section>
  );
}
