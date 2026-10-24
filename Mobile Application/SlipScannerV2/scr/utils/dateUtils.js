import { NOT_APPLICABLE } from "../constants/app";
const thaiMonths = {
    "ม.ค.": "01",
    "ก.พ.": "02",
    "มี.ค.": "03",
    "เม.ย.": "04",
    "พ.ค.": "05",
    "มิ.ย.": "06",
    "ก.ค.": "07",
    "ส.ค.": "08",
    "ก.ย.": "09",
    "ต.ค.": "10",
    "พ.ย.": "11",
    "ธ.ค.": "12",
};

export function convertThaiDateToISO(thaiDate) {
  if (!thaiDate || thaiDate === NOT_APPLICABLE) return null;
  const parts = thaiDate.split(" ");

  if (parts.length < 3) return null;

  const day = parts[0].padStart(2, "0");
  const month = thaiMonths[parts[1]];
  const year = parseInt(parts[2], 10) - 543;

  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
}