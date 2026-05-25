-- Sistema de Caja — esquema Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase

-- ─── Tablas ────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id          TEXT        PRIMARY KEY,
  store_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode     TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  variante    TEXT,
  marca       TEXT,
  proveedor   TEXT,
  category    TEXT,
  price       NUMERIC     NOT NULL DEFAULT 0,
  cost        NUMERIC     NOT NULL DEFAULT 0,
  stock       INTEGER     NOT NULL DEFAULT 0,
  margen_pct  NUMERIC,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, barcode)
);

CREATE TABLE sales (
  id               TEXT        PRIMARY KEY,
  store_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             TIMESTAMPTZ NOT NULL,
  channel          TEXT        NOT NULL DEFAULT 'POS',
  items            JSONB       NOT NULL DEFAULT '[]',
  list_total       NUMERIC     NOT NULL DEFAULT 0,
  discount         NUMERIC              DEFAULT 0,
  discount_amount  NUMERIC              DEFAULT 0,
  effective_total  NUMERIC     NOT NULL DEFAULT 0,
  payment_method   TEXT,
  card_commission  NUMERIC              DEFAULT 0,
  card_brand       TEXT,
  shipping         JSONB                DEFAULT '{"cobro":0,"costo":0,"margin":0}',
  status           TEXT        NOT NULL DEFAULT 'COMPLETED',
  voided_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expenses (
  id              TEXT        PRIMARY KEY,
  store_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  description     TEXT        NOT NULL,
  amount          NUMERIC     NOT NULL DEFAULT 0,
  subtype         TEXT                 DEFAULT 'General',
  doc_type        TEXT                 DEFAULT 'boleta',
  type            TEXT                 DEFAULT 'variable',
  iva_credito     NUMERIC              DEFAULT 0,
  template_id     TEXT,
  auto_generated  BOOLEAN              DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expense_templates (
  id                  TEXT        PRIMARY KEY,
  store_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description         TEXT        NOT NULL,
  amount              NUMERIC     NOT NULL DEFAULT 0,
  doc_type            TEXT                 DEFAULT 'boleta',
  is_template         BOOLEAN              DEFAULT TRUE,
  active              BOOLEAN              DEFAULT TRUE,
  last_imputed_month  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clients (
  id            TEXT        PRIMARY KEY,
  store_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razon_social  TEXT        NOT NULL,
  rut           TEXT,
  giro          TEXT,
  direccion     TEXT,
  comuna        TEXT,
  contacto      TEXT,
  telefono      TEXT,
  mail          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sales_notes (
  id             TEXT        PRIMARY KEY,
  store_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folio          INTEGER,
  date           DATE,
  cliente        JSONB,
  items          JSONB       NOT NULL DEFAULT '[]',
  total          NUMERIC              DEFAULT 0,
  neto           NUMERIC              DEFAULT 0,
  iva            NUMERIC              DEFAULT 0,
  estado         TEXT                 DEFAULT 'pendiente',
  oc             JSONB,
  observaciones  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
  id              TEXT        PRIMARY KEY,
  store_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_documento  TEXT        NOT NULL,
  folio           INTEGER,
  fecha_emision   DATE,
  emisor          JSONB,
  receptor        JSONB,
  items           JSONB       NOT NULL DEFAULT '[]',
  neto            NUMERIC              DEFAULT 0,
  iva             NUMERIC              DEFAULT 0,
  total           NUMERIC              DEFAULT 0,
  forma_pago      TEXT,
  estado          TEXT                 DEFAULT 'emitida',
  anulada_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE store_settings (
  store_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings    JSONB       NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Índices ───────────────────────────────────────────────────────────────
-- products ya tiene índice implícito por UNIQUE (store_id, barcode)

CREATE INDEX ON sales             (store_id, date DESC);
CREATE INDEX ON expenses          (store_id, date DESC);
CREATE INDEX ON expense_templates (store_id);
CREATE INDEX ON clients           (store_id);
CREATE INDEX ON sales_notes       (store_id, created_at DESC);
CREATE INDEX ON documents         (store_id, created_at DESC);

-- ─── Row Level Security ────────────────────────────────────────────────────

ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales             ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_store" ON products          FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
CREATE POLICY "own_store" ON sales             FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
CREATE POLICY "own_store" ON expenses          FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
CREATE POLICY "own_store" ON expense_templates FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
CREATE POLICY "own_store" ON clients           FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
CREATE POLICY "own_store" ON sales_notes       FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
CREATE POLICY "own_store" ON documents         FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());
CREATE POLICY "own_store" ON store_settings    FOR ALL USING (store_id = auth.uid()) WITH CHECK (store_id = auth.uid());

-- ─── Funciones RPC para stock atómico ─────────────────────────────────────

CREATE OR REPLACE FUNCTION decrement_stock(p_store_id UUID, p_barcode TEXT, p_qty INTEGER)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
  UPDATE products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE store_id = p_store_id AND barcode = p_barcode;
$$;

CREATE OR REPLACE FUNCTION increment_stock(p_store_id UUID, p_barcode TEXT, p_qty INTEGER)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
  UPDATE products
  SET stock = stock + p_qty
  WHERE store_id = p_store_id AND barcode = p_barcode;
$$;
