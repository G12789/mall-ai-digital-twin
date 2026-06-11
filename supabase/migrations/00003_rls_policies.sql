-- ============================================================
-- 00003: Row-Level Security policies
-- ============================================================

-- Enable RLS on all application tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE footfall_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's tenant_id from profiles
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policy: tenants can only see own data
CREATE POLICY "tenant_isolation_tenants" ON tenants
  FOR ALL USING (id = current_user_tenant_id());

-- Policy: profiles can only see own profile
CREATE POLICY "profiles_self_access" ON profiles
  FOR ALL USING (id = auth.uid());

-- Policy: malls scoped to user's tenant
CREATE POLICY "tenant_isolation_malls" ON malls
  FOR ALL USING (tenant_id = current_user_tenant_id());

-- Policy: floors scoped via mall -> tenant
CREATE POLICY "tenant_isolation_floors" ON floors
  FOR ALL USING (mall_id IN (
    SELECT id FROM malls WHERE tenant_id = current_user_tenant_id()
  ));

-- Policy: units scoped via mall -> tenant
CREATE POLICY "tenant_isolation_units" ON units
  FOR ALL USING (mall_id IN (
    SELECT id FROM malls WHERE tenant_id = current_user_tenant_id()
  ));

-- Policy: mall_tenants scoped via mall -> tenant
CREATE POLICY "tenant_isolation_mall_tenants" ON mall_tenants
  FOR ALL USING (mall_id IN (
    SELECT id FROM malls WHERE tenant_id = current_user_tenant_id()
  ));

-- Policy: leases scoped via mall -> tenant
CREATE POLICY "tenant_isolation_leases" ON leases
  FOR ALL USING (mall_id IN (
    SELECT id FROM malls WHERE tenant_id = current_user_tenant_id()
  ));

-- Policy: work_orders scoped via tenant
CREATE POLICY "tenant_isolation_work_orders" ON work_orders
  FOR ALL USING (tenant_id = current_user_tenant_id());

-- Policy: documents scoped via tenant
CREATE POLICY "tenant_isolation_documents" ON documents
  FOR ALL USING (tenant_id = current_user_tenant_id());

-- Policy: doc_chunks scoped via mall -> tenant
CREATE POLICY "tenant_isolation_doc_chunks" ON doc_chunks
  FOR ALL USING (mall_id IN (
    SELECT id FROM malls WHERE tenant_id = current_user_tenant_id()
  ));

-- Policy: footfall_logs scoped via mall -> tenant
CREATE POLICY "tenant_isolation_footfall" ON footfall_logs
  FOR ALL USING (mall_id IN (
    SELECT id FROM malls WHERE tenant_id = current_user_tenant_id()
  ));

-- Policy: pos_logs scoped via mall -> tenant
CREATE POLICY "tenant_isolation_pos" ON pos_logs
  FOR ALL USING (mall_id IN (
    SELECT id FROM malls WHERE tenant_id = current_user_tenant_id()
  ));

-- Policy: chat scoped via tenant
CREATE POLICY "tenant_isolation_chat_sessions" ON chat_sessions
  FOR ALL USING (tenant_id = current_user_tenant_id());

CREATE POLICY "tenant_isolation_chat_messages" ON chat_messages
  FOR ALL USING (session_id IN (
    SELECT id FROM chat_sessions WHERE tenant_id = current_user_tenant_id()
  ));
