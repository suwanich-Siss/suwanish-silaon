// ─────────────────────────────────────────────
// styles/menu.styles.js
// ใช้โดย: screens/MenuScreen.js
// ─────────────────────────────────────────────

import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const menuStyles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#F3F4F6" },

  // ── Header ───────────────────────────────────
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: COLORS.primary,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#333",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo:  { marginLeft: 20, flex: 1 },
  profileName:  { fontSize: 22, fontWeight: "bold", color: "#fff" },
  profileEmail: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  editProfilePill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  editProfileText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ── Menu List ─────────────────────────────────
  scrollContent: { padding: 20, paddingTop: 25 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
    marginLeft: 5,
  },
  menuGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 5,
    marginBottom: 25,
  },
  divider:  { height: 1, backgroundColor: "#F3F4F6", marginLeft: 60 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  menuLeft:     { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuTitle:    { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  menuSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  // ── Modals ────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: 600,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle:  { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  inputGroup:  { marginBottom: 15 },
  inputLabel:  { fontSize: 14, color: "#6B7280", marginBottom: 5, fontWeight: "500" },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

// ── Export Modal styles ───────────────────────
// ใช้โดย MenuScreen.js (ส่วน modal ส่งออก Excel/PDF)
export const exportModalStyles = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    maxHeight: "85%",
  },
  handle:           { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 14 },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  headerIconWrap:   { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  headerTitle:      { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerSub:        { fontSize: 12, color: "#6B7280", marginTop: 1 },
  closeBtn:         { padding: 4 },
  dividerLine:      { height: 1, backgroundColor: "#F3F4F6", marginBottom: 12 },
  sectionLabel:     { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 10, marginBottom: 8 },

  presetContainer:      { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  presetPill:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
  presetPillActive:     { backgroundColor: "#EEF2FF", borderColor: "#6C63FF" },
  presetPillText:       { fontSize: 12, color: "#4B5563" },
  presetPillTextActive: { color: "#6C63FF", fontWeight: "600" },

  filterTabs:          { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 10, padding: 3, marginBottom: 12 },
  tabItem:             { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 8 },
  tabItemActive:       { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabItemText:         { fontSize: 12, color: "#6B7280" },
  tabItemTextActive:   { color: "#111827", fontWeight: "600" },

  summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 18 },
  miniCard:    { flex: 1, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 8, alignItems: "center" },
  miniLabel:   { fontSize: 10, color: "#6B7280", marginBottom: 2 },
  miniValue:   { fontSize: 12, fontWeight: "700", color: "#111827" },

  spinnerRow:       { marginBottom: 8 },
  spinnerLabel:     { fontSize: 12, fontWeight: "600", color: "#4B5563", marginBottom: 6 },
  spinnerGroup:     { flexDirection: "row", backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  spinnerUnit:      { flex: 1, alignItems: "center", paddingVertical: 4 },
  spinnerValueBox:  { alignItems: "center" },
  spinnerValue:     { fontSize: 16, fontWeight: "700", color: "#111827" },
  spinnerUnitLabel: { fontSize: 9, color: "#9CA3AF" },
  arrowBtn:         { paddingHorizontal: 10, paddingVertical: 4 },
  spinnerDivider:   { width: 1, backgroundColor: "#E5E7EB", marginVertical: 6 },
  arrowBetween:     { alignItems: "center", marginVertical: 2 },

  confirmBtn:        { backgroundColor: "#6C63FF", borderRadius: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10 },
  confirmBtnLoading: { backgroundColor: "#9CA3AF" },
  confirmBtnText:    { color: "#fff", fontSize: 15, fontWeight: "700" },
});
