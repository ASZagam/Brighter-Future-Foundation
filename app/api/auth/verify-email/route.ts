import { NextResponse } from 'next/server';
import { backendProxyUrl } from '../../backendClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required.' },
        { status: 400 }
      );
    }

    // Call Django verify email endpoint
    const response = await fetch(backendProxyUrl('/auth/verify-email/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(
      {
        message: data.detail || 'Email verified successfully.',
        user: data.user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'An error occurred during email verification.' },
      { status: 500 }
    );
  }
}
