import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendProxyUrl } from '../../backendClient';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Call Django refresh token endpoint through local proxy
    const response = await fetch(backendProxyUrl('/auth/token/refresh/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Failed to refresh token' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const { access } = data;

    const res = NextResponse.json(
      { message: 'Token refreshed successfully' },
      { status: 200 }
    );

    // Update access token cookie
    res.cookies.set('accessToken', access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'An error occurred during token refresh.' },
      { status: 500 }
    );
  }
}
