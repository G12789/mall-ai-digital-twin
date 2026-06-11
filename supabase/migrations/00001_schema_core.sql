-- ============================================================
-- 00001: Core schema - malls, floors, units, tenants, leases
-- ============================================================

-- TENANTS (multi-tenant SaaS isolation)
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    plan_type       TEXT NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name       TEXT,
    role            TEXT NOT NULL DEFAULT 'viewer',
    avatar_url      TEXT,
    phone           TEXT,
    preferences     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MALLS
CREATE TABLE malls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    name_en         TEXT,
    address         TEXT NOT NULL,
    city            TEXT,
    district        TEXT,
    total_area_sqm  NUMERIC(10,2),
    leasable_area_sqm NUMERIC(10,2),
    logo_url        TEXT,
    cover_image_url TEXT,
    contact_name    TEXT,
    contact_phone   TEXT,
    contact_email   TEXT,
    status          TEXT NOT NULL DEFAULT 'active',
    config          JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_malls_tenant ON malls(tenant_id);

-- FLOORS
CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    floor_index     INTEGER NOT NULL,
    floor_label     TEXT NOT NULL,
    floor_name      TEXT,
    plan_image_url  TEXT,
    extrude_height_m NUMERIC(5,2) DEFAULT 4.0,
    ceiling_height_m NUMERIC(5,2) DEFAULT 3.2,
    glb_asset_url   TEXT,
    glb_lowres_url  TEXT,
    geojson_boundary JSONB,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mall_id, floor_index)
);
CREATE INDEX idx_floors_mall ON floors(mall_id);

-- UNITS (铺位)
CREATE TABLE units (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    unit_code       TEXT NOT NULL,
    unit_name       TEXT,
    area_gross_sqm  NUMERIC(8,2),
    area_net_sqm    NUMERIC(8,2),
    area_leased_sqm NUMERIC(8,2),
    polygon_geojson JSONB,
    centroid_geojson JSONB,
    category        TEXT,
    sub_category    TEXT,
    unit_type       TEXT DEFAULT 'standard',
    frontage_m      NUMERIC(5,2),
    floor_position  TEXT,
    status          TEXT DEFAULT 'vacant',
    features        JSONB DEFAULT '[]',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(floor_id, unit_code)
);
CREATE INDEX idx_units_floor ON units(floor_id);
CREATE INDEX idx_units_mall ON units(mall_id);
CREATE INDEX idx_units_status ON units(mall_id, status);

-- TENANTS (商户/品牌)
CREATE TABLE mall_tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    name_en         TEXT,
    brand           TEXT,
    category        TEXT NOT NULL,
    sub_category    TEXT,
    contact_name    TEXT,
    contact_phone   TEXT,
    contact_email   TEXT,
    contact_wechat  TEXT,
    business_license TEXT,
    legal_representative TEXT,
    registered_capital TEXT,
    tier            TEXT DEFAULT 'standard',
    status          TEXT DEFAULT 'active',
    logo_url        TEXT,
    notes           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mall_tenants_mall ON mall_tenants(mall_id);

-- LEASES (租约/合同)
CREATE TABLE leases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    tenant_id       UUID NOT NULL REFERENCES mall_tenants(id) ON DELETE RESTRICT,
    contract_number TEXT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    rent_free_start DATE,
    rent_free_end   DATE,
    rent_model      TEXT NOT NULL DEFAULT 'fixed',
    monthly_rent    NUMERIC(12,2),
    rent_per_sqm    NUMERIC(8,2),
    turnover_rent_pct NUMERIC(5,2),
    mgmt_fee_per_sqm NUMERIC(8,2),
    promotion_fee_per_sqm NUMERIC(8,2),
    deposit_amount  NUMERIC(12,2),
    deposit_months  INTEGER DEFAULT 2,
    payment_cycle   TEXT DEFAULT 'monthly',
    renewal_option  BOOLEAN DEFAULT false,
    early_termination TEXT,
    special_terms   TEXT,
    contract_file_url TEXT,
    status          TEXT NOT NULL DEFAULT 'active',
    signed_date     DATE,
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_mall ON leases(mall_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_dates ON leases(start_date, end_date);
