# 📚 คำอธิบายโค้ด: Custom Hooks (ส่วนที่ 2)

> ครอบคลุม: useHistory · useHome · useSlipScanner · useTransaction

---

## 6️⃣ useHistory.js — ประวัติรายการธุรกรรม

### 📌 ไฟล์นี้ทำอะไร?
ดึงรายการธุรกรรม + สลิป OCR ของเดือนที่เลือก แล้วรวมเป็น list เดียว พร้อมระบบ filter/search

---

### 📦 Import และ Lookup Maps

```js
import { MASLOW_LEVELS } from "../constants/maslow";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../constants/categories";

// re-export: ให้ Screen import ได้ผ่าน hook นี้ที่เดียว ไม่ต้อง import 2 ที่
export { INCOME_CATEGORIES, EXPENSE_CATEGORIES, MASLOW_LEVELS };
```

```js
// สร้าง lookup map สำหรับ maslow — เข้าถึงได้ด้วย ID
const MASLOW_MAP = Object.fromEntries(MASLOW_LEVELS.map((m) => [m.id, m]));
// ผลลัพธ์: { 1: { id:1, title:"ปัจจัย 4", ... }, 2: {...}, ... }
```

---

### 🔄 formatTransaction — แปลง raw DB row → UI object

```js
const formatTransaction = (tx, catMap) => {
  const cat = catMap[tx.category_id];  // หา category จาก map (O(1))
  const mas = MASLOW_MAP[tx.maslow_id]; // หา maslow จาก map (O(1))
  
  return {
    id: `manual_${tx.transaction_id}`,
    // ใส่ prefix เพื่อแยกออกจาก ocr_ ตอนลบ
    
    sync_id:       tx.sync_id,
    amount:        parseFloat(tx.amount) || 0,
    // parseFloat แปลง string → number, || 0 ป้องกัน NaN
    
    date:          tx.transaction_date || "",
    name:          tx.transaction_name || "ไม่ระบุชื่อ",
    // || "ค่า default" ป้องกัน null/undefined
    
    type:          tx.category_type,     // มาจาก JOIN แล้ว
    category_id:   tx.category_id ?? null,
    // ?? null: ถ้า undefined ให้เป็น null (ต่างจาก || ตรงที่ 0/"" ไม่ถูกแทน)
    
    category_name: tx.category_name || cat?.name || "",
    // ลำดับความสำคัญ: จาก JOIN → จาก catMap → string ว่าง
    
    category_icon: cat?.icon || "",
    maslow_id:     tx.maslow_id ?? null,
    maslow_title:  mas?.title || "",    // ?. = Optional Chaining (ป้องกัน mas เป็น null)
    maslow_color:  mas?.color || "",
    maslow_icon:   mas?.icon  || "",
    source:        tx.input_method === "ocr" ? "ocr" : "manual",
    status:        "confirmed",
  };
};
```

---

### 🧾 formatSlip — แปลง slip OCR → UI object

```js
const formatSlip = (slip, catMap) => {
  const cat = catMap[slip.category_id];
  const mas = MASLOW_MAP[slip.maslow_id];

  return {
    id:   `ocr_${slip.transaction_id}`,   // prefix ต่างจาก manual
    type: "expense",                       // สลิปเป็นรายจ่ายเสมอ
    // ...fields อื่นๆ คล้าย formatTransaction
    imageUri:  slip.image_uri ?? null,
    slip_ref:  slip.slip_ref,
    source:    "ocr",
    status:    slip.status ?? "confirmed",
  };
};
```

```js
// Sort helper: เรียงจากใหม่ไปเก่า
const sortByDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
// new Date("2025-01-15") - new Date("2025-01-10") = บวก → b อยู่ก่อน a
```

---

### ⚙️ Hook State

```js
const [filter,         setFilter]         = useState("all");
// "all" | "income" | "expense" | "ocr"

const [searchText,     setSearchText]     = useState("");
const [filterCategory, setFilterCategory] = useState("");

// handleSetFilter รีเซ็ต filterCategory ด้วยทุกครั้ง
const handleSetFilter = useCallback((newFilter) => {
  setFilter(newFilter);
  setFilterCategory("");  // clear category filter เมื่อเปลี่ยน type filter
}, []);
```

---

### 📥 loadHistory — โหลดและรวมข้อมูล

```js
const loadHistory = useCallback(async () => {
  if (!userId) return;
  setIsLoading(true);
  try {
    // โหลด 3 อย่างพร้อมกัน
    const [transactions, slips, categories] = await Promise.all([
      getTransactionsByMonth(selectedMonth, selectedYear, userId),
      getSlips(userId),      // โหลดทุก slip ของ user (กรองทีหลัง)
      getCategories(),
    ]);

    // สร้าง catMap สำหรับ lookup
    const catMap = Object.fromEntries(
      categories.map((c) => [c.category_id || c.id, c])
    );
    // c.category_id || c.id : รองรับ 2 รูปแบบ field name

    // แยก OCR ออกจาก transactions (getTransactionsByMonth คืนทั้งหมด)
    const manualTx = transactions.filter((tx) => tx.input_method !== "ocr");

    // กรอง slips ให้อยู่ในเดือนที่เลือก
    const mm = String(selectedMonth).padStart(2, "0");
    const monthPrefix = `${selectedYear}-${mm}`;   // เช่น "2025-03"
    const filteredSlips = slips.filter(
      (s) => s.transaction_date?.startsWith(monthPrefix)
      // "2025-03-15T10:00:00".startsWith("2025-03") = true
    );

    // รวมและเรียง
    const merged = [
      ...manualTx.map((tx) => formatTransaction(tx, catMap)),
      ...filteredSlips.map((slip) => formatSlip(slip, catMap)),
    ].sort(sortByDateDesc);
    // Spread [...a, ...b] = รวม 2 array เป็น array เดียว

    setHistory(merged);
  } catch (error) {
    console.error("useHistory error:", error);
  } finally {
    setIsLoading(false);
  }
}, [selectedMonth, selectedYear, userId]);
```

---

### 🗑️ handleDeleteTransaction

```js
const handleDeleteTransaction = useCallback(async (transactionId) => {
  if (!userId) return;
  try {
    // ลบ prefix ออก: "manual_42" → "42", "ocr_7" → "7"
    const cleanId = String(transactionId).replace(/^(manual_|ocr_)/, "");
    // Regex: ^ = ต้นสาย, (manual_|ocr_) = คำใดคำหนึ่ง
    
    await deleteTransaction(cleanId, userId);
    await loadHistory();
  } catch (error) {
    console.error("useHistory error:", error);
  }
}, [userId, loadHistory]);
```

---

### 🔍 filteredHistory — กรองข้อมูลสำหรับแสดงผล

```js
const filteredHistory = history.filter((item) => {
  // filter ทุกเงื่อนไข — ถ้าไม่ผ่านข้อใดข้อหนึ่ง return false (กรองออก)
  if (filter === "income"  && item.type   !== "income")  return false;
  if (filter === "expense" && item.type   !== "expense") return false;
  if (filter === "ocr"     && item.source !== "ocr")     return false;
  if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
  // .toLowerCase() ทำให้ search ไม่ case-sensitive
  if (filterCategory && item.category_name !== filterCategory) return false;
  return true;   // ผ่านทุกเงื่อนไข → เก็บไว้
});
```

นี่คือ **Derived Value** (คำนวณทุก render) ไม่ใช่ state เพราะสามารถคำนวณจาก `history` + `filter` ได้เสมอ

---

## 7️⃣ useHome.js — หน้าหลัก

### 📌 ไฟล์นี้ทำอะไร?
โหลดสรุปรายรับ-รายจ่ายเดือนปัจจุบัน + สถิติมาสโลว์ + ทำ sync อัตโนมัติ

---

### 🌅 getGreeting — ข้อความทักทายตามเวลา

```js
const getGreeting = () => {
  const h = new Date().getHours();  // 0-23
  if (h < 12)  return "อรุณสวัสดิ์ ☀️";    // 00:00-11:59
  if (h < 18)  return "สวัสดีตอนบ่าย 🌤️";  // 12:00-17:59
  return "สวัสดีตอนค่ำ 🌙";                  // 18:00-23:59
};
```

---

### 📥 loadData

```js
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
      balance: stats.savings,   // เปลี่ยนชื่อ field สำหรับ UI
    });

    // สร้าง map จาก array แล้วใช้งาน
    const maslowMap = Object.fromEntries(MASLOW_LEVELS.map((m) => [m.id, m]));
    const totalExpense = stats.expense || 1;   // ป้องกัน /0

    setMaslowStats(
      maslow.map((m) => ({
        ...m,
        color:   maslowMap[m.maslow_id]?.color || "#9CA3AF",
        icon:    maslowMap[m.maslow_id]?.icon  || "help-circle",
        title:   maslowMap[m.maslow_id]?.title || m.name_en,
        percent: Math.round((m.total / totalExpense) * 100),
        // Math.round = ปัดเป็นจำนวนเต็ม (25.7 → 26)
      }))
    );

    setMonthLabel(MONTHS[currentMonth - 1]);   // เดือน 3 → index 2 → "มีนาคม"
  } catch (error) {
    console.error("useHome loadData error:", error);
  } finally {
    setIsLoading(false);
  }
}, [userId]);
// Note: currentMonth, currentYear ไม่อยู่ใน deps เพราะสร้างจาก new Date() ทุก render
// = ค่าคงที่ตลอด session
```

---

### 🔄 useFocusEffect + Sync

```js
useFocusEffect(
  useCallback(() => {
    loadData();
    syncDataToServer({ userId, syncToken }).catch(() => {});
    // .catch(() => {}) = fire & forget: ไม่สนใจ error ของ sync
    // ถ้า offline → ไม่ crash แค่ log ข้างใน syncDataToServer
  }, [loadData, userId, syncToken])
);
```

**Fire & Forget Pattern**: ทำงานใน background ไม่รอผล ไม่บล็อก UI

---

## 8️⃣ useSlipScanner.js — สแกนและบันทึกสลิป

### 📌 ไฟล์นี้ทำอะไร?
จัดการ flow ทั้งหมดของการสแกนสลิป: เลือกรูป → OCR → แสดง review modal → บันทึก → sync

---

### 📦 Import พิเศษ

```js
import * as ImagePicker from "expo-image-picker";
// เปิด gallery เลือกรูปภาพ

import * as FileSystem from "expo-file-system/legacy";
// จัดการไฟล์: copy, read, write

import AsyncStorage from "@react-native-async-storage/async-storage";
// เก็บข้อมูลแบบ key-value บนมือถือ (คงอยู่แม้ปิดแอป)
```

```js
const isCancelled = useRef(false);
// useRef ไม่ใช่ useState เพราะ:
// 1. เปลี่ยนค่าไม่ต้อง re-render
// 2. อ่านค่าล่าสุดได้เสมอ (closure ใน async function)
```

---

### 🚀 useEffect — Setup เมื่อ mount

```js
useEffect(() => {
  (async () => {
    // IIFE: Immediately Invoked Function Expression
    // = สร้างและเรียก async function ทันที (เพราะ useEffect ไม่รับ async โดยตรง)
    await setupNotifications();           // ขอสิทธิ์ notification
    await registerBackgroundFetchAsync(); // ลงทะเบียน background task
    const savedUri = await getSavedFolderUri();
    if (savedUri) setKtbFolderUri(savedUri);  // โหลด folder ที่บันทึกไว้
    await initDatabase();
    await refreshData();
    await loadPendingSlips();
  })();
}, []);
// [] = รันแค่ครั้งแรก (component mount)
```

---

### 💾 Pending Slips — บันทึกลง AsyncStorage

```js
const savePendingSlips = async (items) => {
  try {
    await AsyncStorage.setItem(PENDING_SLIPS_KEY, JSON.stringify(items));
    // JSON.stringify แปลง array → string ก่อนเก็บ
  } catch (e) {
    console.error("Failed to save pending slips:", e);
  }
};

const loadPendingSlips = async () => {
  try {
    const saved = await AsyncStorage.getItem(PENDING_SLIPS_KEY);
    if (!saved) return;   // ไม่มีข้อมูลเก็บไว้ → ออก

    const parsed = JSON.parse(saved);   // string → array
    const db = await getDB();
    const filtered = [];

    for (const slip of parsed) {
      // ตรวจว่าบันทึกไป DB แล้วหรือยัง (ป้องกันซ้ำ)
      const byUri = await db.getFirstAsync(
        `SELECT transaction_id FROM transactions
         WHERE input_method = 'ocr' AND transaction_name LIKE ?`,
        [`%${slip.imageUri?.split("/").pop()}%`]
        // .split("/").pop() = ชื่อไฟล์ส่วนท้าย เช่น "slip_123.jpg"
        // LIKE %ชื่อไฟล์% = ค้นหาแบบ contains
      );
      if (byUri) continue;   // บันทึกแล้ว → ข้ามไป

      if (slip.ref && slip.ref !== NOT_APPLICABLE) {
        const byRef = await db.getFirstAsync(...);
        if (byRef) continue;
      }
      filtered.push(slip);   // ยังไม่บันทึก → เก็บไว้
    }

    if (filtered.length === 0) {
      await AsyncStorage.removeItem(PENDING_SLIPS_KEY);   // ลบ key ถ้าว่าง
      return;
    }
    await AsyncStorage.setItem(PENDING_SLIPS_KEY, JSON.stringify(filtered));
    setPendingSlips(filtered);
    setIsReviewModalVisible(true);   // เปิด modal ให้ review
  } catch (e) {
    console.error("Failed to load pending slips:", e);
  }
};
```

---

### 📷 handlePickImage — เลือกรูปเดียว

```js
const handlePickImage = async () => {
  setIsProcessing(true);
  setStatus("กำลังเปิดรูปภาพ...");
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",   // เฉพาะรูปภาพ (ไม่รวมวิดีโอ)
      quality: 1,             // คุณภาพสูงสุด (1 = 100%)
    });
    if (result.canceled) { setStatus("พร้อมทำงาน"); return; }

    const originalUri = result.assets[0].uri;
    const fileName    = `slip_${Date.now()}.jpg`;
    // Date.now() = timestamp ปัจจุบัน ทำให้ชื่อไม่ซ้ำ

    const cachedUri = FileSystem.cacheDirectory + fileName;
    // cacheDirectory = folder ชั่วคราวของแอป
    await FileSystem.copyAsync({ from: originalUri, to: cachedUri });
    // copy ไป cache ก่อน เพราะ uri จาก picker อาจหมดอายุ

    setStatus("กำลัง OCR...");
    const extracted = await processSlip(cachedUri, fileName);
    // processSlip = ส่งรูปไป OCR service แล้วได้ข้อมูลกลับมา
    if (!extracted) { setStatus("สลิปนี้ถูกบันทึกแล้ว"); return; }

    const newPending = [extracted];
    setPendingSlips(newPending);
    await savePendingSlips(newPending);
    setIsReviewModalVisible(true);
    setStatus("พบสลิป 1 รายการ — รอตรวจสอบ");
  } catch (error) {
    setStatus("ผิดพลาด: " + error.message);
  } finally {
    setIsProcessing(false);   // คืน state ไม่ว่าสำเร็จหรือไม่
  }
};
```

---

### 📦 handleBulkProcess — OCR ทั้ง folder

```js
const handleBulkProcess = async () => {
  isCancelled.current = false;   // reset flag การยกเลิก
  setIsBulkProcessing(true);
  let folderUri = ktbFolderUri;

  try {
    // ถ้ายังไม่ได้เลือก folder → ขอสิทธิ์ก่อน
    if (!folderUri) {
      folderUri = await askForFolderPermission();
      if (!folderUri) { setStatus("ยกเลิกการเลือก"); return; }
      setKtbFolderUri(folderUri);
    }

    let imageFiles = [];
    try {
      imageFiles = await listImageFilesInCurrentMonth(folderUri);
    } catch {
      // สิทธิ์หมดอายุ → ล้างแล้วขอใหม่
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
      // ตรวจ flag ยกเลิกทุก iteration
      if (isCancelled.current) {
        setStatus(`ยกเลิกที่ ${i}/${imageFiles.length}`);
        break;   // หยุด loop ทันที
      }
      const file = imageFiles[i];
      setStatus(`OCR ${i + 1}/${imageFiles.length}: ${file.name}`);

      // หน่วงเวลา 1.5 วินาที ป้องกัน rate limit ของ OCR API
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
    setStatus("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    setIsBulkProcessing(false);
  }
};
```

**`await new Promise((r) => setTimeout(r, 1500))`**  
= สร้าง Promise ที่ resolve หลัง 1500ms = หน่วงเวลา 1.5 วินาที

---

### ✅ handleConfirmSave — บันทึกสลิปที่เลือก

```js
const handleConfirmSave = async () => {
  const selectedSlips = pendingSlips.filter((s) => s.isSelected);
  
  if (selectedSlips.length === 0) {
    Alert.alert("แจ้งเตือน", "กรุณาเลือกอย่างน้อย 1 รายการ");
    return;
  }

  // ตรวจว่าเลือก category และ maslow ครบทุกรายการ
  const incomplete = selectedSlips.filter((s) => !s.categoryId || !s.maslowId);
  if (incomplete.length > 0) {
    Alert.alert("ข้อมูลไม่ครบ", `กรุณาเลือกหมวดหมู่และระดับ Maslow ให้ครบทั้ง ${incomplete.length} รายการ`);
    return;
  }

  setIsSaving(true);
  try {
    let saved = 0, failed = 0;
    
    for (const slip of selectedSlips) {
      try {
        await addTransaction({
          userId,
          categoryId:      slip.categoryId,
          maslowId:        slip.maslowId,
          amount:          parseFloat(String(slip.amount).replace(/,/g, "")),
          // String() = แปลงเป็น string ก่อน (ป้องกัน number ที่มี , แล้วแปลงผิด)
          // .replace(/,/g, "") = ลบ comma ทั้งหมด เช่น "1,234.50" → "1234.50"
          // /,/g = regular expression: หาทุก comma (g = global)
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
        failed++;    // นับ error แต่ไม่หยุด loop (บันทึกรายการอื่นต่อ)
      }
    }

    await clearPendingSlips();
    setIsReviewModalVisible(false);
    await refreshData();

    setStatus(
      `บันทึกแล้ว ${saved} รายการ` +
      (failed > 0 ? ` (ผิดพลาด ${failed})` : "")
      // Template literal + conditional string
    );

    await syncDataToServer({ userId, syncToken });  // sync ทันทีหลังบันทึก
  } catch (error) {
    Alert.alert("เกิดข้อผิดพลาด", error.message);
  } finally {
    setIsSaving(false);
  }
};
```

---

### Review Modal Helpers

```js
// อัปเดต field ของ slip หนึ่งตัว (ใช้ tempId เป็น key)
const handleUpdatePendingSlip = async (tempId, updatedFields) => {
  const updated = pendingSlips.map((s) =>
    s.tempId === tempId
      ? { ...s, ...updatedFields }   // ถ้าตรง → merge fields ใหม่
      : s                            // ถ้าไม่ตรง → คืนตัวเดิม
  );
  setPendingSlips(updated);
  await savePendingSlips(updated);
};

// toggle เลือก/ยกเลิกเลือก 1 รายการ
const handleToggleSlipSelection = async (tempId) => {
  const updated = pendingSlips.map((s) =>
    s.tempId === tempId ? { ...s, isSelected: !s.isSelected } : s
    // !s.isSelected = กลับค่า boolean
  );
  setPendingSlips(updated);
  await savePendingSlips(updated);
};

// เลือก/ยกเลิกทั้งหมด
const handleSelectAll = async (selectAll) => {
  const updated = pendingSlips.map((s) => ({ ...s, isSelected: selectAll }));
  setPendingSlips(updated);
  await savePendingSlips(updated);
};

const handleCancel = () => { isCancelled.current = true; };
// แค่ตั้ง flag → bulk process loop จะหยุดเองใน iteration ถัดไป
```

---

## 9️⃣ useTransaction.js — บันทึกรายรับ/รายจ่าย

### 📌 ไฟล์นี้ทำอะไร?
จัดการ form state ของการเพิ่มธุรกรรม พร้อม validate และตรวจสอบงบประมาณหลังบันทึก

---

### 📦 State ทั้งหมด

```js
const [amount,           setAmount]           = useState("");
const [date,             setDate]             = useState(
  new Date().toISOString().split("T")[0]   // "2025-03-15T10:00:00.000Z" → "2025-03-15"
);
const [time,             setTime]             = useState(
  new Date().toTimeString().slice(0, 5)    // "10:30:45 GMT+0700" → "10:30"
);
const [note,             setNote]             = useState("");
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedMaslow,   setSelectedMaslow]   = useState(null);

const scrollRef = useRef(null);
// ref ไปยัง ScrollView/FlatList เพื่อเรียก scrollToIndex
```

---

### 🔄 useFocusEffect สำหรับโหลด Categories

```js
useFocusEffect(
  useCallback(() => {
    refreshCategories();
  }, [refreshCategories]),
);
// ทุกครั้งที่กลับมาหน้านี้ → reload categories
// รองรับกรณีผู้ใช้เพิ่งเพิ่มหมวดหมู่ใหม่
```

---

### 📜 handleCategorySelect — เลือก Category + Auto Scroll

```js
const handleCategorySelect = useCallback((cat, type) => {
  setSelectedCategory(cat);
  if (type === "expense") {
    // เลือกรายจ่าย → scroll ไปหน้า Maslow อัตโนมัติ
    scrollRef.current?.scrollToIndex({ index: 1, animated: true });
    // ?. = ป้องกัน error ถ้า scrollRef.current ยังเป็น null
    // animated: true = scroll แบบมี animation
  }
  // รายรับ (income) ไม่มี maslow → ไม่ต้อง scroll
}, []);
```

---

### 💾 handleSave — บันทึกธุรกรรม

```js
const handleSave = useCallback(
  async ({ userId, onBudgetAlert }) => {
    // รับ userId และ callback แยกจาก hook state
    // เพราะ userId มาจาก AuthContext ที่ Screen ถือ ไม่ใช่ hook นี้

    // ── Validation ──
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกจำนวนเงินให้ถูกต้อง");
      return false;   // คืน false = บันทึกไม่สำเร็จ
    }
    if (!selectedCategory) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกหมวดหมู่");
      return false;
    }

    try {
      // รวม date + time → ISO string
      const transactionDate = `${date}T${time}:00`;
      // เช่น "2025-03-15T10:30:00"
      
      await addTransaction({
        userId,
        categoryId:  selectedCategory.category_id,
        maslowId:    selectedMaslow?.id ?? null,
        // ?.id = ถ้า selectedMaslow เป็น null → undefined → ?? null → null
        amount:      parseFloat(amount),
        transactionDate,
        transactionName: note || null,
        inputMethod:     "manual",
      });

      // ── ตรวจงบประมาณ (เฉพาะรายจ่าย) ──
      if (selectedCategory.category_type === "expense") {
        const [year, month] = date.split("-").map(Number);
        // "2025-03-15".split("-") = ["2025", "03", "15"]
        // .map(Number) = [2025, 3, 15] (แปลงทุกตัวเป็นตัวเลข)

        const budget = await getBudgetStuatus(
          userId, selectedCategory.category_id, month, year
        );

        if (budget && typeof onBudgetAlert === "function") {
          // typeof ตรวจว่าเป็น function จริงๆ ก่อนเรียก
          const limit     = budget.amount_limit;
          const used      = budget.used;
          const remaining = limit - used;

          let level = null;
          if (used > limit)           level = "over";     // เกิน 100%
          else if (used > limit * 0.8) level = "warning";  // เกิน 80%

          if (level) {
            onBudgetAlert({ level, categoryName: selectedCategory.category_name, used, limit, remaining });
            // เรียก callback เพื่อให้ Screen แสดง Toast
          }
        }
      }

      resetForm();
      return true;   // บันทึกสำเร็จ

    } catch (error) {
      console.error("บันทึกไม่สำเร็จ:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้ กรุณาลองใหม่");
      return false;
    }
  },
  [amount, date, note, time, selectedCategory, selectedMaslow, resetForm],
  // dependency array: สร้าง handleSave ใหม่เมื่อ input เปลี่ยน
);
```

---

### 🔄 resetForm — ล้างฟอร์ม

```js
const resetForm = useCallback(() => {
  setAmount("");
  setNote("");
  setDate(new Date().toISOString().split("T")[0]);   // วันปัจจุบัน
  setTime(new Date().toTimeString().slice(0, 5));    // เวลาปัจจุบัน
  setSelectedCategory(null);
  setSelectedMaslow(null);
  scrollRef.current?.scrollToIndex({ index: 0, animated: true });
  // scroll กลับไปหน้าแรก (category selection)
}, []);
// [] = ฟังก์ชันนี้ไม่มี external dependency → สร้างครั้งเดียว
```

---

## 🔑 สรุป Patterns ที่ใช้ใน Part 2

| Pattern | ตัวอย่าง | ประโยชน์ |
|---------|---------|---------|
| **IIFE async** | `(async () => { ... })()` | ใช้ async ใน useEffect |
| **Fire & Forget** | `.catch(() => {})` | sync ใน background ไม่บล็อก UI |
| **isCancelled ref** | `isCancelled.current = true` | หยุด loop โดยไม่ re-render |
| **format functions** | `formatTransaction`, `formatSlip` | แยก transform logic ออกจาก hook |
| **Prefix ID** | `manual_42`, `ocr_7` | แยกประเภทก่อน ลบ prefix ทีหลัง |
| **Early Return** | `if (canceled) return` | ออกจากฟังก์ชันเร็ว ลด nesting |
| **Callback as param** | `handleSave({ onBudgetAlert })` | ส่ง behavior จาก Screen ลงมา |
| **sleep pattern** | `await new Promise(r => setTimeout(r, 1500))` | หน่วงเวลาใน async |
| **Regex replace** | `.replace(/,/g, "")` | ลบ comma จากตัวเลข |
| **useFocusEffect** | reload เมื่อกลับมาหน้านี้ | ข้อมูลสดเสมอหลัง navigate |

---

## 📋 ภาพรวม Hook ทั้งหมด

```
useAnalysis      → สถิติ + Health Score + กราฟ
useBudget        → CRUD งบประมาณ + Accordion animation
useBudgetToast   → Toast notification งบเกิน
useCategoryUpdate → ตรวจ + sync หมวดหมู่จาก Server
useCategoryManager → CRUD หมวดหมู่ + validation
useHistory       → รายการธุรกรรม + filter/search
useHome          → สรุปหน้าหลัก + auto sync
useSlipScanner   → สแกนสลิป OCR + bulk process
useTransaction   → form เพิ่มรายการ + budget check
```

ทุก hook แยก **Logic** ออกจาก **UI** ทำให้ Screen files เป็นแค่การแสดงผล (render) ซึ่งทดสอบและบำรุงรักษาได้ง่ายกว่ามาก
