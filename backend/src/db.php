<?php
class Database {
    private $pdo;

    public function __construct() {
        $dbPath = __DIR__ . '/db.sqlite';
        try {
            $this->pdo = new PDO('sqlite:' . $dbPath);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->initDb();
        } catch (PDOException $e) {
            // Create database file if not exists
            if (!file_exists($dbPath)) {
                touch($dbPath);
                $this->pdo = new PDO('sqlite:' . $dbPath);
                $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->initDb();
            } else {
                throw new Exception("Database connection failed: " . $e->getMessage());
            }
        }
    }

    private function initDb() {
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )');

        $this->pdo->exec('CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )');
        
        // Добавляем индекс для ускорения поиска
        $this->pdo->exec('CREATE INDEX IF NOT EXISTS idx_login ON users (login)');
    }

    public function getPdo() {
        return $this->pdo;
    }
}
?>