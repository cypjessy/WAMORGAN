import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_URL || '';
  const apiKey = process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '';

  if (!apiUrl || !apiKey) {
    console.warn('[Evolution Config] API credentials not configured');
  }

  return NextResponse.json({ apiUrl, apiKey });
}
