// ─────────────────────────────────────────────
// hooks/useHistory.js
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { getTransactionsByMonth, getSlips, getCategories, deleteTransaction } from "../database/database";
import { useAuth } from "../context/AuthContext";
import { MASLOW_LEVELS } from "../constants/maslow";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../constants/categories";

// re-export เพื่อให้ Screen import ได้ผ่านที่เดียว
export { INCOME_CATEGORIES, EXPENSE_CATEGORIES, MASLOW_LEVELS };

// ── Lookup maps ───────────────────────────────────────────────────────────────
const MASLOW_MAP = Object.fromEntries(MASLOW_LEVELS.map((m) => [m.id, m]));

// ── Formatters ────────────────────────────────────────────────────────────────
// transactions จาก getTransactionsByMonth มี category_type จาก JOIN แล้ว
const formatTransaction = (tx, catMap) => {
  const cat = catMap[tx.category_id];
  const mas = MASLOW_MAP[tx.maslow_id];
  return {
    id: `manual_${tx.transaction_id}`,
    sync_id: tx.sync_id,
    amount: parseFloat(tx.amount) || 0,
    date: tx.transaction_date || "",
    name: tx.transaction_name || "ไม่ระบุชื่อ",
    type: tx.category_type,          // ← จาก JOIN (income/expense)
    category_id: tx.category_id ?? null,
    category_name: tx.category_name || cat?.name || "",
    category_icon: cat?.icon || "",
    maslow_id: tx.maslow_id ?? null,
    maslow_title: mas?.title || "",
    maslow_sub: mas?.sub || "",
    maslow_color: mas?.color || "",
    maslow_icon: mas?.icon || "",
    source: tx.input_method === "ocr" ? "ocr" : "manual",
    status: "confirmed",
  };
};

// slips จาก getSlips มี category_id, maslow_id (snake_case), category_name จาก JOIN
const formatSlip = (slip, catMap) => {
  const cat = catMap[slip.category_id];
  const mas = MASLOW_MAP[slip.maslow_id];

  return {
    id: `ocr_${slip.transaction_id}`,
    amount: parseFloat(slip.amount) || 0,
    date: slip.transaction_date || "",
    name: slip.transaction_name || "สลิป",
    type: "expense",
    category_id: slip.category_id ?? null,
    category_name: slip.category_name || cat?.name || "",
    category_icon: cat?.icon || "",
    maslow_id: slip.maslow_id ?? null,
    maslow_title: mas?.title || "",
    maslow_sub: mas?.sub || "",
    maslow_color: mas?.color || "",
    maslow_icon: mas?.icon || "",
    imageUri: slip.image_uri ?? null,
    slip_ref: slip.slip_ref,
    source: "ocr",
    status: slip.status ?? "confirmed",
  };
};

const sortByDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useHistory = () => {
  const now = new Date();
  const { user } = useAuth();
  const userId = user?.user_id;

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const handleSetFilter = useCallback((newFilter) => {
    setFilter(newFilter);
    setFilterCategory("");
  }, []);

  // ── Lookup maps ─────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  //
  const loadHistory = useCallback(async () => {

    if (!userId) return;
    setIsLoading(true);
    try {
      const [transactions, slips, categories] = await Promise.all([
        getTransactionsByMonth(selectedMonth, selectedYear, userId),
        getSlips(userId),
        getCategories(),
      ]);
      setCategories(categories);
      const catMap = Object.fromEntries(categories.map((c) => [c.category_id || c.id, c]));
      // getTransactionsByMonth คืนทั้ง manual + ocr — แยก ocr ออก (ใช้ getSlips แทน)
      const manualTx = transactions.filter((tx) => tx.input_method !== "ocr");

      // กรอง slips ให้อยู่ในเดือนที่เลือกด้วย
      const mm = String(selectedMonth).padStart(2, "0");
      const monthPrefix = `${selectedYear}-${mm}`;
      const filteredSlips = slips.filter(
        (s) => s.transaction_date?.startsWith(monthPrefix)
      );

      const merged = [
        ...manualTx.map((tx) => formatTransaction(tx, catMap)),
        ...filteredSlips.map((slip) => formatSlip(slip, catMap)),
      ].sort(sortByDateDesc);

      setHistory(merged);
    } catch (error) {
      console.error("useHistory error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, userId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    if (!userId) return;
    try {
      const cleanId = String(transactionId).replace(/^(manual_|ocr_)/, "");
      await deleteTransaction(cleanId, userId);

      await loadHistory();
    } catch (error) {
      console.error("useHistory error:", error);
    }
  }, [userId, loadHistory]);

  // ── filtered view ─────────────────────────────────────────────────────────
  const filteredHistory = history.filter((item) => {
    if (filter === "income" && item.type !== "income") return false;
    if (filter === "expense" && item.type !== "expense") return false;
    if (filter === "ocr" && item.source !== "ocr") return false;
    if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    if (filterCategory && item.category_name !== filterCategory) return false;
    return true;
  });

  // ── helpers สำหรับ MonthPickerModal (รับ monthIndex 0-11) ─────────────────
  const setSelectedMonthIndex = (idx) => setSelectedMonth(idx + 1);
  const selectedMonthIndex = selectedMonth - 1;

  const incomeCategories = categories.filter(c => c.category_type === "income" || c.type === "income");
  const expenseCategories = categories.filter(c => c.category_type === "expense" || c.type === "expense");

  return {
    filteredHistory,
    isLoading,
    filter, handleSetFilter,
    searchText, setSearchText,
    filterCategory, setFilterCategory,
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear, setSelectedYear,
    loadHistory,
    handleDeleteTransaction,
    incomeCategories,
    expenseCategories,
  };
};