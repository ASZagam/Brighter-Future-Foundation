import { NextResponse } from 'next/server';
import { backendProxyUrl } from '../../backendClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'Username or email and password are required.' },
        { status: 400 }
      );
    }

    // Call Django JWT login endpoint
    let response: Response;
    try {
      response = await fetch(backendProxyUrl('/auth/login/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginIdentifier, password }),
      });
    } catch (fetchError) {
      console.error('Login fetch failed:', fetchError);
      return NextResponse.json(
        { error: 'Unable to reach the backend. Please start Django or verify your API proxy settings.' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.detail || 'Invalid credentials.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const { access, refresh, user } = data;

    // Create response with JWT tokens in httpOnly cookies
    const res = NextResponse.json(
      { user },
      { status: 200 }
    );

    // Set access token cookie (short-lived, httpOnly)
    res.cookies.set('accessToken', access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    // Set refresh token cookie (long-lived, httpOnly)
    res.cookies.set('refreshToken', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login.' },
      { status: 500 }
    );
  }
}
