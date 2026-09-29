import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProtectedPath } from '@/lib/auth/route-access';

/**
 * Edge auth gate.
 *
 * Middleware can only assert that *a* session cookie exists — it cannot resolve
 * roles (the Django JWT payload carries no role claims). Role-based access is
 * enforced inside the app by `RoleGuard` + the hardened backend API.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(
    request.cookies.get('accessToken') || request.cookies.get('refreshToken')
  );

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
