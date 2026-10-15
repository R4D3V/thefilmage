import { relations } from 'drizzle-orm';
import {
  boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex, varchar,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
    .$onUpdate(() => new Date()),
};

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('admin'),
  ...timestamps,
}, (t) => [uniqueIndex('users_email_uq').on(t.email)]);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  slug: varchar('slug', { length: 80 }).notNull(),
  position: integer('position').notNull().default(0),
  ...timestamps,
}, (t) => [uniqueIndex('categories_slug_uq').on(t.slug)]);

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 160 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull(),
  description: text('description').notNull().default(''),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  coverPublicId: text('cover_public_id'),
  videoPublicId: text('video_public_id'),
  clientName: varchar('client_name', { length: 160 }),
  projectDate: timestamp('project_date', { mode: 'date' }),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(false),
  position: integer('position').notNull().default(0),
  ...timestamps,
}, (t) => [
  uniqueIndex('projects_slug_uq').on(t.slug),
  index('projects_published_pos_idx').on(t.published, t.position),
  index('projects_category_idx').on(t.categoryId),
]);

export const projectImages = pgTable('project_images', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  publicId: text('public_id').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: varchar('alt', { length: 200 }),
  position: integer('position').notNull().default(0),
  ...timestamps,
}, (t) => [index('project_images_project_idx').on(t.projectId, t.position)]);

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  summary: text('summary').notNull(),
  imagePublicId: text('image_public_id'),
  position: integer('position').notNull().default(0),
  published: boolean('published').notNull().default(true),
  ...timestamps,
}, (t) => [uniqueIndex('services_slug_uq').on(t.slug)]);

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  clientName: varchar('client_name', { length: 120 }).notNull(),
  clientCompany: varchar('client_company', { length: 120 }),
  photoPublicId: text('photo_public_id'),
  body: text('body').notNull(),
  rating: integer('rating').notNull().default(5),
  published: boolean('published').notNull().default(false),
  position: integer('position').notNull().default(0),
  ...timestamps,
}, (t) => [index('testimonials_published_idx').on(t.published, t.position)]);

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  company: varchar('company', { length: 120 }),
  service: varchar('service', { length: 120 }),
  budget: varchar('budget', { length: 60 }),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  ipHash: varchar('ip_hash', { length: 64 }),
  ...timestamps,
}, (t) => [index('contact_read_created_idx').on(t.isRead, t.createdAt)]);

export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 80 }).primaryKey(),
  value: text('value').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
    .$onUpdate(() => new Date()),
});

export const rateLimits = pgTable('rate_limits', {
  key: varchar('key', { length: 120 }).primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({ projects: many(projects) }));
export const projectsRelations = relations(projects, ({ one, many }) => ({
  category: one(categories, { fields: [projects.categoryId], references: [categories.id] }),
  images: many(projectImages),
}));
export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, { fields: [projectImages.projectId], references: [projects.id] }),
}));
