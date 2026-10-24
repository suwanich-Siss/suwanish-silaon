export const DB_NAME = "slips.db";
export const NOT_APPLICABLE = "N/A";

// API Key โหลดจาก .env (ไม่ถูก commit ขึ้น GitHub)
// ตั้งชื่อ EXPO_PUBLIC_* เพื่อให้ Expo expose ให้ client-side ได้
export const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY;
export const OCR_API_URL = "https://api.ocr.space/parse/image";
export const KTB_FOLDER_URI_KEY = "ktb_folder_uri";

export const LAST_SCAN_TIMESTAMP_KEY = "last_scan_timestamp";
export const BACKGROUND_FETCH_TASK = "background-slip-scanner-task";
export const PENDING_SLIPS_KEY = "pending_slips_backup";
