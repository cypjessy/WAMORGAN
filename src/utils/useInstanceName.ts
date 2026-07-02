'use client';

import { useState, useEffect } from 'react';
import { businessProfileService } from '@/lib/db';

const DEFAULT_INSTANCE = 'wamorgan-instance-01';

let cachedInstance: string | null = null;
let loadPromise: Promise<string> | null = null;

async function loadInstanceName(): Promise<string> {
  if (cachedInstance) return cachedInstance;
  try {
    const profile = await businessProfileService.getProfile();
    cachedInstance = profile?.whatsappInstanceName || DEFAULT_INSTANCE;
  } catch {
    cachedInstance = DEFAULT_INSTANCE;
  }
  return cachedInstance;
}

export function useInstanceName(): string {
  const [name, setName] = useState(DEFAULT_INSTANCE);

  useEffect(() => {
    loadInstanceName().then(setName);
  }, []);

  return name;
}

export async function getInstanceName(): Promise<string> {
  if (cachedInstance) return cachedInstance;
  if (loadPromise) return loadPromise;
  loadPromise = loadInstanceName();
  return loadPromise;
}