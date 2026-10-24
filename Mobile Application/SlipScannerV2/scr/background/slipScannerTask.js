import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as ScopedStorage from "react-native-scoped-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKGROUND_FETCH_TASK, KTB_FOLDER_URI_KEY, LAST_SCAN_TIMESTAMP_KEY } from "../constants/app";
import { getDB } from "../database/database";          // ✅ ใช้ Singleton แทน openDatabaseAsync
import { processSlip, saveSelectedSlips } from "../services/slipService"; // ✅ ชื่อใหม่
import { sendNotification } from "../services/notificationService";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = new Date();
  console.log(`[${now.toISOString()}] Background task running...`);

  try {
    // 1. เช็คว่ามีโฟลเดอร์ที่บันทึกไว้ไหม
    const ktbFolderUri = await AsyncStorage.getItem(KTB_FOLDER_URI_KEY);
    if (!ktbFolderUri) return BackgroundFetch.BackgroundFetchResult.NoData;

    // 2. หา timestamp รอบล่าสุด (default = 24 ชม.ที่แล้ว)
    const lastScanTimestampStr = await AsyncStorage.getItem(LAST_SCAN_TIMESTAMP_KEY);
    const lastScanTimestamp = lastScanTimestampStr
      ? parseInt(lastScanTimestampStr, 10)
      : Date.now() - 24 * 60 * 60 * 1000;

    // ✅ ใช้ Singleton getDB() — ไม่เปิด DB ใหม่เอง
    await getDB();

    // 3. ดึงรายการไฟล์จากโฟลเดอร์
    let dirFiles = [];
    try {
      dirFiles = await ScopedStorage.listFiles(ktbFolderUri);
    } catch (e) {
      await sendNotification(
        "Slip Scanner ต้องการสิทธิ์",
        "กรุณาเปิดแอปเพื่อทำการตั้งค่าโฟลเดอร์สลิปอีกครั้ง"
      );
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // 4. กรองเฉพาะไฟล์รูปที่ใหม่กว่า timestamp รอบก่อน
    const newFiles = dirFiles.filter(
      (file) =>
        (file.mime === "image/jpeg" || file.mime === "image/png") &&
        file.lastModified > lastScanTimestamp
    );

    if (newFiles.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    // 5. OCR ทุกไฟล์ใหม่ — ✅ ใช้ processSlip (ไม่ส่ง db เข้าไปแล้ว)
    const extracted = [];
    for (const file of newFiles) {
      const result = await processSlip(file.uri, file.name);
      if (result) extracted.push({ ...result, isSelected: true });
    }

    if (extracted.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    // 6. บันทึกทันทีโดยไม่ต้องรอ user ยืนยัน (background mode)
    // อ่าน userId จาก AsyncStorage เพราะ background task ไม่มี React context
    const storedUserId = await AsyncStorage.getItem("userId");
    const userId = storedUserId ? parseInt(storedUserId, 10) : null;
    if (!userId) {
      console.warn("[BG Task] userId not found in AsyncStorage — skipping save");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    const { saved } = await saveSelectedSlips(extracted, userId);

    if (saved > 0) {
      await sendNotification(
        "บันทึกสลิปใหม่เรียบร้อย!",
        `ตรวจพบและบันทึกสลิปใหม่อัตโนมัติ ${saved} รายการ`
      );
      await AsyncStorage.setItem(LAST_SCAN_TIMESTAMP_KEY, String(Date.now()));
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;

  } catch (error) {
    console.error("[BG Task] Error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  console.log("Registering background task...");
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60,  // ทุก 15 นาที
    stopOnTerminate: false,     // ทำงานต่อแม้ปิดแอป
    startOnBoot: true,          // เริ่มอีกครั้งหลังรีบูต
  });
}