// ─────────────────────────────────────────────
// styles/scan.styles.js
// ใช้โดย: screens/Scanslip.js
// ─────────────────────────────────────────────

import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

// ── หน้า Scanslip หลัก ──────────────────────────
export const ScanslipStyle = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#F9FAFB" },

  // Header (LinearGradient จัดสีเอง)
  headerContainer: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  headerTitle:    { fontSize: 20, fontWeight: "bold", color: "#fff", textAlign: "center" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", textAlign: "center" },

  // Summary Card
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryLabel:  { fontSize: 12, color: COLORS.gray, marginBottom: 5 },
  summaryValue:  { fontSize: 28, fontWeight: "bold", color: COLORS.dark },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  // Action Buttons
  actionContainer: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle:    { fontSize: 16, fontWeight: "bold", color: COLORS.dark, marginBottom: 15 },
  actionRow:       { flexDirection: "row", justifyContent: "space-between", gap: 15 },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: { opacity: 0.6 },
  actionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: { fontSize: 14, fontWeight: "bold", color: COLORS.dark },
  actionSub:  { fontSize: 11, color: COLORS.gray },
  statusBar: {
    marginTop: 15,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  statusText: { fontSize: 13, color: COLORS.gray },

  // Slip List
  listContainer: { flex: 1, paddingHorizontal: 20, marginTop: 20 },
  emptyState:    { alignItems: "center", marginTop: 30 },
  slipCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardLeft:   { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cardDate:   { fontSize: 14, fontWeight: "600", color: COLORS.dark },
  cardRef:    { fontSize: 11, color: COLORS.gray },
  cardAmount: { fontSize: 16, fontWeight: "bold", color: "#10B981" },
});

// ── รายการรอตรวจสอบ (Pending List) ──────────────
export const pendingListStyles = StyleSheet.create({
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  confirmAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  confirmAllText:  { color: "#fff", fontSize: 12, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  image:   { width: "100%", height: 180, backgroundColor: "#F3F4F6" },
  noImage: { alignItems: "center", justifyContent: "center" },
  info:    { padding: 12 },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  amount:          { fontSize: 18, fontWeight: "700", color: "#111827" },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: { fontSize: 11, color: "#D97706", fontWeight: "600" },
  meta:    { fontSize: 13, color: "#6B7280", marginTop: 2 },
  tapHint: { fontSize: 12, color: COLORS.primary, marginTop: 8, fontWeight: "500" },
});