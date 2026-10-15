import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { categories, services, siteSettings } from '../src/db/schema';

const db = drizzle(neon(process.env.DATABASE_URL!));

const cats = ['Videography', 'Photography', 'Video Editing', 'Graphic Design', 'Branding', 'Live Streaming'];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Services taken from The Filmage business card.
const svc = [
  ['Video Production', 'Events, social media, film, music videos, documentaries, adverts, podcasts and more — all video production under one roof.'],
  ['Cinematographers & Equipment Hire', 'Experienced cinematographers and professional video equipment available for hire.'],
  ['Live Streaming', 'Reliable multi-camera live streaming for all events.'],
  ['B2B Video Production', 'Corporate and business-to-business video that tells your company story with purpose.'],
  ['Post Production', 'Professional editing and colour grading to give your footage a cinematic finish.'],
];

await db.insert(categories).values(cats.map((name, position) => ({ name, slug: slug(name), position }))).onConflictDoNothing();
await db.insert(services).values(svc.map(([title, summary], position) => ({ title: title!, slug: slug(title!), summary: summary!, position }))).onConflictDoNothing();
await db.insert(siteSettings).values(Object.entries({
  business_name: 'The Filmage',
  tagline: 'Telling stories with purpose',
  email: 'jimstylz01@gmail.com',
  phone: '0781504804',
  whatsapp: '256781504804',
  hero_heading: 'Telling stories with purpose.',
  hero_description: 'The Filmage is a video production house — events, film, music videos, documentaries, adverts and live streaming.',
  seo_title: 'The Filmage | Video Production, Live Streaming & Post Production',
  seo_description: 'The Filmage — video production, cinematographers & equipment hire, live streaming, B2B video and post production.',
}).map(([key, value]) => ({ key, value }))).onConflictDoNothing();
console.log('Seeded.');
