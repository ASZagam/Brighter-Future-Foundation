import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token
 */
export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

/**
 * Get auth token from request headers
 */
export function getAuthToken(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((cookieItem) => {
      const [name, ...rest] = cookieItem.trim().split('=');
      return [name, rest.join('=')];
    })
  );
  
  return cookies['accessToken'] ?? null;
}

/**
 * Create auth cookie
 */
export function createAuthCookie(token: string) {
  return serialize('accessToken', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie() {
  return serialize('accessToken', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

/**
 * Get access token from cookies
 */
export async function getAccessToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('accessToken')?.value;
  } catch {
    return null;
  }
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('refreshToken')?.value;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;
    
    return decoded.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch('/api/auth/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.access;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Decode JWT token without verification
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

/**
 * Type for authenticated user from JWT
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  status: string;
  email_verified: boolean;
  roles: Array<{
    id: string;
    name: string;
  }>;
  role_names: string[];
  is_super_admin: boolean;
  is_admin: boolean;
}
