<?php

function requireLogin(): void {
    if (session_status() === PHP_SESSION_NONE) {
        # code...
        session_start();
    }

    if (empty($_SESSION['admin_id'])) {
        # code...
        header(('Location: /LogicTest/login.php'));
        exit;
    }
}

function isLoggedIn(): bool {
    if (session_status() === PHP_SESSION_NONE) {
        # code...
        session_start();
    }
    return !empty($_SESSION['admin_id']);
}

function getCurrentAdmin(): array {
    return [
        'id' => $_SESSION['admin_id'] ?? null,
        'name' => $_SESSION['admin_name'] ?? 'Admin',
        'email' => $_SESSION['admin_email'] ?? '',
        'role' => $_SESSION['admin_role'] ?? 'admin',

    ];
}