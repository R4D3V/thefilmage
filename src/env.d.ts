/// <reference path="../.astro/types.d.ts" />
declare namespace App {
  interface Locals {
    user?: { id: number; email: string; role: string };
  }
}

declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
