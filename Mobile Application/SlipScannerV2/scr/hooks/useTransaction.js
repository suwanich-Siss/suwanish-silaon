// Hook: useTransaction
// เก็บ state + logic ทั้งหมดของหน้ารายรับ / รายจ่าย
// TransactionScreen.js ดึง hook นี้ไปใช้ผ่าน props จาก AddScreen

import { useState, useRef, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";
import {
  addTransaction,
  getCategories,
  getBudgetStuatus,
} from "../database/database";

export { MASLOW_LEVELS } from "../constants/maslow";

export const useTransaction = () => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [time, setTime] = useState(
    // HH:MM
    new Date().toTimeString().slice(0, 5),
  );
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMaslow, setSelectedMaslow] = useState(null);

  const scrollRef = useRef(null);

  // ── DB-backed categories ───────────────────────────────────────────────────
  const [dbCategories, setDbCategories] = useState([]);

  const refreshCategories = useCallback(async () => {
    try {
      const rows = await getCategories();
      setDbCategories(rows);
    } catch (e) {
      console.error("โหลดหมวดหมู่ไม่สำเร็จ:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshCategories();
    }, [refreshCategories]),
  );

  const incomeCategories = dbCategories.filter(
    (c) => c.category_type === "income",
  );
  const expenseCategories = dbCategories.filter(
    (c) => c.category_type === "expense",
  );

  // ── reset form ─────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setAmount("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    setSelectedCategory(null);
    setSelectedMaslow(null);
    scrollRef.current?.scrollToIndex({ index: 0, animated: true });
  }, []);

  // ── เลือก category แล้ว scroll ไป Maslow อัตโนมัติ (เฉพาะ expense) ────────
  const handleCategorySelect = useCallback((cat, type) => {
    setSelectedCategory(cat);
    if (type === "expense") {
      // scroll ไปหน้า Maslow
      scrollRef.current?.scrollToIndex({ index: 1, animated: true });
    }
  }, []);

  // ── บันทึกธุรกรรม ──────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async ({ userId, onBudgetAlert }) => {
      // validate
      if (!amount || isNaN(parseFloat(amount))) {
        Alert.alert("แจ้งเตือน", "กรุณากรอกจำนวนเงินให้ถูกต้อง");
        return false;
      }
      if (!selectedCategory) {
        Alert.alert("แจ้งเตือน", "กรุณาเลือกหมวดหมู่");
        return false;
      }

      try {
        // รวม date + time → ISO datetime string
        const transactionDate = `${date}T${time}:00`;
        await addTransaction({
          userId,
          categoryId: selectedCategory.category_id,
          maslowId: selectedMaslow?.id ?? null,
          amount: parseFloat(amount),
          transactionDate,
          transactionName: note || null,
          inputMethod: "manual",
        });
        if (selectedCategory.category_type === "expense") {
          const [year, month] = date.split("-").map(Number);

          const budget = await getBudgetStuatus(
            userId,
            selectedCategory.category_id,
            month,
            year,
          );

          if (budget && typeof onBudgetAlert === "function") {
            const limit = budget.amount_limit;
            const used  = budget.used;          // ← ตรงกับ alias "used" ใน SQL
            const remaining = limit - used;

            let level = null;
            if (used > limit) {
              level = "over";
            } else if (used > limit * 0.8) {
              level = "warning";
            }

            if (level) {
              onBudgetAlert({
                level,
                categoryName: selectedCategory.category_name,
                used,
                limit,
                remaining,
              });
            }
          }
        }

        // บันทึกสำเร็จ → reset form + scroll กลับไปหน้า category
        resetForm();
        return true;
      } catch (error) {
        console.error("บันทึกไม่สำเร็จ:", error);
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้ กรุณาลองใหม่");
        return false;
      }
    },
    [amount, date, note, time, selectedCategory, selectedMaslow, resetForm],
  );

  return {
    // state
    amount,
    setAmount,
    date,
    setDate,
    time,
    setTime,
    note,
    setNote,
    selectedCategory,
    setSelectedCategory,
    selectedMaslow,
    setSelectedMaslow,
    // refs
    scrollRef,
    // actions
    handleCategorySelect,
    handleSave,
    resetForm,
    // dynamic categories
    incomeCategories,
    expenseCategories,
    refreshCategories,
  };
};
