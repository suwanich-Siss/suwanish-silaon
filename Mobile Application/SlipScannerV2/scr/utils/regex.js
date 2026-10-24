// src/utils/regex.js

// เปลี่ยนชื่อตัวแปรเป็นตัวพิมพ์ใหญ่ให้หมด เพื่อให้ตรงกับที่ slipService เรียกใช้
export const AMOUNT_REGEX = /(\d{1,3}(?:,\d{3})*\.\d{2})/;

export const DATE_REGEX =
  /(\d{1,2}\s+(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\\.ย\.|ธ\.ค\.)\s+\d{4,5})/;

export const REF_REGEX =
  /(?:รหัสอ้างอิง|ref no|ref)\.?\s*[:\s]?\s*(\w+)/i;

export const KEYWORDS = 
["โอน", "สำเร็จ", "amount", "transfer", "successful"];