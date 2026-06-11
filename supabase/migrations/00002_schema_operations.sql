-- ============================================================
-- 00002: Operations schema - work orders, documents, chat
-- ============================================================

-- WORK ORDERS (工单)
CREATE TABLE work_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL,
    priority        TEXT DEFAULT 'normal',
    status          TEXT DEFAULT 'open',
    assigned_to     UUID REFERENCES auth.users(id),
    created_by      UUID NOT NULL REFERENCES auth.users(id),
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    attachments     JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_work_orders_mall ON work_orders(mall_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);

-- DOCUMENTS (知识库文档)
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    file_url        TEXT NOT NULL,
    file_type       TEXT,
    file_size_bytes INTEGER,
    category        TEXT DEFAULT 'general',
    access_level    TEXT DEFAULT 'admin',
    is_processed    BOOLEAN DEFAULT false,
    chunk_count     INTEGER DEFAULT 0,
    metadata        JSONB DEFAULT '{}',
    created_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_mall ON documents(mall_id);

-- DOCUMENT CHUNKS (文档分块 + 向量)
CREATE TABLE doc_chunks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    content         TEXT NOT NULL,
    content_hash    TEXT,
    token_count     INTEGER,
    embedding       VECTOR(1024),
    start_page      INTEGER,
    end_page        INTEGER,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(document_id, chunk_index)
);
CREATE INDEX idx_doc_chunks_document ON doc_chunks(document_id);
CREATE INDEX idx_doc_chunks_mall ON doc_chunks(mall_id);
CREATE INDEX idx_doc_chunks_embedding ON doc_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- CHAT SESSIONS
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    title           TEXT,
    message_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, mall_id);

-- CHAT MESSAGES
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,
    content         TEXT NOT NULL,
    tool_calls      JSONB,
    tokens_used     INTEGER,
    cited_chunks    UUID[],
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- FOOTFALL LOGS (客流日志)
CREATE TABLE footfall_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL,
    log_hour        INTEGER,
    entrance_name   TEXT,
    visitor_count   INTEGER NOT NULL,
    source          TEXT DEFAULT 'csv',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mall_id, log_date, log_hour, entrance_name)
);
CREATE INDEX idx_footfall_mall ON footfall_logs(mall_id);

-- POS SUMMARY LOGS
CREATE TABLE pos_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mall_id         UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
    unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
    tenant_id       UUID REFERENCES mall_tenants(id) ON DELETE SET NULL,
    log_date        DATE NOT NULL,
    period_type     TEXT DEFAULT 'daily',
    sales_amount    NUMERIC(14,2),
    transaction_count INTEGER,
    avg_basket      NUMERIC(10,2),
    source          TEXT DEFAULT 'csv',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mall_id, unit_id, log_date)
);
CREATE INDEX idx_pos_mall ON pos_logs(mall_id);
CREATE INDEX idx_pos_date ON pos_logs(mall_id, log_date);
