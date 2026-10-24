// ─────────────────────────────────────────────
// styles/home.styles.js
// ใช้โดย: screens/HomeScreen.js
// ─────────────────────────────────────────────

import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const homeStyles = StyleSheet.create({

  // ── Header ───────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  greetingTitle: { fontSize: 24, fontWeight: "800", color: COLORS.dark },
  greetingSub:   { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  profileContainer: { position: "relative" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#F59E0B",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  // ── Summary Card ─────────────────────────────
  glassCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardLabel:   { fontSize: 14, color: COLORS.gray, fontWeight: "600" },
  mainAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.dark,
    letterSpacing: -1,
    marginBottom: 15,
    textAlign: "left",
  },
  divider:     { height: 1, backgroundColor: "#F3F4F6", marginBottom: 15 },
  statsRow:    { flexDirection: "row", justifyContent: "space-between" },
  statItem:    { flex: 1 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel:   { fontSize: 12, color: COLORS.gray, marginBottom: 2 },
  statValue:   { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: { fontSize: 10, fontWeight: "600", color: "#059669", marginLeft: 2 },
  verticalLine: {
    width: 1,
    height: "100%",
    backgroundColor: "#F3F4F6",
    marginHorizontal: 15,
  },

  // ── Maslow Section ───────────────────────────
  sectionContainer: { marginBottom: 20 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: COLORS.dark },
  seeAllText:   { color: COLORS.primary, fontSize: 13, fontWeight: "600" },

  maslowCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  chartRow: { flexDirection: "row", alignItems: "center" },
  donutContainer: {
    width: 170,
    height: 170,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  chartCenterText:  { position: "absolute", zIndex: 10 },
  legendContainer:  { flex: 1, marginLeft: 10, justifyContent: "center" },
  legendItem:       { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  completeLegend: {
    backgroundColor: "#ECFDF5",
    padding: 6,
    borderRadius: 8,
    marginRight: -4,
  },
  dot:            { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendLabel:    { fontSize: 11, color: COLORS.gray, marginBottom: 1 },
  legendPercent:  { fontSize: 13, fontWeight: "bold" },

  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    padding: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  tipText: { fontSize: 11, color: "#6B21A8", flex: 1 },
});