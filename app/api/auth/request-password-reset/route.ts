import { NextResponse } from 'next/server';
import { backendProxyUrl } from '../../backendClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Call Django request password reset endpoint
    const response = await fetch(backendProxyUrl('/auth/request-password-reset/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(
      { message: data.detail || 'Password reset email sent successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Request password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred while requesting password reset.' },
      { status: 500 }
    );
  }
}
