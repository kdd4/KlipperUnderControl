<?php
$dbPath = '/var/www/html/database/db.sqlite';
$pdoDriver = 'sqlite';
$pdo;

try {
	$pdo = new PDO("$pdoDriver:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

	$stmt = $pdo->prepare("
		CREATE TABLE IF NOT EXISTS Users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			login VARCHAR(20) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	");
	$chk = $stmt->execute();
	
	if (!$chk) {
        throw new Exception("SQL Error: Create table Users fail. Info: " . $stmt->errorInfo()[2]);
    }

	$stmt = $pdo->prepare("
		CREATE TABLE IF NOT EXISTS PrinterTasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			endpoint TEXT NOT NULL,
			method TEXT NOT NULL,
            data TEXT,
			result TEXT,
            error TEXT,
            httpCode INTEGER,
			ready BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) 
				ON DELETE CASCADE
				ON UPDATE CASCADE
		)
	");
	$chk = $stmt->execute();
	
	if (!$chk) {
        throw new Exception("SQL Error: Create table PrinterTasks fail. Info: " . $stmt->errorInfo()[2]);
    }

	$stmt = $pdo->prepare("
		CREATE TABLE IF NOT EXISTS refresh_tokens (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			token VARCHAR(255) NOT NULL,
			expires_at DATETIME NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) 
				ON DELETE CASCADE
				ON UPDATE CASCADE
		)
	");
	$chk = $stmt->execute();
	
	if (!$chk) {
        throw new Exception("SQL Error: Create table refresh_tokens fail. Info: " . $stmt->errorInfo()[2]);
    }
	
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'timestamp' => time()
    ]);
    exit(0);
}

function consumeRefresh(string $token): ?int {
	global $pdo;
	
    // Возвращает ID пользователя, если токен валиден и не истёк, и одновременно удаляет запись
    $stmt = $pdo->query('SELECT id, user_id, token, expires_at FROM refresh_tokens');
    foreach ($stmt as $row) {
        if (password_verify($token, $row['token']) && strtotime($row['expires_at']) > now()) {
            // Удаляем, чтобы нельзя было использовать повторно (rotation)
            $pdo->prepare('DELETE FROM refresh_tokens WHERE id=?')->execute([$row['id']]);
            return (int)$row['user_id'];
        }
    }
    return null;
}

function createUser(string $login, string $passwordHash): int {
	global $pdo;

    $stmt = $pdo->prepare('INSERT INTO Users (login, password_hash) VALUES (?,?)');
    $stmt->execute([$login, $passwordHash]);
    return (int)$pdo->lastInsertId();
}

function getUserByLogin(string $login): ?array {
	global $pdo;

    $stmt = $pdo->prepare('SELECT * FROM Users WHERE login=?');
    $stmt->execute([$login]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function storeRefresh(int $userId, string $token, int $expires): void {
	global $pdo;
	
    $stmt = $pdo->prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)');
    $stmt->execute([$userId, password_hash($token, PASSWORD_DEFAULT), date('Y-m-d H:i:s', $expires)]);
}

?>