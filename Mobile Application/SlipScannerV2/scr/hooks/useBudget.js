import { useState, useRef, useCallback, useEffect } from "react";
import { Alert, Animated, Easing } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  addBudget,
  getBudgetsWithUsage,
  deleteBudget,
  updateBudget,
  copyBudgetsFromLastMonth,
  getCategories,
} from "../database/database";
import { useAuth } from "../context/AuthContext";
import { MONTHS } from "../constants/months";

export { MONTHS };

export const useBudget = () => {
  const now = new Date();
  const { user } = useAuth();
  const userId = user?.user_id;

  // ── form state ────────────────────────────────────────────────────────────
  const [amount,         setAmount]         = useState("");
  const [budgetCategory, setBudgetCategory] = useState(null); // { category_id, category_name, category_type }

  // ── dynamic expense categories from DB ────────────────────────────────────
  const [expenseCategories, setExpenseCategories] = useState([]);

  const refreshExpenseCategories = useCallback(async () => {
    try {
      const rows = await getCategories('expense');
      setExpenseCategories(rows);
    } catch (e) {
      console.error('โหลดหมวดหมู่รายจ่ายไม่สำเร็จ:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshExpenseCategories();
    }, [refreshExpenseCategories])
  );

  // budgetMonth = 1–12  (ตรงกับ DB schema)
  const [budgetMonth, setBudgetMonth] = useState(now.getMonth() + 1);
  const [budgetYear,  setBudgetYear]  = useState(now.getFullYear());

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
  const [isLoading,           setIsLoading]           = useState(false);
  const [existingBudgets,     setExistingBudgets]     = useState([]);

  // editingBudget เก็บ object เต็ม (ไม่ใช่แค่ id) เพราะ PK เป็น composite key
  // { category_id, category_name, amount_limit, used }
  const [editingBudget, setEditingBudget] = useState(null);

  // ── Accordion animation ───────────────────────────────────────────────────
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const formHeight    = expandAnim.interpolate({ inputRange: [0,1], outputRange: [0, 360] });
  const formOpacity   = expandAnim.interpolate({ inputRange: [0,0.5,1], outputRange: [0,0,1] });
  const arrowRotation = expandAnim.interpolate({ inputRange: [0,1], outputRange: ["0deg","180deg"] });

  const toggleForm = () => {
    if (isFormExpanded) {
      setIsFormExpanded(false);
      Animated.timing(expandAnim, {
        toValue: 0, duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    } else {
      setIsFormExpanded(true);
      Animated.spring(expandAnim, {
        toValue: 1, friction: 6, tension: 50,
        useNativeDriver: false,
      }).start();
    }
  };

  // ── โหลดงบจาก DB ──────────────────────────────────────────────────────────
  const loadBudgets = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await copyBudgetsFromLastMonth(budgetMonth, budgetYear, userId);
      const data = await getBudgetsWithUsage(budgetMonth, budgetYear, userId);
      setExistingBudgets(data);
    } catch (error) {
      console.error("loadBudgets error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [budgetMonth, budgetYear, userId]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);
  useFocusEffect(useCallback(() => { loadBudgets(); }, [loadBudgets]));

  // ── บันทึกงบใหม่ ──────────────────────────────────────────────────────────
  const handleSaveBudget = useCallback(async () => {
    if (!amount || !budgetCategory) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกวงเงินและเลือกหมวดหมู่");
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกวงเงินที่ถูกต้อง");
      return;
    }

    try {
      await addBudget({
        userId,
        categoryId:  budgetCategory.category_id,
        amountLimit: parsed,
        month:       budgetMonth,
        year:        budgetYear,
      });

      Alert.alert("สำเร็จ", `บันทึกงบ "${budgetCategory.category_name}" เดือน${MONTHS[budgetMonth - 1]} แล้ว`);
      setAmount("");
      setBudgetCategory(null);
      setIsFormExpanded(false);
      expandAnim.setValue(0);
      await loadBudgets();
    } catch (error) {
      console.error("handleSaveBudget error:", error);
      Alert.alert("ข้อผิดพลาด", String(error));
    }
  }, [amount, budgetCategory, budgetMonth, budgetYear, loadBudgets, expandAnim]);

  // ── ลบงบ (composite PK — ไม่มี budget_id แล้ว) ───────────────────────────
  const handleDeleteBudget = useCallback((budget) => {
    Alert.alert(
      "ลบงบประมาณ",
      `ต้องการลบงบ "${budget.category_name}" เดือน${MONTHS[budgetMonth - 1]} ใช่ไหม?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ", style: "destructive",
          onPress: async () => {
            await deleteBudget({
              userId:     userId,
              categoryId: budget.category_id,
              month:      budgetMonth,
              year:       budgetYear,
            });
            await loadBudgets();
          },
        },
      ]
    );
  }, [budgetMonth, budgetYear, loadBudgets]);

  // ── แก้ไขวงเงิน ───────────────────────────────────────────────────────────
  const handleSaveEdit = useCallback(async (newAmount) => {
    if (!editingBudget) return;
    const parsed = parseFloat(newAmount);
    if (!newAmount || isNaN(parsed) || parsed <= 0) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกวงเงินที่ถูกต้อง");
      return;
    }
    await updateBudget({
      userId:      userId,
      categoryId:  editingBudget.category_id,
      month:       budgetMonth,
      year:        budgetYear,
      amountLimit: parsed,
    });
    setEditingBudget(null);
    await loadBudgets();
  }, [editingBudget, budgetMonth, budgetYear, loadBudgets]);

  // ── derived values ─────────────────────────────────────────────────────────
  const totalLimit = existingBudgets.reduce((s, b) => s + b.amount_limit, 0);
  const totalUsed  = existingBudgets.reduce((s, b) => s + b.used, 0);

  // ── helpers สำหรับ MonthPickerModal (รับ monthIndex 0-11) ─────────────────
  const setBudgetMonthIndex = (idx) => setBudgetMonth(idx + 1);
  const budgetMonthIndex    = budgetMonth - 1;

  return {
    // form
    amount,         setAmount,
    budgetCategory, setBudgetCategory,
    budgetMonthIndex, setBudgetMonthIndex,
    budgetYear,       setBudgetYear,
    // modal
    isMonthModalVisible, setIsMonthModalVisible,
    // accordion
    isFormExpanded, toggleForm,
    formHeight, formOpacity, arrowRotation,
    // data
    existingBudgets, isLoading,
    totalLimit, totalUsed,
    expenseCategories,
    // actions
    handleSaveBudget,
    handleDeleteBudget,  // รับ budget object (ไม่ใช่ id)
    handleSaveEdit,      // รับ newAmount string
    editingBudget, setEditingBudget,
    loadBudgets,
    // constants
    MONTHS,
  };
};