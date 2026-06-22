import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CollabDocs/1.0' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: 'Fetch failed' }, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
  }
}

export const dynamic = 'force-dynamic';
