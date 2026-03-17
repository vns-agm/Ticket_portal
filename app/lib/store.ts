import fs from 'fs';
import { kv } from '@vercel/kv';
import { ensureDataDirectory, getDataFilePath } from '@/app/lib/data-path';

type StoreKey = 'issues' | 'comments';

function hasKvConfig(): boolean {
  // @vercel/kv reads KV_* env vars. If they’re missing, calls will fail at runtime.
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function readJson<T>(key: StoreKey, fallback: T): Promise<T> {
  if (hasKvConfig()) {
    const val = await kv.get<T>(key);
    return (val ?? fallback) as T;
  }

  ensureDataDirectory();
  const filePath = getDataFilePath(`${key}.json`);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: StoreKey, value: T): Promise<void> {
  if (hasKvConfig()) {
    await kv.set(key, value);
    return;
  }

  ensureDataDirectory();
  const filePath = getDataFilePath(`${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

