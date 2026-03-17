import path from 'path';
import fs from 'fs';

/**
 * On Vercel the filesystem is read-only except /tmp.
 * Use /tmp for data so API writes succeed. Data is ephemeral (resets on cold start).
 */
function getDataDir(): string {
  if (process.env.VERCEL === '1') {
    return '/tmp/ticket-portal-data';
  }
  return path.join(process.cwd(), 'data');
}

export function getDataFilePath(filename: string): string {
  return path.join(getDataDir(), filename);
}

export function ensureDataDirectory(): void {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}
