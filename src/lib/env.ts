// Server-only. On Cloudflare, secrets come from the Workers runtime env.
import { env as cfEnv } from 'cloudflare:workers';

export type AppEnv = {
  DATABASE_URL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  AUTH_SECRET: string;
};

export function getEnv(): AppEnv {
  const e = cfEnv as unknown as Partial<AppEnv>;
  for (const k of ['DATABASE_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'AUTH_SECRET'] as const) {
    if (!e[k]) throw new Error(`Missing environment variable: ${k}`);
  }
  return e as AppEnv;
}
