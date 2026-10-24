<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require 'db_connect.php';

try {
    // ดึง category_version จาก settings table (ถ้ามี) สำหรับ Version Control
    // ถ้ายังไม่มี table นี้จะ fallback เป็น version = 1
    $version = 1;
    try {
        $vStmt = $conn->prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'category_version' LIMIT 1");
        $vStmt->execute();
        $vRow = $vStmt->fetch(PDO::FETCH_ASSOC);
        if ($vRow) $version = (int)$vRow['setting_value'];
    } catch (Exception $e) {
        // app_settings ยังไม่มี — ใช้ version 1 ต่อไป
    }

    // ดึงเฉพาะ System Categories (id < 1000) ที่ยังใช้งานอยู่
    $sql = "SELECT category_id, category_name, category_type, is_active
            FROM `category`
            WHERE is_active = 1 AND category_id < 1000
            ORDER BY category_id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // แปลง type ให้ถูกต้อง
    foreach ($categories as &$cat) {
        $cat['category_id'] = (int)$cat['category_id'];
        $cat['is_active']   = (int)$cat['is_active'];
    }

    echo json_encode([
        "status"     => "success",
        "version"    => $version,
        "categories" => $categories,
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        "status"  => "error",
        "message" => "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>