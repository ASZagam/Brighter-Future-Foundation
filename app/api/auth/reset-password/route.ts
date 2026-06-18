import { NextResponse } from 'next/server';
import { backendProxyUrl } from '../../backendClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, new_password, new_password_confirm } = body;

    if (!token || !new_password) {
      return NextResponse.json(
        { error: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    // Call Django reset password endpoint through the local proxy
    const response = await fetch(backendProxyUrl('/auth/reset-password/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        new_password,
        new_password_confirm: new_password_confirm || new_password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(
      { message: data.detail || 'Password reset successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred during password reset.' },
      { status: 500 }
    );
  }
}
