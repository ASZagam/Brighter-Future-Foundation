-- PostgreSQL schema for the Core Foundation module

CREATE TABLE core_country (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    iso_code VARCHAR(3) NOT NULL UNIQUE,
    iso3_code VARCHAR(3),
    numeric_code VARCHAR(8),
    calling_code VARCHAR(16),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE core_organization (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    legal_name VARCHAR(255) NOT NULL DEFAULT '',
    abbreviation VARCHAR(32) NOT NULL DEFAULT '',
    mission_statement TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    website VARCHAR(200) NOT NULL DEFAULT '',
    address_line1 VARCHAR(255) NOT NULL DEFAULT '',
    address_line2 VARCHAR(255) NOT NULL DEFAULT '',
    city VARCHAR(120) NOT NULL DEFAULT '',
    postal_code VARCHAR(32) NOT NULL DEFAULT '',
    country_id BIGINT REFERENCES core_country(id) ON DELETE SET NULL,
    state_id BIGINT REFERENCES core_state(id) ON DELETE SET NULL,
    logo VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE core_state (
    id BIGSERIAL PRIMARY KEY,
    country_id BIGINT NOT NULL REFERENCES core_country(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(16) NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(country_id, name)
);

CREATE TABLE core_settings (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL UNIQUE REFERENCES core_organization(id) ON DELETE CASCADE,
    default_timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    default_language VARCHAR(16) NOT NULL DEFAULT 'en',
    support_email VARCHAR(254) NOT NULL DEFAULT '',
    support_phone VARCHAR(50) NOT NULL DEFAULT '',
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    enable_file_uploads BOOLEAN NOT NULL DEFAULT TRUE,
    max_upload_size_mb INTEGER NOT NULL DEFAULT 20,
    notification_sender VARCHAR(254) NOT NULL DEFAULT '',
    analytics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE core_notification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    organization_id BIGINT REFERENCES core_organization(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(16) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT '',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE core_activitylog (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    organization_id BIGINT REFERENCES core_organization(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT '',
    ip_address INET,
    user_agent VARCHAR(512) NOT NULL DEFAULT '',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE core_fileupload (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    organization_id BIGINT REFERENCES core_organization(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    file VARCHAR(100) NOT NULL,
    upload_type VARCHAR(16) NOT NULL,
    content_type VARCHAR(128) NOT NULL DEFAULT '',
    size BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
