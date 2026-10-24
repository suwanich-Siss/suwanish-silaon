<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require 'db_connect.php';

$json_data = file_get_contents("php://input");
$request_body = json_decode($json_data, true);

$sync_token  = $request_body['sync_token'] ?? null;
$transactions = $request_body['transactions'] ?? [];

if (empty($sync_token)) {
    echo json_encode([
        "status" => "error",
        "message" => "Missing unauthorized sync token."
    ]);
    exit;
}

if (!empty($transactions) && is_array($transactions)) {
    $synced_ids = [];
    $error_logs = [];

    $sql = "INSERT INTO `transaction`
            (transaction_id, sync_token, category_id, maslow_id, transaction_date, amount, input_method, transaction_name)
            VALUES
            (:transaction_id, :sync_token, :category_id, :maslow_id, :transaction_date, :amount, :input_method, :transaction_name)
            ON DUPLICATE KEY UPDATE
            category_id = VALUES(category_id),
            maslow_id = VALUES(maslow_id),
            transaction_date = VALUES(transaction_date),
            amount = VALUES(amount),
            input_method = VALUES(input_method),
            transaction_name = VALUES(transaction_name)";

    $stmt = $conn->prepare($sql);

    foreach ($transactions as $tx) {
        $tid = $tx['sync_id'] ?? ($tx['transaction_id'] ?? null);
        try {
            $stmt->execute([
                ':transaction_id'   => $tid,
                ':sync_token'       => $sync_token,
                ':category_id'      => $tx['category_id'],
                ':maslow_id'        => (!empty($tx['maslow_id']) && $tx['maslow_id'] != 0) ? $tx['maslow_id'] : null,
                ':transaction_date' => $tx['transaction_date'],
                ':amount'           => $tx['amount'],
                ':input_method'     => $tx['input_method'],
                ':transaction_name' => $tx['transaction_name']
            ]);
            $synced_ids[] = $tid;
        } catch (PDOException $e) {
            $error_logs[] = [
                "transaction_id" => $tid ?? 'unknown',
                "error" => $e->getMessage()
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Processed " . count($transactions) . " transactions.",
        "synced_ids" => $synced_ids,
        "errors" => $error_logs
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "No data provided or invalid JSON format."
    ]);
}