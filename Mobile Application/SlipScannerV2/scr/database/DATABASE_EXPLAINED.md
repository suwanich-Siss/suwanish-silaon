# 📚 คำอธิบายโค้ด: ระบบฐานข้อมูล (Database Layer)

> เหมาะสำหรับผู้เริ่มต้นเขียนโค้ด — อธิบายทุกส่วนอย่างละเอียด

---

## 📁 โครงสร้างไฟล์

```
scr/database/
├── schema.js       → กำหนดโครงสร้างตาราง (สร้าง Table)
├── seeds.js        → ข้อมูลเริ่มต้น (ข้อมูลตั้งต้นในแอป)
├── database.js     → ฟังก์ชัน CRUD ทั้งหมด (บันทึก/อ่าน/แก้ไข/ลบ)
└── syncService.js  → ส่งข้อมูลขึ้น Server และดึงข้อมูลกลับมา
```

---

## 1️⃣ schema.js — โครงสร้างตาราง

### 📌 ไฟล์นี้ทำอะไร?
กำหนด "แบบแปลน" ของฐานข้อมูล เหมือนการออกแบบตารางใน Excel ก่อนจะใส่ข้อมูล

```js
export const CREATE_TABLES_SQL = [ ... ]
```
- `export` = ส่งออกตัวแปรนี้ให้ไฟล์อื่นนำไปใช้ได้
- `const` = ตัวแปรที่ค่าไม่เปลี่ยนแปลง
- `CREATE_TABLES_SQL` = array ของคำสั่ง SQL แต่ละตัวสร้างตารางหนึ่งตาราง

---

### 🗂️ ตารางที่ 1: `users` — ผู้ใช้งาน

```sql
CREATE TABLE IF NOT EXISTS users (
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
)
```

| คำสั่ง | ความหมาย |
|--------|----------|
| `CREATE TABLE IF NOT EXISTS` | สร้างตารางถ้ายังไม่มี (ถ้ามีอยู่แล้วไม่ทำอะไร) |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | ตัวเลข ID ที่เพิ่มขึ้นอัตโนมัติ (1, 2, 3, ...) |
| `TEXT NOT NULL` | ข้อความที่ต้องมีค่า ห้ามว่าง |
| `UNIQUE` | ห้ามซ้ำกัน (อีเมลต้องไม่ซ้ำกับใคร) |
| `DEFAULT (datetime('now'))` | ถ้าไม่ระบุ จะใส่เวลาปัจจุบันอัตโนมัติ |
| `pdpa_accepted_at` | วันที่ยอมรับนโยบายความเป็นส่วนตัว (PDPA) |

---

### 🗂️ ตารางที่ 2: `categories` — หมวดหมู่

```sql
CREATE TABLE IF NOT EXISTS categories (
  category_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT    NOT NULL,
  category_type TEXT    NOT NULL CHECK(category_type IN ('income', 'expense')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  is_active     INTEGER NOT NULL DEFAULT 1
)
```

| คำสั่ง | ความหมาย |
|--------|----------|
| `CHECK(category_type IN ('income', 'expense'))` | บังคับให้ใส่ได้แค่ 'income' หรือ 'expense' เท่านั้น |
| `is_active INTEGER DEFAULT 1` | 1 = ใช้งานอยู่, 0 = ซ่อน (soft delete) |

```sql
INSERT OR IGNORE INTO sqlite_sequence (name, seq) VALUES ('categories', 999)
```
- ทำให้ ID ถัดไปที่สร้างใหม่เริ่มจาก **1000** ขึ้นไป
- ID 1–999 สงวนไว้สำหรับหมวดหมู่จากระบบ (Server)
- ID 1000+ คือหมวดหมู่ที่ผู้ใช้สร้างเอง

---

### 🗂️ ตารางที่ 3: `maslow_levels` — ทฤษฎีมาสโลว์

```sql
CREATE TABLE IF NOT EXISTS maslow_levels (
  maslow_id   INTEGER PRIMARY KEY,
  name_th     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  description TEXT
)
```

ใช้จัดกลุ่มรายจ่ายตามลำดับความต้องการ 5 ขั้นของมาสโลว์  
(ปัจจัย 4 → ความปลอดภัย → สังคม → ความภาคภูมิใจ → พัฒนาตนเอง)

---

### 🗂️ ตารางที่ 4: `transactions` — รายการธุรกรรม

```sql
CREATE TABLE IF NOT EXISTS transactions (
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
)
```

| คอลัมน์ | ความหมาย |
|---------|----------|
| `REFERENCES users(user_id)` | Foreign Key — ต้องมี user_id นั้นอยู่ในตาราง users จริงๆ |
| `REAL` | ตัวเลขทศนิยม (เงิน) |
| `input_method` | วิธีกรอก: 'manual' = พิมพ์เอง, 'ocr' = สแกนสลิป |
| `is_synced` | 0 = ยังไม่ได้ sync ขึ้น Server, 1 = sync แล้ว |
| `slip_ref` | เลขอ้างอิงของสลิป |
| `image_uri` | ที่อยู่ไฟล์รูปภาพสลิป |
| `status` | สถานะ: 'confirmed' = ยืนยันแล้ว |

---

### 🗂️ ตารางที่ 5: `budgets` — งบประมาณ

```sql
CREATE TABLE IF NOT EXISTS budgets (
  user_id      INTEGER NOT NULL REFERENCES users(user_id),
  category_id  INTEGER NOT NULL REFERENCES categories(category_id),
  month        INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  year         INTEGER NOT NULL,
  amount_limit REAL    NOT NULL,
  PRIMARY KEY (user_id, category_id, month, year)
)
```

| คำสั่ง | ความหมาย |
|--------|----------|
| `CHECK(month BETWEEN 1 AND 12)` | เดือนต้องอยู่ระหว่าง 1–12 เท่านั้น |
| `PRIMARY KEY (user_id, category_id, month, year)` | Composite PK — ผู้ใช้คนเดียวกัน หมวดหมู่เดียวกัน เดือน+ปีเดียวกัน มีแถวเดียวเท่านั้น |

---

## 2️⃣ seeds.js — ข้อมูลเริ่มต้น

### 📌 ไฟล์นี้ทำอะไร?
ใส่ข้อมูลตั้งต้นที่แอปต้องการตั้งแต่เปิดใช้งานครั้งแรก เหมือนการเตรียมเมนูอาหารก่อนเปิดร้าน

```js
export const SEED_CATEGORIES_SQL = `
  INSERT OR IGNORE INTO categories
    (category_id, category_name, category_type, is_active)
  VALUES
    (1,   'อาหาร',       'expense', 1),
    ...
`;
```

- `INSERT OR IGNORE` = ใส่ข้อมูล ถ้ามีอยู่แล้ว (ID ซ้ำ) ให้ข้ามไป ไม่ error
- ทำให้รันซ้ำได้ปลอดภัย ข้อมูลไม่ซ้ำซ้อน

### หมวดหมู่รายจ่าย (ID 1–7)
| ID | ชื่อ |
|----|------|
| 1 | อาหาร |
| 2 | เดินทาง |
| 3 | ช้อปปิ้ง |
| 4 | บิล/น้ำไฟ |
| 5 | สุขภาพ |
| 6 | บันเทิง |
| 7 | อื่นๆ |

### หมวดหมู่รายรับ (ID 101–106)
| ID | ชื่อ |
|----|------|
| 101 | เงินเดือน |
| 102 | โบนัส |
| 103 | ขายของ |
| 104 | ลงทุน |
| 105 | ฟรีแลนซ์ |
| 106 | รายรับอื่นๆ |

### ระดับมาสโลว์ (ID 1–5)
| ID | ชื่อไทย | ความหมาย |
|----|---------|----------|
| 1 | ปัจจัย 4 | อาหาร น้ำ เสื้อผ้า ที่พัก |
| 2 | ความปลอดภัย | เงินเก็บ ประกัน |
| 3 | สังคม | มิตรภาพ ครอบครัว |
| 4 | ความภาคภูมิใจ | รางวัลให้ตัวเอง |
| 5 | พัฒนาตนเอง | การเรียนรู้ |

---

## 3️⃣ database.js — ฟังก์ชันทั้งหมด

### 📌 ไฟล์นี้ทำอะไร?
เป็น "ประตูกลาง" ทั้งหมดที่ติดต่อกับฐานข้อมูล ทุกหน้าจอในแอปจะเรียกฟังก์ชันจากไฟล์นี้

---

### 🔌 ระบบเปิดฐานข้อมูล (Singleton Pattern)

```js
let dbInstance    = null;   // เก็บ instance ของ DB ที่เปิดอยู่
let dbInitPromise = null;   // เก็บ Promise ที่กำลัง init อยู่
```

**Singleton** คือการมีออบเจกต์ได้แค่ 1 ตัวเท่านั้น ป้องกันการเปิด DB ซ้ำ

```js
export const getDB = async () => {
```
- `async` = ฟังก์ชันที่ทำงานแบบรอได้ (asynchronous)
- ทุกครั้งที่ต้องการใช้ DB จะเรียกฟังก์ชันนี้

**ลำดับการทำงาน:**

```
เรียก getDB()
    │
    ├─ กำลัง init อยู่? → รอ Promise เดิม (ไม่สร้างใหม่)
    │
    ├─ มี instance อยู่แล้ว? → ทดสอบ ping → ใช้ได้? → คืนค่า
    │                                              ↓ ไม่ได้
    │                                         ล้าง instance
    │
    └─ สร้างใหม่: เปิด DB → WAL mode → สร้าง Table → Seed ข้อมูล
```

```js
await db.execAsync("PRAGMA journal_mode=WAL;");
```
- WAL (Write-Ahead Logging) = โหมดเขียนไฟล์ที่เร็วกว่าและปลอดภัยกว่า
- ช่วยให้อ่านและเขียนพร้อมกันได้โดยไม่ติดขัด (ลด lock บน Android)

---

### 🛡️ withDB — ตัวกลางป้องกัน Error

```js
const withDB = async (fn) => {
  try {
    const db = await getDB();
    return await fn(db);          // รันฟังก์ชันที่ส่งมา
  } catch (error) {
    const msg = error.message ?? "";
    const isConnErr = msg.includes("NullPointerException") || ...

    if (isConnErr) {
      // เปิด DB ใหม่แล้วลองอีกครั้ง
      dbInstance    = null;
      dbInitPromise = null;
      const freshDb = await getDB();
      return await fn(freshDb);
    }
    throw error;                  // ถ้าไม่ใช่ error แบบนี้ โยนต่อไป
  }
};
```

- รับฟังก์ชัน `fn` เป็น argument (Higher-Order Function)
- ถ้า error เป็นปัญหาการเชื่อมต่อ → เปิด DB ใหม่แล้วลองซ้ำ 1 ครั้ง
- ป้องกัน app crash เมื่อ DB มีปัญหาชั่วคราว

---

### 📅 monthRange — คำนวณช่วงวันของเดือน

```js
const monthRange = (month, year) => {
  const mm      = String(month).padStart(2, "0");  // 1 → "01"
  const lastDay = new Date(year, month, 0).getDate(); // หาวันสุดท้ายของเดือน
  return {
    start: `${year}-${mm}-01`,
    end:   `${year}-${mm}-${String(lastDay).padStart(2, "0")}T23:59:59`,
  };
};
```

- `padStart(2, "0")` = เติม 0 ข้างหน้าให้ครบ 2 หลัก เช่น "1" → "01"
- `new Date(year, month, 0)` = วันที่ 0 ของเดือนถัดไป = วันสุดท้ายของเดือนนี้
- ตัวอย่าง: month=2, year=2025 → start="2025-02-01", end="2025-02-28T23:59:59"

---

### 👤 ฟังก์ชันจัดการ Users

#### `createUser` — สร้างผู้ใช้ใหม่

```js
export const createUser = async ({
  firstName, lastName, email, password,
  birthdate = null, occupation = null, role = "user",
}) => {
  const now = new Date().toISOString();       // เวลาปัจจุบัน
  const hashed = await hashPassword(password); // เข้ารหัส password
  const cleanEmail = email.toLowerCase().trim(); // ทำให้ email เป็น lowercase

  return await withDB((db) =>
    db.runAsync(`INSERT INTO users ...`, [...])
  );
};
```

- Destructuring parameter: `{ firstName, lastName, ... }` = แกะ object ที่รับมา
- `= null` / `= "user"` = ค่า default ถ้าไม่ส่งมา

#### `getUserByEmail` — ค้นหาผู้ใช้จากอีเมล

```js
export const getUserByEmail = async (email) => {
  return await withDB((db) =>
    db.getFirstAsync(`SELECT * FROM users WHERE email = ?`, [email])
  );
};
```

- `?` ใน SQL = Parameterized Query ป้องกัน SQL Injection
- `getFirstAsync` = ดึงแถวแรกที่เจอ (ถ้าไม่เจอคืน null)

#### `updateUser` — แก้ไขข้อมูลผู้ใช้

```js
export const updateUser = async (userId, fields) => {
  const allowed = ["first_name","last_name","email","birthdate","occupation","pdpa_accepted_at"];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  // ...
  const setClause = entries.map(([k]) => `${k} = ?`).join(", ");
};
```

- Whitelist ป้องกันการแก้ไขคอลัมน์อันตราย (เช่น password, role)
- `Object.entries(fields)` = แปลง object เป็น array ของ [key, value]
- Dynamic SQL: สร้าง `SET first_name = ?, last_name = ?` จาก fields ที่ส่งมา

---

### 🔐 Auth Helpers — ระบบยืนยันตัวตน

#### `hashPassword` — เข้ารหัสรหัสผ่าน

```js
export const hashPassword = async (plainText) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256, plainText
  );
};
```

- SHA-256 = อัลกอริทึมเข้ารหัสทางเดียว (one-way hash)
- ไม่มีใครถอดรหัสกลับได้ แม้แต่ developer
- เก็บ hash ใน DB ไม่เก็บรหัสผ่านจริง

#### `loginUser` — เข้าสู่ระบบ

```js
export const loginUser = async (email, password) => {
  const user = await getUserByEmail(email.toLowerCase().trim());
  if (!user) return null;          // ไม่พบ email → return null

  const hashed = await hashPassword(password);
  if (user.password !== hashed) return null;  // password ไม่ตรง → return null

  return user;                     // สำเร็จ → คืน user object
};
```

- เปรียบเทียบ hash ของรหัสผ่านที่กรอก กับ hash ที่เก็บใน DB
- ไม่เปรียบเทียบ plain text กับ plain text (ปลอดภัยกว่า)

---

### 🏷️ ฟังก์ชันจัดการ Categories

#### `getCategories` — ดึงหมวดหมู่

```js
export const getCategories = async (type = null) => {
  const sql = type
    ? `SELECT * FROM categories WHERE is_active = 1 AND category_type = ? ORDER BY category_id`
    : `SELECT * FROM categories WHERE is_active = 1 ORDER BY category_type, category_id`;
  const params = type ? [type] : [];
  return await withDB((db) => db.getAllAsync(sql, params));
};
```

- Ternary operator: `condition ? valueIfTrue : valueIfFalse`
- ถ้าส่ง type มา → กรองตาม type
- ถ้าไม่ส่ง → ดึงทั้งหมดที่ is_active = 1

#### `safeDeleteCategory` — ลบหมวดหมู่อย่างปลอดภัย

```js
export const safeDeleteCategory = async (categoryId) => {
  return await withDB(async (db) => {
    const row = await db.getFirstAsync(
      `SELECT COUNT(*) AS cnt FROM transactions WHERE category_id = ?`,
      [categoryId]
    );
    if (row?.cnt > 0) return { success: false, reason: 'referenced' };
    await deactivateCategory(categoryId);
    return { success: true };
  });
};
```

- ตรวจก่อนว่ามี transaction ใช้ category นี้อยู่ไหม
- ถ้ามี → ลบไม่ได้ คืน `{ success: false, reason: 'referenced' }`
- ถ้าไม่มี → soft delete (is_active = 0) คืน `{ success: true }`
- `row?.cnt` = Optional Chaining ป้องกัน error ถ้า row เป็น null

---

### 💸 ฟังก์ชันจัดการ Transactions

#### `addTransaction` — เพิ่มรายการ

```js
export const addTransaction = async ({
  userId, categoryId, maslowId = null,
  transactionDate, amount,
  inputMethod = "manual", transactionName = null,
  slipRef = null, slipDate = null, imageUri = null,
  status = "confirmed",
}) => {
  const syncId = Crypto.randomUUID();   // สร้าง ID สุ่มสำหรับ sync
  const updatedAt = new Date().toISOString();

  await withDB((db) =>
    db.runAsync(`INSERT INTO transactions ...`, [...])
  );
  return syncId;  // คืน syncId กลับไป
};
```

- `Crypto.randomUUID()` = สร้าง ID ที่ไม่ซ้ำกันทั่วโลก เช่น "a3f2-b4c1-..."
- ใช้สำหรับจับคู่กับ Server ตอน sync

#### `getTransactionsByMonth` — ดึงรายการตามเดือน

```js
export const getTransactionsByMonth = async (month, year, userId) => {
  const { start, end } = monthRange(month, year);  // แกะ object
  return await withDB((db) =>
    db.getAllAsync(
      `SELECT t.*, c.category_name, c.category_type,
              m.name_th AS maslow_name_th, ...
       FROM transactions t
       LEFT JOIN categories    c ON t.category_id = c.category_id
       LEFT JOIN maslow_levels m ON t.maslow_id   = m.maslow_id
       WHERE t.user_id = ? AND t.transaction_date BETWEEN ? AND ?
       ORDER BY t.transaction_date DESC`,
      [userId, start, end]
    )
  );
};
```

- `LEFT JOIN` = เชื่อมตาราง ถ้าไม่มีข้อมูลฝั่งขวา ก็ยังได้แถวนั้นมา (แค่ค่าเป็น null)
- `t.*` = ดึงทุกคอลัมน์จากตาราง transactions (alias ชื่อ t)
- `AS maslow_name_th` = เปลี่ยนชื่อคอลัมน์ใน result

---

### 📊 ฟังก์ชัน Analytics

#### `getMonthlyStats` — สรุปรายรับ-รายจ่ายต่อเดือน

```js
export const getMonthlyStats = async (month, year, userId) => {
  // ...
  let income = 0, expense = 0;
  for (const row of rows) {
    if (row.type === "income")  income  = row.total;
    if (row.type === "expense") expense = row.total;
  }
  return {
    income,
    expense,
    savings:       income - expense,
    savingsRate:   income > 0 ? ((income - expense) / income) * 100 : 0,
    burnRateDaily: daysInMonth > 0 ? expense / daysInMonth : 0,
  };
};
```

- `savings` = เงินออม (รายรับ - รายจ่าย)
- `savingsRate` = อัตราการออม เป็น %
- `burnRateDaily` = รายจ่ายเฉลี่ยต่อวัน
- ป้องกัน divide by zero ด้วย `income > 0 ? ... : 0`

#### `getMaslowStats` — สรุปรายจ่ายตามระดับมาสโลว์

```js
export const getMaslowStats = async (month, year, userId) => {
  return await withDB((db) =>
    db.getAllAsync(
      `SELECT t.maslow_id, m.name_th, m.name_en, SUM(t.amount) AS total
       FROM transactions t
       JOIN categories    c ON t.category_id = c.category_id
       LEFT JOIN maslow_levels m ON t.maslow_id = m.maslow_id
       WHERE t.user_id = ? AND c.category_type = 'expense'
         AND t.maslow_id IS NOT NULL AND t.transaction_date BETWEEN ? AND ?
       GROUP BY t.maslow_id
       ORDER BY t.maslow_id ASC`,
      [userId, start, end]
    )
  );
};
```

- `GROUP BY t.maslow_id` = รวมกลุ่มตาม maslow level แล้ว SUM amount
- `IS NOT NULL` = กรองเฉพาะรายการที่ระบุ maslow level ไว้

---

### 💰 ฟังก์ชันจัดการ Budget

#### `getBudgetStuatus` — เช็คงบประมาณ *(หมายเหตุ: typo ใน code จริง)*

```js
export const getBudgetStuatus = async (userId, categoryId, month, year) => {
  return await withDB(async (db) => {
    // Query 1: ดึง budget limit
    const budget = await db.getFirstAsync(
      `SELECT amount_limit FROM budgets WHERE ...`, [...]
    );
    if (!budget) return null;  // ยังไม่ตั้งงบ → return null

    // Query 2: รวมยอดที่ใช้ไป
    const spent = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) AS used FROM transactions WHERE ...`, [...]
    );

    return { amount_limit: budget.amount_limit, used: spent?.used ?? 0 };
  });
};
```

- แยกเป็น 2 query แทน 1 query ซับซ้อน เพราะ Android มีปัญหากับ correlated subquery
- `COALESCE(SUM(amount), 0)` = ถ้า SUM เป็น null (ไม่มีรายการ) ให้คืน 0 แทน
- `?? 0` = Nullish Coalescing ถ้าค่าเป็น null/undefined ให้ใช้ 0

#### `copyBudgetsFromLastMonth` — คัดลอกงบจากเดือนก่อน

```js
export const copyBudgetsFromLastMonth = async (month, year, userId) => {
  return await withDB(async (db) => {
    // ตรวจว่าเดือนนี้มีงบอยู่แล้วไหม
    const existing = await db.getFirstAsync(
      `SELECT COUNT(*) AS cnt FROM budgets WHERE user_id = ? AND month = ? AND year = ?`,
      [userId, month, year]
    );
    if (existing?.cnt > 0) return;  // มีแล้ว → ไม่ทำอะไร

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;

    await db.runAsync(
      `INSERT OR IGNORE INTO budgets (user_id, category_id, month, year, amount_limit)
       SELECT user_id, category_id, ?, ?, amount_limit FROM budgets
       WHERE user_id = ? AND month = ? AND year = ?`,
      [month, year, userId, prevMonth, prevYear]
    );
  });
};
```

- ถ้าเดือนมกราคม (month=1) → เดือนก่อนคือ ธันวาคม (month=12) ปีก่อน
- `INSERT ... SELECT` = คัดลอกข้อมูลจาก query ผล เข้าตารางโดยตรง (ไม่ต้องดึงมา JS ก่อน)

---

## 4️⃣ syncService.js — ซิงค์ข้อมูลกับ Server

### 📌 ไฟล์นี้ทำอะไร?
ส่งรายการธุรกรรมที่ยังไม่ได้ sync ขึ้น Server ผ่าน HTTP API และดึงหมวดหมู่จาก Server มาอัปเดต

---

### 🌐 URL Constants

```js
const API_URL = "https://eaten-surfer-zit.ngrok-free.dev/backend-api/sync_transactions.php";
const CATEGORIES_URL = "https://eaten-surfer-zit.ngrok-free.dev/backend-api/get_categories.php";
```

- ใช้ ngrok เพื่อให้มือถือเชื่อมต่อกับ server ที่รันบนคอมพิวเตอร์ได้
- ห้ามใช้ `localhost` บนมือถือ เพราะมือถือจะมองหา server ในตัวมันเอง

---

### 📤 `syncDataToServer` — ส่งข้อมูลขึ้น Server

**ขั้นตอนการทำงาน:**

```
1. ตรวจ userId และ syncToken → ถ้าไม่มี หยุดทำงาน

2. ดึงรายการที่ is_synced = 0 จาก SQLite

3. สร้าง sync_id ให้แต่ละรายการ (UUID หรือ hash)
   └── บันทึก map: { uuid → transaction_id }

4. ส่ง POST request ไปที่ API_URL
   └── body = { sync_token, transactions: [...] }

5. รับ response
   └── ถ้าสำเร็จ: อัปเดต is_synced = 1 ของรายการที่ sync แล้ว
   └── ถ้าล้มเหลว: log error รอรอบหน้า
```

```js
const uuidToLocalId = {};  // map: uuid → transaction_id (ใน SQLite)

const transactionPayload = await Promise.all(unsyncedData.map(async (tx) => {
  let currentUuid = tx.sync_id;

  // Fallback: ถ้าไม่มี sync_id ให้สร้าง UUID จาก hash
  if (!currentUuid) {
    const hash = await Crypto.digestStringAsync(...);
    currentUuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-...`;
  }

  uuidToLocalId[currentUuid] = tx.transaction_id;
  return { sync_id: currentUuid, ... };
}));
```

- `Promise.all(array.map(...))` = รัน async function พร้อมกันทั้งหมด แล้วรอทุกตัวเสร็จ
- `hash.slice(0,8)` = ตัดอักขระที่ index 0 ถึง 7 (8 ตัวแรก)
- UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

```js
if (result.status === "success" && result.synced_ids?.length > 0) {
  const localIdsToMark = result.synced_ids
    .map((uuid) => uuidToLocalId[uuid])  // แปลง uuid → local id
    .filter(Boolean);                    // กรองค่า null/undefined ออก
  await markTransactionsAsSynced(localIdsToMark);
}
```

- Server ตอบกลับมาด้วย uuid ที่ sync สำเร็จ
- แปลงกลับเป็น local id แล้วอัปเดต is_synced = 1 ใน SQLite

---

### 🔄 `checkCategoryUpdates` — ตรวจสอบการอัปเดตหมวดหมู่

```js
export const checkCategoryUpdates = async () => {
  const serverCategories = await fetchCategoriesFromServer();
  if (!serverCategories.length) return { hasUpdate: false, serverCategories: [] };

  const localCategories = await getLocalCategories(
    serverCategories.map((c) => Number(c.category_id))
  );

  // เปรียบเทียบด้วย content hash
  const toHash = (categories) =>
    categories
      .map((c) => `${c.category_id}:${c.category_name}:${c.category_type}:${Number(c.is_active ?? 1)}`)
      .sort()
      .join("|");

  const hasUpdate = toHash(serverCategories) !== toHash(localCategories);
  return { hasUpdate, serverCategories };
};
```

**วิธีเปรียบเทียบ (Content Hash):**
1. แปลงแต่ละ category เป็น string: `"1:อาหาร:expense:1"`
2. Sort ให้ลำดับเดิมเสมอ (ป้องกัน false positive จากลำดับต่างกัน)
3. Join เป็น string เดียวด้วย `|`
4. เปรียบเทียบ string — ถ้าต่างกัน = มีการเปลี่ยนแปลง

ป้องกันกรณี: ลบ 1 อัน แล้วเพิ่ม 1 อัน (จำนวนเท่ากัน แต่เนื้อหาเปลี่ยน)

---

## 🔑 สรุปแนวคิดสำคัญ

| แนวคิด | ตัวอย่างในโค้ด |
|--------|---------------|
| **Singleton** | `dbInstance` มีแค่ตัวเดียวเสมอ |
| **async/await** | รอผลลัพธ์ก่อนทำต่อ ไม่บล็อก UI |
| **Parameterized Query** | `WHERE email = ?` ป้องกัน SQL Injection |
| **Soft Delete** | `is_active = 0` แทนการลบจริง |
| **Foreign Key** | `REFERENCES` เชื่อมตารางและป้องกันข้อมูลเสีย |
| **Composite PK** | `PRIMARY KEY (user_id, category_id, month, year)` |
| **Content Hash** | เปรียบเทียบข้อมูลโดยไม่ต้อง loop ทีละรายการ |
| **Promise.all** | รัน async หลายตัวพร้อมกัน |
| **Nullish Coalescing (??)** | `value ?? defaultValue` |
| **Optional Chaining (?.)** | `row?.cnt` ป้องกัน error ถ้า null |

---

> 📝 **หมายเหตุ:** `getBudgetStuatus` มี typo ในชื่อฟังก์ชัน (Status สะกดผิด) ถ้าจะแก้ไขต้องอัปเดตทุกที่ที่เรียกใช้ด้วย
