import PublicFooter from '@/app/components/public/PublicFooter';
import PublicHeader from '@/app/components/public/PublicHeader';
import { getOrganization } from '@/lib/publicApi';

export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const org = await getOrganization();

  const organizationJsonLd = org?.name
    ? {
        '@context': 'https://schema.org',
        '@type': 'NGO',
        name: org.name,
        slogan: org.slogan || undefined,
        description: org.mission || undefined,
        email: org.email || undefined,
        telephone: org.phone || undefined,
        address: org.address || undefined,
        logo: org.logo || undefined,
        url: org.website || undefined,
        sameAs: [org.facebook, org.twitter, org.linkedin, org.instagram].filter(
          (v): v is string => Boolean(v)
        ),
        founder: org.founder_name
          ? {
              '@type': 'Person',
              name: org.founder_name,
              jobTitle: org.founder_title || undefined,
            }
          : undefined,
      }
    : null;

  return (
    <div className="pub-root">
      <PublicHeader orgName={org?.name || undefined} />
      <main id="main-content" className="pub-main">
        {children}
      </main>
      <PublicFooter org={org} />
      {organizationJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      ) : null}
    </div>
  );
}
