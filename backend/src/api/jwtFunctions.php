<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . "/database.php";
require_once __DIR__ . "/utils.php";

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

const ACCESS_LIFETIME  = 900;        // 15 мин
const REFRESH_LIFETIME = 604800;     // 7 дней
const JWT_ALG = 'HS256';

if (!isset($_ENV['JWT_SECRET'])) {
    $_ENV['JWT_SECRET'] = getenv('JWT_SECRET') ?? NULL;
}

function makeJwt(int $userId): string {
    $issued = now();
    $payload = [
        'iss' => $_ENV['JWT_ISSUER']   ?? 'http://localhost:8088',
        'aud' => $_ENV['JWT_AUDIENCE'] ?? 'http://localhost',
        'iat' => $issued,
        'nbf' => $issued,
        'exp' => $issued + ACCESS_LIFETIME,
        'sub' => $userId
    ];
    ob_start();
    $result = JWT::encode($payload, $_ENV['JWT_SECRET'], JWT_ALG);
    ob_end_clean();
    return $result;
}

function verifyJwt(string $token): object {
    ob_start();
    $result = JWT::decode($token, new Key($_ENV['JWT_SECRET'], JWT_ALG));
    ob_end_clean();
    return $result;
}

function requireAuth(): array {
    global $pdo;
    
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$hdr && function_exists('getallheaders')) {
        $h = getallheaders();
        $hdr = $h['Authorization'] ?? $h['authorization'] ?? '';
    }

    if (!preg_match('/^Bearer\s+(.*)$/i', $hdr, $m)) {
        jsonResponse(['error' => 'Missing Bearer token. SERVER: ' . json_encode($_SERVER)], 401);
    }
    try {
        $decoded = verifyJwt($m[1]);
    } catch (Exception $e) {
        jsonResponse(['error' => 'Invalid token'], 401);
    }

    // Опционально: сверяемся с БД (пользователь активен?)
    $stmt = $pdo->prepare('SELECT id FROM Users WHERE id=? AND is_active=1');
    $stmt->execute([$decoded->sub]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        jsonResponse(['error' => 'User disabled'], 403);
    }
    return $user['id'];
}

?>