-- ============================================================
-- PRIME WATCHES — Supabase Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── 1. ADMINS ──────────────────────────────────────────────
CREATE TABLE admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,          -- bcrypt hash
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin',  -- 'admin' | 'superadmin'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. PRODUCTS ────────────────────────────────────────────
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  purchase_price NUMERIC(10,2) NOT NULL,   -- prix d'achat
  selling_price  NUMERIC(10,2) NOT NULL,   -- prix de vente
  stock          INTEGER NOT NULL DEFAULT 0,
  image_url      TEXT,
  category       TEXT DEFAULT 'watch',
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. DELIVERY PRICES ─────────────────────────────────────
-- One row per wilaya (48 wilayas + expanded 69)
CREATE TABLE delivery_prices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya_code  INTEGER UNIQUE NOT NULL,
  wilaya_name  TEXT NOT NULL,
  home_price   NUMERIC(10,2) NOT NULL DEFAULT 400,
  office_price NUMERIC(10,2) NOT NULL DEFAULT 300,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. GLOBAL SETTINGS ─────────────────────────────────────
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('packaging_cost', '200'),
  ('whatsapp_number', '213XXXXXXXXX'),
  ('store_name', 'Prime Watches');

-- ── 5. ORDERS ──────────────────────────────────────────────
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Customer info
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  wilaya_code      INTEGER NOT NULL,
  wilaya_name      TEXT NOT NULL,
  delivery_type    TEXT NOT NULL CHECK (delivery_type IN ('home','office')),
  -- Product snapshot (store at order time in case product changes)
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name     TEXT NOT NULL,
  product_image    TEXT,
  quantity         INTEGER NOT NULL DEFAULT 1,
  -- Financials
  selling_price    NUMERIC(10,2) NOT NULL,   -- unit price at order time
  purchase_price   NUMERIC(10,2) NOT NULL,   -- unit cost at order time
  delivery_cost    NUMERIC(10,2) NOT NULL,
  packaging_cost   NUMERIC(10,2) NOT NULL DEFAULT 200,
  total_price      NUMERIC(10,2) NOT NULL,   -- selling_price*qty + delivery_cost
  profit           NUMERIC(10,2) NOT NULL,   -- sellingPrice - (purchasePrice + packagingCost + deliveryCost)
  -- Status
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. EXPENSES ────────────────────────────────────────────
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('packaging','fuel','other')),
  amount      NUMERIC(10,2) NOT NULL,
  description TEXT,
  admin_id    UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_name  TEXT,  -- snapshot
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. STORAGE BUCKET ──────────────────────────────────────
-- Run this in Supabase Storage section or via API:
-- Create a public bucket named "product-images"

-- ── 8. ROW LEVEL SECURITY ──────────────────────────────────
-- Products: public read, service-role write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Service role all products" ON products USING (auth.role() = 'service_role');

-- Orders: service-role only (we use service role key on server)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role all orders" ON orders USING (auth.role() = 'service_role');
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);

-- Delivery prices: public read
ALTER TABLE delivery_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read delivery" ON delivery_prices FOR SELECT USING (true);
CREATE POLICY "Service role all delivery" ON delivery_prices USING (auth.role() = 'service_role');

-- Settings: public read
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Service role all settings" ON settings USING (auth.role() = 'service_role');

-- Admins: service-role only
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role all admins" ON admins USING (auth.role() = 'service_role');

-- Expenses: service-role only
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role all expenses" ON expenses USING (auth.role() = 'service_role');

-- ── 9. UPDATED_AT TRIGGERS ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_delivery_updated BEFORE UPDATE ON delivery_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 10. SEED: 69 WILAYAS ───────────────────────────────────
INSERT INTO delivery_prices (wilaya_code, wilaya_name, home_price, office_price) VALUES
(1,'Adrar',600,500),(2,'Chlef',400,300),(3,'Laghouat',500,400),
(4,'Oum El Bouaghi',450,350),(5,'Batna',450,350),(6,'Béjaïa',450,350),
(7,'Biskra',500,400),(8,'Béchar',600,500),(9,'Blida',400,300),
(10,'Bouira',400,300),(11,'Tamanrasset',700,600),(12,'Tébessa',500,400),
(13,'Tlemcen',500,400),(14,'Tiaret',450,350),(15,'Tizi Ouzou',400,300),
(16,'Alger',350,250),(17,'Djelfa',450,350),(18,'Jijel',450,350),
(19,'Sétif',400,300),(20,'Saïda',500,400),(21,'Skikda',450,350),
(22,'Sidi Bel Abbès',500,400),(23,'Annaba',450,350),(24,'Guelma',450,350),
(25,'Constantine',400,300),(26,'Médéa',400,300),(27,'Mostaganem',450,350),
(28,'M''Sila',450,350),(29,'Mascara',500,400),(30,'Ouargla',550,450),
(31,'Oran',400,300),(32,'El Bayadh',550,450),(33,'Illizi',700,600),
(34,'Bordj Bou Arréridj',400,300),(35,'Boumerdès',350,250),(36,'El Tarf',450,350),
(37,'Tindouf',700,600),(38,'Tissemsilt',450,350),(39,'El Oued',550,450),
(40,'Khenchela',500,400),(41,'Souk Ahras',500,400),(42,'Tipaza',350,250),
(43,'Mila',450,350),(44,'Aïn Defla',400,300),(45,'Naâma',600,500),
(46,'Aïn Témouchent',500,400),(47,'Ghardaïa',550,450),(48,'Relizane',450,350),
(49,'Timimoun',650,550),(50,'Bordj Badji Mokhtar',750,650),
(51,'Ouled Djellal',550,450),(52,'Béni Abbès',650,550),
(53,'In Salah',700,600),(54,'In Guezzam',750,650),
(55,'Touggourt',550,450),(56,'Djanet',750,650),
(57,'El M''Ghair',550,450),(58,'El Meniaa',650,550),
(59,'Ouled Djellal',550,450),(60,'Bordj Badji Mokhtar',750,650),
(61,'Adrar',600,500),(62,'Timimoun',650,550),(63,'Béni Abbès',650,550),
(64,'In Salah',700,600),(65,'In Guezzam',750,650),
(66,'Touggourt',550,450),(67,'Djanet',750,650),
(68,'El M''Ghair',550,450),(69,'El Meniaa',650,550)
ON CONFLICT (wilaya_code) DO NOTHING;

-- ── 11. SEED: ADMIN ACCOUNTS ───────────────────────────────
-- Passwords are bcrypt hashed. Default passwords:
--   admin1@primewatches.dz  → Admin@1234
--   admin2@primewatches.dz  → Admin@5678
-- CHANGE THESE IN PRODUCTION!
INSERT INTO admins (email, password, name, role) VALUES
(
  'admin1@primewatches.dz',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBJnzQLOHBi0kS',  -- Admin@1234
  'Admin One',
  'superadmin'
),
(
  'admin2@primewatches.dz',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC__/NJQG5mUjF4RiAry',  -- Admin@5678 (note: use bcrypt to hash your own)
  'Admin Two',
  'admin'
);
