import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { checkCategoryUpdates } from '../database/syncService';
import { saveCategoriesToDatabase } from '../database/database';

// Manual-only sync hook — ไม่ auto-run เมื่อ mount
// ต้องเรียก checkForCategoryUpdates() เองจาก UI (กดปุ่มใน CategoryScreen)
export const useCategoryUpdate = (onUpdate) => {
    const isCheckingRef = useRef(false);

    const checkForCategoryUpdates = useCallback(async () => {
        // ป้องกัน double-call
        if (isCheckingRef.current) return { alreadyChecking: true };
        isCheckingRef.current = true;
        try {
            const { hasUpdate, serverCategories } = await checkCategoryUpdates();

            if (!hasUpdate) {
                Alert.alert("หมวดหมู่เป็นปัจจุบันแล้ว", "ไม่พบการอัปเดตจากเซิร์ฟเวอร์");
                return { hasUpdate: false };
            }

            Alert.alert(
                "พบการอัปเดตหมวดหมู่",
                "มีหมวดหมู่ใหม่จากเซิร์ฟเวอร์ ต้องการอัปเดตหรือไม่?",
                [
                    {
                        text: "อัปเดต",
                        onPress: async () => {
                            await saveCategoriesToDatabase(serverCategories);
                            Alert.alert("✅ อัปเดตหมวดหมู่เรียบร้อยแล้ว");
                            if (onUpdate) onUpdate();
                        }
                    },
                    { text: "ไว้ก่อนนะ", style: "cancel" }
                ]
            );
            return { hasUpdate: true };
        } catch (error) {
            console.error("Error checking category updates:", error);
            Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบอัปเดตได้ กรุณาลองใหม่");
            return { error: error.message };
        } finally {
            isCheckingRef.current = false;
        }
    }, [onUpdate]);

    return { checkForCategoryUpdates, isCheckingRef };
};
