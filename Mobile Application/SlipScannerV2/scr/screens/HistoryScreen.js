// ─────────────────────────────────────────────
// screens/HistoryScreen.js (ฉบับอัปเดตระบบ Edit/Delete/Confirm)
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Modal, Image, ScrollView, ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/commonStyles";
import { historyStyles, itemStyles, pillStyles, modalStyles } from "../styles/historyStyles";
import { useHistory, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../hooks/useHistory";
import { useAuth } from "../context/AuthContext";
import MonthPickerModal, { MONTHS } from "../components/MonthPickerModal";

// ➕ นำเข้าฟังก์ชันจัดการฐานข้อมูล SQL ที่เราสร้างขึ้นใหม่
import { 
  deleteTransaction, 
  deleteSlip, 
  confirmTransactionStatus, 
  updateSlip,
} from "../database/database";

export default function HistoryScreen() {
  // ── Hooks — ต้องเรียกในลำดับคงที่ทุก render (Rules of Hooks) ──────────────
  const { user } = useAuth();
  const userId = user?.user_id;

  const {
    filteredHistory,
    isLoading,
    filter,              handleSetFilter,
    searchText,          setSearchText,
    filterCategory,      setFilterCategory,
    selectedMonthIndex,  setSelectedMonthIndex,
    selectedYear,        setSelectedYear,
    loadHistory,
    incomeCategories,
    expenseCategories,
  } = useHistory();

  const [isMonthModalVisible,  setIsMonthModalVisible]  = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedPendingTx,    setSelectedPendingTx]    = useState(null);

  // ➕ State สำหรับจัดการหน้าต่างแก้ไขธุรกรรมย่อย (Edit Modal)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // ใช้ dynamic categories จาก DB (มี category_id, category_name)
  // แทนที่ static INCOME_CATEGORIES / EXPENSE_CATEGORIES ที่ใช้ id/name ต่างกัน
  const getVisibleCategories = () => {
    if (filter === "income")  return incomeCategories;
    if (filter === "expense") return expenseCategories;
    return [...incomeCategories, ...expenseCategories];
  };

  // ── ➕ ฟังก์ชันสำหรับลบรายการประวัติ ─────────────────────────────────────
  const handleDeleteItem = (item) => {
    Alert.alert(
      "ยืนยันการลบ",
      `คุณต้องการลบรายการ "${item.name || 'ไม่มีชื่อ'}" ใช่หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบรายการ",
          style: "destructive",
          onPress: async () => {
            try {
              // ใช้ id prefix เป็นตัวตัดสินประเภท — ocr_ = สลิป, manual_ = รายการปกติ
              const isOcr = item.id.startsWith("ocr_");
              const cleanId = item.id.replace("manual_", "").replace("ocr_", "");

              if (isOcr) {
                await deleteSlip(cleanId, userId);
              } else {
                await deleteTransaction(cleanId, userId);
              }

              Alert.alert("สำเร็จ", "ลบรายการเรียบร้อยแล้ว");
              loadHistory(); // 🔄 รีเฟรชข้อมูลหน้าจอทันที
            } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบรายการนี้ได้");
            }
          }
        }
      ]
    );
  };

  // ── ➕ ฟังก์ชันกดเปิด Modal แก้ไขธุรกรรม ──────────────────────────────────
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setEditName(item.name || "");
    setEditAmount(item.amount?.toString() || "");
    setIsEditModalVisible(true);
  };

  // ── ➕ ฟังก์ชันบันทึกการแก้ไขข้อมูลธุรกรรมเก่าลง SQL ─────────────────────────
  const handleSaveEdit = async () => {
    if (!editName.trim() || !editAmount.trim()) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    try {
      // ตัด prefix ocr_ หรือ manual_ ให้ตรงกับ prefix จริงที่ useHistory กำหนด
      const cleanId = editingItem.id.replace("manual_", "").replace("ocr_", "");
      await updateSlip(cleanId, editName, parseFloat(editAmount));
      
      Alert.alert("สำเร็จ", "แก้ไขข้อมูลเรียบร้อยแล้ว");
      setIsEditModalVisible(false);
      loadHistory(); // 🔄 รีเฟรชหน้าจอทันที
    } catch (error) {
      console.error("Edit Error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลแก้ไขได้");
    }
  };

  // ── ➕ ฟังก์ชันสำหรับปุ่ม ยืนยันความถูกต้อง (อัปเดต SQL จริง) ────────────────────
  const handleConfirmOCR = async () => {
    if (!selectedPendingTx) return;
    try {
      // ทำความสะอาดไอดีถอนรหัสคำนำหน้าออก
      const cleanId = selectedPendingTx.id?.replace("ocr_", "").replace("manual_", "");
      
      // 🚀 ส่งคำสั่งอัปเดต SQL ไปยังฐานข้อมูล
      await confirmTransactionStatus(cleanId);

      Alert.alert("สำเร็จ!", "ยืนยันความถูกต้องของข้อมูลสลิปเรียบร้อยแล้ว");
      setIsReviewModalVisible(false);
      loadHistory(); // 🔄 รีเฟรชข้อมูลเพื่อปรับสีแถบหรือสถานะในประวัติ
    } catch (error) {
      console.error("Confirm OCR Error:", error);
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการยืนยันสถานะข้อมูล");
    }
  };

  const isSelectedConfirmed = selectedPendingTx?.status === 'confirmed';

  // ── ปรับปรุงส่วนแสดงผลแถวรายการธุรกรรมแต่ละตัว ────────────────────────────────
  const renderItem = ({ item }) => {
    const isOcr = item.source === "ocr";
    const amountColor = item.type === "income" ? "#10B981" : "#EF4444";
    const amountPrefix = item.type === "income" ? "+" : "-";
    return (
      <View style={[itemStyles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
        {/* ── ไอคอนหมวดหมู่ ── */}
        <View style={[itemStyles.iconCircle, { backgroundColor: amountColor + "15" }]}>
          <Ionicons
            name={isOcr ? "scan-outline" : item.type === "income" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
            size={22} color={amountColor}
          />
        </View>

        {/* ── ชื่อรายการ + วันที่ ── */}
        <TouchableOpacity
          style={{ flex: 1, paddingHorizontal: 10 }}
          onPress={() => {
            if (isOcr) {
              setSelectedPendingTx(item);
              setIsReviewModalVisible(true);
            }
          }}
        >
          <Text style={itemStyles.name} numberOfLines={1}>{item.name || "ไม่มีชื่อรายการ"}</Text>
          <Text style={itemStyles.meta}>
            {item.category_name ? `${item.category_name}  ·  ` : ""}
            {item.date ? item.date.slice(0, 10) : ""}
            {isOcr && (
              <Text style={{ color: item.status === "confirmed" ? "#059669" : "#D97706", fontWeight: "600" }}>
                {"  "}
                {item.status === "confirmed" ? "✓ ยืนยันแล้ว" : "⏳ รอตรวจสอบ"}
              </Text>
            )}
          </Text>
        </TouchableOpacity>

        {/* ── ยอดเงิน ── */}
        <Text style={[itemStyles.amount, { color: amountColor, marginRight: 8 }]}>
          {amountPrefix}฿{item.amount?.toLocaleString("th-TH")}
        </Text>

        {/* ── ปุ่ม Edit / Delete ── */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {!isOcr && (
            <TouchableOpacity onPress={() => handleOpenEditModal(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDeleteItem(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={historyStyles.container}>
      <View style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={historyStyles.headerContainer}>
          <Text style={historyStyles.headerTitle}>ประวัติรายการ</Text>

          {/* Search bar */}
          <View style={historyStyles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.gray} style={{ marginRight: 8 }} />
            <TextInput
              style={historyStyles.searchInput}
              placeholder="ค้นหารายการ..."
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>

          {/* Month selector */}
          <TouchableOpacity
            style={historyStyles.monthSelector}
            onPress={() => setIsMonthModalVisible(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={historyStyles.monthText}>
              {MONTHS[selectedMonthIndex]} {selectedYear + 543}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Filter Tabs ── */}
        <View style={historyStyles.filterContainer}>
          {[
            { key: "all",     label: "ทั้งหมด" },
            { key: "income",  label: "รายรับ"  },
            { key: "expense", label: "รายจ่าย" },
            { key: "ocr",     label: "สลิป OCR" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[historyStyles.filterBtn, filter === tab.key && historyStyles.filterBtnActive]}
              onPress={() => handleSetFilter(tab.key)}
            >
              <Text style={[historyStyles.filterText, filter === tab.key && historyStyles.filterTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Category Pills ── */}
        {(filter === "income" || filter === "expense") && getVisibleCategories().length > 0 && (
          <View style={historyStyles.categoryWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={historyStyles.categoryScroll}>
              {/* pill ล้างตัวกรอง */}
              <TouchableOpacity
                style={[historyStyles.categoryPill, !filterCategory && historyStyles.categoryPillActive]}
                onPress={() => setFilterCategory("")}
              >
                <Text style={[historyStyles.categoryPillText, !filterCategory && historyStyles.categoryPillTextActive]}>
                  ทั้งหมด
                </Text>
              </TouchableOpacity>
              {getVisibleCategories().map((cat) => (
                <TouchableOpacity
                  key={cat.category_id || cat.id}
                  style={[historyStyles.categoryPill, filterCategory === cat.category_name && historyStyles.categoryPillActive]}
                  onPress={() => setFilterCategory(cat.category_name)}
                >
                  <Text style={[historyStyles.categoryPillText, filterCategory === cat.category_name && historyStyles.categoryPillTextActive]}>
                    {cat.category_name || cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── List ── */}
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
            ListEmptyComponent={() => (
              <View style={{ alignItems: "center", marginTop: 60 }}>
                <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                <Text style={{ color: "#9CA3AF", marginTop: 12, fontSize: 14 }}>ไม่พบรายการประวัติ</Text>
              </View>
            )}
          />
        )}

        {/* ── 🔄 หน้าต่างรีวิวความถูกต้องสลิป OCR ย่อยเดิม ── */}
        <Modal visible={isReviewModalVisible} transparent animationType="fade" onRequestClose={() => setIsReviewModalVisible(false)}>
          <View style={modalStyles.modalOverlay}>
            <View style={modalStyles.modalContent}>
              <View style={modalStyles.modalHeader}>
                <Text style={modalStyles.modalTitle}>รายละเอียดสลิป OCR</Text>
                <TouchableOpacity onPress={() => setIsReviewModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* ── รูปสลิป ── */}
                {selectedPendingTx?.imageUri ? (
                  <Image
                    source={{ uri: selectedPendingTx.imageUri }}
                    style={{ width: "100%", height: 200, borderRadius: 10, marginBottom: 16 }}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={{ width: "100%", height: 120, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Ionicons name="image-outline" size={40} color="#D1D5DB" />
                    <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>ไม่มีรูปภาพ</Text>
                  </View>
                )}

                {/* ── ข้อมูลสลิป ── */}
                {[
                  { label: "ยอดเงิน",    value: selectedPendingTx?.amount != null ? `฿${Number(selectedPendingTx.amount).toLocaleString("th-TH")}` : "-", icon: "cash-outline" },
                  { label: "วันที่",      value: selectedPendingTx?.date   ? selectedPendingTx.date.slice(0, 10) : "-",                                   icon: "calendar-outline" },
                  { label: "เลขอ้างอิง", value: selectedPendingTx?.slip_ref || "-",                                                                       icon: "barcode-outline" },
                  { label: "หมวดหมู่",   value: selectedPendingTx?.category_name || "ยังไม่กำหนด",                                                        icon: "grid-outline" },
                ].map(({ label, value, icon }) => (
                  <View key={label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
                    <Ionicons name={icon} size={16} color="#6B7280" style={{ marginRight: 10, width: 20 }} />
                    <Text style={{ fontSize: 13, color: "#6B7280", width: 80 }}>{label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 }}>{value}</Text>
                  </View>
                ))}

                {/* ── ปุ่มยืนยันความถูกต้องด้านล่าง ── */}
                <TouchableOpacity
                  style={[isSelectedConfirmed ? modalStyles.closeActionBtn : modalStyles.confirmBtn, { marginTop: 20 }]}
                  onPress={isSelectedConfirmed ? () => setIsReviewModalVisible(false) : handleConfirmOCR}
                >
                  {!isSelectedConfirmed && (
                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                  )}
                  <Text style={isSelectedConfirmed ? modalStyles.closeActionBtnText : modalStyles.confirmBtnText}>
                    {isSelectedConfirmed ? "ปิดหน้าต่าง" : "ยืนยันความถูกต้องลงระบบ"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── ➕ (Option) หน้าต่างย่อยสำหรับแก้ไขข้อมูลธุรกรรมเก่า (Edit Modal) ── */}
        <Modal visible={isEditModalVisible} transparent animationType="fade" onRequestClose={() => setIsEditModalVisible(false)}>
          <View style={customStyles.modalOverlay}>
            <View style={customStyles.modalContent}>
              <Text style={customStyles.modalTitle}>📝 แก้ไขข้อมูลธุรกรรม</Text>
              
              <Text style={customStyles.label}>ชื่อรายการ</Text>
              <TextInput 
                style={customStyles.input} 
                value={editName} 
                onChangeText={setEditName} 
                placeholder="กรอกชื่อรายการ" 
              />

              <Text style={customStyles.label}>จำนวนเงิน</Text>
              <TextInput 
                style={customStyles.input} 
                value={editAmount} 
                onChangeText={setEditAmount} 
                keyboardType="numeric" 
                placeholder="0.00" 
              />

              <View style={customStyles.btnGroup}>
                <TouchableOpacity style={[customStyles.btn, customStyles.btnCancel]} onPress={() => setIsEditModalVisible(false)}>
                  <Text style={{ color: "#374151", fontWeight: "600" }}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[customStyles.btn, customStyles.btnSave]} onPress={handleSaveEdit}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>บันทึก</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <MonthPickerModal
          visible={isMonthModalVisible}
          selectedMonthIndex={selectedMonthIndex}
          selectedYear={selectedYear}
          onSelectMonth={setSelectedMonthIndex}
          onSelectYear={setSelectedYear}
          onClose={() => setIsMonthModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

// สไตล์ตกแต่งเพิ่มเติมสำหรับหน้าต่าง Edit Modal ย่อย
const customStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 15, color: "#111827" },
  label: { fontSize: 13, color: "#4B5563", marginBottom: 5, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 14, color: "#111827" },
  btnGroup: { flexDirection: "row", gap: 10, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  btnCancel: { borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#F9FAFB" },
  btnSave: { backgroundColor: COLORS.primary }
});