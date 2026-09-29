import type { Metadata } from 'next';
import {
  getCapabilities,
  getFieldReports,
  getGallery,
  getImpactSummary,
  getNews,
  getOrganization,
  getPrograms,
  getTransparency,
} from '@/lib/publicApi';
import {
  AllocationSection,
  buildArticleJsonLd,
  Capabilities,
  FieldReports,
  Hero,
  ImpactMetrics,
  MissionStrip,
  NewsArticleJsonLd,
  NewsroomSection,
  NewsletterBand,
  ProgramsSection,
  selectFieldReports,
  selectFlagshipPrograms,
  selectHeroImage,
  selectHomeMetrics,
  selectMission,
  selectNewsroomPosts,
  selectOrgName,
} from '@/app/components/public/home';

export const revalidate = 60;

const FALLBACK_TITLE = 'Brighter Future Foundation';
const FALLBACK_DESCRIPTION =
  'Field reports, program updates and financial transparency from Brighter Future Foundation.';

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrganization();
  const title = org?.name ? `${org.name} | Community development, health and outreach` : FALLBACK_TITLE;
  const description = org?.mission || FALLBACK_DESCRIPTION;
  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { title, description, type: 'website', url: '/' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/**
 * Landing page. Data loading only — every section is a component in
 * app/components/public/home, and the "which records do we show" rules live in
 * that folder's selectors module.
 */
export default async function LandingPage() {
  const [org, impact, transparency, capabilities, programs, reports, news, gallery] =
    await Promise.all([
      getOrganization(),
      getImpactSummary(),
      getTransparency(),
      getCapabilities(),
      getPrograms(),
      getFieldReports(),
      getNews(),
      getGallery(),
    ]);

  return (
    // pub-landing marks the one public route that does not use .pub-container,
    // so the stylesheet can give its sections a centred content column (and
    // side padding on small screens) without affecting the other pages.
    <div className="pub-landing">
      <MissionStrip mission={selectMission(org)} />

      <Hero
        name={selectOrgName(org)}
        slogan={org?.slogan || null}
        mission={selectMission(org)}
        heroImage={selectHeroImage(org, gallery)}
        impact={impact}
      />

      <ImpactMetrics slots={selectHomeMetrics(impact?.metrics ?? [])} />

      <Capabilities capabilities={capabilities} />

      <ProgramsSection programs={selectFlagshipPrograms(programs)} />

      <FieldReports reports={selectFieldReports(reports)} />

      <AllocationSection
        transparency={transparency}
        coverage={impact?.transparency.public_reporting_coverage ?? null}
        allocations={transparency?.allocations ?? []}
      />

      <NewsroomSection posts={selectNewsroomPosts(news)} />

      <NewsletterBand />

      <NewsArticleJsonLd items={buildArticleJsonLd(news, org)} />
    </div>
  );
}
