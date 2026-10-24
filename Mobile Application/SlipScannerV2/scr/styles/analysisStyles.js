import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const analysisStyles = StyleSheet.create({

  // ── Layout ────────────────────────────────────
  container:    { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 16 },

  // ── Header ────────────────────────────────────
  headerBackground: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  monthText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // ── Health Score Card ─────────────────────────
  healthScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    gap: 12,
  },
  scoreLabel:    { fontSize: 11, color: COLORS.gray, fontWeight: "600" },
  scoreValue:    { fontSize: 28, fontWeight: "900", color: COLORS.primary },
  scoreMessage:  { flex: 1 },
  scoreTitle:    { fontSize: 14, fontWeight: "700", color: "#111827" },
  scoreSub:      { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  circularScore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Overview Cards ────────────────────────────
  summaryRow:    { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryCard:   { flex: 1, borderRadius: 16, padding: 14 },
  summaryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(5,150,105,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel:  { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  summaryValue:  { fontSize: 18, fontWeight: "800" },

  // ── Savings Card ──────────────────────────────
  savingsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle:    { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  trendTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText:    { fontSize: 12, fontWeight: "700" },
  bigSavings:   { fontSize: 30, fontWeight: "900", marginVertical: 8 },
  burnRateText: { fontSize: 13, color: "#6B7280" },

  // ── Section Container ─────────────────────────
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle:    { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: "#6B7280", marginBottom: 14 },

  // ── Maslow ────────────────────────────────────
  maslowBarContainer: {
    height: 20,
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  maslowList:    { gap: 12 },
  maslowItem:    { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  maslowName:    { fontSize: 14, fontWeight: "700", color: "#111827" },
  maslowDesc:    { fontSize: 12, color: "#6B7280", marginTop: 2 },
  maslowAmount:  { fontSize: 14, fontWeight: "700", color: "#111827" },
  maslowPercent: { fontSize: 12, fontWeight: "600" },
  insightBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: "flex-start",
  },
  insightText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 20 },

  // ── Top Categories ────────────────────────────
  catRow:    { marginBottom: 14 },
  catName:   { fontSize: 14, fontWeight: "600", color: "#111827" },
  catAmount: { fontSize: 13, color: "#6B7280" },
  catBarBg:  { height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 4 },

  // ── Empty State ───────────────────────────────
  emptyBox:  { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { color: COLORS.gray, fontSize: 14 },
});