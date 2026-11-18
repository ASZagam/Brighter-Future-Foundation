/**
 * Opening mission statement, rendered above the hero.
 * Falls back to the default positioning line until an organisation profile
 * with a mission statement is published.
 */
export function MissionStrip({ mission }: { mission: string | null }) {
  const firstSentence = mission?.trim().match(/^.*?[.!?](?:\s|$)/)?.[0].trim();

  return (
    <div className="pub-utility">
      <p>
        {firstSentence ||
          mission ||
          'Clean water, health outreach and community development — reported from the field.'}
      </p>
    </div>
  );
}
