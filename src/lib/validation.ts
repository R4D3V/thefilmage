import { z } from 'zod';

// Strip control characters and collapse whitespace; output is also escaped by Astro on render.
const clean = (max: number) =>
  z.string().transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()).pipe(z.string().max(max));

export const BUDGETS = ['Under $500', '$500 – $1,500', '$1,500 – $5,000', '$5,000+', 'Not sure yet'] as const;

export const contactSchema = z.object({
  name: clean(120).pipe(z.string().min(2, 'Please enter your name')),
  email: z.email('Enter a valid email').max(255),
  phone: clean(40).optional().default(''),
  company: clean(120).optional().default(''),
  service: clean(120).optional().default(''),
  budget: clean(60).optional().default(''),
  message: clean(4000).pipe(z.string().min(10, 'Tell us a little more (10+ characters)')),
});
