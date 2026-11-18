import { NextResponse } from 'next/server';
import { backendProxyUrl } from '../../backendClient';

function errorMessage(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return 'Registration could not be completed.';

  const errors = payload as Record<string, unknown>;
  const detail = errors.detail ?? errors.error;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(String).join(' ');

  const labels: Record<string, string> = {
    email: 'Email',
    password: 'Password',
    password2: 'Password confirmation',
    full_name: 'Full name',
    phone: 'Phone',
    non_field_errors: 'Registration',
  };
  const messages = Object.entries(errors).flatMap(([field, value]) => {
    const items = Array.isArray(value) ? value : [value];
    return items.filter((item) => typeof item === 'string').map((item) => `${labels[field] ?? field}: ${item}`);
  });
  return messages.join(' ') || 'Registration could not be completed. Please try again.';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password, password2 } = body;

    if (!email || !password || !password2) {
      return NextResponse.json(
        { error: 'Email, password, and password confirmation are required.' },
        { status: 400 }
      );
    }
    if (password !== password2) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    // Generate username from email (part before @)
    const username = email.split('@')[0];

    // Call Django registration endpoint through the local proxy
    const response = await fetch(backendProxyUrl('/auth/register/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        full_name: fullName || '',
        phone: phone || '',
        password,
        password2: password,
      }),
      duplex: 'half',
    } as RequestInit);

    if (!response.ok) {
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      return NextResponse.json(
        { error: errorMessage(payload) },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email to verify your account.',
        user: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration.' },
      { status: 500 }
    );
  }
}
