import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ScrollView, Dimensions, Alert, Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/commonStyles";
import { addStyles } from "../styles/addStyles";
import {
  MASLOW_LEVELS,
} from "../hooks/useTransaction";

const { width } = Dimensions.get("window");

export default function TransactionScreen({
  type,
  userId,
  amount,           setAmount,
  date,             setDate,
  time,             setTime,
  note,             setNote,
  selectedCategory,
  selectedMaslow,   setSelectedMaslow,
  scrollRef,
  handleCategorySelect,
  handleSave,
  incomeCategories,
  expenseCategories,
  navigation,
  onBudgetAlert,
}) {
  const isExpense   = type === "expense";
  const accentColor = isExpense ? "#EF4444" : "#10B981";
  const categories  = isExpense ? expenseCategories : incomeCategories ;


  // canSave: มีจำนวนเงินและเลือกหมวดหมู่แล้ว
  // expense ต้องเลือก Maslow ด้วย
  const canSave =
    !!amount &&
    !isNaN(parseFloat(amount)) &&
    !!selectedCategory &&
    (isExpense ? !!selectedMaslow : true);

  // ── Date / Time picker state ─────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // แปลง date string YYYY-MM-DD เป็น Date object
  const dateObj = date ? new Date(date + "T00:00:00") : new Date();

  const onDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (event.type === "dismissed") return;
    if (selected) {
      const d = selected;
      const iso = d.getFullYear() + "-"
        + String(d.getMonth() + 1).padStart(2, "0") + "-"
        + String(d.getDate()).padStart(2, "0");
      setDate(iso);
    }
  };

  const onTimeChange = (event, selected) => {
    setShowTimePicker(false);
    if (event.type === "dismissed") return;
    if (selected) {
      const hh = String(selected.getHours()).padStart(2, "0");
      const mm = String(selected.getMinutes()).padStart(2, "0");
      setTime(hh + ":" + mm);
    }
  };

  const formatNumber = (num) => {
    if (!num) return "";
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  };
  // format วันที่ให้อ่านง่าย ภาษาไทย
  const displayDate = dateObj.toLocaleDateString("th-TH", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  // ── handleSave: ส่ง userId จาก AuthContext ────────────────────────────────
  const onPressSave = () => {
    handleSave({ userId, onBudgetAlert });
  };

  return (
    <>
      {/* ── จำนวนเงิน ───────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>จำนวนเงิน</Text>
          <View style={styles.amountContainer}>
            
            <Text style={[styles.currencySymbol, { color: accentColor }]}>฿</Text>
            <TextInput
              style={[styles.amountInput, { color: COLORS.dark }]}
              placeholder="0"
              keyboardType="numeric"
              value={formatNumber(amount)}
              onChangeText={(text) => {
                // ลบ , ออกก่อนเก็บ
                const cleaned = text.replace(/,/g, "").replace(/[^0-9.]/g, "");
                setAmount(cleaned);
              }}
              autoFocus
            />
          </View>
      </View>

      {/* ── วันที่ + เวลา ──────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>วันที่ของรายการ</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* ปุ่มเลือกวันที่ */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.fieldInput,
              {
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
              },
            ]}
          >
            <Text
              style={{ fontSize: 14, color: COLORS.dark }}
              numberOfLines={1}
            >
              {displayDate}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          {/* ปุ่มเลือกเวลา */}
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={[
              styles.fieldInput,
              {
                width: 90,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
              },
            ]}
          >
            <Text style={{ fontSize: 14, color: COLORS.dark }}>{time}</Text>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Native DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "calendar"}
          onChange={onDateChange}
          // maximumDate={new Date()}
          locale="th"
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={dateObj}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "clock"}
          onChange={onTimeChange}
          is24Hour
        />
      )}

      {/* ── Note ReadOnly ───────────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>วันที่และเวลาที่บันทึก</Text>
        <View
          style={[
            styles.fieldInput,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              backgroundColor: "#F3F4F6",   // สีเทาแสดงว่า read-only
              borderColor: "#E5E7EB",
            },
          ]}
        >
          <Text style={{ fontSize: 14, color: "#9CA3AF" }}>
            {new Date().toLocaleDateString("th-TH", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </Text>
          <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
        </View>
        <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, paddingHorizontal: 2 }}>
          ตั้งค่าอัตโนมัติ ไม่สามารถแก้ไขได้
        </Text>
      </View>
      {/* ── Note ──────────────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>บันทึกช่วยจำ (Note)</Text>
        <TextInput
          style={[
            styles.fieldInput,
            { minHeight: 80, textAlignVertical: "top" },
          ]}
          placeholder="เพิ่มรายละเอียด..."
          value={note}
          onChangeText={setNote}
          multiline
        />
      </View>

      {/* ── Pager: หน้า 1 = Category / หน้า 2 = Maslow ──────────────────────── */}
      <FlatList
        ref={scrollRef}
        data={isExpense ? [1, 2] : [1]}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.toString()}
        renderItem={({ index }) => {
          // หน้า 1: หมวดหมู่
          if (index === 0) {
            return (
              <View style={{ width }}>
                <ScrollView
                  contentContainerStyle={{
                    paddingBottom: 150,
                    paddingHorizontal: 20,
                  }}
                >
                  <Text style={styles.stepLabel}>เลือกหมวดหมู่</Text>
                  <View style={styles.gridContainer}>
                    {categories.map((item) => {
                      const isSelected = selectedCategory?.category_id === item.category_id;
                      return (
                        <TouchableOpacity
                          key={item.category_id.toString()}
                          style={[
                            styles.catItemWrapper,
                            isSelected && styles.catItemSelected,
                          ]}
                          onPress={() => handleCategorySelect(item, type)}
                        >
                          <View
                            style={[
                              styles.iconCircle,
                              {
                                backgroundColor: isSelected
                                  ? accentColor
                                  : "#F3F4F6",
                              },
                            ]}
                          >
                            <Ionicons
                              name="pricetag-outline"
                              size={24}
                              color={isSelected ? "#fff" : COLORS.gray}
                            />
                          </View>
                          <Text
                            style={[
                              styles.catText,
                              isSelected && {
                                fontWeight: "700",
                                color: COLORS.dark,
                              },
                            ]}
                          >
                            {item.category_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* ปุ่มเพิ่มหมวดหมู่ (Coming Soon) */}
                    <TouchableOpacity
                      style={styles.catItemWrapper}
                      onPress={() =>
                        navigation.navigate("CategoryManagement")
                      }
                    >
                      <View style={[styles.iconCircle, styles.addBtnCircle]}>
                        <Ionicons name="add" size={30} color={COLORS.gray} />
                      </View>
                      <Text style={styles.catText}>เพิ่มเอง</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            );
          }

          // หน้า 2: Maslow (expense เท่านั้น)
          return (
            <View style={{ width }}>
              <View style={styles.stepContainer}>
                <View style={styles.stepHeaderRow}>
                  <TouchableOpacity
                    onPress={() =>
                      scrollRef.current?.scrollToIndex({
                        index: 0,
                        animated: true,
                      })
                    }
                  >
                    <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
                  </TouchableOpacity>
                  <Text style={styles.stepLabel}>{"Maslow's Impact"}</Text>
                  <View style={{ width: 24 }} />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 150 }}
                >
                  {MASLOW_LEVELS.map((level) => {
                    const isSelected = selectedMaslow?.id === level.id;
                    return (
                      <TouchableOpacity
                        key={level.id}
                        style={[
                          styles.maslowCard,
                          isSelected && {
                            borderColor: level.color,
                            backgroundColor: level.color + "15",
                          },
                        ]}
                        onPress={() => setSelectedMaslow(level)}
                      >
                        <View
                          style={[
                            styles.maslowIconBox,
                            {
                              backgroundColor: isSelected
                                ? level.color
                                : "#F3F4F6",
                            },
                          ]}
                        >
                          <Ionicons
                            name={level.icon}
                            size={22}
                            color={isSelected ? "#fff" : COLORS.gray}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.maslowTitle}>{level.title}</Text>
                          <Text style={styles.maslowSub}>{level.sub}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={level.color}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          );
        }}
      />

      {/* ── ปุ่มยืนยัน (Floating) ───────────────────────────────────────────── */}
      {canSave && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor }]}
            onPress={onPressSave}
          >
            <Text style={styles.saveBtnText}>ยืนยันรายการ</Text>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// ── ย้าย inline styles ออกมา ──────────────────────────────────────────────────
// (เพิ่มใน commonStyles ภายหลัง หรือจะเก็บ local ก็ได้)
const fieldStyles = {
  fieldGroup: { marginBottom: 15, paddingHorizontal: 20 },
  fieldLabel: { marginBottom: 5, color: COLORS.dark },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: COLORS.dark, backgroundColor: "#F9FAFB",
  },
};

const styles = { ...addStyles, ...fieldStyles };