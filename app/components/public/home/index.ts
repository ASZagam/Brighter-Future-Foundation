/**
 * Landing-page sections.
 *
 * The route in app/(public)/page.tsx stays a thin orchestrator: it fetches the
 * public API payloads, hands them to these presentational sections, and owns
 * metadata. Selection rules live in ./selectors.
 */
export { MissionStrip } from './MissionStrip';
export { Hero } from './Hero';
export { ImpactMetrics } from './ImpactMetrics';
export { Capabilities } from './Capabilities';
export { ProgramsSection } from './ProgramsSection';
export { FieldReports } from './FieldReports';
export { AllocationSection } from './AllocationSection';
export { NewsroomSection } from './NewsroomSection';
export { NewsletterBand } from './NewsletterBand';
export { NewsArticleJsonLd } from './NewsArticleJsonLd';

export {
  buildArticleJsonLd,
  selectFieldReports,
  selectFlagshipPrograms,
  selectHeroImage,
  selectHomeMetrics,
  selectMission,
  selectNewsroomPosts,
  selectOrgName,
} from './selectors';

export type { ResolvedMetricSlot } from './selectors';
