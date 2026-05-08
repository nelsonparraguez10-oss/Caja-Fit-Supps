-- Sistema de Caja — esquema SQLite (referencia / migración futura)

CREATE TABLE IF NOT EXISTS products (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode   TEXT    UNIQUE NOT NULL,
  name      TEXT    NOT NULL,
  price     REAL    NOT NULL,  -- precio con IVA (19 %)
  cost      REAL    NOT NULL,  -- costo de adquisición
  stock     INTEGER DEFAULT 0,
  category  TEXT    DEFAULT 'General',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id             TEXT PRIMARY KEY,          -- UUID
  date           DATETIME NOT NULL,
  total          REAL     NOT NULL,
  payment_method TEXT     NOT NULL,         -- cash | transfer | card
  card_commission REAL    DEFAULT 0,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id          TEXT  NOT NULL,
  product_barcode  TEXT  NOT NULL,
  product_name     TEXT  NOT NULL,
  price            REAL  NOT NULL,
  cost             REAL  NOT NULL,
  quantity         INTEGER NOT NULL,
  subtotal         REAL  NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,             -- UUID
  date        DATE NOT NULL,
  description TEXT NOT NULL,
  amount      REAL NOT NULL,
  type        TEXT NOT NULL,                -- fixed | variable
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
