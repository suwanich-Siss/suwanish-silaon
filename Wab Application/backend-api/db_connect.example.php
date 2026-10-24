<?php
// Copy this file to db_connect.php and fill in your database credentials
// db_connect.php is gitignored and will NOT be committed

$host = "localhost";
$dbname = "your_database_name"; 
$username = "your_db_username";              
$password = "your_db_password";                  

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode([
        "status" => "error", 
        "message" => "Database connection failed: " . $e->getMessage()
    ]));
}
?>
