<?php
$dbPath = '/var/www/html/database/db.sqlite';
$pdoDriver = 'sqlite';
$pdo;

try {
	$pdo = new PDO("$pdoDriver:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Создание таблицы, если её нет
	$pdo->exec("
		CREATE TABLE IF NOT EXISTS PrinterTasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			endpoint TEXT NOT NULL,
			method TEXT NOT NULL,
            data TEXT,
			result TEXT,
            error TEXT,
            httpCode INTEGER,
            actual BOOLEAN DEFAULT TRUE,
			ready BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	");

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'timestamp' => time()
    ]);
    exit();
}
?>