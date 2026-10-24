// ─────────────────────────────────────────────
// database/database.js
// Core: เปิด DB · migrations · seed
// + CRUD functions ทั้งหมด
//
// Schema  → database/schema.js
// Seeds   → database/seeds.js
//
// NOTE: month ใน DB = 1–12 (ตรง schema)
//       ถ้าโค้ดอื่นใช้ monthIndex (0–11)
//       ให้บวก +1 ก่อนเรียก function ที่นี่
// ─────────────────────────────────────────────

import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { CREATE_TABLES_SQL } from "./schema";
import { SEED_CATEGORIES_SQL, SEED_MASLOW_SQL } from "./seeds";

const DB_NAME = "slips.db"; // แก้ชื่อ DB ที่นี่

// ── Singleton ─────────────────────────────────────────────────────────────────
let dbInstance    = null;
let dbInitPromise = null;

export const getDB = async () => {
  // (A) ถ้ากำลัง init อยู่ — ทุก caller รอ Promise เดิม ไม่สร้างซ้ำ
  if (dbInitPromise) return dbInitPromise;

  // (B) ถ้ามี instance อยู่แล้ว — ping พร้อมเช็ค table ก่อน คืนถ้าใช้ได้
  if (dbInstance) {
    try {
      // ตรวจทั้ง connection และ schema — ถ้า DB file หายหรือถูกล้างข้อมูล จะ throw ที่นี่
      await dbInstance.execAsync("SELECT 1 FROM categories LIMIT 1");
      return dbInstance;
    }
    catch (_) { dbInstance = null; }
  }

  // (C) สร้าง Promise และเก็บไว้ก่อน await — ป้องกัน race condition
  dbInitPromise = (async () => {
    // เปิด DB ใหม่
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // เปิด WAL mode: ลด lock contention บน Android ได้มาก
    await db.execAsync("PRAGMA journal_mode=WAL;");

    // DDL ทีละ statement (execAsync หลาย statement พร้อมกัน → NullPointerException)
    for (const sql of CREATE_TABLES_SQL) {
      await db.execAsync(sql);
    }

    // Seed ข้อมูลเริ่มต้น (INSERT OR IGNORE — ปลอดภัยรันซ้ำ)
    await db.execAsync(SEED_CATEGORIES_SQL);
    await db.execAsync(SEED_MASLOW_SQL);

    // set instance หลัง init สำเร็จ 100% แล้วค่อยล้าง Promise
    dbInstance    = db;
    dbInitPromise = null;
    return dbInstance;
  })();

  // Promise ที่เก็บไว้จะถูก await โดยทุก caller ที่เข้ามาระหว่าง init
  return dbInitPromise;
};

const withDB = async (fn) => {
  try {
    const db = await getDB();
    return await fn(db);
  } catch (error) {
    const msg = error.message ?? "";
    const isConnErr =
      msg.includes("NullPointerException") ||
      msg.includes("prepareAsync") ||
      msg.includes("execAsync") ||
      msg.includes("no such table") ||
      msg.includes("unable to open database") ||
      msg.includes("disk I/O error") ||
      msg.includes("database disk image is malformed");

    if (isConnErr) {
      console.warn("DB error — reinitializing:", msg);
      dbInstance    = null;
      dbInitPromise = null;
      const freshDb = await getDB();
      return await fn(freshDb);
    }
    throw error;
  }
};

export const initDatabase = async () => { await getDB(); };

// ── helper: ช่วงวันในเดือน ────────────────────────────────────────────────────
// รับ month = 1–12, year = YYYY
const monthRange = (month, year) => {
  const mm      = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${mm}-01`,
    end:   `${year}-${mm}-${String(lastDay).padStart(2, "0")}T23:59:59`,
  };
};

// ══════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════

export const createUser = async ({
  firstName, lastName, email, password,
  birthdate = null, occupation = null, role = "user",
}) => {
  const now = new Date().toISOString();
  const hashed = await hashPassword(password);
  const cleanEmail = email.toLowerCase().trim();

  return await withDB((db) =>
    db.runAsync(
      `INSERT INTO users
         (first_name, last_name, email, password,
          birthdate, occupation, created_at, updated_at, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, cleanEmail, hashed,
       birthdate, occupation, now, now, role]
    )
  );
};

export const getUserByEmail = async (email) => {
  try {
    return await withDB((db) =>
      db.getFirstAsync(`SELECT * FROM users WHERE email = ?`, [email])
    );
  } catch (e) { console.error(e); return null; }
};

export const getUserById = async (userId) => {
  try {
    return await withDB((db) =>
      db.getFirstAsync(`SELECT * FROM users WHERE user_id = ?`, [userId])
    );
  } catch (e) { console.error(e); return null; }
};

export const updateUser = async (userId, fields) => {
  // fields = object ของ column ที่ต้องการเปลี่ยน
  const allowed = ["first_name","last_name","email","birthdate","occupation","pdpa_accepted_at"];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return;

  const setClause = entries.map(([k]) => `${k} = ?`).join(", ");
  const values    = entries.map(([, v]) => v);

  return await withDB((db) =>
    db.runAsync(
      `UPDATE users SET ${setClause}, updated_at = datetime('now') WHERE user_id = ?`,
      [...values, userId]
    )
  );
};

export const acceptPDPA = async (userId) => {
  return await withDB((db) =>
    db.runAsync(
      `UPDATE users SET pdpa_accepted_at = datetime('now'), updated_at = datetime('now')
       WHERE user_id = ?`,
      [userId]
    )
  );
};

//---------------------
//Auth Helpers
//--------------------- New888

// Hash wiht SHA-256
export const hashPassword = async (plainText) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,plainText
  );
};

export const checkPassword = async (userId, plainText) => {
  const user = await getUserById (userId);
  if (!user) return false;
  const hashed = await hashPassword(plainText);
  return user.password === hashed;
};

export const changePassword = async (userId, plainText, newPassword) => {
  const isMatch = await checkPassword(userId, plainText);
  if (!isMatch) return false;

  const hashed = await hashPassword(newPassword);
  return await withDB((db) => db.runAsync(
    `UPDATE users SET password = ?, updated_at = datetime('now') WHERE user_id = ?`,
    [hashed, userId]
  ));
};

// Login 
export const loginUser = async (email, password) => {
  const user = await getUserByEmail (email.toLowerCase().trim());
  if (!user) return null;

  const hashed = await hashPassword(password);
  if (user.password !== hashed) return null;

  return user;
};
// ══════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════

// ดึงเฉพาะหมวดหมู่ที่ยัง active
export const getCategories = async (type = null) => {
  try {
    const sql = type
      ? `SELECT * FROM categories WHERE is_active = 1 AND category_type = ? ORDER BY category_id`
      : `SELECT * FROM categories WHERE is_active = 1 ORDER BY category_type, category_id`;
    const params = type ? [type] : [];
    return await withDB((db) => db.getAllAsync(sql, params));
  } catch (e) { console.error(e); return []; }
};

// soft delete หมวดหมู่ (ไม่ลบจริง เพราะ transaction เก่าอ้างอิงอยู่)
export const deactivateCategory = async (categoryId) => {
  return await withDB((db) =>
    db.runAsync(
      `UPDATE categories SET is_active = 0 WHERE category_id = ?`,
      [categoryId]
    )
  );
};

// เพิ่มหมวดหมู่ใหม่ (caller ต้อง validate name และ type ก่อนเรียก)
// @returns {Promise<number>} lastInsertRowId ของแถวที่เพิ่ม
export const addCategory = async ({ categoryName, categoryType }) => {
  return await withDB((db) =>
    db.runAsync(
      `INSERT INTO categories (category_name, category_type, created_at, is_active)
       VALUES (?, ?, datetime('now'), 1)`,
      [categoryName, categoryType]
    )
  );
};

// เปลี่ยนชื่อหมวดหมู่ (ประเภทเปลี่ยนไม่ได้หลังสร้าง)
// @returns {Promise<void>}
export const updateCategoryName = async (categoryId, categoryName) => {
  return await withDB((db) =>
    db.runAsync(
      `UPDATE categories SET category_name = ? WHERE category_id = ?`,
      [categoryName, categoryId]
    )
  );
};

// ลบหมวดหมู่แบบ soft-delete เฉพาะเมื่อไม่มี transaction อ้างอิง
// @returns {Promise<{ success: boolean, reason?: 'referenced' }>}
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

// ── Sync helpers สำหรับ Categories ──────────────────────────────────────────

// ID Boundary: 1–999 = System Categories (จาก Server)
//              1000+  = User-created Categories (สร้างบนมือถือ)
// ใช้ตรวจสอบสิทธิ์บน UI — ห้ามแก้ไข/ลบ system categories
export const isSystemCategory = (categoryId) => Number(categoryId) < 1000;

// ดึง categories จาก local SQLite เฉพาะ id ที่อยู่บน server
// รับ serverIds array เพื่อเปรียบเทียบกับ server — ไม่ดึง user-created categories
export const getLocalCategories = async (serverIds = [1,2,3,4,5,6,7,101,102,103,104,105,106]) => {
  if (!serverIds.length) return [];
  try {
    const placeholders = serverIds.map(() => "?").join(",");
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT category_id, category_name, category_type, is_active
         FROM categories
         WHERE category_id IN (${placeholders})
         ORDER BY category_id`,
        serverIds
      )
    );
  } catch (e) { console.error(e); return []; }
};

// บันทึก categories ที่ได้จาก server ลง SQLite
// - ใช้ UPSERT ที่ไม่เขียนทับ is_active ของผู้ใช้ (รักษาการตั้งค่า "ซ่อน" ไว้)
// - ไม่แตะ user-created categories (id >= 1000) เด็ดขาด
// - รันใน transaction เพื่อป้องกัน partial write
export const saveCategoriesToDatabase = async (serverCategories) => {
  if (!serverCategories?.length) return;

  // Validate และกรองเฉพาะ system category ids (< 1000)
  const valid = serverCategories.filter(
    (c) => c.category_id && c.category_name && c.category_type
         && Number(c.category_id) < 1000
  );
  if (!valid.length) return;

  return await withDB(async (db) => {
    await db.runAsync("BEGIN TRANSACTION");
    try {
      for (const cat of valid) {
        // ON CONFLICT: อัปเดตแค่ชื่อและประเภท — ไม่แตะ is_active ของผู้ใช้
        await db.runAsync(
          `INSERT INTO categories (category_id, category_name, category_type, is_active)
           VALUES (?, ?, ?, 1)
           ON CONFLICT(category_id) DO UPDATE SET
             category_name = excluded.category_name,
             category_type = excluded.category_type`,
          [Number(cat.category_id), cat.category_name, cat.category_type]
        );
      }
      await db.runAsync("COMMIT");
    } catch (e) {
      await db.runAsync("ROLLBACK");
      throw e;
    }
  });
};

// ══════════════════════════════════════════════════════
// MASLOW LEVELS
// ══════════════════════════════════════════════════════

export const getMaslowLevels = async () => {
  try {
    return await withDB((db) =>
      db.getAllAsync(`SELECT * FROM maslow_levels ORDER BY maslow_id`)
    );
  } catch (e) { console.error(e); return []; }
};

export const getMaslowStats = async (month, year, userId) => {
  const { start, end } = monthRange(month, year);
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT t.maslow_id,
                m.name_th, m.name_en, m.description,
                SUM(t.amount) AS total
         FROM transactions t
         JOIN categories    c ON t.category_id = c.category_id
         LEFT JOIN maslow_levels m ON t.maslow_id = m.maslow_id
         WHERE t.user_id = ?
           AND c.category_type = 'expense'
           AND t.maslow_id IS NOT NULL
           AND t.transaction_date BETWEEN ? AND ?
         GROUP BY t.maslow_id
         ORDER BY t.maslow_id ASC`,
        [userId, start, end]
      )
    );
  } catch (e) { console.error(e); return []; }
};
// ══════════════════════════════════════════════════════
// TRANSACTIONS
// ══════════════════════════════════════════════════════

export const addTransaction = async ({
  userId,
  categoryId,
  maslowId       = null,
  transactionDate,
  amount,
  inputMethod    = "manual",
  transactionName = null,
  slipRef        = null,
  slipDate       = null,
  imageUri       = null,
  status         = "confirmed",
}) => {
   // ใช้สำหรับ Sync กับ Server
   const syncId = Crypto.randomUUID();
  const updatedAt = new Date().toISOString();

  await withDB((db) =>
    db.runAsync(
      `INSERT INTO transactions
         (sync_id, user_id, category_id, maslow_id, transaction_date, amount,
          input_method, transaction_name, is_synced, updated_at,
          slip_ref, slip_date, image_uri, status)
       VALUES (?,?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [syncId, userId, categoryId, maslowId, transactionDate, amount,
       inputMethod, transactionName, updatedAt,
       slipRef, slipDate, imageUri, status]
    )
  );
  return syncId;
};

// ดึง transactions พร้อม category_type (income/expense)
export const getTransactionsByMonth = async (month, year, userId) => {
  const { start, end } = monthRange(month, year);
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT t.*, c.category_name, c.category_type,
                m.name_th AS maslow_name_th, m.name_en AS maslow_name_en
         FROM transactions t
         LEFT JOIN categories    c ON t.category_id = c.category_id
         LEFT JOIN maslow_levels m ON t.maslow_id   = m.maslow_id
         WHERE t.user_id = ?
           AND t.transaction_date BETWEEN ? AND ?
         ORDER BY t.transaction_date DESC`,
        [userId, start, end]
      )
    );
  } catch (e) { console.error(e); return []; }
};

export const getAllTransactions = async (userId) => {
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT t.*, c.category_name, c.category_type
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ?
         ORDER BY t.transaction_date DESC`,
        [userId]
      )
    );
  } catch (e) { console.error(e); return []; }
};

export const deleteTransaction = async (transactionId, userId) => {
  return await withDB((db) =>
    db.runAsync(
      `DELETE FROM transactions WHERE transaction_id = ? AND user_id = ?`,
      [transactionId, userId]
    )
  );
};

export const confirmTransactionStatus = async (transactionId) => {
  return await withDB((db) => db.runAsync(
    `UPDATE transactions SET status = 'confirmed' WHERE transaction_id = ?`,
    [transactionId]
  ));
};

// ── Sync ──────────────────────────────────────
export const getUnsyncedTransactions = async (userId) => {
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT * FROM transactions WHERE user_id = ? AND is_synced = 0`,
        [userId]
      )
    );
  } catch (e) { console.error(e); return []; }
};

export const markTransactionsAsSynced = async (localIds) => {
  if (!localIds?.length) return;
  const placeholders = localIds.map(() => "?").join(",");
  return await withDB((db) =>
    db.runAsync(
      `UPDATE transactions SET is_synced = 1
       WHERE transaction_id IN (${placeholders})`,
      localIds
    )
  );
};

// ── Slips (OCR) ───────────────────────────────
export const getSlips = async (userId) => {
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT t.*, c.category_name, c.category_type
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.input_method = 'ocr'
         ORDER BY t.transaction_date DESC`,
        [userId]
      )
    );
  } catch (e) { console.error(e); return []; }
};

export const deleteSlip = async (slipId, userId) => {
  return await withDB((db) => db.runAsync(
    `DELETE FROM transactions WHERE transaction_id = ? AND user_id = ?`,
    [slipId, userId]
  ));
};

export const updateSlip = async (transactionId, name, amount) => {
  return await withDB((db) => db.runAsync(
    `UPDATE transactions SET transaction_name = ?, amount = ? WHERE transaction_id = ?`,
    [name, amount, transactionId]
  ));
};
// ══════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════

// รับ month = 1–12
export const getMonthlyStats = async (month, year, userId) => {
  const { start, end } = monthRange(month, year);
  try {
    const rows = await withDB((db) =>
      db.getAllAsync(
        `SELECT c.category_type AS type, COALESCE(SUM(t.amount), 0) AS total
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.transaction_date BETWEEN ? AND ?
         GROUP BY c.category_type`,
        [userId, start, end]
      )
    );

    let income = 0, expense = 0;
    for (const row of rows) {
      if (row.type === "income")  income  = row.total;
      if (row.type === "expense") expense = row.total;
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    return {
      income,
      expense,
      savings:       income - expense,
      savingsRate:   income > 0 ? ((income - expense) / income) * 100 : 0,
      burnRateDaily: daysInMonth > 0 ? expense / daysInMonth : 0,
    };
  } catch (e) {
    console.error(e);
    return { income: 0, expense: 0, savings: 0, savingsRate: 0, burnRateDaily: 0 };
  }
};

// เดือนก่อนหน้า (month 1–12)
export const getPrevMonthStats = async (month, year, userId) => {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  return getMonthlyStats(prevMonth, prevYear, userId);
};

export const getCategoryStats = async (month, year, userId) => {
  const { start, end } = monthRange(month, year);
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT t.category_id,
                c.category_name,
                c.category_type,
                SUM(t.amount) AS total
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ?
           AND c.category_type = 'expense'
           AND t.transaction_date BETWEEN ? AND ?
         GROUP BY t.category_id
         ORDER BY total DESC
         LIMIT 6`,
        [userId, start, end]
      )
    );
  } catch (e) { console.error(e); return []; }
};



// daily spending ของเดือน (สำหรับกราฟ)
export const getDailyExpenses = async (month, year, userId) => {
  const { start, end } = monthRange(month, year);
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT substr(t.transaction_date, 1, 10) AS day,
                SUM(t.amount) AS total
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ?
           AND c.category_type = 'expense'
           AND t.transaction_date BETWEEN ? AND ?
         GROUP BY day
         ORDER BY day ASC`,
        [userId, start, end]
      )
    );
  } catch (e) { console.error(e); return []; }
};

// ══════════════════════════════════════════════════════
// BUDGET
// ══════════════════════════════════════════════════════

export const getBudgetStuatus = async (userId, categoryId, month, year) => {
  const { start, end } = monthRange(month, year);
  try {
    return await withDB(async (db) => {
      // แยกเป็น 2 query เพื่อหลีกเลี่ยง correlated subquery ที่ทำให้ prepareAsync crash บน Android
      const budget = await db.getFirstAsync(
        `SELECT amount_limit FROM budgets
         WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?`,
        [userId, categoryId, month, year]
      );
      if (!budget) return null;

      const spent = await db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) AS used
         FROM transactions
         WHERE user_id = ? AND category_id = ?
           AND transaction_date BETWEEN ? AND ?`,
        [userId, categoryId, start, end]
      );

      return {
        amount_limit: budget.amount_limit,
        used: spent?.used ?? 0,
      };
    });
  } catch (e) { console.error("Error in getBudgetStatus:", e); return null; }
};

export const getBudgetsWithUsage = async (month, year, userId) => {
  const { start, end } = monthRange(month, year);
  try {
    return await withDB((db) =>
      db.getAllAsync(
        `SELECT
           b.category_id,
           c.category_name,
           b.amount_limit,
           COALESCE(SUM(t.amount), 0) AS used
         FROM budgets b
         JOIN categories c ON b.category_id = c.category_id
         LEFT JOIN transactions t
           ON  t.category_id = b.category_id
           AND t.user_id = b.user_id
           AND t.transaction_date BETWEEN ? AND ?
         WHERE b.user_id = ? AND b.month = ? AND b.year = ?
         GROUP BY b.category_id
         ORDER BY c.category_name ASC`,
        [start, end, userId, month, year]
      )
    );
  } catch (e) { console.error(e); return []; }
};

export const addBudget = async ({ userId, categoryId, amountLimit, month, year }) => {
  return await withDB((db) =>
    db.runAsync(
      `INSERT OR REPLACE INTO budgets
         (user_id, category_id, month, year, amount_limit)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, categoryId, month, year, amountLimit]
    )
  );
};

export const updateBudget = async ({ userId, categoryId, month, year, amountLimit }) => {
  return await withDB((db) =>
    db.runAsync(
      `UPDATE budgets SET amount_limit = ?
       WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?`,
      [amountLimit, userId, categoryId, month, year]
    )
  );
};

export const deleteBudget = async ({ userId, categoryId, month, year }) => {
  return await withDB((db) =>
    db.runAsync(
      `DELETE FROM budgets
       WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?`,
      [userId, categoryId, month, year]
    )
  );
};

// คัดลอก budget เดือนที่แล้วมาใช้เดือนนี้ (ถ้ายังไม่มี)
export const copyBudgetsFromLastMonth = async (month, year, userId) => {
  return await withDB(async (db) => {
    const existing = await db.getFirstAsync(
      `SELECT COUNT(*) AS cnt FROM budgets
       WHERE user_id = ? AND month = ? AND year = ?`,
      [userId, month, year]
    );
    if (existing?.cnt > 0) return;

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;

    await db.runAsync(
      `INSERT OR IGNORE INTO budgets (user_id, category_id, month, year, amount_limit)
       SELECT user_id, category_id, ?, ?, amount_limit
       FROM budgets
       WHERE user_id = ? AND month = ? AND year = ?`,
      [month, year, userId, prevMonth, prevYear]
    );
  });
};