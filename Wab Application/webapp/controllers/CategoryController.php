<?php
// controllers/CategoryController.php

require_once __DIR__ . '/../config/database.php';

class CategoryController {

    public function getAll(): array {
        $db = Database::getConnection();
        return $db->query(
            "SELECT category_id, category_name, category_type, created_at, is_active
             FROM category
             ORDER BY category_type, category_id"
        )->fetchAll();
    }

    public function getPaginatedCategories(int $pageIncome = 1, int $pageExpense = 1, int $limit = 5): array {
        $db = Database::getConnection();
        
        $offsetIncome = ($pageIncome - 1) * $limit;
        $offsetExpense = ($pageExpense - 1) * $limit;

        // ดึงข้อมูลรายรับ
        $stmtIncome = $db->prepare("SELECT * FROM category WHERE category_type = 'income' ORDER BY category_id DESC LIMIT :limit OFFSET :offset");
        $stmtIncome->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmtIncome->bindValue(':offset', $offsetIncome, PDO::PARAM_INT);
        $stmtIncome->execute();
        $incomes = $stmtIncome->fetchAll();

        // ดึงข้อมูลรายจ่าย
        $stmtExpense = $db->prepare("SELECT * FROM category WHERE category_type = 'expense' ORDER BY category_id DESC LIMIT :limit OFFSET :offset");
        $stmtExpense->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmtExpense->bindValue(':offset', $offsetExpense, PDO::PARAM_INT);
        $stmtExpense->execute();
        $expenses = $stmtExpense->fetchAll();

        // นับจำนวนข้อมูลทั้งหมด
        $totalIncome = $db->query("SELECT COUNT(*) FROM category WHERE category_type = 'income'")->fetchColumn();
        $totalExpense = $db->query("SELECT COUNT(*) FROM category WHERE category_type = 'expense'")->fetchColumn();

        // คำนวณจำนวนหน้า
        $totalPageIncome = ceil($totalIncome / $limit);
        $totalPageExpense = ceil($totalExpense / $limit);

        return [
            'incomes' => $incomes,
            'expenses' => $expenses,
            'totalPageIncome' => $totalPageIncome,
            'totalPageExpense' => $totalPageExpense,
            'currentPageIncome' => $pageIncome,
            'currentPageExpense' => $pageExpense
        ];
    }

    public function getById(int $id): array|false {
        $db   = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM category WHERE category_id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(string $name, string $type): array {
        if (empty($name)) return ['success' => false, 'message' => 'กรุณาระบุชื่อหมวดหมู่'];
        if (!in_array($type, ['income', 'expense'])) return ['success' => false, 'message' => 'ประเภทไม่ถูกต้อง'];

        $db = Database::getConnection();

        // --- ID Range Partitioning (ทั้งหมดต้องอยู่ในช่วง 1–999) ---
        // expense : 1–499  |  income : 500–999
        if ($type === 'income') {
            $rangeMin = 500;
            $rangeMax = 999;
        } else {
            $rangeMin = 1;
            $rangeMax = 499;
        }

        $stmt  = $db->prepare(
            "SELECT MAX(category_id) FROM category
             WHERE category_type = ? AND category_id BETWEEN ? AND ?"
        );
        $stmt->execute([$type, $rangeMin, $rangeMax]);
        $maxId  = $stmt->fetchColumn();
        $nextId = $maxId ? $maxId + 1 : $rangeMin;

        if ($nextId > $rangeMax) {
            return [
                'success' => false,
                'message' => "ไม่สามารถเพิ่มได้ รหัสหมวดหมู่ {$type} เต็มจำนวน (ช่วง {$rangeMin}–{$rangeMax})",
            ];
        }

        try {
            $stmt = $db->prepare(
                "INSERT INTO category (category_id, category_name, category_type, created_at, is_active)
                 VALUES (?, ?, ?, NOW(), 1)"
            );
            $stmt->execute([$nextId, trim($name), $type]);
            return ['success' => true, 'id' => $nextId];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'เกิดข้อผิดพลาดในการสร้างรหัสหมวดหมู่: ' . $e->getMessage()];
        }
    }

    public function update(int $id, string $name, string $type, int $isActive): array {
        if (empty($name)) return ['success' => false, 'message' => 'กรุณาระบุชื่อหมวดหมู่'];
        if (!in_array($type, ['income', 'expense'])) return ['success' => false, 'message' => 'ประเภทไม่ถูกต้อง'];

        $db   = Database::getConnection();
        $stmt = $db->prepare(
            "UPDATE category SET category_name = ?, category_type = ?, is_active = ? WHERE category_id = ?"
        );
        $stmt->execute([trim($name), $type, (int)$isActive, $id]);
        return ['success' => true];
    }

    public function delete(int $id): array {
        // Hard Delete — ตรวจสอบก่อนว่ามี transaction อ้างอิงอยู่หรือไม่
        $db    = Database::getConnection();
        $check = $db->prepare("SELECT COUNT(*) FROM `transaction` WHERE category_id = ?");
        $check->execute([$id]);
        if ($check->fetchColumn() > 0) {
            return ['success' => false, 'message' => 'ไม่สามารถลบได้ เนื่องจากมีธุรกรรมอ้างอิงหมวดหมู่นี้'];
        }
        $stmt = $db->prepare("DELETE FROM category WHERE category_id = ?");
        $stmt->execute([$id]);
        return ['success' => true];
    }

    // ─── Version Control ────────────────────────────────────────────────────────

    /**
     * ดึง category_version ปัจจุบันจาก app_settings
     * (สร้าง record อัตโนมัติหากยังไม่มี)
     */
    public function getCategoryVersion(): int {
        $db = Database::getConnection();
        $this->ensureSettingsTable($db);
        $stmt = $db->query("SELECT setting_value FROM app_settings WHERE setting_key = 'category_version'");
        $row  = $stmt->fetch();
        return $row ? (int)$row['setting_value'] : 1;
    }

    /**
     * เพิ่ม category_version ขึ้น 1 (เรียกเมื่อ Admin กด Publish Update)
     */
    public function publishUpdate(): array {
        $db = Database::getConnection();
        $this->ensureSettingsTable($db);
        $db->exec(
            "INSERT INTO app_settings (setting_key, setting_value)
             VALUES ('category_version', 2)
             ON DUPLICATE KEY UPDATE setting_value = setting_value + 1"
        );
        $newVersion = $this->getCategoryVersion();
        return ['success' => true, 'version' => $newVersion];
    }

    /**
     * สร้าง table app_settings หากยังไม่มี
     */
    private function ensureSettingsTable(PDO $db): void {
        $db->exec(
            "CREATE TABLE IF NOT EXISTS app_settings (
                setting_key   VARCHAR(100) PRIMARY KEY,
                setting_value VARCHAR(255) NOT NULL,
                updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        // seed ค่าเริ่มต้น version = 1 ถ้ายังไม่มี
        $db->exec(
            "INSERT IGNORE INTO app_settings (setting_key, setting_value)
             VALUES ('category_version', '1')"
        );
    }

    public function toggleStatus(int $id): array {
        $db   = Database::getConnection();
        $stmt = $db->prepare("UPDATE category SET is_active = 1 - is_active WHERE category_id = ?");
        $stmt->execute([$id]);
        return ['success' => true];
    }
}
