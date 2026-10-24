# 📱 คำอธิบายโค้ด: Screens (ส่วนที่ 2)

> ครอบคลุม: AnalysisScreen · BudgetScreen · HistoryScreen · CategoryScreen · AddCategoryModal · EditCategoryModal · Scanslip · MenuScreen

---

## 7️⃣ AnalysisScreen.js — หน้าวิเคราะห์การเงิน

### 📌 ทำอะไร?
แสดงกราฟ + สถิติ: Maslow Stacked Bar, Top Categories Bar Chart, MoM growth

### Setup

```js
const {
  isLoading, summary, healthScore, momGrowth,
  maslowStats, categoryStats,
  selectedMonthIndex, setSelectedMonthIndex,
  selectedYear,       setSelectedYear,
} = useAnalysis();
// hook จัดการ data ทั้งหมด screen ทำแค่แสดงผล

const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
// เก็บ state เปิด/ปิด modal เลือกเดือน ไว้ใน Screen เพราะเป็น UI state ล้วนๆ

const BAR_COLORS = ["#F59E0B", "#3B82F6", "#EC4899", "#6366F1", "#10B981", "#8B5CF6"];
// สีสำหรับ Bar Chart หมุนวน (index % 6)
```

### Loading State

```js
if (isLoading) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {/* ActivityIndicator = loading spinner ของ React Native */}
      <Text>กำลังวิเคราะห์ข้อมูล...</Text>
    </View>
  );
}
// Early return: ถ้า loading ให้แสดง spinner แทน content
```

### Maslow Stacked Bar

```js
const renderMaslowBar = () => {
  if (maslowStats.length === 0) return null;
  return (
    <View style={S.maslowBarContainer}>
      {maslowStats.map((item, index) => (
        <View
          key={item.maslow_id}
          style={{
            width: `${item.percent}%`,       // ความกว้างตาม %
            backgroundColor: item.color,
            height: "100%",
            // มนขอบเฉพาะตัวแรก (ซ้าย) และตัวสุดท้าย (ขวา)
            borderTopLeftRadius:     index === 0                      ? 10 : 0,
            borderBottomLeftRadius:  index === 0                      ? 10 : 0,
            borderTopRightRadius:    index === maslowStats.length - 1 ? 10 : 0,
            borderBottomRightRadius: index === maslowStats.length - 1 ? 10 : 0,
          }}
        />
      ))}
    </View>
  );
};
```

### Dynamic Insight (IIFE)

```js
{(() => {
  // IIFE ใน JSX: ต้องการ logic ก่อน return JSX แต่ JSX ไม่รับ statement
  const highest = [...maslowStats].sort((a, b) => b.total - a.total)[0];
  // [...maslowStats] = copy array ก่อน sort (ไม่แก้ original)
  // .sort((a,b) => b-a) = เรียงจากมากไปน้อย
  // [0] = รายการแรก = มากสุด
  
  if (!highest) return null;
  const isHighPhysical = highest.maslow_id === 1 && highest.percent > 40;
  
  return (
    <View style={S.insightBox}>
      <Text style={S.insightText}>
        {isHighPhysical
          ? `"${highest.label}" คิดเป็น ${highest.percent.toFixed(0)}% ...`
          : `หมวดที่ใช้มากสุดคือ "${highest.label}" ...`
        }
      </Text>
    </View>
  );
})()}
```

### Savings Card + MoM Growth

```js
<View style={S.savingsCard}>
  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    <Text style={S.cardTitle}>เงินคงเหลือ</Text>
    
    {/* Tag แสดงการเปลี่ยนแปลง MoM */}
    <View style={[S.trendTag, { backgroundColor: momGrowth >= 0 ? "#D1FAE5" : "#FEE2E2" }]}>
      <Ionicons
        name={momGrowth >= 0 ? "trending-up" : "trending-down"}
        size={14}
        color={momGrowth >= 0 ? "#059669" : "#DC2626"}
      />
      <Text style={{ color: momGrowth >= 0 ? "#059669" : "#DC2626" }}>
        {momGrowth >= 0 ? "+" : ""}{momGrowth.toFixed(1)}%
        {/* toFixed(1) = ทศนิยม 1 หลัก เช่น 12.3% */}
      </Text>
    </View>
  </View>

  <Text style={[S.bigSavings, { color: (summary?.savings ?? 0) >= 0 ? "#111827" : "#DC2626" }]}>
    {(summary?.savings ?? 0).toLocaleString()}
    {/* summary?.savings = Optional Chaining กันกรณี summary ยัง null */}
    {/* ?? 0 = ถ้า null/undefined ให้ใช้ 0 */}
  </Text>
</View>
```

---

## 8️⃣ BudgetScreen.js — หน้างบประมาณ

### 📌 ทำอะไร?
แสดงรายการงบประมาณแต่ละหมวด พร้อม Progress Bar + Accordion Form เพิ่มงบ

### Accordion Animation

```js
const {
  isFormExpanded, toggleForm,
  formHeight, formOpacity, arrowRotation,
  // ค่า Animated.Value interpolated จาก useBudget
} = useBudget();
```

```js
{/* Card ที่กดได้ — toggleForm เปิด/ปิด accordion */}
<TouchableOpacity
  style={[styles.budgetFormCard, isFormExpanded && styles.budgetFormCardActive]}
  onPress={toggleForm}
  activeOpacity={0.9}
>
  <View style={styles.cardHeader}>
    {/* ลูกศรหมุน 180 องศาเมื่อเปิด */}
    <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
      <Ionicons name="chevron-down" size={24} color={COLORS.gray} />
    </Animated.View>
    {/* Animated.View = View ที่รับ Animated.Value ได้ */}
  </View>

  {/* Form ที่ซ่อน/แสดงด้วย animation */}
  <Animated.View style={[styles.hiddenFormContainer, {
    height: formHeight,    // ความสูงเปลี่ยนตาม animation
    opacity: formOpacity,  // ความโปร่งใสเปลี่ยนตาม animation
  }]}>
    {/* เนื้อหา form ... */}
  </Animated.View>
</TouchableOpacity>
```

### Category Selector (Horizontal Scroll)

```js
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {expenseCategories.map((item) => {
    const isSelected = budgetCategory?.category_id === item.category_id;
    return (
      <TouchableOpacity
        key={item.category_id}
        onPress={() => setBudgetCategory(item)}
        style={{
          paddingVertical: 8, paddingHorizontal: 14, marginRight: 8,
          backgroundColor: isSelected ? COLORS.primary : COLORS.lightGray,
          borderRadius: 20,              // ทำให้เป็น pill shape
          borderWidth: 1,
          borderColor: isSelected ? COLORS.primary : "#E5E7EB",
        }}
      >
        <Text style={{ color: isSelected ? "#fff" : COLORS.dark }}>
          {item.category_name}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>
```

### Budget Card + Progress Bar

```js
{existingBudgets.map((budget) => {
  // คำนวณ % ที่ใช้ไป
  const usedPercent = budget.amount_limit > 0
    ? Math.min((budget.used / budget.amount_limit) * 100, 100)
    : 0;
  // Math.min(..., 100) = ไม่เกิน 100% (แม้จะใช้เกินงบ)

  const isOver = budget.used > budget.amount_limit;
  const barColor = isOver
    ? "#EF4444"                              // แดง = เกิน
    : usedPercent > 80
    ? "#F59E0B"                              // เหลือง = ใกล้เต็ม
    : "#10B981";                             // เขียว = ปกติ

  const isEditing = editingBudget?.category_id === budget.category_id;
  // ตรวจว่า card นี้กำลัง edit อยู่ไหม

  return (
    <View key={budget.category_id} style={styles.budgetItemCard}>
      
      {/* Edit inline form */}
      {isEditing && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            style={[styles.inputField, { flex: 1 }]}
            keyboardType="numeric"
            value={editAmount}
            onChangeText={setEditAmount}
            autoFocus  // focus keyboard อัตโนมัติ
          />
          <TouchableOpacity onPress={() => handleSaveEdit(editAmount)}>
            <Text>บันทึก</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingBudget(null)}>
            <Ionicons name="close-circle" size={24} />
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, {
          width: `${usedPercent}%`,
          backgroundColor: barColor,
        }]} />
      </View>
    </View>
  );
})}
```

---

## 9️⃣ HistoryScreen.js — หน้าประวัติรายการ

### 📌 ทำอะไร?
แสดงรายการทั้งหมดของเดือนที่เลือก พร้อม filter, search, delete, edit, ดูรูปสลิป OCR

### getVisibleCategories — ดึง category ตาม filter

```js
const getVisibleCategories = () => {
  if (filter === "income")  return incomeCategories;
  if (filter === "expense") return expenseCategories;
  return [...incomeCategories, ...expenseCategories];
  // Spread: รวม 2 array เป็น 1
};
```

### handleDeleteItem — ลบรายการ

```js
const handleDeleteItem = (item) => {
  Alert.alert(
    "ยืนยันการลบ",
    `คุณต้องการลบ "${item.name || 'ไม่มีชื่อ'}" ใช่หรือไม่?`,
    [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบรายการ", style: "destructive",
        onPress: async () => {
          try {
            const isOcr  = item.id.startsWith("ocr_");
            const cleanId = item.id.replace("manual_", "").replace("ocr_", "");
            // ลบ prefix ออก: "manual_42" → "42"

            if (isOcr) {
              await deleteSlip(cleanId, userId);
            } else {
              await deleteTransaction(cleanId, userId);
            }

            Alert.alert("สำเร็จ", "ลบรายการเรียบร้อยแล้ว");
            loadHistory();   // reload ทันที
          } catch (error) {
            Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบรายการนี้ได้");
          }
        }
      }
    ]
  );
};
```

### renderItem — render แต่ละแถว

```js
const renderItem = ({ item }) => {
  const isOcr        = item.source === "ocr";
  const amountColor  = item.type === "income" ? "#10B981" : "#EF4444";
  const amountPrefix = item.type === "income" ? "+" : "-";

  return (
    <View style={[itemStyles.card, { flexDirection: "row" }]}>
      
      {/* ไอคอน */}
      <View style={[itemStyles.iconCircle, { backgroundColor: amountColor + "15" }]}>
        {/* amountColor + "15" = เพิ่ม hex opacity 15% ท้ายสี */}
        <Ionicons
          name={isOcr ? "scan-outline" : item.type === "income"
            ? "arrow-down-circle-outline"
            : "arrow-up-circle-outline"
          }
          size={22} color={amountColor}
        />
      </View>

      {/* ชื่อ + วันที่ (กดได้เฉพาะ OCR เพื่อดูรูป) */}
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          if (isOcr) {
            setSelectedPendingTx(item);
            setIsReviewModalVisible(true);
          }
        }}
      >
        <Text style={itemStyles.name} numberOfLines={1}>
          {item.name || "ไม่มีชื่อรายการ"}
          {/* numberOfLines={1} = ตัดข้อความที่ยาวเกิน 1 บรรทัด */}
        </Text>
        <Text style={itemStyles.meta}>
          {item.category_name ? `${item.category_name}  ·  ` : ""}
          {item.date ? item.date.slice(0, 10) : ""}
          {/* .slice(0,10) ตัดแค่ "YYYY-MM-DD" */}
          {isOcr && (
            <Text style={{ color: item.status === "confirmed" ? "#059669" : "#D97706" }}>
              {"  "}{item.status === "confirmed" ? "✓ ยืนยันแล้ว" : "⏳ รอตรวจสอบ"}
            </Text>
          )}
        </Text>
      </TouchableOpacity>

      {/* ยอดเงิน */}
      <Text style={[itemStyles.amount, { color: amountColor }]}>
        {amountPrefix}฿{item.amount?.toLocaleString("th-TH")}
      </Text>

      {/* ปุ่ม Edit (เฉพาะ manual) + Delete */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {!isOcr && (
          <TouchableOpacity
            onPress={() => handleOpenEditModal(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            // hitSlop: ขยาย touch area ออกไป 8px ทุกด้าน (กดง่ายขึ้น)
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDeleteItem(item)} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### OCR Review Modal

```js
<Modal
  visible={isReviewModalVisible}
  transparent
  animationType="fade"      // fade in/out แทน slide
  onRequestClose={() => setIsReviewModalVisible(false)}
>
  <View style={modalStyles.modalOverlay}>
    <View style={modalStyles.modalContent}>
      
      {/* รูปสลิป */}
      {selectedPendingTx?.imageUri ? (
        <Image
          source={{ uri: selectedPendingTx.imageUri }}
          style={{ width: "100%", height: 200, borderRadius: 10 }}
          resizeMode="contain"
        />
      ) : (
        <View style={{ /* placeholder */ }}>
          <Ionicons name="image-outline" size={40} color="#D1D5DB" />
          <Text>ไม่มีรูปภาพ</Text>
        </View>
      )}

      {/* ข้อมูลสลิป: วน array of config */}
      {[
        { label: "ยอดเงิน",    value: `฿${Number(selectedPendingTx?.amount).toLocaleString()}`, icon: "cash-outline" },
        { label: "วันที่",      value: selectedPendingTx?.date?.slice(0, 10) ?? "-",             icon: "calendar-outline" },
        { label: "เลขอ้างอิง", value: selectedPendingTx?.slip_ref || "-",                        icon: "barcode-outline" },
        { label: "หมวดหมู่",   value: selectedPendingTx?.category_name || "ยังไม่กำหนด",          icon: "grid-outline" },
      ].map(({ label, value, icon }) => (
        <View key={label} style={{ flexDirection: "row", paddingVertical: 10 }}>
          <Ionicons name={icon} size={16} color="#6B7280" />
          <Text style={{ width: 80 }}>{label}</Text>
          <Text style={{ flex: 1, fontWeight: "600" }}>{value}</Text>
        </View>
      ))}
      {/* วน array of config แทน copy-paste View เดิมๆ 4 ครั้ง */}

      {/* ปุ่มยืนยัน หรือ ปิด (ขึ้นกับ status) */}
      <TouchableOpacity
        onPress={isSelectedConfirmed ? () => setIsReviewModalVisible(false) : handleConfirmOCR}
      >
        <Text>{isSelectedConfirmed ? "ปิดหน้าต่าง" : "ยืนยันความถูกต้องลงระบบ"}</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

### Edit Modal + customStyles

```js
// StyleSheet.create ใน file เดียวกัน (local styles)
const customStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  // rgba(0,0,0,0.4) = ดำ opacity 40% = overlay มืดๆ
  modalContent:  { width: "85%", backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 5 },
  // elevation: 5 = เงาบน Android
  btnGroup:      { flexDirection: "row", gap: 10, marginTop: 10 },
  // gap: 10 = ระยะห่างระหว่าง flex items (React Native 0.71+)
});
```

---

## 🔟 CategoryScreen.js — จัดการหมวดหมู่

### 📌 ทำอะไร?
แสดงรายการ category แบ่งตามประเภท พร้อมเพิ่ม/แก้ไข/ลบ และ sync จาก Server

### Sub-components ใน file เดียวกัน

```js
// CategoryRow: แถวหมวดหมู่หนึ่งแถว
function CategoryRow({ item, onEdit, onDelete, showDivider }) {
  const isSystem = isSystemCategory(item.category_id);
  // isSystem = category_id < 1000 = สร้างโดย system ห้ามแก้/ลบ
  
  return (
    <>
      <View style={styles.categoryRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryName}>{item.category_name}</Text>
          {isSystem && (
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}>หมวดหมู่ระบบ</Text>
          )}
        </View>
        <View style={styles.rowActions}>
          {/* แสดงปุ่ม Edit/Delete เฉพาะ user-created */}
          {!isSystem && (
            <TouchableOpacity onPress={() => onEdit(item)}>
              <Ionicons name="create-outline" size={20} />
            </TouchableOpacity>
          )}
          {!isSystem && (
            <TouchableOpacity onPress={() => onDelete(item)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
          {/* System = แสดง lock icon */}
          {isSystem && (
            <Ionicons name="lock-closed-outline" size={18} color="#D1D5DB" />
          )}
        </View>
      </View>
      {showDivider && <View style={styles.categoryRowDivider} />}
      {/* showDivider: แสดงเส้นคั่น ยกเว้นรายการสุดท้าย */}
    </>
  );
}

// CategorySection: กลุ่มหมวดหมู่ (รายรับ หรือ รายจ่าย)
function CategorySection({ title, data, onEdit, onDelete, onAdd }) {
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.sectionHeader}>{title}</Text>
        <TouchableOpacity onPress={onAdd}>
          <Ionicons name="add-circle-outline" size={22} />
        </TouchableOpacity>
      </View>
      <View style={styles.sectionContent}>
        {data.length === 0 ? (
          <Text style={styles.emptyStateText}>ยังไม่มีหมวดหมู่</Text>
        ) : (
          data.map((item, index) => (
            <CategoryRow
              key={item.category_id.toString()}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              showDivider={index < data.length - 1}
              // สุดท้าย: index = length-1 → showDivider = false
            />
          ))
        )}
      </View>
    </>
  );
}
```

### Manual Sync

```js
const { checkForCategoryUpdates } = useCategoryUpdate(loadCategories);
const [isSyncing, setIsSyncing] = useState(false);

const handleSyncPress = async () => {
  if (isSyncing) return;           // ป้องกัน double-click
  setIsSyncing(true);
  await checkForCategoryUpdates(); // ตรวจ + อัปเดตจาก server
  setIsSyncing(false);
};
```

```js
{/* ปุ่ม Sync บน Header */}
<TouchableOpacity onPress={handleSyncPress} disabled={isSyncing}>
  {isSyncing
    ? <ActivityIndicator size="small" color="#6B7280" />
    : <Ionicons name="cloud-download-outline" size={22} color="#6B7280" />
  }
</TouchableOpacity>
```

### Auto-clear Error Banner

```js
const errorTimerRef = useRef(null);

useEffect(() => {
  if (error) {
    errorTimerRef.current = setTimeout(() => {
      // error state อยู่ใน hook — เราแค่รอให้หายไปเอง
    }, 3000);
  }
  return () => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      // Cleanup: ล้าง timer เมื่อ unmount หรือ error เปลี่ยน
    }
  };
}, [error]);
```

### FAB (Floating Action Button)

```js
<TouchableOpacity
  style={styles.fab}
  onPress={() => { setAddModalType('income'); setAddModalVisible(true); }}
>
  <Ionicons name="add" size={28} color="#fff" />
</TouchableOpacity>
```

### เปิด Modal

```js
<AddCategoryModal
  visible={addModalVisible}
  initialType={addModalType}     // 'income' | 'expense'
  onConfirm={async (data) => {
    const result = await createCategory(data);
    if (result.success) setAddModalVisible(false);
    // Modal ปิดเองหลัง success — ถ้า error modal ยังเปิดอยู่ (error จะแสดงใน modal)
    return result;
  }}
  onCancel={() => setAddModalVisible(false)}
/>
```

---

## 1️⃣1️⃣ AddCategoryModal.js — Modal เพิ่มหมวดหมู่

### 📌 ทำอะไร?
Modal popup สำหรับกรอกชื่อและเลือกประเภทหมวดหมู่ใหม่  
เป็น **Presentation Component** — ไม่มี logic/DB ตัวเอง ทุกอย่างผ่าน `onConfirm` callback

### useEffect สำหรับ sync

```js
// sync type เมื่อ initialType เปลี่ยน (เช่น กดเพิ่มจากส่วน income → modal ต้อง set income)
useEffect(() => {
  setType(initialType ?? 'income');
}, [initialType]);

// reset เมื่อ modal ปิด
useEffect(() => {
  if (!visible) {
    setName('');
    setNameError('');
  }
}, [visible]);
```

### handleConfirm

```js
const handleConfirm = async () => {
  setNameError('');
  setSubmitting(true);
  
  const result = await onConfirm({ categoryName: name, categoryType: type });
  // ส่ง data ขึ้นไปให้ parent → parent เรียก createCategory → ได้ result กลับมา
  
  setSubmitting(false);
  if (!result.success) {
    setNameError(result.error);  // แสดง error ใน modal (ไม่ปิด)
    return;
  }
  // Success → parent ปิด modal ด้วย visible=false
  setName('');
  setNameError('');
};
```

### Layout พิเศษ: Tap-outside to close

```js
<Pressable style={styles.modalOverlay} onPress={onCancel}>
  {/* กด overlay (พื้นหลัง) → ปิด modal */}
  
  <Pressable onPress={(e) => e.stopPropagation()}>
    {/* กด content → หยุดไม่ให้ event ลอยขึ้นไปถึง overlay */}
    {/* e.stopPropagation() = หยุด event bubbling */}
    
    <View style={styles.modalContent}>
      {/* เนื้อหา modal */}
    </View>
  </Pressable>
</Pressable>
```

### KeyboardAvoidingView

```js
<Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    {/* ทำให้ modal เลื่อนขึ้นเมื่อ keyboard เปิด ป้องกัน keyboard บัง input */}
```

### Type Selector

```js
<View style={styles.typeSelector}>
  <TouchableOpacity
    style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
    onPress={() => setType('income')}
  >
    <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
      รายรับ
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
    onPress={() => setType('expense')}
  >
    <Text>รายจ่าย</Text>
  </TouchableOpacity>
</View>
```

### Confirm Button + Loading State

```js
<TouchableOpacity
  style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
  onPress={handleConfirm}
  disabled={submitting}
  // disabled = true → กดไม่ได้ + opacity ลดลง
>
  <Text style={styles.confirmBtnText}>ยืนยัน</Text>
</TouchableOpacity>
```

---

## 1️⃣2️⃣ EditCategoryModal.js — Modal แก้ไขหมวดหมู่

### 📌 ทำอะไร?
Modal แก้ไขชื่อหมวดหมู่ ประเภทเปลี่ยนไม่ได้ (แสดง read-only)

```js
// Pre-fill ชื่อเดิมเมื่อ category เปลี่ยน
useEffect(() => {
  if (category) {
    setName(category.category_name);  // ใส่ชื่อเดิมใน input
    setNameError('');
  }
}, [category]);

// แสดงประเภทแบบ read-only
const typeLabel = category?.category_type === 'income' ? 'รายรับ' : 'รายจ่าย';

// ใน JSX:
<Text style={styles.typeLabelReadOnly}>{typeLabel}</Text>
// Text ธรรมดา (ไม่ใช่ input) = ดูได้อย่างเดียว
```

Pattern เหมือน AddCategoryModal แต่ไม่มี Type Selector (lock ค่าไว้)

---

## 1️⃣3️⃣ Scanslip.js — หน้าสแกนสลิป

### 📌 ทำอะไร?
UI สำหรับเลือกรูปสลิป OCR + แสดงรายการรอยืนยัน

```js
const {
  status, slips, totalAmount,
  isProcessing, isBulkProcessing, isSaving,
  pendingSlips, isReviewModalVisible,
  handlePickImage, handleBulkProcess, handleCancel,
  handleUpdatePendingSlip, handleToggleSlipSelection,
  handleSelectAll, handleConfirmSave, handleDiscardPending,
  setIsReviewModalVisible,
} = useSlipScanner();
// Screen ดึงทุกอย่างจาก hook = UI บริสุทธิ์

const [focusedSlipId, setFocusedSlipId] = useState(null);
// null = ดูทั้งหมด, มี id = ดูแค่สลิปนั้น
```

### Linear Gradient Header

```js
import { LinearGradient } from "expo-linear-gradient";

<LinearGradient
  colors={[COLORS.primary, "#4F46E5"]}  // จาก primary → indigo
  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
  // start/end = ทิศทาง gradient (0,0 = บนซ้าย, 1,1 = ล่างขวา) = แนวทแยง
  style={styles.headerContainer}
>
```

### Action Buttons (ปุ่ม Cancel ระหว่าง Bulk)

```js
{!isBulkProcessing ? (
  // แสดงปุ่ม "สแกนโฟลเดอร์" ปกติ
  <TouchableOpacity onPress={handleBulkProcess}>
    <Text>สแกนโฟลเดอร์</Text>
  </TouchableOpacity>
) : (
  // กำลัง bulk → แสดงปุ่ม "ยกเลิก" แทน
  <TouchableOpacity onPress={handleCancel}>
    <Ionicons name="close" color={COLORS.danger} />
    <Text style={{ color: COLORS.danger }}>ยกเลิก</Text>
  </TouchableOpacity>
)}
```

### FlatList Performance

```js
<FlatList
  data={pendingSlips}
  keyExtractor={(item) => item.tempId}
  renderItem={({ item }) => (...)}
  
  // Performance tuning:
  initialNumToRender={5}   // render แค่ 5 รายการแรก
  maxToRenderPerBatch={5}  // render ครั้งละ 5 เมื่อ scroll
  windowSize={5}           // เก็บ 5 หน้าไว้ใน memory
  // ลด memory + เพิ่มความเร็ว scroll สำหรับ list ยาว
/>
```

### Focused Slip Review

```js
const handleTapPendingSlip = (tempId) => {
  setFocusedSlipId(tempId);
  setIsReviewModalVisible(true);
};

<SlipReviewModal
  visible={isReviewModalVisible}
  pendingSlips={
    focusedSlipId
      ? pendingSlips.filter((s) => s.tempId === focusedSlipId)  // แค่สลิปที่กด
      : pendingSlips   // ทั้งหมด (กดปุ่ม "ยืนยันทั้งหมด")
  }
  ...
/>
```

---

## 1️⃣4️⃣ MenuScreen.js — หน้าเมนู/ตั้งค่า

### 📌 ทำอะไร?
โปรไฟล์ผู้ใช้ + ตั้งค่า + Export ข้อมูล + Logout

### Sub-component MenuItem

```js
const MenuItem = ({ icon, color, title, subtitle, onPress, rightElement }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuLeft}>
      <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
        {/* color + "15" = เพิ่ม hex opacity 15% เป็น background */}
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        {/* && = แสดงเฉพาะเมื่อมี subtitle */}
      </View>
    </View>
    {rightElement ? rightElement : <Ionicons name="chevron-forward" size={20} />}
    {/* rightElement อาจเป็น Switch toggle หรือ ActivityIndicator */}
  </TouchableOpacity>
);
```

### Notification Toggle

```js
const toggleOCRNotify = async () => {
  const next = !isOCRNotifyEnabled;  // กลับค่า
  setIsOCRNotifyEnabled(next);       // update UI ทันที
  try {
    await AsyncStorage.setItem(NOTIFY_OCR_KEY, String(next));
    // String(true) = "true", String(false) = "false"
    // AsyncStorage เก็บแค่ string เท่านั้น
  } catch (e) {
    console.error("บันทึกการตั้งค่าไม่สำเร็จ:", e);
  }
};
```

### DateSpinner Component — เลือกวันที่แบบ Wheel

```js
const DateSpinner = ({ label, dateObj, onDateChange }) => {
  const maxDay = daysInMonth(dateObj.month, dateObj.year);
  // คำนวณจำนวนวันของเดือนนั้นๆ

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  // ให้ค่าอยู่ระหว่าง min-max เสมอ

  const changeDay = (delta) => {
    const newDay = clamp(dateObj.day + delta, 1, maxDay);
    onDateChange({ ...dateObj, day: newDay });
    // Spread + override: copy ทุก field เปลี่ยนแค่ day
  };

  const changeMonth = (delta) => {
    let newMonth = dateObj.month + delta;
    let newYear  = dateObj.year;
    if (newMonth > 12) { newMonth = 1;  newYear += 1; }  // overflow ปี
    if (newMonth < 1)  { newMonth = 12; newYear -= 1; }  // underflow ปี
    // ...
  };
};
```

### Export Flow

```js
const handleConfirmExport = async () => {
  // Validate วันที่
  const start = new Date(startDate.year, startDate.month - 1, startDate.day);
  const end   = new Date(endDate.year, endDate.month - 1, endDate.day);
  if (start > end) {
    Alert.alert("ข้อผิดพลาด", "วันที่เริ่มต้นห้ามมากกว่าวันที่สิ้นสุด");
    return;
  }

  try {
    setIsExporting(true);
    
    // 1. ดึงข้อมูล
    const rawTransactions = await fetchTransactions({ startDate: startStr, endDate: endStr, type: filterType });
    
    if (rawTransactions.length === 0) {
      Alert.alert("แจ้งเตือน", "ไม่พบข้อมูลในช่วงเวลาที่เลือก");
      return;
    }

    // 2. สร้างไฟล์ตามประเภทที่เลือก
    if (exportFileType === "Excel") {
      await generateExcelReport(rawTransactions, dateText);
    } else {
      await generatePDFReport(rawTransactions, previewSummary, dateText);
    }

    setIsExportModalVisible(false);
  } catch (error) {
    Alert.alert("เกิดข้อผิดพลาด", error.message);
  } finally {
    setIsExporting(false);
  }
};
```

---

## 🔑 สรุป Patterns ที่ใช้ใน Part 2

| Pattern | ตัวอย่าง | ประโยชน์ |
|---------|---------|---------|
| **IIFE ใน JSX** | `{(() => { ... })()}` | ใช้ logic ก่อน return JSX |
| **stopPropagation** | `e.stopPropagation()` | ป้องกัน tap ลอยขึ้น overlay |
| **hitSlop** | `hitSlop={{ top:8, bottom:8 }}` | ขยาย touch area ปุ่มเล็ก |
| **numberOfLines** | `numberOfLines={1}` | truncate text ยาวเกิน |
| **color + opacity hex** | `color + "15"` | background โปร่งใสจากสีหลัก |
| **Sub-component** | `CategoryRow`, `MenuItem` | แยก UI ย่อยออกมา reuse |
| **FlatList Performance** | `initialNumToRender`, `windowSize` | เพิ่ม performance list ยาว |
| **AsyncStorage toggle** | `String(true/false)` | เก็บ boolean ใน AsyncStorage |
| **Spread + override** | `{ ...dateObj, day: newDay }` | แก้ field เดียวใน object |
| **Presentation Component** | Modal ไม่มี DB logic | แยก UI กับ Logic ชัดเจน |

---

## 📋 ภาพรวม Screens ทั้งหมด

```
Authentication:
  WelcomeScreen    → หน้าต้อนรับ ปุ่ม Login/Signup
  LoginScreen      → กรอก email + password
  SignupScreen     → สมัครสมาชิก + PDPA

Main App (Tab Navigation):
  HomeScreen           → สรุปรายรับ-รายจ่าย + Maslow Ring Chart
  AddScreen            → Container ของ 3 Tab
    ├── TransactionScreen → กรอกรายการ (expense/income)
    └── BudgetScreen      → จัดการงบประมาณ
  HistoryScreen        → ประวัติ + filter + search + edit
  Scanslip             → OCR สแกนสลิป
  AnalysisScreen       → กราฟวิเคราะห์
  MenuScreen           → โปรไฟล์ + ตั้งค่า + Export

Modal/Overlay:
  AddCategoryModal    → เพิ่มหมวดหมู่ (popup)
  EditCategoryModal   → แก้ไขหมวดหมู่ (popup)
  CategoryScreen      → จัดการหมวดหมู่ (full screen)
```
