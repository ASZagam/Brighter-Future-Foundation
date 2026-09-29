/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/dashboard', destination: '/admin', permanent: false },
      { source: '/members', destination: '/admin/members', permanent: false },
      { source: '/members/:slug*', destination: '/admin/members/:slug*', permanent: false },
      { source: '/beneficiaries', destination: '/admin/beneficiaries', permanent: false },
      { source: '/volunteers', destination: '/admin/volunteers', permanent: false },
      { source: '/volunteers/:slug*', destination: '/admin/volunteers/:slug*', permanent: false },
      { source: '/donations', destination: '/admin/donations', permanent: false },
      { source: '/events', destination: '/admin/events', permanent: false },
      { source: '/references', destination: '/admin/references', permanent: false },
      { source: '/settings', destination: '/admin/settings', permanent: false },
      { source: '/core', destination: '/admin/core', permanent: false },
    ];
  },
};

module.exports = nextConfig;
