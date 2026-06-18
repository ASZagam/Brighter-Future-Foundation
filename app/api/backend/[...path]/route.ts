import { NextResponse, NextRequest } from 'next/server';

const DJANGO_API_URL = process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

function buildBackendUrl(pathSegments: string[] = [], appendTrailingSlash = false) {
  let path = pathSegments.join('/');
  if (appendTrailingSlash && path && !path.endsWith('/')) {
    path += '/';
  }
  return `${DJANGO_API_URL}/${path}`.replace(/([^:]\/\/)\/+/, '$1');
}

async function proxyRequest(request: NextRequest, resolvedParams: { path?: string[] }) {
  // Always append trailing slash for Django API endpoints
  const backendUrl = buildBackendUrl(resolvedParams.path ?? [], true);
  const headers = new Headers(request.headers);
  headers.delete('host');

  const proxyResponse = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD', 'OPTIONS'].includes(request.method) ? undefined : request.body,
    duplex: 'half',
  } as RequestInit);

  const response = new NextResponse(proxyResponse.body, {
    status: proxyResponse.status,
  });

  proxyResponse.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}
