// ─────────────────────────────────────────────
// styles/typography.js
// Style ที่เกี่ยวกับตัวอักษร (font, text)
// ─────────────────────────────────────────────

import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const typography = StyleSheet.create({
  // Headings
  h1: { fontSize: 28, fontWeight: "800", color: COLORS.dark },
  h2: { fontSize: 22, fontWeight: "700", color: COLORS.dark },
  h3: { fontSize: 18, fontWeight: "700", color: COLORS.dark },
  h4: { fontSize: 16, fontWeight: "600", color: COLORS.dark },

  // Body
  body:    { fontSize: 14, color: COLORS.dark,  lineHeight: 20 },
  caption: { fontSize: 12, color: COLORS.gray,  lineHeight: 16 },
  small:   { fontSize: 11, color: COLORS.gray                  },

  // Amounts
  amountLg: { fontSize: 32, fontWeight: "800", color: COLORS.dark },
  amountMd: { fontSize: 20, fontWeight: "700", color: COLORS.dark },

  // Status
  income:  { color: COLORS.success, fontWeight: "700" },
  expense: { color: COLORS.danger,  fontWeight: "700" },
});

