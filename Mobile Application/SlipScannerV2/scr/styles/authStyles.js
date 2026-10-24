// ─────────────────────────────────────────────
// styles/auth.styles.js
// ใช้โดย: LoginScreen · SignupScreen · WelcomeScreen
// ─────────────────────────────────────────────

import { StyleSheet, Platform } from "react-native";

// ── LoginScreen ──────────────────────────────────
export const loginStyle = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F8FAFC" },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginLeft: -10,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#11213D",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle:   { fontSize: 16, color: "#64748B", lineHeight: 24 },
  form:       { marginTop: 10 },
  forgotPass: { alignSelf: "flex-end", marginTop: 15 },
  linkText:   { color: "#206B64", fontWeight: "700", fontSize: 14 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  line:   { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  orText: { marginHorizontal: 10, color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingBottom: 20,
  },
});

// ── SignupScreen ─────────────────────────────────
export const SignupStyle = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#F8FAFC" },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginLeft: -10,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#11213D",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle:          { fontSize: 16, color: "#64748B", lineHeight: 24 },
  form:              { marginTop: 10 },
  spacer:            { height: 16 },
  spacerforpassword: { height: 30 },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  checkboxLabel: { flex: 1, marginLeft: 10, fontSize: 13, color: "#64748B", lineHeight: 22 },
  linkText:      { color: "#206B64", fontWeight: "700", fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingVertical: 20,
  },

  // Modal PDPA (Bottom Sheet)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    height: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#11213D", marginBottom: 16 },
  modalBody:  { fontSize: 14, color: "#64748B", lineHeight: 24 },
  modalCloseBtn: {
    backgroundColor: "#11213D",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 15,
    marginBottom: Platform.OS === "ios" ? 20 : 0,
  },
});

// ── WelcomeScreen ────────────────────────────────
export const WelcomeStyle = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  contentContainer: {
    flex: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  logoGlowWrapper: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#206B64",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  logoImage:      { width: 180, height: 180 },
  textContainer:  { alignItems: "center", width: "100%" },
  titleTop: {
    fontSize: 42,
    fontWeight: "900",
    color: "#11213D",
    letterSpacing: 2,
  },
  titleBottom: {
    fontSize: 24,
    fontWeight: "600",
    color: "#11213D",
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
  },
  bottomContainer: {
    flex: 2,
    justifyContent: "flex-end",
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  primaryBtn: {
    backgroundColor: "#11213D",
    height: 60,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#11213D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryBtnText:  { color: "#FFFFFF", fontSize: 18, fontWeight: "bold", letterSpacing: 0.5 },
  btnIcon:         { marginLeft: 10 },
  secondaryBtn: {
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(32, 107, 100, 0.1)",
    marginBottom: 25,
  },
  secondaryBtnText: { color: "#206B64", fontSize: 16, fontWeight: "bold" },
  footerText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
});