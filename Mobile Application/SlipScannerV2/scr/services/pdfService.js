import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const generatePDFReport = async (
  transactions,
  summary,
  dateRangeText,
) => {
  if (!transactions || transactions.length === 0) {
    throw new Error("ไม่มีข้อมูลสำหรับส่งออกในระบบ");
  }

  // สร้าง HTML สำหรับรายงาน PDF
  const tableRowsHtml = transactions
    .map((t, idx) => {
      const isIncome = t.category_type === "income";

      return `<tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${t.transaction_date.replace("T", " ").substring(0, 16)}</td>
        <td style="color: ${isIncome ? "#10B981" : "#EF4444"}; font-weight: bold;">
            ${isIncome ? "รายรับ" : "รายจ่าย"}
        </td>
        <td>${t.category_name || "-"}</td>
        <td>${t.maslow_name ? `${t.maslow_name} (${t.maslow_name_en})` : "-"}</td>
        <td>${t.transaction_name || "-"}</td>
        <td style="text-align: right; font-weight: bold; color: ${isIncome ? "#10B981" : "#EF4444"};">
            ${isIncome ? "+" : "-"}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
        </tr>`;
    })
    .join("");

  // สร้าง HTML เต็มรูปแบบสำหรับ PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>รายงานสรุปบัญชีรายรับ-รายจ่าย</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');

            body {
                font-family: 'Sarabun', sans-serif;
            }

            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }

            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #9CA3AF;
            }
        </style>

    </head>

    <body>

        <div class="header-container">
            <h1 class="app-title">IETracker Report</h1>
            <div class="report-subtitle">
                เอกสารแสดงรายการเคลื่อนไหวทางบัญชีสรุป
            </div>
            
            <div style="text-align: right;">
                <div style="font-weight: bold;">ช่วงเวลาข้อมูล</div>
                <div style="color: #4B5563; margin-top: 2px;">${dateRangeText}</div>
            </div>
        </div>

        <div class="summary-grid">
<div class="summary-card primary">
          <div class="card-label">รายการทั้งหมด</div>
          <div class="card-value" style="color: #4338CA;">${summary.count} รายการ</div>
        </div>
        <div class="summary-card success">
          <div class="card-label">รายรับรวมสุทธิ</div>
          <div class="card-value" style="color: #059669;">฿${summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card danger">
          <div class="card-label">รายจ่ายรวมสุทธิ</div>
          <div class="card-value" style="color: #DC2626;">฿${summary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card" style="background: #FFFBEB; border-color: #FDE68A;">
          <div class="card-label">คงเหลือรวม</div>
          <div class="card-value" style="color: #D97706;">฿${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 20%; text-align: left;">วันที่-เวลา</th>
            <th style="width: 12%; text-align: left;">ประเภท</th>
            <th style="width: 20%; text-align: left;">หมวดหมู่</th>
            <th style="width: 18%; text-align: left;">ระดับมาสโลว์</th>
            <th style="width: 25%; text-align: left;">รายละเอียดรายการ</th>
            <th style="width: 18%; text-align: right;">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer">
        รายงานนี้สร้างขึ้นโดยอัตโนมัติจากแอปพลิเคชัน IETracker ณ วันที่ ${new Date().toLocaleDateString("th-TH")}
      </div>
    </body>
    </html>
    `;


    // สร้าง PDF จาก HTML
    const {uri} = await Print.printToFileAsync({ html: htmlContent });
    // แชร์ไฟล์ PDF
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: `ส่งออกรายงาน PDF: ${dateRangeText}`,
        });
    } else {
        throw new Error("ไม่สามารถแชร์ไฟล์ได้ในอุปกรณ์นี้");
    }
    return uri;
};
