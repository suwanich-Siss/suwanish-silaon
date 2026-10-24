import { readAsStringAsync } from "expo-file-system/legacy";
import * as ImageManipulator from 'expo-image-manipulator'; // เพิ่มตัวนี้
import { OCR_API_KEY, OCR_API_URL } from "../constants/app";

const TIMEOUT_MS  = 40000; // 40 วิ — รองรับเน็ตช้า (เดิม 20 วิ)
const MAX_RETRIES = 2;     // retry อีก 2 รอบถ้า timeout
const RETRY_DELAY = 3000;  // รอ 3 วิก่อน retry


// ─── Helper: sleep ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Helper: Resize รูปให้เล็กลง ─────────────────────────────────────────────
const resizeImage = async (fileUri) => {
  const manipulated = await ImageManipulator.manipulateAsync(
    fileUri,
    [{ resize: { width: 600 } }],   // ลดจาก 1024 → 600px (สลิปอ่านได้ชัดเหมือนกัน)
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } // compress 0.6 (เดิม 0.7)
  );
  return manipulated.uri;
};

// ─── Helper: ยิง OCR 1 ครั้ง ──────────────────────────────────────────────────
// ฟังก์ชันนี้ = “ส่งรูป (base64) ไป OCR API แล้วเอาผลลัพธ์กลับมา”
const callOCRApi = async (base64Image) => {
  // ตั้ง timeout ถ้า API ช้าเกิน → ยกเลิก request AbortController = ควบคุมการยกเลิก setTimeout = ตั้งเวลา
  const controller = new AbortController(); 
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);
 
  try { // เตรียมข้อมูลส่ง (FormData) ใส่ API key
    const formData = new FormData();
    formData.append("apikey",            OCR_API_KEY);
    // ใส่รูป (base64)
    formData.append("base64Image",       `data:image/jpeg;base64,${base64Image}`);
     // ใช้ OCR ภาษาไทย
    formData.append("language",          "tha");
    // ใช้ engine เวอร์ชัน 2
    formData.append("ocrengine",         "2");
    // ไม่เอา overlay (ตำแหน่งตัวอักษร)
    formData.append("isOverlayRequired", "false");
 
    // ส่ง request ไป OCR
    const response = await fetch(OCR_API_URL, {
      method: "POST",
      body:   formData,
      signal: controller.signal,
    });
    
    // ถ้าเสร็จแล้ว → ยกเลิก timer
    clearTimeout(timeoutId);
 
    // ✅ ตรวจ HTTP status ก่อน parse — จับ 403/500 ได้ชัด
    if (response.status === 403) {
      throw new Error("OCR_FORBIDDEN"); // API Key หมดอายุหรือเกิน quota
    }
    if (!response.ok) {  // error อื่น เช่น 500
      throw new Error(`OCR_HTTP_${response.status}`);
    }
 
    return await response.json(); // แปลง response เป็น JSON
 
  } finally {
    clearTimeout(timeoutId); // ไม่ว่าจะสำเร็จหรือ error → เคลียร์ timeout
  }
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const performOCR = async (fileUri) => {  // ฟังก์ชันนี้ = “เอารูป → OCR → คืนข้อความ
  try {
    // 1. Resize รูปก่อนส่ง
    const resizedUri  = await resizeImage(fileUri);
    const base64Image = await readAsStringAsync(resizedUri, { encoding: "base64" });
 
    // 2. ยิง API พร้อม retry
    let lastError = null;
 
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const result = await callOCRApi(base64Image);
 
        // ✅ API ตอบกลับ แต่ OCR มี error (เช่น ไฟล์แปลก)
        if (result.IsErroredOnProcessing) {
          console.warn(`OCR API Error (attempt ${attempt}):`, result.ErrorMessage);
          return null; // ไม่ต้อง retry — รูปมีปัญหา
        }
 
        if (!result.ParsedResults?.length) return null; // เก็บ error ล่าสุด
 
        return result.ParsedResults[0]?.ParsedText
          .replace(/\s+/g, " ")
          .toLowerCase();
 
      } catch (error) {
        lastError = error;
 
        // 403 — ไม่ต้อง retry เพราะ key มีปัญหา
        if (error.message === "OCR_FORBIDDEN") {
          console.error("❌ OCR API Key หมดอายุหรือเกิน quota — กรุณาตรวจสอบที่ ocr.space");
          return null;
        }
 
        const isTimeout = error.name === "AbortError";
        const isLastAttempt = attempt === MAX_RETRIES + 1;
 
        if (isTimeout) {
          console.warn(`⏱ OCR Timeout (attempt ${attempt}/${MAX_RETRIES + 1})`);
        } else {
          console.warn(` OCR Error (attempt ${attempt}):`, error.message);
        }
 
        if (!isLastAttempt) {
          console.log(` Retry ในอีก ${RETRY_DELAY / 1000} วิ...`);
          await sleep(RETRY_DELAY);
          continue;
        }
 
        // หมด retry แล้ว
        if (isTimeout) {
          console.error("❌ OCR Timeout ทุก attempt — เน็ตช้าหรือรูปใหญ่เกิน (ข้ามไฟล์นี้)");
        } else {
          console.error("❌ OCR ล้มเหลวทุก attempt:", lastError?.message);
        }
        return null;
      }
    }
 
  } catch (error) {
    // resize ล้มเหลว หรือ readAsStringAsync ล้มเหลว
    console.error("❌ OCR Pre-process Error:", error.message);
    return null;
  }
};