import { NextResponse } from 'next/server';
import { backendProxyUrl } from '../../backendClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
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
      let error = {};
      try {
        error = await response.json();
      } catch (e) {
        error = { error: `Backend error: ${response.status} ${response.statusText}` };
      }
      return NextResponse.json(error, { status: response.status });
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
