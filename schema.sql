-- ============================================
-- MARKETPLACE TURÍSTICO — SCHEMA SQL COMPLETO
-- Cloudflare D1 (SQLite 3.x compatible)
-- ============================================

-- Enable foreign keys (required for SQLite FK enforcement)
PRAGMA foreign_keys = ON;

-- ============================================
-- ENUM TABLES (lookup tables for status/plans)
-- ============================================

-- ENUM: listing_status
CREATE TABLE IF NOT EXISTS listing_status_enum (
    status TEXT PRIMARY KEY
);
INSERT INTO listing_status_enum (status) VALUES
    ('draft'),
    ('pending'),
    ('published'),
    ('paused'),
    ('rejected'),
    ('expired');

-- ENUM: subscription_plan
CREATE TABLE IF NOT EXISTS subscription_plan_enum (
    plan TEXT PRIMARY KEY
);
INSERT INTO subscription_plan_enum (plan) VALUES
    ('basic'),
    ('professional'),
    ('agency');

-- ENUM: payment_status
CREATE TABLE IF NOT EXISTS payment_status_enum (
    status TEXT PRIMARY KEY
);
INSERT INTO payment_status_enum (status) VALUES
    ('pending'),
    ('completed'),
    ('failed'),
    ('refunded'),
    ('cancelled');

-- ENUM: user_role
CREATE TABLE IF NOT EXISTS user_role_enum (
    role TEXT PRIMARY KEY
);
INSERT INTO user_role_enum (role) VALUES
    ('traveler'),
    ('agency_admin'),
    ('moderator'),
    ('admin');

-- ENUM: message_type
CREATE TABLE IF NOT EXISTS message_type_enum (
    type TEXT PRIMARY KEY
);
INSERT INTO message_type_enum (type) VALUES
    ('inquiry'),
    ('booking'),
    ('review_reply'),
    ('system');

-- ============================================
-- CORE TABLES
-- ============================================

-- USERS: Viajeros, agencia-admins, admins
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT,
    full_name       TEXT NOT NULL,
    avatar_url      TEXT,
    phone           TEXT,
    role            TEXT NOT NULL DEFAULT 'traveler' REFERENCES user_role_enum(role),
    is_active       INTEGER NOT NULL DEFAULT 1,
    email_verified  INTEGER NOT NULL DEFAULT 0,
    preferences     TEXT,                 -- JSON: lang, currency, newsletter
    last_login_at   TEXT,                 -- ISO-8601
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- AGENCIES: Agencias de viajes verificadas
CREATE TABLE IF NOT EXISTS agencies (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid                TEXT NOT NULL UNIQUE,
    owner_user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name       TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    logo_url            TEXT,
    description         TEXT,
    website             TEXT,
    phone               TEXT,
    email               TEXT,
    license_number      TEXT NOT NULL,
    license_verified    INTEGER NOT NULL DEFAULT 0,
    license_verified_at TEXT,
    country             TEXT,
    city                TEXT,
    address             TEXT,
    social_links        TEXT,                 -- JSON: { facebook, instagram, linkedin }
    is_verified         INTEGER NOT NULL DEFAULT 0,
    is_active           INTEGER NOT NULL DEFAULT 1,
    subscription_plan   TEXT NOT NULL DEFAULT 'basic' REFERENCES subscription_plan_enum(plan),
    subscription_expires_at TEXT,
    listings_used       INTEGER NOT NULL DEFAULT 0,
    listings_limit      INTEGER NOT NULL DEFAULT 5,
    featured_used       INTEGER NOT NULL DEFAULT 0,
    featured_limit      INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- CATEGORIES: Tipos de anuncios de viajes
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    name_es     TEXT NOT NULL,
    name_en     TEXT,
    icon        TEXT,
    color       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    metadata    TEXT,                         -- JSON: seo_title, seo_description
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- LISTINGS: Anuncios de ofertas turísticas
CREATE TABLE IF NOT EXISTS listings (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid                TEXT NOT NULL UNIQUE,
    agency_id           INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    category_id         INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title               TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    description         TEXT NOT NULL,
    short_description   TEXT,
    destination_country TEXT NOT NULL,
    destination_city    TEXT,
    duration_days       INTEGER,
    departure_dates     TEXT,                 -- JSON array of ISO dates
    price               REAL NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'EUR',
    original_price      REAL,
    is_featured         INTEGER NOT NULL DEFAULT 0,
    featured_until      TEXT,
    max_travelers       INTEGER,
    includes            TEXT,                 -- JSON array
    excludes            TEXT,                 -- JSON array
    itinerary           TEXT,                 -- JSON: [{ day, title, description }]
    tags                TEXT,                 -- JSON array
    cover_image         TEXT,                 -- URL to R2
    status              TEXT NOT NULL DEFAULT 'draft' REFERENCES listing_status_enum(status),
    moderation_notes    TEXT,
    published_at        TEXT,
    expires_at          TEXT,
    seo_title           TEXT,
    seo_description     TEXT,
    view_count          INTEGER NOT NULL DEFAULT 0,
    click_count         INTEGER NOT NULL DEFAULT 0,
    lead_count          INTEGER NOT NULL DEFAULT 0,
    avg_rating          REAL DEFAULT NULL,
    review_count        INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- LISTING_IMAGES: Galería de imágenes por anuncio
CREATE TABLE IF NOT EXISTS listing_images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid        TEXT NOT NULL UNIQUE,
    listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text    TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_primary  INTEGER NOT NULL DEFAULT 0,
    file_size   INTEGER,
    dimensions  TEXT,                     -- JSON: { width, height }
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- BOOKMARKS: Favoritos de viajeros
CREATE TABLE IF NOT EXISTS bookmarks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(user_id, listing_id)
);

-- REVIEWS: Valoraciones verificadas
CREATE TABLE IF NOT EXISTS reviews (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    listing_id      INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    author_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    title           TEXT,
    comment         TEXT NOT NULL,
    is_verified     INTEGER NOT NULL DEFAULT 0,     -- verified by purchase/booking
    verified_at     TEXT,
    moderation_status TEXT NOT NULL DEFAULT 'approved',
    helpful_count   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- MESSAGES: Contacto entre viajeros y agencias
CREATE TABLE IF NOT EXISTS messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    listing_id      INTEGER REFERENCES listings(id) ON DELETE SET NULL,
    sender_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL DEFAULT 'inquiry' REFERENCES message_type_enum(type),
    subject         TEXT,
    body            TEXT NOT NULL,
    is_read         INTEGER NOT NULL DEFAULT 0,
    read_at         TEXT,
    parent_message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    metadata        TEXT,                     -- JSON: { travel_dates, adults, children, notes }
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- SUBSCRIPTIONS: Suscripciones de agencias
CREATE TABLE IF NOT EXISTS subscriptions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    agency_id       INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    plan            TEXT NOT NULL REFERENCES subscription_plan_enum(plan),
    stripe_subscription_id TEXT,
    stripe_customer_id     TEXT,
    status          TEXT NOT NULL DEFAULT 'active',
    current_period_start TEXT NOT NULL,
    current_period_end   TEXT NOT NULL,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    cancelled_at    TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- PAYMENTS: Pagos de agencias
CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    agency_id       INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    amount          REAL NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'EUR',
    status          TEXT NOT NULL DEFAULT 'pending' REFERENCES payment_status_enum(status),
    description     TEXT,
    payment_method  TEXT,
    receipt_url     TEXT,
    paid_at         TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- AUDIT_LOG: Registro de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid        TEXT NOT NULL UNIQUE,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    actor_ip    TEXT,
    action      TEXT NOT NULL,              -- e.g., listing_created, agency_verified
    entity_type TEXT NOT NULL,              -- e.g., listing, agency, user
    entity_id   INTEGER,
    old_values  TEXT,                     -- JSON: snapshot before change
    new_values  TEXT,                     -- JSON: snapshot after change
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================
-- FULL-TEXT SEARCH (FTS5) VIRTUAL TABLE
-- ============================================
CREATE VIRTUAL TABLE IF NOT EXISTS listings_fts USING fts5(
    title,
    description,
    destination_country,
    destination_city,
    tags,
    content='listings',
    content_rowid='id'
);

-- Triggers to keep FTS index in sync with listings
CREATE TRIGGER IF NOT EXISTS listings_fts_insert AFTER INSERT ON listings BEGIN
    INSERT INTO listings_fts(rowid, title, description, destination_country, destination_city, tags)
    VALUES (new.id, new.title, new.description, new.destination_country, new.destination_city, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS listings_fts_delete AFTER DELETE ON listings BEGIN
    INSERT INTO listings_fts(listings_fts, rowid, title, description, destination_country, destination_city, tags)
    VALUES ('delete', old.id, old.title, old.description, old.destination_country, old.destination_city, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS listings_fts_update AFTER UPDATE ON listings BEGIN
    INSERT INTO listings_fts(listings_fts, rowid, title, description, destination_country, destination_city, tags)
    VALUES ('delete', old.id, old.title, old.description, old.destination_country, old.destination_city, old.tags);
    INSERT INTO listings_fts(rowid, title, description, destination_country, destination_city, tags)
    VALUES (new.id, new.title, new.description, new.destination_country, new.destination_city, new.tags);
END;

-- ============================================
-- INDICES FOR COMMON QUERIES
-- ============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Agencies
CREATE INDEX IF NOT EXISTS idx_agencies_owner ON agencies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_verified ON agencies(is_verified);
CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(is_active);
CREATE INDEX IF NOT EXISTS idx_agencies_plan ON agencies(subscription_plan);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(sort_order);

-- Listings — core search & filter indices
CREATE INDEX IF NOT EXISTS idx_listings_agency ON listings(agency_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_country ON listings(destination_country);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(destination_city);
CREATE INDEX IF NOT EXISTS idx_listings_published ON listings(published_at);
CREATE INDEX IF NOT EXISTS idx_listings_expires ON listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_avg_rating ON listings(avg_rating);
CREATE INDEX IF NOT EXISTS idx_listings_review_count ON listings(review_count);
-- Composite: published + featured + country + price (homepage filters)
CREATE INDEX IF NOT EXISTS idx_listings_search_composite ON listings(status, is_featured, destination_country, price);
-- Composite: category + status + price
CREATE INDEX IF NOT EXISTS idx_listings_category_search ON listings(category_id, status, price);

-- Listing Images
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_primary ON listing_images(listing_id, is_primary);

-- Bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_listing ON bookmarks(listing_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON reviews(author_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON reviews(moderation_status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_agency ON payments(agency_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON payments(stripe_payment_intent_id);

-- Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
