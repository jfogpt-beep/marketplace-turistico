import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── USERS ──────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['traveler', 'agency', 'admin'] }).notNull().default('traveler'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role),
]);

// ─── AGENCIES ─────────────────────────────────────────
export const agencies = sqliteTable('agencies', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' }).notNull().references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  country: text('country').notNull().default('ES'),
  licenseNumber: text('license_number').unique(),
  licenseVerified: integer('license_verified', { mode: 'boolean' }).notNull().default(false),
  licenseVerifiedAt: integer('license_verified_at', { mode: 'timestamp' }),
  isSuspended: integer('is_suspended', { mode: 'boolean' }).notNull().default(false),
  suspensionReason: text('suspension_reason'),
  subscriptionPlan: text('subscription_plan', { enum: ['basic', 'professional', 'agency'] }).notNull().default('basic'),
  subscriptionStatus: text('subscription_status', { enum: ['active', 'past_due', 'canceled', 'trialing'] }).notNull().default('trialing'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  trialEndsAt: integer('trial_ends_at', { mode: 'timestamp' }),
  listingCount: integer('listing_count', { mode: 'number' }).notNull().default(0),
  featuredCount: integer('featured_count', { mode: 'number' }).notNull().default(0),
  totalLeads: integer('total_leads', { mode: 'number' }).notNull().default(0),
  rating: real('rating').default(0),
  reviewCount: integer('review_count', { mode: 'number' }).notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('agencies_slug_idx').on(table.slug),
  index('agencies_user_id_idx').on(table.userId),
  index('agencies_subscription_idx').on(table.subscriptionPlan, table.subscriptionStatus),
]);

// ─── CATEGORIES ───────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order', { mode: 'number' }).notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('categories_slug_idx').on(table.slug),
]);

// ─── LISTINGS ─────────────────────────────────────────
export const listings = sqliteTable('listings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  agencyId: integer('agency_id', { mode: 'number' }).notNull().references(() => agencies.id),
  categoryId: integer('category_id', { mode: 'number' }).notNull().references(() => categories.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),
  destination: text('destination').notNull(),
  country: text('country').notNull(),
  city: text('city'),
  durationDays: integer('duration_days', { mode: 'number' }),
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  currency: text('currency').notNull().default('EUR'),
  departureDates: text('departure_dates'), // JSON array of dates
  maxTravelers: integer('max_travelers', { mode: 'number' }),
  includes: text('includes'), // JSON array
  excludes: text('excludes'), // JSON array
  itinerary: text('itinerary'), // JSON array
  accommodationType: text('accommodation_type'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  featuredUntil: integer('featured_until', { mode: 'timestamp' }),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  verificationStatus: text('verification_status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  status: text('status', { enum: ['draft', 'active', 'paused', 'expired'] }).notNull().default('draft'),
  viewCount: integer('view_count', { mode: 'number' }).notNull().default(0),
  clickCount: integer('click_count', { mode: 'number' }).notNull().default(0),
  leadCount: integer('lead_count', { mode: 'number' }).notNull().default(0),
  rating: real('rating').default(0),
  reviewCount: integer('review_count', { mode: 'number' }).notNull().default(0),
  vectorId: text('vector_id'), // Vectorize ID
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
}, (table) => [
  uniqueIndex('listings_slug_idx').on(table.slug),
  index('listings_agency_idx').on(table.agencyId),
  index('listings_category_idx').on(table.categoryId),
  index('listings_destination_idx').on(table.destination),
  index('listings_price_idx').on(table.price),
  index('listings_featured_idx').on(table.isFeatured),
  index('listings_status_idx').on(table.status),
  index('listings_verification_idx').on(table.verificationStatus),
]);

// ─── LISTING_IMAGES ───────────────────────────────────
export const listingImages = sqliteTable('listing_images', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  listingId: integer('listing_id', { mode: 'number' }).notNull().references(() => listings.id),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  altText: text('alt_text'),
  sortOrder: integer('sort_order', { mode: 'number' }).notNull().default(0),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('listing_images_listing_idx').on(table.listingId),
]);

// ─── BOOKMARKS ────────────────────────────────────────
export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' }).notNull().references(() => users.id),
  listingId: integer('listing_id', { mode: 'number' }).notNull().references(() => listings.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('bookmarks_user_listing_idx').on(table.userId, table.listingId),
]);

// ─── REVIEWS ──────────────────────────────────────────
export const reviews = sqliteTable('reviews', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' }).notNull().references(() => users.id),
  agencyId: integer('agency_id', { mode: 'number' }).notNull().references(() => agencies.id),
  listingId: integer('listing_id', { mode: 'number' }).references(() => listings.id),
  bookingReference: text('booking_reference'),
  rating: integer('rating', { mode: 'number' }).notNull(),
  title: text('title'),
  content: text('content').notNull(),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
  agencyResponse: text('agency_response'),
  agencyRespondedAt: integer('agency_responded_at', { mode: 'timestamp' }),
  helpfulCount: integer('helpful_count', { mode: 'number' }).notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('reviews_agency_idx').on(table.agencyId),
  index('reviews_listing_idx').on(table.listingId),
  index('reviews_user_idx').on(table.userId),
  index('reviews_rating_idx').on(table.rating),
]);

// ─── MESSAGES ─────────────────────────────────────────
export const messages = sqliteTable('messages', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  senderId: integer('sender_id', { mode: 'number' }).notNull().references(() => users.id),
  receiverId: integer('receiver_id', { mode: 'number' }).notNull().references(() => users.id),
  listingId: integer('listing_id', { mode: 'number' }).references(() => listings.id),
  subject: text('subject'),
  content: text('content').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  parentMessageId: integer('parent_message_id', { mode: 'number' }).references(() => messages.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('messages_sender_idx').on(table.senderId),
  index('messages_receiver_idx').on(table.receiverId),
  index('messages_conversation_idx').on(table.senderId, table.receiverId),
  index('messages_listing_idx').on(table.listingId),
]);

// ─── SUBSCRIPTIONS ──────────────────────────────────────
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  agencyId: integer('agency_id', { mode: 'number' }).notNull().references(() => agencies.id),
  plan: text('plan', { enum: ['basic', 'professional', 'agency'] }).notNull(),
  status: text('status', { enum: ['active', 'past_due', 'canceled', 'trialing', 'paused'] }).notNull().default('trialing'),
  price: real('price').notNull(),
  interval: text('interval', { enum: ['month', 'year'] }).notNull().default('month'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),
  canceledAt: integer('canceled_at', { mode: 'timestamp' }),
  listingLimit: integer('listing_limit', { mode: 'number' }).notNull(),
  featuredLimit: integer('featured_limit', { mode: 'number' }).notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('subscriptions_agency_idx').on(table.agencyId),
  index('subscriptions_stripe_idx').on(table.stripeSubscriptionId),
]);

// ─── PAYMENTS ───────────────────────────────────────────
export const payments = sqliteTable('payments', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  agencyId: integer('agency_id', { mode: 'number' }).notNull().references(() => agencies.id),
  subscriptionId: integer('subscription_id', { mode: 'number' }).references(() => subscriptions.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('EUR'),
  status: text('status', { enum: ['pending', 'succeeded', 'failed', 'refunded'] }).notNull().default('pending'),
  description: text('description'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeInvoiceId: text('stripe_invoice_id'),
  receiptUrl: text('receipt_url'),
  failureMessage: text('failure_message'),
  refundedAmount: real('refunded_amount'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('payments_agency_idx').on(table.agencyId),
  index('payments_stripe_idx').on(table.stripePaymentIntentId),
]);

// ─── AUDIT_LOG ──────────────────────────────────────────
export const auditLog = sqliteTable('audit_log', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer('user_id', { mode: 'number' }).references(() => users.id),
  agencyId: integer('agency_id', { mode: 'number' }).references(() => agencies.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(), // 'listing', 'agency', 'user', 'review', etc.
  entityId: integer('entity_id', { mode: 'number' }),
  oldValues: text('old_values'), // JSON
  newValues: text('new_values'), // JSON
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('audit_user_idx').on(table.userId),
  index('audit_entity_idx').on(table.entityType, table.entityId),
  index('audit_action_idx').on(table.action),
]);

// ─── REPORTS ────────────────────────────────────────────
export const reports = sqliteTable('reports', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  reporterId: integer('reporter_id', { mode: 'number' }).notNull().references(() => users.id),
  entityType: text('entity_type', { enum: ['listing', 'agency', 'review'] }).notNull(),
  entityId: integer('entity_id', { mode: 'number' }).notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: text('status', { enum: ['pending', 'investigating', 'resolved', 'dismissed'] }).notNull().default('pending'),
  resolvedBy: integer('resolved_by', { mode: 'number' }).references(() => users.id),
  resolution: text('resolution'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('reports_entity_idx').on(table.entityType, table.entityId),
  index('reports_status_idx').on(table.status),
]);

// ─── FEATURED_PURCHASES ─────────────────────────────────
export const featuredPurchases = sqliteTable('featured_purchases', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  agencyId: integer('agency_id', { mode: 'number' }).notNull().references(() => agencies.id),
  listingId: integer('listing_id', { mode: 'number' }).notNull().references(() => listings.id),
  durationDays: integer('duration_days', { mode: 'number' }).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('EUR'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  status: text('status', { enum: ['pending', 'active', 'expired'] }).notNull().default('pending'),
  startsAt: integer('starts_at', { mode: 'timestamp' }),
  endsAt: integer('ends_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('featured_purchases_agency_idx').on(table.agencyId),
  index('featured_purchases_listing_idx').on(table.listingId),
]);
