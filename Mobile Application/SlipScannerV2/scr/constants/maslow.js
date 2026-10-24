// ─────────────────────────────────────────────
// constants/maslow.js
// ระดับความต้องการ (Maslow's Hierarchy)
// ─────────────────────────────────────────────

export const MASLOW_LEVELS = [
  {
    id:    1,
    title: "Physical Needs",
    sub:   "ปัจจัย 4 (อาหาร, น้ำ, ที่อยู่)",
    color: "#F59E0B",
    icon:  "restaurant",
  },
  {
    id:    2,
    title: "Safety & Security",
    sub:   "ความปลอดภัย, เงินเก็บ",
    color: "#3B82F6",
    icon:  "shield-checkmark",
  },
  {
    id:    3,
    title: "Love & Belonging",
    sub:   "เข้าสังคม, ปาร์ตี้",
    color: "#EC4899",
    icon:  "heart",
  },
  {
    id:    4,
    title: "Esteem",
    sub:   "รางวัลชีวิต, ของแบรนด์เนม",
    color: "#8B5CF6",
    icon:  "trophy",
  },
  {
    id:    5,
    title: "Self-Actualization",
    sub:   "เติมเต็มความฝัน",
    color: "#10B981",
    icon:  "leaf",
  },
];

// helper: ดึง maslow level จาก id
export const getMaslowById = (id) =>
  MASLOW_LEVELS.find((m) => m.id === id) || null;