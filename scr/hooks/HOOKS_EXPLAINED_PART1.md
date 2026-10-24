# 📚 คำอธิบายโค้ด: Custom Hooks (ส่วนที่ 1)

> ครอบคลุม: useAnalysis · useBudget · useBudgetToast · useCategoryUpdate · useCategoryManager

---

## 🧠 Custom Hook คืออะไร?

**Custom Hook** คือฟังก์ชัน JavaScript ธรรมดาที่:
- ชื่อต้องขึ้นต้นด้วย `use` เสมอ
- เรียกใช้ React Hook อื่นๆ ข้างในได้ (useState, useEffect, ฯลฯ)
- ใช้สำหรับ **แยก Logic ออกจาก UI** ทำให้ Screen ดูสะอาด

```
Screen (UI)  →  useXxx (Logic)  →  database.js (Data)
   แสดงผล         จัดการ state        อ่าน/เขียน DB
```

---

## 1️⃣ useAnalysis.js — วิเคราะห์สุขภาพการเงิน

### 📌 ไฟล์นี้ทำอะไร?
ดึงข้อมูลสถิติรายเดือน คำนวณ Health Score และจัดเตรียมข้อมูลสำหรับกราฟ

---

### 📦 Import

```js
import { useState, useEffect, useCallback } from "react";
```
- `useState` — เก็บค่าที่เปลี่ยนได้ใน component
- `useEffect` — รันโค้ดเมื่อค่าบางอย่างเปลี่ยน
- `useCallback` — จดจำฟังก์ชัน ไม่สร้างใหม่ทุก render

```js
import { MASLOW_LEVELS } from "../constants/maslow";
```
- ดึงข้อมูลสี/ไอคอน/ชื่อ ของแต่ละระดับมาสโลว์จากไฟล์ constants

---

### 🎨 MASLOW_CONFIG — แปลง Array เป็น Object สำหรับ Lookup

```js
export const MASLOW_CONFIG = Object.fromEntries(
  MASLOW_LEVELS.map((m) => [
    m.id,
    { color: m.color, icon: m.icon, label: m.title, desc: m.sub },
  ])
);
```

**ทำความเข้าใจทีละขั้น:**

```js
// MASLOW_LEVELS มีหน้าตาแบบนี้ (array):
[
  { id: 1, title: "ปัจจัย 4", color: "#...", icon: "home", sub: "..." },
  { id: 2, title: "ความปลอดภัย", color: "#...", ... },
]

// .map() แปลงแต่ละตัวเป็น [key, value] pair:
[
  [1, { color: "#...", icon: "home", label: "ปัจจัย 4", desc: "..." }],
  [2, { color: "#...", ... }],
]

// Object.fromEntries() แปลง array of pairs เป็น object:
{
  1: { color: "#...", icon: "home", label: "ปัจจัย 4", desc: "..." },
  2: { color: "#...", ... },
}
```

ทำไมต้องแปลง? เพราะต้องการเข้าถึงข้อมูลด้วย ID เช่น `MASLOW_CONFIG[3]`  
แทนที่จะ loop หา id ทุกครั้ง (เร็วกว่า O(1) vs O(n))

---

### 🏥 calcHealthScore — คำนวณเกรดสุขภาพการเงิน

```js
const calcHealthScore = (savingsRate) => {
  if (savingsRate >= 30) return { grade: "A",  score: 95, label: "สุขภาพการเงินยอดเยี่ยม!", ... };
  if (savingsRate >= 20) return { grade: "B+", score: 80, label: "สุขภาพการเงินดีมาก",      ... };
  if (savingsRate >= 10) return { grade: "B",  score: 65, label: "สุขภาพการเงินพอใช้",      ... };
  if (savingsRate >= 0)  return { grade: "C",  score: 45, label: "ควรลดค่าใช้จ่ายลง",      ... };
  return                        { grade: "D",  score: 20, label: "รายจ่ายสูงกว่ารายรับ!",  ... };
};
```

- รับ `savingsRate` (อัตราการออมเป็น %) แล้วคืน object ที่มีเกรด/คะแนน/ข้อความ
- ตรวจจากมากไปน้อย — ถ้าเข้าเงื่อนไขแรกก็ return ออกทันที ไม่ตรวจที่เหลือ
- `savingsRate.toFixed(0)` — ปัดทศนิยมให้เป็นจำนวนเต็ม เช่น 25.7 → "26"
- `Math.abs(savingsRate)` — ค่าสัมบูรณ์ (ลบลบเป็นบวก) สำหรับแสดงตัวเลขติดลบ

---

### ⚙️ useAnalysis Hook — ส่วนหลัก

#### State ทั้งหมด

```js
const now = new Date();           // เวลาปัจจุบัน
const { user } = useAuth();       // ดึง user จาก AuthContext
const userId = user?.user_id;     // ?. = ป้องกัน error ถ้า user เป็น null

const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
// now.getMonth() คืน 0-11 → บวก 1 ให้เป็น 1-12

const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
const [isLoading,     setIsLoading]     = useState(true);
// isLoading = true ตั้งแต่แรก เพราะยังไม่ได้โหลดข้อมูล

const [summary,       setSummary]       = useState(null);
const [healthScore,   setHealthScore]   = useState(null);
const [momGrowth,     setMomGrowth]     = useState(0);
// MoM = Month-over-Month การเติบโตเทียบเดือนก่อน

const [maslowStats,   setMaslowStats]   = useState([]);
const [categoryStats, setCategoryStats] = useState([]);
```

---

#### loadAnalysis — โหลดข้อมูลทั้งหมด

```js
const loadAnalysis = useCallback(async () => {
  if (!userId) return;   // ยังไม่ login → หยุด
  setIsLoading(true);
  try {
    // โหลด 4 อย่างพร้อมกัน (เร็วกว่าทำทีละอัน)
    const [stats, prevStats, maslow, categories] = await Promise.all([
      getMonthlyStats(selectedMonth, selectedYear, userId),
      getPrevMonthStats(selectedMonth, selectedYear, userId),
      getMaslowStats(selectedMonth, selectedYear, userId),
      getCategoryStats(selectedMonth, selectedYear, userId),
    ]);
```

- `Promise.all([...])` — รัน async function ทั้งหมดพร้อมกัน รอจนครบทุกตัว
- Array Destructuring: `const [a, b, c, d] = await Promise.all([...])` แกะผลลัพธ์ตามลำดับ

```js
    setSummary(stats);
    setHealthScore(calcHealthScore(stats.savingsRate));
```

```js
    // MoM savings growth — เปรียบเทียบการออมเดือนนี้กับเดือนก่อน
    if (prevStats.savings !== 0) {
      setMomGrowth(
        ((stats.savings - prevStats.savings) / Math.abs(prevStats.savings)) * 100
      );
    } else {
      // เดือนก่อนออมได้ 0 — ใช้กฎพิเศษ ไม่งั้นหารด้วย 0
      setMomGrowth(stats.savings > 0 ? 100 : 0);
    }
```

สูตร: `(ใหม่ - เก่า) / |เก่า| × 100` = การเปลี่ยนแปลงเป็น %

```js
    // เติมข้อมูล config (สี, ไอคอน) ให้แต่ละระดับมาสโลว์
    const totalMaslow = maslow.reduce((s, m) => s + m.total, 0);
    // reduce: สะสมผลรวมจาก array → totalMaslow = ยอดรายจ่ายทั้งหมด
    
    setMaslowStats(
      maslow.map((m) => ({
        ...m,                          // copy ทุก field เดิม
        ...(MASLOW_CONFIG[m.maslow_id] ?? {  // ?? = ถ้า undefined ให้ใช้ค่า default
          color: "#9CA3AF", icon: "help-circle",
          label: m.name_en || "Other", desc: m.name_th || "",
        }),
        percent: totalMaslow > 0 ? (m.total / totalMaslow) * 100 : 0,
        // ป้องกัน divide by zero
      }))
    );
```

- `...m` (Spread Operator) — copy ทุก property ของ object m
- `...MASLOW_CONFIG[m.maslow_id]` — ต่อท้ายด้วย config (ถ้าชื่อซ้ำกัน ตัวหลังชนะ)

```js
    // คำนวณ % ของแต่ละหมวดหมู่
    const totalExpense = stats.expense || 1;  // || 1 ป้องกัน /0 เมื่อไม่มีรายจ่าย
    setCategoryStats(
      categories.map((cat) => ({
        ...cat,
        percent: (cat.total / totalExpense) * 100,
      }))
    );
  } catch (error) {
    console.error("useAnalysis error:", error);
  } finally {
    setIsLoading(false);  // finally รันเสมอ ไม่ว่าจะสำเร็จหรือ error
  }
}, [selectedMonth, selectedYear, userId]);
// dependency array: สร้างฟังก์ชันใหม่เมื่อค่าเหล่านี้เปลี่ยน
```

```js
useEffect(() => { loadAnalysis(); }, [loadAnalysis]);
// รัน loadAnalysis ทุกครั้งที่ loadAnalysis เปลี่ยน (= เมื่อ month/year/userId เปลี่ยน)
```

---

#### Month Index Conversion

```js
// UI ส่ง monthIndex (0-11) มา → แปลงเป็น month (1-12) ก่อนเก็บ
const setSelectedMonthIndex = (idx) => setSelectedMonth(idx + 1);
const selectedMonthIndex    = selectedMonth - 1;  // ส่งกลับเป็น 0-11 ให้ UI
```

ทำไมต้องแปลง? เพราะ React Native DatePicker ใช้ index 0-11  
แต่ DB เก็บ month 1-12 ตาม schema

---

## 2️⃣ useBudget.js — จัดการงบประมาณ

### 📌 ไฟล์นี้ทำอะไร?
จัดการ CRUD ของงบประมาณ + Animation ของ form accordion + โหลดข้อมูลจาก DB

---

### 📦 Import พิเศษ

```js
import { Alert, Animated, Easing } from "react-native";
```
- `Alert` — popup แจ้งเตือน
- `Animated` — ระบบ animation ของ React Native
- `Easing` — กำหนดรูปแบบความเร็วของ animation

```js
import { useFocusEffect } from "@react-navigation/native";
```
- รันโค้ดทุกครั้งที่หน้าจอนี้ "ถูก focus" (กลับมาจากหน้าอื่น)
- ต่างจาก useEffect ที่รันแค่ครั้งแรก

```js
import { useRef } from "react";
```
- `useRef` — เก็บค่าที่ไม่ทำให้ re-render เมื่อเปลี่ยน (เหมาะกับ Animated.Value)

---

### 🎭 Accordion Animation

```js
const expandAnim = useRef(new Animated.Value(0)).current;
// Animated.Value(0) = ค่าเริ่มต้น 0 สำหรับ animation
// useRef ป้องกันการสร้าง Animated.Value ใหม่ทุก render
// .current = ดึงค่าจาก ref object
```

```js
// interpolate = แปลงค่า input → output ตาม range ที่กำหนด
const formHeight = expandAnim.interpolate({
  inputRange:  [0, 1],        // ค่า animation: 0 = ปิด, 1 = เปิด
  outputRange: [0, 360],      // ความสูง: 0px → 360px
});

const formOpacity = expandAnim.interpolate({
  inputRange:  [0, 0.5, 1],   // 3 จุด
  outputRange: [0, 0,   1],   // ใส 0 ช่วงแรก → ค่อยๆ โชว์
});
// ทำให้ content โผล่มาช้ากว่า container เล็กน้อย (effect สวยงาม)

const arrowRotation = expandAnim.interpolate({
  inputRange:  [0, 1],
  outputRange: ["0deg", "180deg"],  // หมุนลูกศร 180 องศา
});
```

```js
const toggleForm = () => {
  if (isFormExpanded) {
    // ปิด form: ใช้ timing animation (เส้นตรง)
    setIsFormExpanded(false);
    Animated.timing(expandAnim, {
      toValue: 0,           // animate ไปที่ 0 (ปิด)
      duration: 300,        // 300ms
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),  // cubic-bezier curve (smooth)
      useNativeDriver: false,  // false เพราะ animate height (ไม่ใช่ transform)
    }).start();
  } else {
    // เปิด form: ใช้ spring animation (กระเด้ง)
    setIsFormExpanded(true);
    Animated.spring(expandAnim, {
      toValue: 1,           // animate ไปที่ 1 (เปิด)
      friction: 6,          // แรงต้าน (ยิ่งมาก ยิ่งกระเด้งน้อย)
      tension: 50,          // ความตึง (ยิ่งมาก ยิ่งเร็ว)
      useNativeDriver: false,
    }).start();
  }
};
```

---

### 📥 loadBudgets — โหลดงบจาก DB

```js
const loadBudgets = useCallback(async () => {
  if (!userId) return;
  setIsLoading(true);
  try {
    // คัดลอกงบจากเดือนก่อนก่อน (ถ้าเดือนนี้ยังไม่มีงบ)
    await copyBudgetsFromLastMonth(budgetMonth, budgetYear, userId);
    // แล้วค่อยโหลดพร้อม usage
    const data = await getBudgetsWithUsage(budgetMonth, budgetYear, userId);
    setExistingBudgets(data);
  } catch (error) {
    console.error("loadBudgets error:", error);
  } finally {
    setIsLoading(false);
  }
}, [budgetMonth, budgetYear, userId]);

useEffect(() => { loadBudgets(); }, [loadBudgets]);
// รันเมื่อ mount และเมื่อ month/year เปลี่ยน

useFocusEffect(useCallback(() => { loadBudgets(); }, [loadBudgets]));
// รันทุกครั้งที่กลับมาหน้านี้ (เช่น กลับจากหน้าเพิ่มหมวดหมู่)
```

---

### 💾 handleSaveBudget — บันทึกงบใหม่

```js
const handleSaveBudget = useCallback(async () => {
  // Validation ก่อนบันทึก
  if (!amount || !budgetCategory) {
    Alert.alert("แจ้งเตือน", "กรุณากรอกวงเงินและเลือกหมวดหมู่");
    return;
  }
  const parsed = parseFloat(amount);  // แปลง string → number
  if (isNaN(parsed) || parsed <= 0) {
    Alert.alert("แจ้งเตือน", "กรุณากรอกวงเงินที่ถูกต้อง");
    return;
  }

  try {
    await addBudget({ userId, categoryId: budgetCategory.category_id, ... });

    Alert.alert("สำเร็จ",
      `บันทึกงบ "${budgetCategory.category_name}" เดือน${MONTHS[budgetMonth - 1]} แล้ว`
    );
    // MONTHS[budgetMonth - 1]: เดือน 1 → index 0 = "มกราคม"

    // Reset form
    setAmount("");
    setBudgetCategory(null);
    setIsFormExpanded(false);
    expandAnim.setValue(0);   // reset animation ทันที (ไม่ animate)
    await loadBudgets();
  } catch (error) {
    Alert.alert("ข้อผิดพลาด", String(error));
  }
}, [amount, budgetCategory, budgetMonth, budgetYear, loadBudgets, expandAnim]);
```

---

### 🗑️ handleDeleteBudget — ลบงบ

```js
const handleDeleteBudget = useCallback((budget) => {
  Alert.alert(
    "ลบงบประมาณ",
    `ต้องการลบงบ "${budget.category_name}" ... ใช่ไหม?`,
    [
      { text: "ยกเลิก", style: "cancel" },   // ปุ่มยกเลิก
      {
        text: "ลบ", style: "destructive",     // ปุ่มสีแดง
        onPress: async () => {
          await deleteBudget({
            userId,
            categoryId: budget.category_id,  // composite PK ไม่มี budget_id
            month: budgetMonth,
            year: budgetYear,
          });
          await loadBudgets();
        },
      },
    ]
  );
}, [budgetMonth, budgetYear, loadBudgets]);
```

- ใช้ `Alert.alert` 3 arguments: title, message, buttons array
- `style: "destructive"` = ปุ่มสีแดงบน iOS (Android ไม่ต่าง)
- รับ `budget` object ทั้งก้อน เพราะ primary key เป็น composite (ไม่มี single id)

---

### 📊 Derived Values

```js
// คำนวณจากข้อมูลที่มีอยู่ ไม่ต้อง state แยก
const totalLimit = existingBudgets.reduce((s, b) => s + b.amount_limit, 0);
const totalUsed  = existingBudgets.reduce((s, b) => s + b.used,         0);
// reduce: เริ่มจาก 0, บวกทีละรายการ จนครบ array
```

---

## 3️⃣ useBudgetToast.js — แจ้งเตือนงบเกิน

### 📌 ไฟล์นี้ทำอะไร?
จัดการ state ของ Toast notification (แจ้งเตือนเล็กๆ ที่โผล่ชั่วคราว) เมื่องบประมาณใกล้หรือเกิน

```js
export const useBudgetToast = () => {
  const [toastMessage, setToastMessage] = useState({
    visible: false,       // ซ่อนอยู่
    level: null,          // "warning" หรือ "over"
    categoryName: null,   // ชื่อหมวดหมู่
    remaining: 0,         // เงินคงเหลือ
  });
```

State เป็น object เดียว แทนที่จะเป็น state แยก 4 ตัว → จัดการง่ายกว่า

```js
  const showToast = useCallback((data) => {
    setToastMessage({
      visible: true,          // แสดง toast
      level: data.level,
      categoryName: data.categoryName,
      remaining: data.remaining,
    });
  }, []);
  // useCallback ไม่มี dependency → สร้างฟังก์ชันครั้งเดียว ไม่สร้างใหม่

  const hideToast = useCallback(() => {
    setToastMessage((prev) => ({ ...prev, visible: false }));
    // (prev) => ... = Functional update: ใช้ค่าเดิมทั้งหมด เปลี่ยนแค่ visible
  }, []);
```

---

## 4️⃣ useCategoryUpdate.js — ตรวจอัปเดตหมวดหมู่จาก Server

### 📌 ไฟล์นี้ทำอะไร?
ตรวจสอบว่า Server มีหมวดหมู่ใหม่ไหม และอัปเดตลง SQLite (เรียกเองจาก UI เท่านั้น ไม่ auto)

```js
export const useCategoryUpdate = (onUpdate) => {
  // onUpdate = callback ที่ caller ส่งมา (เช่น reload list)
  
  const isCheckingRef = useRef(false);
  // useRef เก็บ flag ป้องกัน double-call
  // ทำไมไม่ใช้ useState? เพราะไม่ต้องการ re-render เมื่อ flag เปลี่ยน
```

```js
  const checkForCategoryUpdates = useCallback(async () => {
    // ป้องกัน double-call (ถ้ากำลังตรวจอยู่ → return ทันที)
    if (isCheckingRef.current) return { alreadyChecking: true };
    isCheckingRef.current = true;  // ตั้ง flag = กำลังทำงาน
    
    try {
      const { hasUpdate, serverCategories } = await checkCategoryUpdates();
      // Object Destructuring: แกะ property ออกจาก object

      if (!hasUpdate) {
        Alert.alert("หมวดหมู่เป็นปัจจุบันแล้ว", "ไม่พบการอัปเดตจากเซิร์ฟเวอร์");
        return { hasUpdate: false };
      }

      // ถ้ามีอัปเดต → ถามผู้ใช้ก่อน
      Alert.alert(
        "พบการอัปเดตหมวดหมู่",
        "มีหมวดหมู่ใหม่จากเซิร์ฟเวอร์ ...",
        [
          {
            text: "อัปเดต",
            onPress: async () => {
              await saveCategoriesToDatabase(serverCategories);
              Alert.alert("✅ อัปเดตหมวดหมู่เรียบร้อยแล้ว");
              if (onUpdate) onUpdate();  // เรียก callback (ถ้ามี)
            }
          },
          { text: "ไว้ก่อนนะ", style: "cancel" }
        ]
      );
      return { hasUpdate: true };
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตรวจสอบอัปเดตได้");
      return { error: error.message };
    } finally {
      isCheckingRef.current = false;  // คืน flag ไม่ว่าจะสำเร็จหรือเปล่า
    }
  }, [onUpdate]);

  return { checkForCategoryUpdates, isCheckingRef };
};
```

**Pattern: Guard Clause**
```
ถ้ากำลังทำอยู่ → return ทันที (ไม่รัน logic ซ้ำ)
```

---

## 5️⃣ useCategoryManager.js — จัดการ CRUD หมวดหมู่

### 📌 ไฟล์นี้ทำอะไร?
โหลด/เพิ่ม/แก้ไข/ลบหมวดหมู่ พร้อม validation ก่อนทุก operation

```js
import {
  validateCategoryName,
  validateCategoryType,
  checkDuplicateName,
} from '../utils/categoryValidation';
```
- validation logic แยกไปไฟล์ utils เพื่อ reuse ได้

---

### State และ Derived Values

```js
const [categories, setCategories] = useState([]);

// Derived: คำนวณจาก categories โดยตรง ไม่ต้อง state แยก
const incomeCategories  = categories.filter(c => c.category_type === 'income');
const expenseCategories = categories.filter(c => c.category_type === 'expense');
```

- `filter` คืน array ใหม่ที่มีเฉพาะรายการที่ผ่านเงื่อนไข
- คำนวณ re-render ทุกครั้ง แต่เร็วมากเพราะ categories ไม่ใหญ่

---

### createCategory — เพิ่มหมวดหมู่ใหม่

```js
const createCategory = useCallback(async ({ categoryName, categoryType }) => {
  // Validation: ตรวจทีละขั้น return ถ้า fail
  const n = validateCategoryName(categoryName);
  if (!n.valid) return { success: false, error: n.error };
  // ถ้า name ไม่ valid → return ทันที ไม่ตรวจขั้นต่อไป

  const t = validateCategoryType(categoryType);
  if (!t.valid) return { success: false, error: t.error };

  const d = checkDuplicateName(categoryName, categoryType, categories);
  if (!d.valid) return { success: false, error: d.error };
  // ป้องกันชื่อซ้ำในประเภทเดียวกัน

  try {
    await addCategory({ categoryName, categoryType });
    await loadCategories();              // โหลดใหม่หลังเพิ่ม
    return { success: true };
  } catch (e) {
    return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}, [categories, loadCategories]);
```

**Pattern: Early Return Validation**
```
ตรวจ 1 → fail? return error
ตรวจ 2 → fail? return error  
ตรวจ 3 → fail? return error
ทุก validate ผ่าน → ทำงานจริง
```

---

### editCategory — แก้ไขชื่อหมวดหมู่

```js
const editCategory = useCallback(async (categoryId, newName) => {
  // หา category เดิมเพื่อดู type (ต้องการสำหรับ duplicate check)
  const existing = categories.find(c => c.category_id === categoryId);
  // .find() = คืนรายการแรกที่ตรงเงื่อนไข (หรือ undefined)

  const n = validateCategoryName(newName);
  if (!n.valid) return { success: false, error: n.error };

  // ส่ง categoryId ด้วย เพื่อให้ checkDuplicateName ข้ามตัวเอง
  const d = checkDuplicateName(newName, existing.category_type, categories, categoryId);
  if (!d.valid) return { success: false, error: d.error };

  try {
    await updateCategoryName(categoryId, newName);
    await loadCategories();
    return { success: true };
  } catch (e) {
    return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}, [categories, loadCategories]);
```

---

### deleteCategory — ลบหมวดหมู่

```js
const deleteCategory = useCallback(async (categoryId) => {
  try {
    const result = await safeDeleteCategory(categoryId);
    // safeDeleteCategory ตรวจว่ามี transaction อ้างอิงอยู่ไหม
    
    if (!result.success) {
      return { success: false, error: 'ไม่สามารถลบได้ — หมวดหมู่นี้มีรายการธุรกรรมอยู่' };
    }
    await loadCategories();
    return { success: true };
  } catch (e) {
    return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}, [loadCategories]);
```

---

### useEffect สำหรับ Initial Load

```js
useEffect(() => {
  loadCategories();
}, [loadCategories]);
// [] = dependency array ว่าง → รันแค่ครั้งแรก (mount)
// แต่ใส่ loadCategories เป็น dependency ด้วย เพราะ eslint แนะนำ
```

---

## 🔑 สรุป Patterns ที่ใช้ใน Part 1

| Pattern | ตัวอย่าง | ประโยชน์ |
|---------|---------|---------|
| **Promise.all** | `await Promise.all([...])` | โหลดหลายอย่างพร้อมกัน เร็วขึ้น |
| **Derived State** | `categories.filter(...)` | ไม่ต้องมี state แยก ลด bug |
| **Early Return Validation** | `if (!valid) return error` | โค้ดอ่านง่าย ไม่ซ้อน if |
| **useRef for flag** | `isCheckingRef.current` | ไม่ trigger re-render |
| **Functional Update** | `prev => ({ ...prev, x: y })` | อัปเดต state ปลอดภัย |
| **useCallback + deps** | `useCallback(fn, [deps])` | ไม่สร้างฟังก์ชันใหม่ทุก render |
| **Object.fromEntries** | MASLOW_CONFIG | Lookup O(1) แทน loop O(n) |
| **Spread + Override** | `{ ...m, ...config }` | merge object โดยตัวหลังชนะ |
