import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  const { path } = await paramsPromise;
  const evolutionApiUrl = process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_URL || '';
  const evolutionApiKey = process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '';
  const xApiKey = request.headers.get('x-api-key') || evolutionApiKey;

  if (!evolutionApiUrl) {
    return NextResponse.json(
      { error: 'Evolution API URL not configured' },
      { status: 500 }
    );
  }

  const pathStr = path.join('/').replace(/\/+$/, '');
  const queryString = request.nextUrl.search;

  const baseUrl = evolutionApiUrl.endsWith('/') ? evolutionApiUrl.slice(0, -1) : evolutionApiUrl;
  const targetUrl = baseUrl + '/' + pathStr + queryString;

  console.log('[Evolution Proxy]', method, pathStr);

  try {
    let body: BodyInit | undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': xApiKey,
      },
      body,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'content-type': contentType },
    });
  } catch (error) {
    console.error('[Evolution Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reach Evolution API', details: String(error) },
      { status: 502 }
    );
  }
}
