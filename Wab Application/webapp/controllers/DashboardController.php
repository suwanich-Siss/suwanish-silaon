<?php

require_once __DIR__ . '/../config/database.php';

class dashboardController {
    
    // 1. ดึงข้อมูลตัวเลข KPI รวมของระบบ
    public function getKPIs(): array {
        $db = Database::getConnection();
        
        // นับจำนวนผู้ใช้ทั้งหมด (เฉพาะคนที่มี role เป็น 'user')
        $totalUsers = $db->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn();
        
        // นับจำนวนรายการธุรกรรมทั้งหมด
        $totalTx = $db->query("SELECT COUNT(*) FROM `transaction`")->fetchColumn();

        // รวมยอดเงินรายรับ (income)
        $totalIncome = $db->query(
            "SELECT COALESCE(SUM(t.amount), 0) FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE c.category_type = 'income'"
        )->fetchColumn();

        // รวมยอดเงินรายจ่าย (expense)
        $totalExpense = $db->query(
            "SELECT COALESCE(SUM(t.amount), 0) FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE c.category_type = 'expense'"
        )->fetchColumn();

        // นับจำนวนผู้ใช้ใหม่ที่สมัครในเดือนนี้
        $newUsersThisMonth = $db->query(
            "SELECT COUNT(*) FROM users
             WHERE role = 'user'
               AND MONTH(created_at) = MONTH(NOW())
               AND YEAR(created_at) = YEAR(NOW())"
        )->fetchColumn();

        return [
            'total_users'          => (int)$totalUsers,
            'total_transactions'   => (int)$totalTx,
            'total_income'         => (float)$totalIncome,
            'total_expense'        => (float)$totalExpense,
            'net_savings'          => (float)$totalIncome - (float)$totalExpense,
            'new_users_this_month' => (int)$newUsersThisMonth,
        ];
    }

    // 2. ดึงสถิติการสมัครของผู้ใช้งานย้อนหลัง 12 เดือน
    public function getUsersPerMonth(): array {
        $db = Database::getConnection();
        $stmt = $db->query(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key,
                    DATE_FORMAT(created_at, '%b %Y')  AS month_label,
                    COUNT(*) AS total
             FROM users
             WHERE role = 'user'
               AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY month_key, month_label
             ORDER BY month_key"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 3. ดึงยอดรวมเปรียบเทียบ รายรับ VS รายจ่าย
    public function getIncomeVsExpense(): array {
        $db = Database::getConnection();
        $income = $db->query(
            "SELECT COALESCE(SUM(t.amount), 0) FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE c.category_type = 'income'"
        )->fetchColumn();
        
        $expense = $db->query(
            "SELECT COALESCE(SUM(t.amount), 0) FROM `transaction` t
             JOIN category c ON t.category_id = c.category_id
             WHERE c.category_type = 'expense'"
        )->fetchColumn();
        
        return [
            'income'  => (float)$income, 
            'expense' => (float)$expense
        ];
    }

    // 4. ดึงสัดส่วนรายจ่ายแยกตามหมวดหมู่ (Category)
    public function getExpenseByCategory(): array {
        $db = Database::getConnection();
        $stmt = $db->query(
            "SELECT c.category_name, COALESCE(SUM(t.amount), 0) AS total
             FROM category c
             LEFT JOIN `transaction` t ON c.category_id = t.category_id
             WHERE c.category_type = 'expense' AND c.is_active = 1
             GROUP BY c.category_id, c.category_name
             ORDER BY total DESC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 5. ดึงสัดส่วนตามระดับความต้องการ Maslow
    public function getMaslowDistribution(): array {
        $db = Database::getConnection();
        $stmt = $db->query(
            "SELECT m.name_en, m.name_th, COALESCE(SUM(t.amount), 0) AS total
             FROM maslow_level m
             LEFT JOIN `transaction` t ON m.maslow_id = t.maslow_id
             GROUP BY m.maslow_id, m.name_en, m.name_th
             ORDER BY m.maslow_id"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 6. ดึงรายการธุรกรรมล่าสุด (ปรับแก้ให้ตรงตามตารางปัจจุบัน)
    public function getRecentTransactions(int $limit = 10): array {
        $db = Database::getConnection();
        
        $sql = "SELECT t.transaction_id, 
                       t.transaction_date, 
                       t.amount,
                       t.transaction_name, 
                       c.category_name, 
                       c.category_type
                FROM `transaction` t
                JOIN category c ON t.category_id = c.category_id
                ORDER BY t.transaction_date DESC
                LIMIT :limit";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}