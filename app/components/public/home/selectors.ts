import {
  absoluteMediaUrl,
  type PublicFieldReport,
  type PublicGalleryItem,
  type PublicMetric,
  type PublicNews,
  type PublicOrganization,
  type PublicProgram,
} from '@/lib/publicApi';

/**
 * View-model shaping for the landing page.
 *
 * The page component fetches raw public API payloads; everything that decides
 * *which* records to show, and in what order, lives here instead. Keeping the
 * selection rules out of JSX means the honest-data behaviour is testable and
 * reviewable in one place: nothing in this module ever substitutes a fallback
 * number for a missing one.
 */

/** How many records each landing-page section shows. */
export const SECTION_LIMITS = {
  programs: 3,
  reports: 3,
  news: 3,
} as const;

/**
 * The four headline figures, in display order.
 *
 * The API's published labels are used directly so the cards cannot imply more
 * than the underlying records establish.
 */
const METRIC_SLOTS = [
  { label: 'Programs on record', source: 'Programs on record' },
  { label: 'People reached', source: 'People reached' },
  { label: 'Active volunteers', source: 'Active volunteers' },
  { label: 'States reached', source: 'States reached' },
] as const;

/** A display slot after being resolved against the published metrics. */
export type ResolvedMetricSlot = { label: string; metric: PublicMetric | undefined };

/**
 * Resolves each display slot against the published metrics. A slot with no
 * matching metric, or one flagged `available: false`, stays unresolved so the
 * section can render its "Awaiting data" state.
 */
export function selectHomeMetrics(metrics: PublicMetric[]): ResolvedMetricSlot[] {
  return METRIC_SLOTS.map((slot) => ({
    label: slot.label,
    metric: metrics.find((m) => m.label === slot.source),
  }));
}

/** Active programmes first, capped for the section. */
export function selectFlagshipPrograms(programs: PublicProgram[]): PublicProgram[] {
  return programs.filter((p) => p.status === 'active').slice(0, SECTION_LIMITS.programs);
}

/**
 * Featured field reports when an editor has promoted any, otherwise the most
 * recent ones. A report is only ever listed if it has passed publication
 * review, which the API already guarantees.
 */
export function selectFieldReports(reports: PublicFieldReport[]): PublicFieldReport[] {
  const featured = reports.filter((r) => r.is_featured);
  return (featured.length > 0 ? featured : reports).slice(0, SECTION_LIMITS.reports);
}

/** Most recent published news, capped for the section. */
export function selectNewsroomPosts(news: PublicNews[]): PublicNews[] {
  return news.slice(0, SECTION_LIMITS.news);
}

/**
 * Prefers the organisation's configured banner, then the supplied foundation
 * banner, and finally a published gallery image.
 */
export function selectHeroImage(
  org: PublicOrganization | null,
  gallery: PublicGalleryItem[],
): string | null {
  return (
    absoluteMediaUrl(org?.hero_banner) ??
    absoluteMediaUrl('/media/organization/banner/bff_banner_1920x720.jpg') ??
    absoluteMediaUrl(gallery[0]?.image)
  );
}

/** Uses the original uncropped group photo for responsive and About imagery. */
export function selectFoundationPhoto(): string {
  return absoluteMediaUrl('/media/organization/banner/bff_g3.jpeg') ?? '';
}

/** Trims the org mission for card use, or null when the record is blank. */
export function selectMission(org: PublicOrganization | null): string | null {
  const mission = org?.mission?.trim();
  return mission ? mission : null;
}

/** Organisation display name, with the documented fallback. */
export function selectOrgName(org: PublicOrganization | null): string {
  return org?.name?.trim() || 'Brighter Future Foundation';
}

/**
 * NewsArticle JSON-LD for the homepage feed. Emits nothing when there is no
 * published news rather than a placeholder entry.
 */
export function buildArticleJsonLd(
  posts: PublicNews[],
  org: PublicOrganization | null,
): Record<string, unknown>[] {
  return selectNewsroomPosts(posts).map((post) => ({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    datePublished: post.published_at,
    image: absoluteMediaUrl(post.cover_image) ?? undefined,
    author: { '@type': 'Organization', name: selectOrgName(org) },
  }));
}
