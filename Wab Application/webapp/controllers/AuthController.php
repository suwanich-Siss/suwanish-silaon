<?php

require_once __DIR__ . '/../config/database.php';

class AuthController {
    public function login(string $email, string $password): array {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT user_id, first_name, last_name, email, password, role
             FROM users
             WHERE email = :email AND role = 'admin'
             LIMIT 1"
        );
        $stmt->execute([':email' => trim($email)]);
        $user = $stmt->fetch();

        if (!$user) {
            return ['success' => false, 'message' => 'ไม่พอบัญชีนี้'];

        }

        $valid = password_verify($password, $user['password']) || $password === $user['password'];

        if (!$valid) {
            return ['success' => false, 'message' => 'รหัสผ่านไม่ถูกต้อง'];
        }

        if ($password === $user['password']) {
            $db -> prepare("UPDATE users SET password = ? WHERE user_id = ?")
            -> execute([password_hash($password, PASSWORD_DEFAULT), $user['user_id']]);
        }

        if (session_status() === PHP_SESSION_NONE) session_start();
        session_regenerate_id(true);
        $_SESSION['admin_id']    = $user['user_id'];
        $_SESSION['admin_name']  = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['admin_email'] = $user['email'];
        $_SESSION['admin_role']  = $user['role'];

        return ['success' => true];

    }

    public function logout(): void {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION=[];
        session_destroy();
    }
}