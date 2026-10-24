// ─────────────────────────────────────────────
// database/schema.js
// แต่ละ statement แยกใน array เพื่อส่ง runAsync ทีละตัว
// (execAsync หลาย statement พร้อมกัน → NullPointerException บน Android)
// ─────────────────────────────────────────────

export const CREATE_TABLES_SQL = [

  // 1. ผู้ใช้งาน
  `CREATE TABLE IF NOT EXISTS users (
    user_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name       TEXT NOT NULL,
    last_name        TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    password         TEXT NOT NULL,
    birthdate        TEXT,
    occupation       TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
    pdpa_accepted_at TEXT,
    role             TEXT NOT NULL DEFAULT 'user'
  )`,

  // 2. หมวดหมู่
  `CREATE TABLE IF NOT EXISTS categories (
    category_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT    NOT NULL,
    category_type TEXT    NOT NULL CHECK(category_type IN ('income', 'expense')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    is_active     INTEGER NOT NULL DEFAULT 1
  )`,

  // ID Partitioning: กันช่อง 1–999 ไว้สำหรับ System Categories จาก Server
  // User-created categories จะเริ่มที่ 1000 ขึ้นไปโดยอัตโนมัติ
  `INSERT OR IGNORE INTO sqlite_sequence (name, seq) VALUES ('categories', 999)`,

  // 3. ลำดับขั้นความต้องการมาสโลว์
  `CREATE TABLE IF NOT EXISTS maslow_levels (
    maslow_id   INTEGER PRIMARY KEY,
    name_th     TEXT NOT NULL,
    name_en     TEXT NOT NULL,
    description TEXT
  )`,

  // 4. การบันทึกรายรับ/รายจ่าย
  `CREATE TABLE IF NOT EXISTS transactions (
    transaction_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(user_id),
    category_id      INTEGER NOT NULL REFERENCES categories(category_id),
    maslow_id        INTEGER          REFERENCES maslow_levels(maslow_id),
    transaction_date TEXT    NOT NULL,
    amount           REAL    NOT NULL,
    input_method     TEXT    NOT NULL DEFAULT 'manual',
    transaction_name TEXT,
    is_synced        INTEGER NOT NULL DEFAULT 0,
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    slip_ref         TEXT,
    slip_date        TEXT,
    image_uri        TEXT,
    status           TEXT    NOT NULL DEFAULT 'confirmed'
  )`,

  // 5. งบประมาณ (composite PK)
  `CREATE TABLE IF NOT EXISTS budgets (
    user_id      INTEGER NOT NULL REFERENCES users(user_id),
    category_id  INTEGER NOT NULL REFERENCES categories(category_id),
    month        INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    year         INTEGER NOT NULL,
    amount_limit REAL    NOT NULL,
    PRIMARY KEY (user_id, category_id, month, year)
  )`,

];
