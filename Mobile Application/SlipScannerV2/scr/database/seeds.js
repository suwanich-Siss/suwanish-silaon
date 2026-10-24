// หมวดหมู่
export const SEED_CATEGORIES_SQL = `
    INSERT OR IGNORE INTO categories
        (category_id, category_name, category_type, is_active)
    VALUES
        (1,   'อาหาร',       'expense', 1),
        (2,   'เดินทาง',     'expense', 1),
        (3,   'ช้อปปิ้ง',    'expense', 1),
        (4,   'บิล/น้ำไฟ',   'expense', 1),
        (5,   'สุขภาพ',      'expense', 1),
        (6,   'บันเทิง',     'expense', 1),
        (7,   'อื่นๆ',       'expense', 1),
        (101, 'เงินเดือน',   'income',  1),
        (102, 'โบนัส',       'income',  1),
        (103, 'ขายของ',      'income',  1),
        (104, 'ลงทุน',       'income',  1),
        (105, 'ฟรีแลนซ์',    'income',  1),
        (106, 'รายรับอื่นๆ', 'income',  1);
`;

// Maslow Levels
export const SEED_MASLOW_SQL = `
    INSERT OR IGNORE INTO maslow_levels
        (maslow_id, name_th, name_en, description)
  VALUES
        (1, 'ปัจจัย 4',       'Physical Needs',     'อาหาร น้ำ เสื้อผ้า ที่พัก การนอนหลับ'),
        (2, 'ความปลอดภัย',    'Safety & Security',  'เงินเก็บ ประกัน สุขภาพ ความมั่นคงในชีวิต'),
        (3, 'สังคม',          'Love & Belonging',   'มิตรภาพ ครอบครัว ความสัมพันธ์ การเข้าสังคม'),
        (4, 'ความภาคภูมิใจ', 'Esteem',             'รางวัลให้ตัวเอง สินค้าแบรนด์ ความสำเร็จ'),
        (5, 'พัฒนาตนเอง',    'Self-Actualization', 'การเรียนรู้ ศิลปะ ความฝัน การเติบโต');
`;