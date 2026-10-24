import { getDB } from "../database/database";

export const fetchTransactions = async ({startDate, endDate, type}) => {
    try {
        const db = await getDB();

        const startStr = `${startDate}T00:00:00`;
        const endStr = `${endDate}T23:59:59`;

        let sql = `
            SELECT t.*, c.category_name, c.category_type,
                   m.name_th AS maslow_name, m.name_en AS maslow_name_en
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.category_id
            LEFT JOIN maslow_levels m ON t.maslow_id = m.maslow_id
            WHERE t.transaction_date BETWEEN ? AND ?`;
        const params = [startStr, endStr];
        if (type && type !== "all") {
            sql += " AND c.category_type = ?";
            params.push(type);
        }

        sql += " ORDER BY t.transaction_date ASC";
        return await db.getAllAsync(sql, params);
    } catch (e) {
        console.error("Error fetching transactions export data:", e);
        throw new Error("ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้");
    }
};

export const calculatePreviewSummary = (transactions) => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) =>{
        if (t.category_type === "income") {
            income += t.amount;
        } else if (t.category_type === "expense") {
            expense += t.amount;
        }
    });
    return {
        count: transactions.length,
        income, expense,
        balance: income - expense,
    };
};