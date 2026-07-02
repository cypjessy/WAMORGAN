import { NextRequest, NextResponse } from 'next/server';

const BUNNY_STORAGE_HOST = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || '';
const BUNNY_STORAGE_ZONE = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || '';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '';
const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || '';
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';

// Initialize Firebase Admin with just the project ID (no service account needed
// for token verification — uses Google's public key infrastructure)
async function ensureFirebaseAuth() {
  const { initializeApp, getApps } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  if (!getApps().length) {
    initializeApp({ projectId: FIREBASE_PROJECT_ID });
  }
  return getAuth();
}

async function verifyAuth(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const auth = await ensureFirebaseAuth();
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress with Sharp (server-side fallback)
    const sharp = (await import('sharp')).default;
    const compressed = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Generate filename
    const ext = 'webp';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${folder}_${timestamp}_${random}.${ext}`;

    // Upload to Bunny Storage
    const storagePath = `tenant_${user.uid}/${folder}/${filename}`;

    const bunnyResponse = await fetch(
      `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${storagePath}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: BUNNY_API_KEY,
          'Content-Type': 'image/webp',
        },
        body: new Blob([new Uint8Array(compressed)], { type: 'image/webp' }),
      }
    );

    if (!bunnyResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Bunny Storage returned HTTP ${bunnyResponse.status}`,
      }, { status: 502 });
    }

    const url = `${BUNNY_CDN_URL}/${storagePath}`;

    return NextResponse.json({ success: true, url, filename });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Upload failed',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return NextResponse.json({ success: false, error: 'No URL provided' }, { status: 400 });
  }

  try {
    // Extract storage path from CDN URL
    const urlObj = new URL(fileUrl);
    const storagePath = urlObj.pathname.replace(/^\//, '');

    const bunnyResponse = await fetch(
      `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${storagePath}`,
      {
        method: 'DELETE',
        headers: { AccessKey: BUNNY_API_KEY },
      }
    );

    if (!bunnyResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Bunny Storage returned HTTP ${bunnyResponse.status}`,
      }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Delete failed',
    }, { status: 500 });
  }
}