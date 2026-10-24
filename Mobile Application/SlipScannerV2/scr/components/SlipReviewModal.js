import React, { useState, useCallback, useEffect, memo } from "react";
import {
  View, Text, Modal, FlatList, TouchableOpacity,
  TextInput, Image, StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/commonStyles";
import {  MASLOW_LEVELS } from "../constants/maslow";
// import {  EXPENSE_CATEGORIES } from "../constants/categories";
import { getCategories } from "../database/database";

// ─── CategoryPicker ───────────────────────────────────────────────────────────
const CategoryPicker = memo(({ selectedId, onSelect, categories }) => (
  <View style={pickerStyles.section}>
    <View style={pickerStyles.labelRow}>
      <Ionicons name="grid-outline" size={13} color="#6B7280" />
      <Text style={pickerStyles.label}>หมวดหมู่</Text>
      {!selectedId && <Text style={pickerStyles.required}>กรุณาเลือก</Text>}
    </View>
    <View style={pickerStyles.pillRow}>
      {categories.map((cat) => {
        // ใช้ category_id เป็น key หลัก (ตรงกับ field ที่ SQLite คืนมา)
        const catId   = cat.category_id;
        const catName = cat.category_name || cat.name || "";
        const catIcon = cat.category_icon || cat.icon || "pricetag-outline";
        const active  = selectedId === catId;
        return (
          <TouchableOpacity
            key={catId}
            style={[pickerStyles.pill, active && pickerStyles.pillActive]}
            onPress={() => onSelect(catId)}
          >
            <Ionicons
              name={catIcon} size={13}
              color={active ? "#fff" : "#6B7280"}
              style={{ marginRight: 4 }}
            />
            <Text style={[pickerStyles.pillText, active && pickerStyles.pillTextActive]}>
              {catName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
));

// ─── MaslowPicker ─────────────────────────────────────────────────────────────
const MaslowPicker = memo(({ selectedId, onSelect }) => (
  <View style={pickerStyles.section}>
    <View style={pickerStyles.labelRow}>
      <Ionicons name="layers-outline" size={13} color="#6B7280" />
      <Text style={pickerStyles.label}>ระดับความต้องการ (Maslow)</Text>
      {!selectedId && <Text style={pickerStyles.required}>กรุณาเลือก</Text>}
    </View>
    <View style={pickerStyles.maslowGrid}>
      {MASLOW_LEVELS.map((level) => {
        const active = selectedId === level.id;
        return (
          <TouchableOpacity
            key={level.id}
            style={[
              pickerStyles.maslowCard,
              active && { borderColor: level.color, backgroundColor: level.color + "12" },
            ]}
            onPress={() => onSelect(level.id)}
          >
            <View style={[
              pickerStyles.maslowIcon,
              { backgroundColor: active ? level.color : level.color + "20" },
            ]}>
              <Ionicons name={level.icon} size={16} color={active ? "#fff" : level.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[pickerStyles.maslowTitle, active && { color: level.color }]}>
                {level.title}
              </Text>
              <Text style={pickerStyles.maslowSub} numberOfLines={1}>{level.sub}</Text>
            </View>
            {active && <Ionicons name="checkmark-circle" size={18} color={level.color} />}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
));

// ─── SlipEditForm ─────────────────────────────────────────────────────────────
const SlipEditForm = memo(({ slip, onSave, onCancel }) => {
  const [amount, setAmount] = useState(slip.amount ?? "");
  const [date,   setDate]   = useState(slip.date   ?? "");
  const [ref,    setRef]    = useState(slip.ref     ?? "");
  const [amountError, setAmountError] = useState("");

  useEffect(() => {
    setAmount(slip.amount ?? "");
    setDate(slip.date ?? "");
    setRef(slip.ref ?? "");
  }, [slip]);
  // ค่าที่ OCR อ่านมาครั้งแรก (เก็บเป็น original สำหรับแสดง hint)
  const originalAmount = slip.originalAmount ?? slip.amount ?? "";
  const originalDate   = slip.originalDate   ?? slip.date   ?? "";
  const originalRef    = slip.originalRef    ?? slip.ref    ?? "";

  const validateAndSave = () => {
    // ตรวจสอบจำนวนเงิน
    const cleaned = amount.replace(/,/g, "");
    if (cleaned !== "" && isNaN(parseFloat(cleaned))) {
      setAmountError("กรุณาใส่ตัวเลขเท่านั้น เช่น 1500.00");
      return;
    }
    setAmountError("");
    onSave({
      amount,
      date,
      ref,
      isEdited: true,
      // เก็บค่า original ไว้ครั้งแรกที่แก้ เพื่อแสดง hint ในครั้งถัดไป
      originalAmount: originalAmount || slip.amount,
      originalDate:   originalDate   || slip.date,
      originalRef:    originalRef    || slip.ref,
    });
  };

  const isAmountSuspect = !slip.amount || slip.amount === "N/A";
  const isDateSuspect   = !slip.date   || slip.date   === "N/A";
  const isRefSuspect    = !slip.ref    || slip.ref    === "N/A";

  return (
    <View style={editStyles.container}>
      {/* Header */}
      <View style={editStyles.headerRow}>
        <Ionicons name="construct-outline" size={15} color="#6B7280" />
        <Text style={editStyles.title}>แก้ไขข้อมูล OCR</Text>
      </View>

      {/* ── จำนวนเงิน ── */}
      <View style={editStyles.fieldBlock}>
        <View style={editStyles.labelRow}>
          <Ionicons name="cash-outline" size={13} color="#6B7280" />
          <Text style={editStyles.label}>จำนวนเงิน</Text>
          {isAmountSuspect && (
            <View style={editStyles.suspectBadge}>
              <Ionicons name="warning-outline" size={11} color="#B45309" />
              <Text style={editStyles.suspectText}>OCR ไม่แน่ใจ</Text>
            </View>
          )}
        </View>
        <TextInput
          style={[editStyles.input, amountError ? editStyles.inputError : null]}
          value={amount}
          onChangeText={(v) => { setAmount(v); setAmountError(""); }}
          keyboardType="decimal-pad"
          placeholder="เช่น 1500.00"
          placeholderTextColor="#9CA3AF"
        />
        {amountError ? (
          <Text style={editStyles.errorText}>{amountError}</Text>
        ) : originalAmount && originalAmount !== amount ? (
          <Text style={editStyles.hintText}>
            🔍 OCR อ่านได้: {originalAmount}
          </Text>
        ) : null}
      </View>

      {/* ── วันที่ ── */}
      <View style={editStyles.fieldBlock}>
        <View style={editStyles.labelRow}>
          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
          <Text style={editStyles.label}>วันที่</Text>
          {isDateSuspect && (
            <View style={editStyles.suspectBadge}>
              <Ionicons name="warning-outline" size={11} color="#B45309" />
              <Text style={editStyles.suspectText}>OCR ไม่แน่ใจ</Text>
            </View>
          )}
        </View>
        <TextInput
          style={editStyles.input}
          value={date}
          onChangeText={setDate}
          placeholder="เช่น 15 ม.ค. 68 หรือ 15/01/2568"
          placeholderTextColor="#9CA3AF"
        />
        {originalDate && originalDate !== date && (
          <Text style={editStyles.hintText}>🔍 OCR อ่านได้: {originalDate}</Text>
        )}
      </View>

      {/* ── เลขอ้างอิง ── */}
      <View style={editStyles.fieldBlock}>
        <View style={editStyles.labelRow}>
          <Ionicons name="barcode-outline" size={13} color="#6B7280" />
          <Text style={editStyles.label}>เลขอ้างอิง (REF)</Text>
          {isRefSuspect && (
            <View style={editStyles.suspectBadge}>
              <Ionicons name="warning-outline" size={11} color="#B45309" />
              <Text style={editStyles.suspectText}>OCR ไม่แน่ใจ</Text>
            </View>
          )}
        </View>
        <TextInput
          style={editStyles.input}
          value={ref}
          onChangeText={setRef}
          placeholder="เลขอ้างอิง"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
        />
        {originalRef && originalRef !== ref && (
          <Text style={editStyles.hintText}>🔍 OCR อ่านได้: {originalRef}</Text>
        )}
      </View>

      {/* ── ปุ่ม ── */}
      <View style={editStyles.btnRow}>
        <TouchableOpacity style={editStyles.cancelBtn} onPress={onCancel}>
          <Text style={editStyles.cancelBtnText}>ยกเลิก</Text>
        </TouchableOpacity>
        <TouchableOpacity style={editStyles.saveBtn} onPress={validateAndSave}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={editStyles.saveBtnText}>บันทึก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── SlipReviewItem ───────────────────────────────────────────────────────────
//  memo — re-render เฉพาะเมื่อ props ของตัวเองเปลี่ยน ไม่กระทบ item อื่น
const SlipReviewItem = memo(({ slip, onToggle, onUpdate, autoEdit, categories =[] }) => {
  // autoEdit: true เมื่อเปิดมาเพื่อแก้สลิปนี้โดยตรง → เปิด form ทันที
  const [isEditing, setIsEditing] = useState(() => autoEdit ?? false);

  // ถ้า autoEdit เปลี่ยน (เช่น เปิด modal ใหม่) ให้ sync state
  useEffect(() => {
    if (autoEdit) setIsEditing(true);
  }, [autoEdit]);

  const isComplete = !!slip.categoryId && !!slip.maslowId;

  const handleCategorySelect = useCallback(
    (id) => onUpdate(slip.tempId, { categoryId: id }),
    [slip.tempId, onUpdate]
  );
  const handleMaslowSelect = useCallback(
    (id) => onUpdate(slip.tempId, { maslowId: id }),
    [slip.tempId, onUpdate]
  );
  const handleToggle = useCallback(
    () => onToggle(slip.tempId),
    [slip.tempId, onToggle]
  );

  return (
    <View style={[
      itemStyles.card,
      !slip.isSelected && itemStyles.cardUnselected,
      slip.isSelected && !isComplete && itemStyles.cardWarning,
    ]}>
      {/* ─── รูปภาพ ─── */}
      <View style={itemStyles.imageWrapper}>
        {slip.imageUri ? (
          <Image
            source={{ uri: slip.imageUri }}
            style={itemStyles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={[itemStyles.image, itemStyles.noImage]}>
            <Ionicons name="image-outline" size={48} color="#D1D5DB" />
          </View>
        )}
        <TouchableOpacity onPress={handleToggle} style={itemStyles.checkboxOverlay}>
          <Ionicons
            name={slip.isSelected ? "checkbox" : "square-outline"}
            size={30}
            color={slip.isSelected ? COLORS.primary : "#9CA3AF"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsEditing((v) => !v)}
          style={itemStyles.editOverlay}
        >
          <Ionicons
            name={isEditing ? "close-circle" : "create"} size={28}
            color={isEditing ? COLORS.danger : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* ─── ข้อมูลสลิป ─── */}
      {isEditing ? (
          <SlipEditForm slip={slip} onSave={(fields) => {
            onUpdate(slip.tempId, fields);
            setIsEditing(false);
          }} />
        ) : (
          <View style={itemStyles.info}>
            <View style = {itemStyles.amountRow}>
              <Text style={itemStyles.amount}>
                {slip.amount !== "N/A" ? `฿${parseFloat(slip.amount.replace(/,/g, "")).toLocaleString()}`
                : "ไม่พบยอดเงิน"}
              </Text>
            </View>

            <View style={itemStyles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color="#6B7280" />
              <Text style={itemStyles.meta}>{slip.date || "ไม่พบวันที่" }  </Text>
              <Ionicons name="barcode-outline" size={13} color="#6B7280" />
              <Text style={itemStyles.meta}>{slip.ref || "ไม่พบเลขอ้างอิง" }  </Text>
            </View>
          </View>
        )}

      {/* ─── Pickers (เฉพาะ item ที่ถูกเลือก) ─── */}
      {slip.isSelected && (
        <View style={pickerStyles.pickerWrapper}>
          <CategoryPicker selectedId={slip.categoryId} onSelect={handleCategorySelect} categories={categories} />
          <MaslowPicker   selectedId={slip.maslowId}   onSelect={handleMaslowSelect} />
        </View>
      )}

      {/* ─── Edit Form ─── */}
    </View>
  );
}, (prev, next) =>
  // ✅ custom comparator — re-render เฉพาะเมื่อ props จริงๆ เปลี่ยน
  prev.slip === next.slip &&
  prev.onToggle === next.onToggle &&
  prev.onUpdate === next.onUpdate &&
  prev.autoEdit === next.autoEdit &&
  prev.categories === next.categories
);

// ─── SlipReviewModal ──────────────────────────────────────────────────────────
const SlipReviewModal = ({
  visible, pendingSlips, isSaving,
  onToggleSelection, onSelectAll, onUpdate,
  onConfirm, onDiscard, onClose,
}) => {
  const selectedSlips   = pendingSlips.filter((s) => s.isSelected);
  const selectedCount   = selectedSlips.length;
  const allSelected     = selectedCount === pendingSlips.length && pendingSlips.length > 0;
  const incompleteCount = selectedSlips.filter((s) => !s.categoryId || !s.maslowId).length;
  const [categories, setCategories] = useState([]);

useEffect(() => {
    if (visible) {
      const loadDB = async () => {
        try {
          const rawData = await getCategories();
          // กรองเอาเฉพาะหมวดหมู่ฝั่งรายจ่าย (Expense) เพราะนี่คือกิจกรรมการสแกนสลิปรายจ่าย
          const expenseOnly = rawData.filter(c => c.category_type === "expense" || c.type === "expense");
          setCategories(expenseOnly);
        } catch (error) {
          console.error("Error loading categories in SlipReviewModal:", error);
        }
      };
      loadDB();
    }
  }, [visible]);

  //  useCallback — ป้องกัน SlipReviewItem re-render เพราะ props เปลี่ยน reference
  // (onToggleSelection และ onUpdate มาจาก useSlipScanner ซึ่ง wrap ด้วย useCallback แล้ว)
  const handleToggle = onToggleSelection;
  const handleUpdate = onUpdate;

  // single-slip mode: เปิด modal มาเพื่อแก้สลิปนี้โดยตรง → เปิด edit form อัตโนมัติ
  const isSingleSlip = pendingSlips.length === 1;

  //  FlatList renderItem — useCallback ป้องกัน re-create ทุก render
  const renderItem = useCallback(({ item }) => (
    <SlipReviewItem
      slip={item}
      onToggle={handleToggle}
      onUpdate={handleUpdate}
      autoEdit={isSingleSlip}
      categories={categories}
      
    />
  ), [handleToggle, handleUpdate, isSingleSlip, categories]);

  //  keyExtractor คงที่ ไม่สร้าง function ใหม่ทุกรอบ
  const keyExtractor = useCallback((item) => item.tempId, []);

  //  ListHeaderComponent — "เลือกทั้งหมด" row อยู่ใน FlatList ด้วยกัน
  // ป้องกัน nested ScrollView + ทำให้ scroll ลื่นขึ้น
  const ListHeader = useCallback(() => (
    <TouchableOpacity
      style={modalStyles.selectAllRow}
      onPress={() => onSelectAll(!allSelected)}
    >
      <Ionicons
        name={allSelected ? "checkbox" : "square-outline"} size={22}
        color={allSelected ? COLORS.primary : "#9CA3AF"}
      />
      <Text style={modalStyles.selectAllText}>
        {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
      </Text>
    </TouchableOpacity>
  ), [allSelected, onSelectAll]);

  //  ListEmptyComponent
  const ListEmpty = useCallback(() => (
    <View style={modalStyles.emptyBox}>
      <Ionicons name="document-outline" size={48} color="#D1D5DB" />
      <Text style={modalStyles.emptyText}>ไม่มีรายการ</Text>
    </View>
  ), []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modalStyles.container}>

        {/* ─── Header ─── */}
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} style={modalStyles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={modalStyles.title}>ตรวจสอบสลิป</Text>
            <Text style={modalStyles.subtitle}>
              {pendingSlips.length} รายการ · เลือก {selectedCount}
              {incompleteCount > 0 && (
                <Text style={{ color: "#EF4444" }}> · ยังไม่ครบ {incompleteCount}</Text>
              )}
            </Text>
          </View>
          <TouchableOpacity onPress={onDiscard} style={modalStyles.discardBtn}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/*  FlatList  ─── */}
        <FlatList
          data={pendingSlips}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={<View style={{ height: 140 }} />}
          extraData={pendingSlips}   // ← สำคัญ: ให้ FlatList รู้ว่า data เปลี่ยนแปลง
          // ── Performance config ──────────────────
          initialNumToRender={3}       // render แค่ 3 item แรก ก่อน
          maxToRenderPerBatch={3}      // render ทีละ 3 เมื่อ scroll
          windowSize={5}               // เก็บ viewport * 5 ใน memory
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true} //  unmount item นอกหน้าจอ (ประหยัด memory)
          getItemLayout={undefined}    // ไม่ set เพราะ item สูงไม่เท่ากัน (มี/ไม่มี pickers)
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}
          style={{ flex: 1 }}
        />

        {/* ─── Footer ─── */}
        <View style={modalStyles.footer}>
          {incompleteCount > 0 && selectedCount > 0 && (
            <View style={modalStyles.warningBar}>
              <Ionicons name="warning-outline" size={15} color="#92400E" />
              <Text style={modalStyles.warningText}>
                เลือกหมวดหมู่และระดับ Maslow ให้ครบก่อนบันทึก ({incompleteCount} รายการ)
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              modalStyles.confirmBtn,
              (selectedCount === 0 || isSaving || incompleteCount > 0) && modalStyles.confirmBtnDisabled,
            ]}
            onPress={onConfirm}
            disabled={selectedCount === 0 || isSaving || incompleteCount > 0}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={modalStyles.confirmBtnText}>
                  บันทึกที่เลือก ({selectedCount} รายการ)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </Modal>
  );
};

export default SlipReviewModal;

// ─── Styles ───────────────────────────────────────────────────────────────────

const pickerStyles = StyleSheet.create({
  pickerWrapper: { borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  section: {
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 10,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  required: { fontSize: 11, color: "#EF4444", marginLeft: "auto" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  pillTextActive: { color: "#fff" },
  maslowGrid: { gap: 6 },
  maslowCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB",
  },
  maslowIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  maslowTitle: { fontSize: 13, fontWeight: "600", color: "#374151" },
  maslowSub:   { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  discardBtn: { padding: 8, borderRadius: 8, backgroundColor: "#FEE2E2" },
  selectAllRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },
  selectAllText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#E5E7EB",
  },
  warningBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FEF3C7", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  warningText: { fontSize: 12, color: "#92400E", flex: 1 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
  },
  confirmBtnDisabled: { backgroundColor: "#9CA3AF" },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

const itemStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 14, marginBottom: 16,
    overflow: "hidden", borderWidth: 1.5, borderColor: "#E5E7EB", elevation: 2,
  },
  cardUnselected: { opacity: 0.45 },
  cardWarning: { borderColor: "#FCA5A5" },
  imageWrapper: { position: "relative" },
  image: { width: "100%", height: 260, backgroundColor: "#F3F4F6" },
  noImage: { alignItems: "center", justifyContent: "center" },
  checkboxOverlay: {
    position: "absolute", top: 10, left: 10,
    backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 8, padding: 4,
  },
  editOverlay: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 8, padding: 4,
  },
  info: { padding: 12, paddingBottom: 8 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  amount: { fontSize: 20, fontWeight: "700", color: "#111827" },
  amountNA: { fontSize: 16, color: "#EF4444", fontStyle: "italic" },
  editedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#D1FAE5", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  editedBadgeText: { fontSize: 10, color: "#059669", fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 16 },
  meta: { fontSize: 13, color: "#6B7280" },
  metaNA: { color: "#EF4444", fontStyle: "italic" },
  selectedTagRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.primary + "40",
    backgroundColor: COLORS.primary + "08",
  },
  tagText: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
});

const editStyles = StyleSheet.create({
  container: {
    marginHorizontal: 12, marginBottom: 12, padding: 12,
    backgroundColor: "#F9FAFB", borderRadius: 10,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  title: { fontSize: 14, fontWeight: "600", color: "#374151" },
  fieldBlock: { marginBottom: 10 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  label: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  suspectBadge: {
    flexDirection: "row", alignItems: "center", gap: 3, marginLeft: "auto",
    backgroundColor: "#FEF3C7", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  suspectText: { fontSize: 10, color: "#B45309", fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, color: "#111827", backgroundColor: "#fff",
  },
  inputError: { borderColor: "#EF4444" },
  errorText: { fontSize: 11, color: "#EF4444", marginTop: 4 },
  hintText: { fontSize: 11, color: "#9CA3AF", marginTop: 4, fontStyle: "italic" },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  cancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: "#D1D5DB", alignItems: "center",
  },
  cancelBtnText: { color: "#6B7280", fontWeight: "600" },
  saveBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 8,
    backgroundColor: COLORS.primary, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});