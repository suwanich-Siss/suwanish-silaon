// ─────────────────────────────────────────────
// styles/categoryStyles.js
// ใช้โดย: screens/CategoryScreen · AddCategoryModal · EditCategoryModal
// ─────────────────────────────────────────────

import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const categoryStyles = StyleSheet.create({

  // ── Screen / Layout ───────────────────────────
  container:     { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: { padding: 16 },

  // ── Header ───────────────────────────────────
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    textAlign: "center",
  },
  backBtn: { padding: 4 },

  // ── Section ───────────────────────────────────
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionContent: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  // ── Category Row ─────────────────────────────
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  categoryRowDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  rowActions: { flexDirection: "row", gap: 8 },
  actionBtn:  { padding: 6 },

  // ── Empty State ───────────────────────────────
  emptyState:     { paddingVertical: 24, alignItems: "center" },
  emptyStateText: { fontSize: 14, color: "#9CA3AF" },

  // ── Error Banner ──────────────────────────────
  errorBanner: {
    backgroundColor: "#FEE2E2",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: { fontSize: 13, color: "#DC2626" },

  // ── FAB ───────────────────────────────────────
  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // ── Modal ─────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  textInputError: { borderColor: "#EF4444" },
  inlineError: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },

  // ── Type Selector ─────────────────────────────
  typeSelector: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
  },
  typeBtnText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  typeBtnTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  typeLabelReadOnly: {
    fontSize: 14,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },

  // ── Modal Buttons ─────────────────────────────
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  confirmBtnDisabled: { backgroundColor: "#9CA3AF" },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
});
