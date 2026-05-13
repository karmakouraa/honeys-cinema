<?php
// ─── Database connection (MySQL via PDO) ─────────────────────
// Run setup.sql once to create the schema before using this app.

define('DB_HOST', 'localhost');
define('DB_NAME', 'honeys_cinema');
define('DB_USER', 'root');
define('DB_PASS', '');          // XAMPP default: no password

function get_db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'msg' => 'Database connection failed.']);
        exit;
    }

    return $pdo;
}
