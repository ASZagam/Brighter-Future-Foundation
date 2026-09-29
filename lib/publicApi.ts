/**
 * Server-side access to the Django public API (`/api/v2/public/`).
 *
 * Every helper is failure-tolerant on purpose: these pages are public and
 * must render even when the backend is slow, restarting, or has no data yet.
 * A failed fetch returns `null` / an empty collection so the UI can show an
 * honest "not available yet" state instead of a blank page or a crash.
 */

const DJANGO_API_URL =
  process.env.DJANGO_API_URL ||
  process.env.NEXT_PUBLIC_DJANGO_API_URL ||
  'http://localhost:8000/api';

const PUBLIC_BASE = `${DJANGO_API_URL.replace(/\/+$/, '')}/v2/public`;

const TIMEOUT_MS = 6000;

export type PublicMetric = {
  label: string;
  value: number | null;
  available: boolean;
  unit: string | null;
  source: string | null;
};

export type PublicOrganization = {
  name: string;
  slogan: string;
  mission: string;
  vision: string;
  history: string;
  founder_name: string;
  founder_title: string;
  email: string;
  phone: string;
  address: string;
  logo: string | null;
  hero_banner: string | null;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  website: string;
};

export type PublicProgram = {
  id: number;
  program_id: string;
  title: string;
  slug: string;
  description: string;
  objectives: string;
  expected_outcomes: string;
  status: string;
  priority: string;
  category_name: string | null;
  country_name: string | null;
  state_name: string | null;
  lga: string;
  address: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  amount_spent: number | null;
  funding_target: number | null;
  beneficiary_count: number;
  image: string | null;
  budget_utilisation: number | null;
};

export type PublicFieldReport = {
  id: number;
  title: string;
  summary: string;
  location: string;
  status: string;
  is_featured: boolean;
  program_title: string;
  program_slug: string;
  image: string | null;
  submitted_at: string;
};

export type PublicNews = {
  id: number;
  title: string;
  body: string;
  category: string;
  cover_image: string | null;
  image_caption: string;
  published_at: string;
};

export type PublicEvent = {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string | null;
};

export type PublicCapability = {
  id: number;
  name: string;
  description: string;
  color: string | null;
  icon: string | null;
};

export type PublicGalleryItem = {
  id: number;
  image: string;
  caption: string;
  program_title: string;
  uploaded_at: string;
};

export type PublicAllocation = {
  id: number;
  label: string;
  percentage: string;
  period_label: string;
  program_title: string | null;
  category_name: string | null;
  notes: string;
};

export type ImpactSummary = {
  metrics: PublicMetric[];
  transparency: {
    public_reporting_coverage: number | null;
    published_field_reports: number;
    published_allocations: number;
    total_programs: number;
  };
  countries: { id: number; name: string }[];
};

export type TransparencyData = {
  funds_raised: number | null;
  budget_committed: number | null;
  expenditure_recorded: number | null;
  allocation_total_percentage: number;
  allocations: PublicAllocation[];
  public_documents_available: number;
  note: string;
};

async function getJSON<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${PUBLIC_BASE}${path}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getList<T>(path: string): Promise<T[]> {
  const data = await getJSON<T[]>(path);
  return Array.isArray(data) ? data : [];
}

export const getOrganization = () =>
  getJSON<PublicOrganization>('/organization/').then((v) => v ?? null);

export const getImpactSummary = () =>
  getJSON<ImpactSummary>('/impact-summary/').then((v) => v ?? null);

export const getTransparency = () =>
  getJSON<TransparencyData>('/transparency/').then((v) => v ?? null);

export const getCapabilities = () => getList<PublicCapability>('/capabilities/');
export const getPrograms = () => getList<PublicProgram>('/programs/');
export const getProgram = (slug: string) =>
  getJSON<PublicProgram>(`/programs/${encodeURIComponent(slug)}/`);
export const getFieldReports = () => getList<PublicFieldReport>('/field-reports/');
export const getNews = () => getList<PublicNews>('/newsroom/');
export const getEvents = () => getList<PublicEvent>('/events/');
export const getGallery = () => getList<PublicGalleryItem>('/gallery/');
export const getAllocations = () => getList<PublicAllocation>('/allocation/');

export const absoluteMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = DJANGO_API_URL.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCount = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-NG').format(value);
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
