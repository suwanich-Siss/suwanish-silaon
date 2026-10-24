import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Animated, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/commonStyles";
import { addStyles as styles } from "../styles/addStyles";
import { useBudget } from "../hooks/useBudget";
import MonthPickerModal, { MONTHS } from "../components/MonthPickerModal";

export default function BudgetScreen() {
  // เก็บค่า + ฟังก์ชันเปลี่ยนค่า
  const {
    amount,           setAmount,
    budgetCategory,   setBudgetCategory,
    budgetMonthIndex, setBudgetMonthIndex,
    budgetYear,       setBudgetYear,
    editingBudget, setEditingBudget,
    // UI state
    isMonthModalVisible, setIsMonthModalVisible,
    isFormExpanded, toggleForm,
    formHeight, formOpacity, arrowRotation,
    // data
    existingBudgets, isLoading,
    totalLimit, totalUsed,
    expenseCategories,
    //function (logic)
    handleSaveBudget,
    handleDeleteBudget,  // รับ budget object
    handleSaveEdit,      // รับ newAmount string
  } = useBudget();

  // local state สำหรับ edit input
  const [editAmount, setEditAmount] = useState("");
  const [isFormMonthModalVisible, setIsFormMonthModalVisible] = useState(false); //สถานะว่า modal เปิดอยู่ไหม เริ่มต้นคือปิดไว้

  return (
    //ใช้ทำ “หน้าจอเลื่อนขึ้น-ลงได้” ซ่อนแถบ scroll ด้านข้าง
    <ScrollView style={styles.budgetModeContainer} showsVerticalScrollIndicator={false}>
        {/*Accordion: ตั้งงบประมาณใหม่ ปุ่ม (Card กดได้)*/}
      <TouchableOpacity style={[styles.budgetFormCard, isFormExpanded && styles.budgetFormCardActive]} onPress={toggleForm} activeOpacity={0.9}>

          <View style={styles.cardHeader}>

              <View style={{flexDirection: "row", alignItems: "center"}}>

                <View style={[styles.iconCircle, { backgroundColor: "#E0E7FF", width: 40, height: 40, marginBottom: 0, marginRight: 12 }]}>
                  <Ionicons name="wallet" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>ตั้งงบประมาณใหม่</Text>
              </View>
              {/*ลูกศรหมุน*/}
              <Animated.View style={{transform: [{ rotate: arrowRotation}]}}>
                <Ionicons name="chevron-down" size={24} color={COLORS.gray} />
              </Animated.View>
          </View>
          {/* ป็น View ที่ “มี animation”  formHeight = คุม “ความสูง” (เปิด/ปิด) formOpacity = คุม “ความโปร่งใส” */}
          <Animated.View style={[styles.hiddenFormContainer, { height: formHeight, opacity: formOpacity }]}>
           {/* เส้นคั่น */}
           <View style={styles.divider}/>

            {/* วงเงิน */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>วงเงิน (฿)</Text>
                <TextInput
                  style={[styles.inputField, { color: COLORS.primary, fontWeight: "bold" }]}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
            />
            </View>

            {/* เลือกหมวดหมู่ กล่องครอบทั้งหมด + เว้นระยะด้านล่าง*/}
            <View style={{ marginBottom: 15 }}>
              {/* label บอกว่าเป็นส่วนเลือกหมวด */}
              <Text style={{ marginBottom: 8, color: COLORS.dark, fontWeight: "600" }}>หมวดหมู่งบประมาณ</Text>
              {/* horizontal = เลื่อนซ้าย-ขวา */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {/* วน array หมวดหมู่ item = แต่ละหมวด */}
                  {expenseCategories.map((item) => {
                    // ถ้า id ตรงกัน = เลือกอยู่
                    const isSelected = budgetCategory?.category_id === item.category_id;
                    return (
                      <TouchableOpacity key={item.category_id} onPress={() => setBudgetCategory(item)} style={{paddingVertical: 8, paddingHorizontal: 14, marginRight: 8,
                      backgroundColor: isSelected ? COLORS.primary : COLORS.lightGray,
                      borderRadius: 20, borderWidth: 1,
                      borderColor: isSelected ? COLORS.primary : "#E5E7EB",}}>
                        {/* ตัวหนังสือสีขาว หนาขึ้น */}
                        <Text style={{ color: isSelected ? "#fff" : COLORS.dark, fontWeight: isSelected ? "700" : "400" }}>
                          {item.category_name}
                        </Text>
                      </TouchableOpacity>

                    );
                  })}
                </ScrollView>
              
            </View>
            {/* เลือกเดือนที่ต้องการตั้งงบ กล่องครอบ + เว้นระยะด้านล่าง*/}
            <View style={{ marginBottom: 15 }}>
              {/* label บอกว่าเลือก “เดือน / ปี” */}
              <Text style={styles.label}>เดือน / ปี</Text>
              {/* กดแล้ว เปิด modal สำหรับเลือกเดือน/ปี style ทำให้หน้าตาเหมือน input ข้างในจัด “ซ้าย-ขวา”*/}
              <TouchableOpacity onPress={() => setIsFormMonthModalVisible(true)} style={[styles.inputField, 
                  {flexDirection: "row", alignItems: "center",
                  justifyContent: "space-between", paddingVertical: 12,
                  }]}>
                    {/* ดือน (จาก array MONTHS)   */}
                  <Text style={{ fontSize: 15, color: COLORS.dark }}>
                    {MONTHS[budgetMonthIndex]}  {budgetYear}
                  </Text>
                  {/* ไอคอนปฏิทิน/ */}
                <Ionicons name="calendar-outline" size={18} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
                  {/* เอาข้อมูลทั้งหมดไปบันทึก (amount, category, month, year) */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudget}>
              <Text style={styles.saveButtonText}>บันทึกงบประมาณ</Text>
            </TouchableOpacity>
          </Animated.View>
      </TouchableOpacity>

      {/* ── เลือกเดือน ────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.monthSelector}
        onPress={() => setIsMonthModalVisible(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
        <Text style={styles.monthSelectorText}>
          {MONTHS[budgetMonthIndex]} {budgetYear}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.gray} />
      </TouchableOpacity>
      {/* สรุปยอดงบ */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>งบรวม</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
            ฿{totalLimit.toLocaleString()}
          </Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>ใช้ไปแล้ว</Text>
          <Text style={[styles.summaryValue, { color: totalUsed > totalLimit ? "#EF4444" : "#10B981" }]}>
            ฿{totalUsed.toLocaleString()}
          </Text>
        </View>
      </View>
{/* รายการงบแต่ละหมวด */}
      {isLoading ? null : existingBudgets.map((budget) => {
        const usedPercent = budget.amount_limit > 0 ? Math.min((budget.used / budget.amount_limit) * 100, 100) :0;
        const isOver = budget.used > budget.amount_limit;
        const barColor = isOver ?  "#EF4444" : usedPercent > 80 ? "#F59E0B" : "#10B981";
        const isEditing = editingBudget?.category_id === budget.category_id;

        return (
          <View key={budget.category_id} style={styles.budgetItemCard}>
            <View style={styles.budgetItemHeader}>
              <Text style={styles.budgetCategoryName}>{budget.category_name}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {/* ปุ่มแก้ไข */}
                <TouchableOpacity onPress={() => {setEditAmount(String(budget.amount_limit)); setEditingBudget(budget); }}>
                  <Ionicons name="pencil-outline" size={18} color={COLORS.gray}/>
                </TouchableOpacity>
                {/* ปุ่มลบ — ส่ง budget object ทั้งก้อน */}
                <TouchableOpacity onPress={() => handleDeleteBudget(budget)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444"/>
                </TouchableOpacity>
              </View>
            </View>
            {/* Edit inline */}
            {isEditing && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
                <TextInput style={[styles.inputField, { flex: 1 }]}
                  keyboardType="numeric"
                  value={editAmount}
                  onChangeText={setEditAmount}
                  autoFocus />
                <TouchableOpacity onPress={() => handleSaveEdit(editAmount)} style={styles.saveButton}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    บันทึก
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingBudget(null)}>
                  <Ionicons name="close-circle" size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
            )}
            {/* ตัวเลข: ใช้แล้ว / งบ */}
            <View style={styles.budgetAmountRow}>
              <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                ใช้แล้ว ฿{budget.used.toLocaleString()}
              </Text>
              <Text style={{ color: COLORS.dark, fontSize: 12, fontWeight: "600" }}>
                งบ ฿{budget.amount_limit.toLocaleString()}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${usedPercent}%`, backgroundColor: barColor }]}/>
            </View>
          </View>
        );
      })}
      {/* MonthPickerModal */}
      <MonthPickerModal
        visible={isMonthModalVisible}
        selectedMonthIndex={budgetMonthIndex}
        selectedYear={budgetYear}
        onSelectMonth={(idx) => setBudgetMonthIndex(idx)}
        onSelectYear={(year) => setBudgetYear(year)}
        onClose={() => setIsMonthModalVisible(false)}
      />

      {/* MonthPickerModal สำหรับฟอร์ม accordion */}
      <MonthPickerModal
        visible={isFormMonthModalVisible}
        selectedMonthIndex={budgetMonthIndex}
        selectedYear={budgetYear}
        onSelectMonth={(idx) => setBudgetMonthIndex(idx)}
        onSelectYear={(year) => setBudgetYear(year)}
        onClose={() => setIsFormMonthModalVisible(false)}
      />
        
    </ScrollView>
  );

}