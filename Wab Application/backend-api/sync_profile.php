<?php
require_once 'db_connect.php';
$body = json_decode(file_get_contents('php://input'), true);
$accountToken = $body['account_token'] ?? null;
$email = $body['email'] ?? null;
$pdpaAccepted = $body['pdpa_accepted'] ?? null;

if (!$accountToken || !$email || !$pdpaAccepted) {
    echo json_encode([
        "status" => "error",
        "message" => "Missing required fields."
    ]);
    exit;

}

$stmt = $conn -> prepare("
    INSERT INTO userprofile (account_token, email, pdpa_accepted)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
    pdpa_accepted = VALUES(pdpa_accepted),
    updated_at = now()
");
$stmt->execute([$accountToken, $email, $pdpaAccepted]);
echo json_encode([
    "status" => "success",
    "message" => "Profile updated successfully."
]);