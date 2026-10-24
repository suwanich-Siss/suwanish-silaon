import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getMonthlyStats, getMaslowStats } from "../database/database";
import { syncDataToServer } from "../database/syncService";
import { useAuth } from "../context/AuthContext";
import { MASLOW_LEVELS } from "../constants/maslow";
import { MONTHS } from "../constants/months";

// greeting ตามช่วงเวลา
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12)  return "อรุณสวัสดิ์ ☀️";
  if (h < 18)  return "สวัสดีตอนบ่าย 🌤️";
  return "สวัสดีตอนค่ำ 🌙";
};

export const useHome = () => {
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;  // 1-12
  const currentYear  = now.getFullYear();

  const { user, syncToken } = useAuth();
  const userId = user?.user_id;

  const [summary,    setSummary]    = useState({ income: 0, expense: 0, balance: 0 });
  const [maslowStats,setMaslowStats]= useState([]);
  const [monthLabel, setMonthLabel] = useState(MONTHS[now.getMonth()]);
  const [isLoading,  setIsLoading]  = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [stats, maslow] = await Promise.all([
        getMonthlyStats(currentMonth, currentYear, userId),
        getMaslowStats(currentMonth, currentYear, userId),
      ]);

      setSummary({
        income:  stats.income,
        expense: stats.expense,
        balance: stats.savings,
      });

      // เติม config (สี, ไอคอน) จาก MASLOW_LEVELS
      const maslowMap = Object.fromEntries(MASLOW_LEVELS.map((m) => [m.id, m]));
      const totalExpense = stats.expense || 1;
      setMaslowStats(
        maslow.map((m) => ({
          ...m,
          color:   maslowMap[m.maslow_id]?.color || "#9CA3AF",
          icon:    maslowMap[m.maslow_id]?.icon  || "help-circle",
          title:   maslowMap[m.maslow_id]?.title || m.name_en,
          percent: Math.round((m.total / totalExpense) * 100),
        }))
      );

      setMonthLabel(MONTHS[currentMonth - 1]);
    } catch (error) {
      console.error("useHome loadData error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // โหลดใหม่ทุกครั้งที่กลับมาหน้า Home + sync ครั้งแรก
  useFocusEffect(
    useCallback(() => {
      loadData();
      syncDataToServer({ userId, syncToken }).catch(() => {});  // fire & forget
    }, [loadData, userId, syncToken])
  );

  return {
    greeting:   getGreeting(),
    summary,
    maslowStats,
    monthLabel,
    isLoading,
    loadData,
  };
};