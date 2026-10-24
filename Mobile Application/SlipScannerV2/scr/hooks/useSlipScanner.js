import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { initDatabase, getDB, addTransaction } from "../database/database";
import { NOT_APPLICABLE, PENDING_SLIPS_KEY, KTB_FOLDER_URI_KEY } from "../constants/app";
import {
  processSlip,
  saveSelectedSlips,
  fetchSlipsFromDb,
  calculateTotal,
} from "../services/slipService";
import { setupNotifications }          from "../services/notificationService";
import { registerBackgroundFetchAsync } from "../background/slipScannerTask";
import {
  getSavedFolderUri,
  askForFolderPermission,
  listImageFilesInCurrentMonth,
} from "../services/storageService";
import { syncDataToServer } from "../database/syncService";
import { useAuth } from "../context/AuthContext";

export const useSlipScanner = () => {
  const { user, syncToken } = useAuth();
  const userId = user?.user_id;

  const [status,              setStatus]              = useState("พร้อมทำงาน");
  const [slips,               setSlips]               = useState([]);
  const [pendingSlips,        setPendingSlips]        = useState([]);
  const [isReviewModalVisible,setIsReviewModalVisible]= useState(false);
  const [isProcessing,        setIsProcessing]        = useState(false);
  const [isBulkProcessing,    setIsBulkProcessing]    = useState(false);
  const [isSaving,            setIsSaving]            = useState(false);
  const [ktbFolderUri,        setKtbFolderUri]        = useState(null);
  const [totalAmount,         setTotalAmount]         = useState(0);

  const isCancelled = useRef(false);

  // ── Setup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await setupNotifications();
      await registerBackgroundFetchAsync();
      const savedUri = await getSavedFolderUri();
      if (savedUri) setKtbFolderUri(savedUri);
      await initDatabase();
      await refreshData();
      await loadPendingSlips();
    })();
  }, []);

  const refreshData = async () => {
    const loadedSlips = await fetchSlipsFromDb();
    setSlips(loadedSlips);
    setTotalAmount(await calculateTotal());
  };

  // ── Pending slip persistence ───────────────────────────────────────────────
  const savePendingSlips = async (items) => {
    try { await AsyncStorage.setItem(PENDING_SLIPS_KEY, JSON.stringify(items)); }
    catch (e) { console.error("Failed to save pending slips:", e); }
  };

  const loadPendingSlips = async () => {
    try {
      const saved = await AsyncStorage.getItem(PENDING_SLIPS_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      const db = await getDB();
      const filtered = [];

      for (const slip of parsed) {
        // ตรวจว่าบันทึกไปแล้วหรือยัง (ใช้ชื่อตารางใหม่: transactions)
        const byUri = await db.getFirstAsync(
          `SELECT transaction_id FROM transactions
           WHERE input_method = 'ocr' AND transaction_name LIKE ?`,
          [`%${slip.imageUri?.split("/").pop()}%`]
        );
        if (byUri) continue;

        if (slip.ref && slip.ref !== NOT_APPLICABLE) {
          const byRef = await db.getFirstAsync(
            `SELECT transaction_id FROM transactions
             WHERE input_method = 'ocr' AND transaction_name = ?`,
            [`โอนเงิน (REF: ${slip.ref})`]
          );
          if (byRef) continue;
        }
        filtered.push(slip);
      }

      if (filtered.length === 0) {
        await AsyncStorage.removeItem(PENDING_SLIPS_KEY);
        return;
      }
      await AsyncStorage.setItem(PENDING_SLIPS_KEY, JSON.stringify(filtered));
      setPendingSlips(filtered);
      setIsReviewModalVisible(true);
    } catch (e) {
      console.error("Failed to load pending slips:", e);
    }
  };

  const clearPendingSlips = async () => {
    setPendingSlips([]);
    await AsyncStorage.removeItem(PENDING_SLIPS_KEY);
  };

  // ── Single image pick ──────────────────────────────────────────────────────
  const handlePickImage = async () => {
    setIsProcessing(true);
    setStatus("กำลังเปิดรูปภาพ...");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 1,
      });
      if (result.canceled) { setStatus("พร้อมทำงาน"); return; }

      const originalUri = result.assets[0].uri;
      const fileName    = `slip_${Date.now()}.jpg`;
      const cachedUri   = FileSystem.cacheDirectory + fileName;
      await FileSystem.copyAsync({ from: originalUri, to: cachedUri });

      setStatus("กำลัง OCR...");
      const extracted = await processSlip(cachedUri, fileName);
      if (!extracted) { setStatus("สลิปนี้ถูกบันทึกแล้ว"); return; }

      const newPending = [extracted];
      setPendingSlips(newPending);
      await savePendingSlips(newPending);
      setIsReviewModalVisible(true);
      setStatus("พบสลิป 1 รายการ — รอตรวจสอบ");
    } catch (error) {
      console.error("handlePickImage error:", error);
      setStatus("ผิดพลาด: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Bulk process ───────────────────────────────────────────────────────────
  const handleBulkProcess = async () => {
    isCancelled.current = false;
    setIsBulkProcessing(true);
    let folderUri = ktbFolderUri;

    try {
      if (!folderUri) {
        folderUri = await askForFolderPermission();
        if (!folderUri) { setStatus("ยกเลิกการเลือก"); return; }
        setKtbFolderUri(folderUri);
      }

      let imageFiles = [];
      try {
        imageFiles = await listImageFilesInCurrentMonth(folderUri);
      } catch {
        await AsyncStorage.removeItem(KTB_FOLDER_URI_KEY);
        setKtbFolderUri(null);
        Alert.alert("สิทธิ์หมดอายุ", "กรุณาเลือกโฟลเดอร์ใหม่อีกครั้ง");
        folderUri = await askForFolderPermission();
        if (!folderUri) return;
        setKtbFolderUri(folderUri);
        imageFiles = await listImageFilesInCurrentMonth(folderUri);
      }

      if (imageFiles.length === 0) { setStatus("ไม่พบสลิปในเดือนนี้"); return; }

      const results = [];
      for (let i = 0; i < imageFiles.length; i++) {
        if (isCancelled.current) { setStatus(`ยกเลิกที่ ${i}/${imageFiles.length}`); break; }
        const file = imageFiles[i];
        setStatus(`OCR ${i + 1}/${imageFiles.length}: ${file.name}`);
        await new Promise((r) => setTimeout(r, 1500));
        const extracted = await processSlip(file.uri, file.name);
        if (extracted) results.push(extracted);
      }

      if (results.length === 0) { setStatus("ไม่พบสลิปใหม่ในเดือนนี้"); return; }

      setPendingSlips(results);
      await savePendingSlips(results);
      setIsReviewModalVisible(true);
      setStatus(`พบสลิป ${results.length} รายการ — รอตรวจสอบ`);
    } catch (error) {
      console.error("Bulk Process Error:", error);
      setStatus("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // ── Review modal actions ───────────────────────────────────────────────────
  const handleUpdatePendingSlip = async (tempId, updatedFields) => {
    const updated = pendingSlips.map((s) => s.tempId === tempId ? { ...s, ...updatedFields } : s);
    setPendingSlips(updated);
    await savePendingSlips(updated);
  };

  const handleToggleSlipSelection = async (tempId) => {
    const updated = pendingSlips.map((s) => s.tempId === tempId ? { ...s, isSelected: !s.isSelected } : s);
    setPendingSlips(updated);
    await savePendingSlips(updated);
  };

  const handleSelectAll = async (selectAll) => {
    const updated = pendingSlips.map((s) => ({ ...s, isSelected: selectAll }));
    setPendingSlips(updated);
    await savePendingSlips(updated);
  };

  const handleConfirmSave = async () => {
    const selectedSlips = pendingSlips.filter((s) => s.isSelected);
    if (selectedSlips.length === 0) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกอย่างน้อย 1 รายการ");
      return;
    }

    const incomplete = selectedSlips.filter((s) => !s.categoryId || !s.maslowId);
    if (incomplete.length > 0) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        `กรุณาเลือกหมวดหมู่และระดับ Maslow ให้ครบทั้ง ${incomplete.length} รายการก่อนบันทึก`
      );
      return;
    }

    setIsSaving(true);
    try {
      let saved = 0, failed = 0;
      for (const slip of selectedSlips) {
        try {
          await addTransaction({
            userId:          userId,
            categoryId:      slip.categoryId,
            maslowId:        slip.maslowId,
            amount:          parseFloat(String(slip.amount).replace(/,/g, "")),
            transactionDate: slip.slipDateISO || new Date().toISOString(),
            inputMethod:     "ocr",
            transactionName: `โอนเงิน (REF: ${slip.ref || "ไม่ระบุ"})`,
            slipRef:         slip.ref,
            slipDate:        slip.slipDateISO,
            imageUri:        slip.imageUri,
            status:          "confirmed",
          });
          saved++;
        } catch (e) {
          console.error("addTransaction error:", e);
          failed++;
        }
      }

      await clearPendingSlips();
      setIsReviewModalVisible(false);
      await refreshData();

      setStatus(
        `บันทึกแล้ว ${saved} รายการ` +
        (failed > 0 ? ` (ผิดพลาด ${failed})` : "")
      );

      await syncDataToServer({ userId, syncToken });
    } catch (error) {
      console.error("Confirm save error:", error);
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardPending = async () => {
    Alert.alert("ยืนยันการยกเลิก", "ต้องการลบรายการรอตรวจสอบทั้งหมดใช่ไหม?", [
      { text: "ไม่", style: "cancel" },
      {
        text: "ยืนยัน", style: "destructive",
        onPress: async () => {
          await clearPendingSlips();
          setIsReviewModalVisible(false);
          setStatus("พร้อมทำงาน");
        },
      },
    ]);
  };

  const handleCancel = () => { isCancelled.current = true; };

  return {
    status, slips, totalAmount,
    isProcessing, isBulkProcessing, isSaving,
    pendingSlips, isReviewModalVisible,
    handlePickImage, handleBulkProcess, handleCancel,
    handleUpdatePendingSlip, handleToggleSlipSelection,
    handleSelectAll, handleConfirmSave, handleDiscardPending,
    setIsReviewModalVisible,
  };
};