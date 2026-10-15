import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/', '.astro/', '.vercel/', 'node_modules/', 'drizzle/'] },
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { files: ['src/env.d.ts'], rules: { '@typescript-eslint/triple-slash-reference': 'off' } },
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
];
