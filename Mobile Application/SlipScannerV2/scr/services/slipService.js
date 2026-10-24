import { NOT_APPLICABLE } from "../constants/app";
import { AMOUNT_REGEX, DATE_REGEX, REF_REGEX, KEYWORDS } from "../utils/regex";
import { convertThaiDateToISO } from "../utils/dateUtils";
import { performOCR } from "./ocrService";
import { getDB, addTransaction } from "../database/database";

// ── Step 1: OCR + Extract เท่านั้น — ยังไม่บันทึก DB ──────────────────────────
export const processSlip = async (fileUri, fileName) => {
  try {
    const db = await getDB();

    // เช็ค URI ก่อน (ไม่ต้อง OCR เลย)
    const byUri = await db.getFirstAsync(
      `SELECT transaction_id FROM transactions
       WHERE input_method = 'ocr' AND transaction_name LIKE ?`,
      [`%${fileUri.split("/").pop()}%`],
    );
    if (byUri) {
      console.log(`Already saved (URI). Skipping OCR.`);
      return null;
    }

    // OCR: เอารูป → แปลงเป็นข้อความ
    const fullText = await performOCR(fileUri);
    if (!fullText) return null;

    // เช็คว่าข้อความนี้เกี่ยวกับสลิปไหม
    if (!KEYWORDS.some((k) => fullText.includes(k))) return null;

    const extracted = {
      tempId:  `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      amount:  fullText.match(AMOUNT_REGEX)?.[1] || NOT_APPLICABLE,
      date:    fullText.match(DATE_REGEX)?.[0]   || NOT_APPLICABLE,
      ref:     fullText.match(REF_REGEX)?.[1]    || NOT_APPLICABLE,
      imageUri:   fileUri,
      fileName,
      isSelected: true,
    };

    // เช็ค ref หลัง OCR — ถ้าซ้ำก็ไม่ต้องเข้า pendingSlips เลย
    if (extracted.ref !== NOT_APPLICABLE) {
      const byRef = await db.getFirstAsync(
        `SELECT transaction_id FROM transactions
         WHERE input_method = 'ocr' AND transaction_name = ?`,
        [`โอนเงิน (REF: ${extracted.ref})`],
      );
      if (byRef) {
        console.log(`Duplicate ref (${extracted.ref}). Skipping.`);
        return null;
      }
    }

    return extracted;
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return null;
  }
};

// ── Step 2: บันทึกสลิปลง transactions table ────────────────────────────────────
// ใช้โดย background task (saveSelectedSlips) ซึ่งบันทึกทันทีโดยไม่ต้องรอ user ยืนยัน
// รับ userId เป็น parameter แทนการเรียก useAuth() (Hook ใช้ใน Component เท่านั้น)
const saveSlipToTransactions = async (slip, userId) => {
  try {
    const slipDateISO = convertThaiDateToISO(slip.date);

    // เช็ค ref ซ้ำก่อนบันทึก
    if (slip.ref !== NOT_APPLICABLE) {
      const db = await getDB();
      const existing = await db.getFirstAsync(
        `SELECT transaction_id FROM transactions WHERE slip_ref = ?`,
        [slip.ref],
      );
      if (existing) {
        console.log(`Duplicate slip (Ref: ${slip.ref}). Skipping.`);
        return { skipped: true };
      }
    }

    await addTransaction({
      userId:          userId,
      categoryId:      slip.categoryId   ?? null,
      maslowId:        slip.maslowId     ?? null,
      amount:          parseFloat(String(slip.amount).replace(/,/g, "")) || 0,
      transactionDate: slipDateISO || new Date().toISOString(),
      inputMethod:     "ocr",
      transactionName: `โอนเงิน (REF: ${slip.ref || "ไม่ระบุ"})`,
      slipRef:         slip.ref !== NOT_APPLICABLE ? slip.ref : null,
      slipDate:        slipDateISO,
      imageUri:        slip.imageUri ?? null,
      status:          "confirmed",
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving slip:", error);
    return { error: error.message };
  }
};

// ── บันทึกทีละหลายรายการ คืนผลสรุป ────────────────────────────────────────────
// ใช้โดย background task (slipScannerTask.js)
// ต้องส่ง userId มาด้วยเสมอ — อ่านจาก AsyncStorage ใน background task แทน useAuth()
export const saveSelectedSlips = async (slips, userId) => {
  let saved = 0, skipped = 0, failed = 0;

  for (const slip of slips) {
    const result = await saveSlipToTransactions(slip, userId);
    if (result.success)  saved++;
    else if (result.skipped) skipped++;
    else failed++;
  }

  return { saved, skipped, failed };
};

// ── ดึง OCR slips จาก DB ────────────────────────────────────────────────────────
export const fetchSlipsFromDb = async () => {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM transactions
     WHERE input_method = 'ocr'
     ORDER BY transaction_date DESC`,
  );
};

// ── คำนวณยอดรวมสลิปทั้งหมด ──────────────────────────────────────────────────────
export const calculateTotal = async () => {
  const db = await getDB();
  try {
    const result = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE input_method = 'ocr'`,
    );
    return result?.total || 0;
  } catch (error) {
    console.error("Failed to calculate total:", error);
    return 0;
  }
};
