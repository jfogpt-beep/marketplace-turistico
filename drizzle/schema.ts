import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = ["traveler", "agency_admin", "moderator", "admin"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const listingStatusEnum = [
  "draft",
  "pending",
  "published",
  "paused",
  "rejected",
  "expired",
] as const;
export type ListingStatus = (typeof listingStatusEnum)[number];

export const subscriptionPlanEnum = ["basic", "professional", "agency"] as const;
export type SubscriptionPlan = (typeof subscriptionPlanEnum)[number];

export const paymentStatusEnum = [
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
] as const;
export type PaymentStatus = (typeof paymentStatusEnum)[number];

export const messageTypeEnum = [
  "inquiry",
  "booking",
  "review_reply",
  "system",
] as const;
export type MessageType = (typeof messageTypeEnum)[number];

// ============================================
// HELPER: JSON column
// ============================================
const jsonColumn = <T>() =>
  text("", { mode: "json" }).$type<T | null>();

const jsonColumnReq = <T>(defaultVal: T) =>
  text("", { mode: "json" }).$type<T>().default(sql`${JSON.stringify(defaultVal)}`);

// ============================================
// TABLE: users
// ============================================
export const users = sqliteTable(
  "users",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    role: text("role", { enum: userRoleEnum }).notNull().default("traveler"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    preferences: text("preferences", { mode: "json" }).$type<{
      lang?: string;
      currency?: string;
      newsletter?: boolean;
    } | null>(),
    lastLoginAt: text("last_login_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    roleIdx: index("idx_users_role").on(table.role),
    activeIdx: index("idx_users_active").on(table.isActive),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================
// TABLE: agencies
// ============================================
export const agencies = sqliteTable(
  "agencies",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    ownerUserId: integer("owner_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessName: text("business_name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    description: text("description"),
    website: text("website"),
    phone: text("phone"),
    email: text("email"),
    licenseNumber: text("license_number").notNull(),
    licenseVerified: integer("license_verified", { mode: "boolean" }).notNull().default(false),
    licenseVerifiedAt: text("license_verified_at"),
    country: text("country"),
    city: text("city"),
    address: text("address"),
    socialLinks: text("social_links", { mode: "json" }).$type<{
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    } | null>(),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    subscriptionPlan: text("subscription_plan", { enum: subscriptionPlanEnum })
      .notNull()
      .default("basic"),
    subscriptionExpiresAt: text("subscription_expires_at"),
    listingsUsed: integer("listings_used", { mode: "number" }).notNull().default(0),
    listingsLimit: integer("listings_limit", { mode: "number" }).notNull().default(5),
    featuredUsed: integer("featured_used", { mode: "number" }).notNull().default(0),
    featuredLimit: integer("featured_limit", { mode: "number" }).notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    ownerIdx: index("idx_agencies_owner").on(table.ownerUserId),
    slugIdx: index("idx_agencies_slug").on(table.slug),
    verifiedIdx: index("idx_agencies_verified").on(table.isVerified),
    activeIdx: index("idx_agencies_active").on(table.isActive),
    planIdx: index("idx_agencies_plan").on(table.subscriptionPlan),
  })
);

export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;

// ============================================
// TABLE: categories
// ============================================
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    nameEs: text("name_es").notNull(),
    nameEn: text("name_en"),
    icon: text("icon"),
    color: text("color"),
    sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    metadata: text("metadata", { mode: "json" }).$type<{
      seoTitle?: string;
      seoDescription?: string;
    } | null>(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    slugIdx: index("idx_categories_slug").on(table.slug),
    activeIdx: index("idx_categories_active").on(table.isActive),
    orderIdx: index("idx_categories_order").on(table.sortOrder),
  })
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// ============================================
// TABLE: listings
// ============================================
export const listings = sqliteTable(
  "listings",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    agencyId: integer("agency_id", { mode: "number" })
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    categoryId: integer("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    shortDescription: text("short_description"),
    destinationCountry: text("destination_country").notNull(),
    destinationCity: text("destination_city"),
    durationDays: integer("duration_days", { mode: "number" }),
    departureDates: text("departure_dates", { mode: "json" }).$type<string[] | null>(),
    price: real("price").notNull(),
    currency: text("currency").notNull().default("EUR"),
    originalPrice: real("original_price"),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    featuredUntil: text("featured_until"),
    maxTravelers: integer("max_travelers", { mode: "number" }),
    includes: text("includes", { mode: "json" }).$type<string[] | null>(),
    excludes: text("excludes", { mode: "json" }).$type<string[] | null>(),
    itinerary: text("itinerary", { mode: "json" }).$type<
      { day: number; title: string; description: string }[] | null
    >(),
    tags: text("tags", { mode: "json" }).$type<string[] | null>(),
    coverImage: text("cover_image"),
    status: text("status", { enum: listingStatusEnum }).notNull().default("draft"),
    moderationNotes: text("moderation_notes"),
    publishedAt: text("published_at"),
    expiresAt: text("expires_at"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    viewCount: integer("view_count", { mode: "number" }).notNull().default(0),
    clickCount: integer("click_count", { mode: "number" }).notNull().default(0),
    leadCount: integer("lead_count", { mode: "number" }).notNull().default(0),
    avgRating: real("avg_rating"),
    reviewCount: integer("review_count", { mode: "number" }).notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    agencyIdx: index("idx_listings_agency").on(table.agencyId),
    categoryIdx: index("idx_listings_category").on(table.categoryId),
    statusIdx: index("idx_listings_status").on(table.status),
    featuredIdx: index("idx_listings_featured").on(table.isFeatured),
    priceIdx: index("idx_listings_price").on(table.price),
    countryIdx: index("idx_listings_country").on(table.destinationCountry),
    cityIdx: index("idx_listings_city").on(table.destinationCity),
    publishedIdx: index("idx_listings_published").on(table.publishedAt),
    expiresIdx: index("idx_listings_expires").on(table.expiresAt),
    avgRatingIdx: index("idx_listings_avg_rating").on(table.avgRating),
    reviewCountIdx: index("idx_listings_review_count").on(table.reviewCount),
    searchCompositeIdx: index("idx_listings_search_composite").on(
      table.status,
      table.isFeatured,
      table.destinationCountry,
      table.price
    ),
    categorySearchIdx: index("idx_listings_category_search").on(
      table.categoryId,
      table.status,
      table.price
    ),
  })
);

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

// ============================================
// TABLE: listing_images
// ============================================
export const listingImages = sqliteTable(
  "listing_images",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    listingId: integer("listing_id", { mode: "number" })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    altText: text("alt_text"),
    sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    fileSize: integer("file_size", { mode: "number" }),
    dimensions: text("dimensions", { mode: "json" }).$type<{
      width: number;
      height: number;
    } | null>(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    listingIdx: index("idx_listing_images_listing").on(table.listingId),
    primaryIdx: index("idx_listing_images_primary").on(table.listingId, table.isPrimary),
  })
);

export type ListingImage = typeof listingImages.$inferSelect;
export type NewListingImage = typeof listingImages.$inferInsert;

// ============================================
// TABLE: bookmarks
// ============================================
export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: integer("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: integer("listing_id", { mode: "number" })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    userIdx: index("idx_bookmarks_user").on(table.userId),
    listingIdx: index("idx_bookmarks_listing").on(table.listingId),
    uniqueBookmark: uniqueIndex("idx_bookmarks_unique").on(table.userId, table.listingId),
  })
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

// ============================================
// TABLE: reviews
// ============================================
export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    listingId: integer("listing_id", { mode: "number" })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    authorUserId: integer("author_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating", { mode: "number" }).notNull(),
    title: text("title"),
    comment: text("comment").notNull(),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    verifiedAt: text("verified_at"),
    moderationStatus: text("moderation_status").notNull().default("approved"),
    helpfulCount: integer("helpful_count", { mode: "number" }).notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    listingIdx: index("idx_reviews_listing").on(table.listingId),
    authorIdx: index("idx_reviews_author").on(table.authorUserId),
    ratingIdx: index("idx_reviews_rating").on(table.rating),
    verifiedIdx: index("idx_reviews_verified").on(table.isVerified),
    moderationIdx: index("idx_reviews_moderation").on(table.moderationStatus),
  })
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

// ============================================
// TABLE: messages
// ============================================
export const messages = sqliteTable(
  "messages",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    listingId: integer("listing_id", { mode: "number" }).references(() => listings.id, {
      onDelete: "set null",
    }),
    senderUserId: integer("sender_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientUserId: integer("recipient_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: messageTypeEnum }).notNull().default("inquiry"),
    subject: text("subject"),
    body: text("body").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    readAt: text("read_at"),
    parentMessageId: integer("parent_message_id", { mode: "number" }).references(() => messages.id, {
      onDelete: "cascade",
    }),
    metadata: text("metadata", { mode: "json" }).$type<{
      travelDates?: string;
      adults?: number;
      children?: number;
      notes?: string;
    } | null>(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    senderIdx: index("idx_messages_sender").on(table.senderUserId),
    recipientIdx: index("idx_messages_recipient").on(table.recipientUserId),
    listingIdx: index("idx_messages_listing").on(table.listingId),
    parentIdx: index("idx_messages_parent").on(table.parentMessageId),
    createdIdx: index("idx_messages_created").on(table.createdAt),
  })
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// ============================================
// TABLE: subscriptions
// ============================================
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    agencyId: integer("agency_id", { mode: "number" })
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    plan: text("plan", { enum: subscriptionPlanEnum }).notNull(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeCustomerId: text("stripe_customer_id"),
    status: text("status").notNull().default("active"),
    currentPeriodStart: text("current_period_start").notNull(),
    currentPeriodEnd: text("current_period_end").notNull(),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
    cancelledAt: text("cancelled_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    agencyIdx: index("idx_subscriptions_agency").on(table.agencyId),
    stripeIdx: index("idx_subscriptions_stripe").on(table.stripeSubscriptionId),
    periodEndIdx: index("idx_subscriptions_period_end").on(table.currentPeriodEnd),
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// ============================================
// TABLE: payments
// ============================================
export const payments = sqliteTable(
  "payments",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    agencyId: integer("agency_id", { mode: "number" })
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    subscriptionId: integer("subscription_id", { mode: "number" }).references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeInvoiceId: text("stripe_invoice_id"),
    amount: real("amount").notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: text("status", { enum: paymentStatusEnum }).notNull().default("pending"),
    description: text("description"),
    paymentMethod: text("payment_method"),
    receiptUrl: text("receipt_url"),
    paidAt: text("paid_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    agencyIdx: index("idx_payments_agency").on(table.agencyId),
    subscriptionIdx: index("idx_payments_subscription").on(table.subscriptionId),
    statusIdx: index("idx_payments_status").on(table.status),
    stripeIdx: index("idx_payments_stripe").on(table.stripePaymentIntentId),
  })
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// ============================================
// TABLE: audit_log
// ============================================
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    actorUserId: integer("actor_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    actorIp: text("actor_ip"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id"),
    oldValues: text("old_values", { mode: "json" }).$type<Record<string, unknown> | null>(),
    newValues: text("new_values", { mode: "json" }).$type<Record<string, unknown> | null>(),
    notes: text("notes"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    actorIdx: index("idx_audit_actor").on(table.actorUserId),
    entityIdx: index("idx_audit_entity").on(table.entityType, table.entityId),
    actionIdx: index("idx_audit_action").on(table.action),
    createdIdx: index("idx_audit_created").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

// ============================================
// RELATIONS (Drizzle ORM)
// ============================================

import { relations } from "drizzle-orm";

// --- users relations ---
export const usersRelations = relations(users, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [users.id],
    references: [agencies.ownerUserId],
  }),
  bookmarks: many(bookmarks),
  reviews: many(reviews),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
  auditLogs: many(auditLog),
}));

// --- agencies relations ---
export const agenciesRelations = relations(agencies, ({ one, many }) => ({
  owner: one(users, {
    fields: [agencies.ownerUserId],
    references: [users.id],
  }),
  listings: many(listings),
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

// --- categories relations ---
export const categoriesRelations = relations(categories, ({ many }) => ({
  listings: many(listings),
}));

// --- listings relations ---
export const listingsRelations = relations(listings, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [listings.agencyId],
    references: [agencies.id],
  }),
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  images: many(listingImages),
  bookmarks: many(bookmarks),
  reviews: many(reviews),
  messages: many(messages),
}));

// --- listing_images relations ---
export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, {
    fields: [listingImages.listingId],
    references: [listings.id],
  }),
}));

// --- bookmarks relations ---
export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [bookmarks.listingId],
    references: [listings.id],
  }),
}));

// --- reviews relations ---
export const reviewsRelations = relations(reviews, ({ one }) => ({
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
  author: one(users, {
    fields: [reviews.authorUserId],
    references: [users.id],
  }),
}));

// --- messages relations ---
export const messagesRelations = relations(messages, ({ one, many }) => ({
  listing: one(listings, {
    fields: [messages.listingId],
    references: [listings.id],
  }),
  sender: one(users, {
    fields: [messages.senderUserId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientUserId],
    references: [users.id],
    relationName: "recipient",
  }),
  parent: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
  }),
  replies: many(messages, { relationName: "parent" }),
}));

// --- subscriptions relations ---
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [subscriptions.agencyId],
    references: [agencies.id],
  }),
  payments: many(payments),
}));

// --- payments relations ---
export const paymentsRelations = relations(payments, ({ one }) => ({
  agency: one(agencies, {
    fields: [payments.agencyId],
    references: [agencies.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// --- audit_log relations ---
export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(users, {
    fields: [auditLog.actorUserId],
    references: [users.id],
  }),
}));
