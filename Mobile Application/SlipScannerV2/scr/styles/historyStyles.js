// ─────────────────────────────────────────────
// styles/history.styles.js
// ใช้โดย: screens/HistoryScreen.js
// ─────────────────────────────────────────────

import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const historyStyles = StyleSheet.create({

  // ── Container ─────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  // ── Header ───────────────────────────────────
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchInput:  { flex: 1, fontSize: 16, color: COLORS.dark },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    marginRight: 5,
  },

  // ── Filter Tabs ───────────────────────────────
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: -20,       // ลอยขึ้นทับ header
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  filterBtn:        { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  filterBtnActive:  { backgroundColor: COLORS.primary },
  filterText:       { fontSize: 14, color: COLORS.gray, fontWeight: "bold" },
  filterTextActive: { color: COLORS.white },

  // ── Category Pills ────────────────────────────
  categoryWrapper:  { marginBottom: 15 },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.gray,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  categoryScroll:   { paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  categoryPillText:       { color: COLORS.dark, fontSize: 14 },
  categoryPillTextActive: { color: COLORS.white, fontWeight: "bold" },
});

// ── Transaction Item ──────────────────────────────
// ใช้ใน renderItem ของ FlatList
export const itemStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  // squircle แทนวงกลม — ลดทรงกลมที่แย่งซีนกับส่วนอื่น
  iconCircle: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 14 },
  name:       { fontSize: 15, fontWeight: "600", color: "#111827" },
  meta:       { fontSize: 12, color: "#6B7280" },
  amount:     { fontSize: 16, fontWeight: "700" },
  // badge ไม่มี background — เหลือแค่ icon + text สี ไม่มีก้อนสีแย่งซีน
  badge:      { flexDirection: "row", alignItems: "center", gap: 3 },
  badgeText:  { fontSize: 11, fontWeight: "500" },
});

// ── Category Pill (filter row) ────────────────────
// ใช้ใน horizontal ScrollView กรองหมวดหมู่
export const pillStyles = StyleSheet.create({
  pill:                    { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
  pillActive:              { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillIncome:              { borderColor: "#059669", backgroundColor: "#ECFDF5" },
  pillIncomeActive:        { backgroundColor: "#059669", borderColor: "#059669" },
  pillExpense:             { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  pillExpenseActive:       { backgroundColor: "#DC2626", borderColor: "#DC2626" },
  pillText:                { fontSize: 13, fontWeight: "500", color: "#374151" },
  pillTextActive:          { color: "#fff" },
  separator:               { width: 1, height: 28, backgroundColor: "#E5E7EB", marginHorizontal: 4, alignSelf: "center" },
  groupLabel:              { flexDirection: "row", alignItems: "center", gap: 3, marginRight: 6, paddingVertical: 4 },
  groupLabelText:          { fontSize: 11, fontWeight: "700" },
  activeCategoryBadge:     { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF2FF", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  activeCategoryBadgeText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
});

// ── OCR Slip Detail Modal ─────────────────────────
// Bottom sheet แสดงรายละเอียดสลิป
export const modalStyles = StyleSheet.create({
  // ── keys ที่ HistoryScreen ใช้ (center modal) ──
  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  modalContent:  { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle:    { fontSize: 18, fontWeight: "700", color: "#111827" },
  // ── keys เดิม (bottom sheet) ──
  bottomSheetOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  bottomSheet:          { backgroundColor: "#fff", height: "88%", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  bottomSheetHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  bottomSheetTitle:     { fontSize: 20, fontWeight: "bold", color: "#111827" },
  confirmedBanner:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ECFDF5", borderRadius: 10, padding: 12, marginBottom: 16 },
  confirmedBannerText:  { color: "#059669", fontSize: 14, fontWeight: "600" },
  slipImage:            { width: "100%", height: 260, borderRadius: 15, backgroundColor: "#E5E7EB", marginBottom: 20 },
  slipImagePlaceholder: { justifyContent: "center", alignItems: "center" },
  fieldLabel:           { fontSize: 14, color: "#6B7280", marginBottom: 5 },
  fieldInput:           { backgroundColor: "#F3F4F6", padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, color: "#111827" },
  fieldInputReadonly:   { backgroundColor: "#F9FAFB", color: "#6B7280" },
  confirmBtn:           { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#059669", padding: 18, borderRadius: 15, marginTop: 4, marginBottom: 30 },
  confirmBtnText:       { color: "#fff", fontSize: 17, fontWeight: "bold" },
  closeActionBtn:       { padding: 16, borderRadius: 15, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center", marginTop: 4, marginBottom: 30 },
  closeActionBtnText:   { color: "#374151", fontSize: 16, fontWeight: "600" },
});