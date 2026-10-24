import XLSX from 'xlsx';
//  เปลี่ยนมาใช้ชุด Legacy ตามที่ Expo แนะนำเพื่อตัดปัญหาบัคโครงสร้างใหม่
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const generateExcelReport = async (transactions, dateRangeText) => {

    if (!transactions || transactions.length === 0) {
        throw new Error("ไม่มีข้อมูลสำหรับส่งออกในระบบ");
    }

    // จัดรูปแบบโครงสร้างข้อมูล แถวสำหรับ Excel
    const rows = transactions.map((t, idx) => ({
        "ลำดับ": idx + 1,
        "วันที่-เวลา": t.transaction_date.replace("T", " ").substring(0, 16),
        "ประเภท": t.category_type === "income" ? "รายรับ" : "รายจ่าย",
        "หมวดหมู่": t.category_name || "-",
        "ระดับมาสโลว์": t.maslow_name ? `${t.maslow_name} (${t.maslow_name_en})` : "-",
        "รายละเอียด": t.transaction_name || "-",
        "วิธีการบันทึก": t.input_method === "ocr" ? "สแกนสลิป" : "คีย์เอง",
        "จำนวนเงิน": t.amount || 0,
    }));

    // สร้าง workbook และ worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // ปรับขนาดคอลัมน์
    const maxProps = [{ wch: 6 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 16 }];
    worksheet["!cols"] = maxProps;

    //  กลับมาใช้แบบ base64 ที่เสถียรที่สุดสำหรับ SheetJS (ไม่ต้องแปลงเป็น Uint8Array เอง)
    const wboot = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    const filename = `IETracker_Report_${Date.now()}.xlsx`;
    const fileUrl = `${FileSystem.cacheDirectory}${filename}`;

    try {
        //  บันทึกไฟล์ผ่านคำสั่ง Legacy แต่อยู่ใน Path ที่ปลอดภัย คำเตือนจะไม่ขึ้นกวนใจอีกครับ
        await FileSystem.writeAsStringAsync(fileUrl, wboot, { encoding: 'base64' });

        // เปิดหน้าต่างแชร์ไฟล์
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUrl, {
                mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                dialogTitle: `แชร์รายงาน Excel: ${dateRangeText}`,
            });
        } else {
            throw new Error("ไม่สามารถแชร์ไฟล์ได้ในอุปกรณ์นี้");
        }
        
        return fileUrl;
    } catch (error) {
        console.error("Error generating Excel report:", error);
        throw new Error("เกิดข้อผิดพลาดในการสร้างรายงาน Excel");
    }
};