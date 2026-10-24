import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/commonStyles";
import { MONTHS } from "../constants/months";

// Re-export so existing consumers (BudgetScreen, HistoryScreen) continue to work
export { MONTHS };

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 5;
const MAX_YEAR = CURRENT_YEAR;

export default function MonthPickerModal({
  visible,
  onClose,
  selectedMonthIndex,
  selectedYear,
  onSelectMonth,
  onSelectYear,
}) {
  const [displayYear, setDisplayYear] = useState(selectedYear);

  React.useEffect(() => {
    if (visible) setDisplayYear(selectedYear);
  }, [visible, selectedYear]);

  const canGoPrev = displayYear > MIN_YEAR;
  const canGoNext = displayYear < MAX_YEAR;

  const handleSelectMonth = (index) => {
    onSelectMonth(index);
    if (onSelectYear) onSelectYear(displayYear);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.box}>

          <Text style={styles.title}>เลือกเดือน / ปี</Text>

          <View style={styles.yearRow}>
            <TouchableOpacity
              style={[styles.yearArrow, !canGoPrev && styles.yearArrowDisabled]}
              onPress={() => canGoPrev && setDisplayYear((y) => y - 1)}
              disabled={!canGoPrev}
            >
              <Ionicons name="chevron-back" size={22} color={canGoPrev ? COLORS.primary : "#D1D5DB"} />
            </TouchableOpacity>

            <Text style={styles.yearText}>{displayYear}</Text>

            <TouchableOpacity
              style={[styles.yearArrow, !canGoNext && styles.yearArrowDisabled]}
              onPress={() => canGoNext && setDisplayYear((y) => y + 1)}
              disabled={!canGoNext}
            >
              <Ionicons name="chevron-forward" size={22} color={canGoNext ? COLORS.primary : "#D1D5DB"} />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {MONTHS.map((month, index) => {
              const isActive = selectedMonthIndex === index && displayYear === selectedYear;
              return (
                <TouchableOpacity
                  key={month}
                  style={[styles.monthBtn, isActive && styles.monthBtnActive]}
                  onPress={() => handleSelectMonth(index)}
                >
                  <Text style={[styles.monthText, isActive && styles.monthTextActive]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>ปิด</Text>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function MonthSelectorButton({ selectedMonthIndex, selectedYear, onPress }) {
  return (
    <TouchableOpacity style={styles.selectorBtn} onPress={onPress}>
      <Text style={styles.selectorText}>
        {MONTHS[selectedMonthIndex]} {selectedYear}
      </Text>
      <Ionicons name="chevron-down" size={16} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = {
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  box:                { width: "82%", backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  title:              { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center", color: "#111827" },
  yearRow:            { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 14, gap: 16 },
  yearArrow:          { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  yearArrowDisabled:  { backgroundColor: "#FAFAFA" },
  yearText:           { fontSize: 18, fontWeight: "700", color: COLORS.primary, minWidth: 60, textAlign: "center" },
  grid:               { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  monthBtn:           { width: "30%", paddingVertical: 10, alignItems: "center", marginBottom: 10, backgroundColor: "#F3F4F6", borderRadius: 10 },
  monthBtnActive:     { backgroundColor: COLORS.primary },
  monthText:          { fontSize: 13, color: "#111827", fontWeight: "500" },
  monthTextActive:    { color: "#fff", fontWeight: "700" },
  closeBtn:           { marginTop: 6, padding: 12, backgroundColor: "#F3F4F6", borderRadius: 10, alignItems: "center" },
  closeBtnText:       { color: "#111827", fontWeight: "bold", fontSize: 15 },
  selectorBtn:        { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  selectorText:       { color: "#fff", fontSize: 14, fontWeight: "600" },
};