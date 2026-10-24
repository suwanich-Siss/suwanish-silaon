import { useState, useEffect, useCallback } from "react";
import {
  getMonthlyStats,
  getPrevMonthStats,
  getMaslowStats,
  getCategoryStats,
} from "../database/database";
import { useAuth } from "../context/AuthContext";
import { MASLOW_LEVELS } from "../constants/maslow";

// ── config สี/ไอคอน สำหรับ Maslow แต่ละระดับ ─────────────────────────────────
// ดึงจาก constants/maslow.js แล้ว map เป็น lookup ทันที
export const MASLOW_CONFIG = Object.fromEntries(
  MASLOW_LEVELS.map((m) => [
    m.id,
    { color: m.color, icon: m.icon, label: m.title, desc: m.sub },
  ])
);

// ── Health Score (50/30/20 rule) ─────────────────────────────────────────────
const calcHealthScore = (savingsRate) => {
  if (savingsRate >= 30) return { grade: "A",  score: 95, label: "สุขภาพการเงินยอดเยี่ยม!", sub: `ออมได้ ${savingsRate.toFixed(0)}% เกินเป้าหมาย 20%` };
  if (savingsRate >= 20) return { grade: "B+", score: 80, label: "สุขภาพการเงินดีมาก",      sub: `ออมได้ ${savingsRate.toFixed(0)}% ตามเป้าหมาย`     };
  if (savingsRate >= 10) return { grade: "B",  score: 65, label: "สุขภาพการเงินพอใช้",      sub: `ออมได้ ${savingsRate.toFixed(0)}% ลองเพิ่มอีกนิด`  };
  if (savingsRate >= 0)  return { grade: "C",  score: 45, label: "ควรลดค่าใช้จ่ายลง",      sub: `ออมได้ ${savingsRate.toFixed(0)}% ต่ำกว่าเป้า 20%`  };
  return                        { grade: "D",  score: 20, label: "รายจ่ายสูงกว่ารายรับ!",  sub: `ติดลบ ${Math.abs(savingsRate).toFixed(0)}% โปรดตรวจสอบ` };
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useAnalysis = () => {
  const now = new Date();
  const { user } = useAuth();
  const userId = user?.user_id;

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [isLoading,     setIsLoading]     = useState(true);

  const [summary,       setSummary]       = useState(null);
  const [healthScore,   setHealthScore]   = useState(null);
  const [momGrowth,     setMomGrowth]     = useState(0);
  const [maslowStats,   setMaslowStats]   = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);

  const loadAnalysis = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [stats, prevStats, maslow, categories] = await Promise.all([
        getMonthlyStats(selectedMonth, selectedYear, userId),
        getPrevMonthStats(selectedMonth, selectedYear, userId),
        getMaslowStats(selectedMonth, selectedYear, userId),
        getCategoryStats(selectedMonth, selectedYear, userId),
      ]);

      setSummary(stats);
      setHealthScore(calcHealthScore(stats.savingsRate));

      // MoM savings growth
      if (prevStats.savings !== 0) {
        setMomGrowth(((stats.savings - prevStats.savings) / Math.abs(prevStats.savings)) * 100);
      } else {
        setMomGrowth(stats.savings > 0 ? 100 : 0);
      }

      // Maslow: เติม config (สี, ไอคอน) + คำนวณ %
      const totalMaslow = maslow.reduce((s, m) => s + m.total, 0);
      setMaslowStats(
        maslow.map((m) => ({
          ...m,
          ...(MASLOW_CONFIG[m.maslow_id] ?? {
            color: "#9CA3AF", icon: "help-circle",
            label: m.name_en || "Other", desc: m.name_th || "",
          }),
          percent: totalMaslow > 0 ? (m.total / totalMaslow) * 100 : 0,
        }))
      );

      // Category: คำนวณ %
      const totalExpense = stats.expense || 1;
      setCategoryStats(
        categories.map((cat) => ({
          ...cat,
          percent: (cat.total / totalExpense) * 100,
        }))
      );
    } catch (error) {
      console.error("useAnalysis error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, userId]);

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  // ── helpers สำหรับ MonthPickerModal ที่ส่ง monthIndex (0-11) ─────────────
  // Screen ส่ง monthIndex มา → แปลงเป็น month 1-12 ก่อนเก็บ
  const setSelectedMonthIndex = (idx) => setSelectedMonth(idx + 1);
  const selectedMonthIndex    = selectedMonth - 1; // ส่งกลับเป็น 0-11 ให้ UI ใช้

  return {
    isLoading,
    summary,
    healthScore,
    momGrowth,
    maslowStats,
    categoryStats,
    // expose ทั้ง 2 รูปแบบ: index สำหรับ UI, month สำหรับ internal
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear,       setSelectedYear,
    loadAnalysis,
  };
};