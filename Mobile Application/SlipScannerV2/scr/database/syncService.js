import { getUnsyncedTransactions, markTransactionsAsSynced, getLocalCategories, saveCategoriesToDatabase } from "./database";
import * as Crypto from "expo-crypto";

// ⚠️ เปลี่ยน IP ให้ตรงกับเครื่อง Server ของคุณ
// ห้ามใช้ localhost — มือถือจะมองหา localhost ในตัวมันเอง ไม่ใช่คอมพิวเตอร์
const API_URL = "https://eaten-surfer-zit.ngrok-free.dev/backend-api/sync_transactions.php";

const CATEGORIES_URL = "https://eaten-surfer-zit.ngrok-free.dev/backend-api/get_categories.php";

/**
 * syncDataToServer({ userId, syncToken })
 *
 * รับเป็น object เพื่อตัดปัญหาลำดับ argument
 * ทั้ง userId และ syncToken ต้องส่งมาจาก AuthContext
 *
 * @param {number} userId    - user_id ของผู้ใช้ที่ login อยู่
 * @param {string} syncToken // token ที่สร้างจาก AuthContext (ไม่ใช่ JWT)
 */
export const syncDataToServer = async ({ userId, syncToken }) => {
  if (!userId || !syncToken) {
    console.warn("Sync skipped: userId or syncToken is missing.", { userId, syncToken });
    return;
  }

  try {
    // 1. กวาดรายการที่ยังไม่ได้ Sync จาก SQLite
    const unsyncedData = await getUnsyncedTransactions(userId);

    if (!unsyncedData || unsyncedData.length === 0) {
      console.log("Sync: All data is up to date.");
      return;
    }

    const uuidToLocalId = {};
    const transactionPayload = await Promise.all(unsyncedData.map(async (tx) => {
      let currentUuid = tx.sync_id;
      
      // Fallback: หาก schema ไม่มี sync_id จะสร้าง UUID จำลองที่คงที่เสมอตาม transaction_id
      if (!currentUuid) {
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${syncToken}:${tx.transaction_id}`
        );
        currentUuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
      }

      uuidToLocalId[currentUuid] = tx.transaction_id;
      return {
        sync_id:          currentUuid,
        category_id:      tx.category_id,
        maslow_id:        tx.maslow_id,
        transaction_date: tx.transaction_date,
        amount:           tx.amount,
        input_method:     tx.input_method,
        transaction_name: tx.transaction_name,
      };
    }));

    const finalPayload = {
      sync_token:   syncToken,
      transactions: transactionPayload,
    };

    // Debug: แสดง payload ก่อนส่ง เพื่อยืนยันว่า sync_token ไม่ว่าง
    console.log("[Sync] finalPayload:", JSON.stringify({
      sync_token:        finalPayload.sync_token,
      transaction_count: finalPayload.transactions.length,
    }));

    // 2. ยิง API ไปที่ PHP
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
    });

    const textResponse = await response.text();
    console.log("[Sync] ข้อความจาก Server:", textResponse);

    let result;
    try {
      result = JSON.parse(textResponse);
    } catch {
      console.log("[Sync] Server ตอบกลับมาไม่ใช่ JSON:", textResponse);
      return;
    }

    // 3. ถ้า Server บอกสำเร็จ ให้ mark ว่า synced แล้ว
    if (result.status === "success" && result.synced_ids?.length > 0) {
      const localIdsToMark = result.synced_ids
        .map((uuid) => uuidToLocalId[uuid])
        .filter(Boolean);
      await markTransactionsAsSynced(localIdsToMark);
      console.log(`[Sync] Successfully synced ${localIdsToMark.length} items.`);
    } else {
      if (result.errors?.length > 0) {
        console.log("[Sync] Server Errors:", JSON.stringify(result.errors, null, 2));
      }
      console.log("[Sync] Failed:", result.message);
    }
  } catch (error) {
    // ตกมาตรงนี้เมื่อไม่มีเน็ต หรือเซิร์ฟเวอร์ล่ม — รอรอบหน้า sync ใหม่เองอัตโนมัติ
    console.log("[Sync] Error (Offline or Cannot connect to API):", error.message);
  }
};

export const fetchCategoriesFromServer = async () => {
  try {
    const response = await fetch(CATEGORIES_URL);
    const result  = await response.json();

    if (result.status === "success") {
      return result.categories || [];
    }
  } catch (error) {
    console.error("Error fetching categories from server:", error);
  }
  return [];
};

export const checkCategoryUpdates = async () => {
  // 1. ดึง categories จาก server ก่อน
  const serverCategories = await fetchCategoriesFromServer();

  // ถ้า server ไม่ตอบหรือไม่มีข้อมูล — ถือว่าไม่มีอัปเดต ป้องกัน false positive
  if (!serverCategories.length) return { hasUpdate: false, serverCategories: [] };

  // 2. ดึง local categories เฉพาะ id ที่อยู่บน server (ไม่รวม user-created)
  const localCategories = await getLocalCategories(serverCategories.map((c) => Number(c.category_id)));

  // 3. เปรียบเทียบด้วย content hash
  //    ป้องกันกรณี server ลบ 1 รายการแล้วเพิ่มใหม่ 1 รายการ (จำนวนเท่ากันแต่เนื้อหาเปลี่ยน)
  const toHash = (categories) =>
    categories
      .map((c) => `${c.category_id}:${c.category_name}:${c.category_type}:${Number(c.is_active ?? 1)}`)
      .sort()
      .join("|");

  const hasUpdate = toHash(serverCategories) !== toHash(localCategories);

  return { hasUpdate, serverCategories };
};