const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BACKEND_PROXY_BASE = new URL('/api/backend/', FRONTEND_BASE_URL);

// export function backendProxyUrl(path: string) {
//   const normalizedPath = path.replace(/^\/+/, '');
//   return new URL(normalizedPath, BACKEND_PROXY_BASE).toString();
// }


export function backendProxyUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_DJANGO_API_URL}${path}`;
}