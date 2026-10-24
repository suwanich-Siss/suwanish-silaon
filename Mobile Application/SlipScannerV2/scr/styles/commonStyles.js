// ─────────────────────────────────────────────
// styles/commonStyles.js
//
// ไฟล์นี้เหลือแค่ navStyles (ใช้โดย TabBar)
// + re-export COLORS และ baseStyles เพื่อ
//   backward compatibility กับโค้ดเก่า
//
// Screen styles อยู่ที่:
//   styles/home.styles.js
//   styles/add.styles.js
//   styles/analysis.styles.js
//   styles/history.styles.js
//   styles/scan.styles.js
//   styles/menu.styles.js
//   styles/auth.styles.js
// ─────────────────────────────────────────────

import { StyleSheet, Dimensions, Platform } from "react-native";

// ── Re-exports (backward compat) ──────────────
// COLORS + baseStyles
export { COLORS } from "./colors";
export { baseStyles } from "./layout";

// Auth screens — ยังไม่ได้ migrate import
export { loginStyle, SignupStyle, WelcomeStyle } from "./authStyles";

// Screen styles — ยังไม่ได้ migrate import
export { homeStyles }     from "./homeStyles";
export { addStyles }      from "./addStyles";
export { analysisStyles } from "./analysisStyles";
export { historyStyles }  from "./historyStyles";
export { menuStyles }     from "./menuStyles";
export { ScanslipStyle, pendingListStyles } from "./scanStyles";

// ── navStyles ──────────────────────────────────
// ใช้โดย navigation/TabBar.js เท่านั้น
export const navStyles = StyleSheet.create({

  // ── Tab Bar Container ──────────────────────
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    backgroundColor: "transparent",
  },

  tabBar: {
    flexDirection: "row",
    height: 70,
    width: Dimensions.get("window").width - 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    paddingHorizontal: 5,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#11213D",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },

  tabItem: {
    height: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  iconContainerActive: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A1931",
    borderRadius: 20,
  },

  activeLabel: {
    fontSize: 10,
    marginTop: 25,
    color: "#11213D",
    fontWeight: "700",
    position: "absolute",
    bottom: 8,
  },

  // ── Center (+) Button ──────────────────────
  centerButtonWrapper: {
    position: "relative",
    top: -10,
    zIndex: 10,
  },

  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#11213D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#11213D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },

  // ── Action Modal ───────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:"rgba(15, 23, 42, 0.6)",
  },

  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 30,
    width: "50%",
    marginBottom: 100,
  },

  menuItemWrapper: { alignItems: "center" },
  menuButton:      { alignItems: "center" },

  menuIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFF",
  },

  closeButton: {
    position: "absolute",
    bottom: 40,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#11213D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});