// ─────────────────────────────────────────────
// constants/categories.js
// หมวดหมู่รายรับ / รายจ่าย
// เพิ่ม / แก้ไขหมวดหมู่ที่ไฟล์นี้ที่เดียว
// ─────────────────────────────────────────────

export const INCOME_CATEGORIES = [
  { id: 101, name: "เงินเดือน",    icon: "cash"               },
  { id: 102, name: "โบนัส",        icon: "gift"               },
  { id: 103, name: "ขายของ",       icon: "storefront"         },
  { id: 104, name: "ลงทุน",        icon: "trending-up"        },
  { id: 105, name: "ฟรีแลนซ์",     icon: "laptop"             },
  { id: 106, name: "รายรับอื่นๆ",  icon: "ellipsis-horizontal"},
];

export const EXPENSE_CATEGORIES = [
  { id: 1, name: "อาหาร",     icon: "fast-food"           },
  { id: 2, name: "เดินทาง",   icon: "bus"                 },
  { id: 3, name: "ช้อปปิ้ง",  icon: "cart"                },
  { id: 4, name: "บิล/น้ำไฟ", icon: "receipt"             },
  { id: 5, name: "สุขภาพ",    icon: "medkit"              },
  { id: 6, name: "บันเทิง",   icon: "game-controller"     },
  { id: 7, name: "อื่นๆ",     icon: "ellipsis-horizontal" },
];

// helper: ดึง category จาก id
export const getCategoryById = (id) => {
  return (
    INCOME_CATEGORIES.find((c) => c.id === id) ||
    EXPENSE_CATEGORIES.find((c) => c.id === id) ||
    null
  );
};