<?php
// Включение отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Базовые заголовки CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Динамический CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка предварительного OPTIONS запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Max-Age: 86400');
    exit(0);
}

// Путь к директории макросов
$rootDir = __DIR__ . '/../../printer_data/macros';
if (!file_exists($rootDir)) {
    mkdir($rootDir, 0755, true);
}
$rootDir = realpath($rootDir);

if ($rootDir === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Root macros dir not found or cannot be created: ' . __DIR__]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '/';

// Логирование входящего запроса
error_log("[$method] $path - " . json_encode($_GET));

// Нормализация пути
$path = str_replace(['/macros', '//'], ['', '/'], $path);
$path = trim($path, '/');
$path = $path === '' ? '/' : '/' . $path;
$fullPath = $rootDir . $path;

// Проверка безопасности пути
$fullPath = realpath($fullPath);
if ($fullPath === false || strpos($fullPath, $rootDir) !== 0) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Invalid path', 
        'requested' => $path,
        'root' => $rootDir,
        'full' => $fullPath
    ]);
    exit;
}

// Обработка тела запроса
$body = file_get_contents('php://input');
$jsonBody = json_decode($body, true) ?? [];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['action']) && $_GET['action'] === 'content') {
                if (!is_file($fullPath)) {
                    http_response_code(404);
                    echo json_encode(['error' => 'File not found']);
                    exit;
                }
                $content = file_get_contents($fullPath);
                echo json_encode(['content' => $content]);
                exit;
            }
            
            if (!is_dir($fullPath)) {
                http_response_code(400);
                echo json_encode(['error' => 'Not a directory']);
                exit;
            }
            
            $items = [];
            foreach (scandir($fullPath) as $file) {
                if ($file === '.' || $file === '..') continue;
                $itemPath = $fullPath . '/' . $file;
                $items[] = [
                    'name' => $file,
                    'isDir' => is_dir($itemPath),
                    'size' => is_file($itemPath) ? filesize($itemPath) : 0,
                    'modified' => date('Y-m-d H:i:s', filemtime($itemPath))
                ];
            }
            echo json_encode(['files' => $items]);
            break;

        case 'PUT':
            if (empty($body)) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing content']);
                exit;
            }
            
            if (file_put_contents($fullPath, $body) === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to write file']);
                exit;
            }
            
            echo json_encode(['success' => true]);
            break;

        case 'POST':
            $type = $jsonBody['type'] ?? null;
            $name = $jsonBody['name'] ?? null;
            
            if (!$type || !$name) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing type or name']);
                exit;
            }
            
            $newPath = $fullPath . '/' . $name;
            
            if (file_exists($newPath)) {
                http_response_code(409);
                echo json_encode(['error' => 'File or directory exists']);
                exit;
            }
            
            if ($type === 'dir') {
                if (!mkdir($newPath, 0755, true)) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to create directory']);
                    exit;
                }
            } else {
                $content = $jsonBody['content'] ?? '';
                if (file_put_contents($newPath, $content) === false) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to create file']);
                    exit;
                }
            }
            
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (is_dir($fullPath)) {
                // Проверка что директория пуста
                $fileCount = count(scandir($fullPath));
                if ($fileCount > 2) {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'Directory not empty',
                        'fileCount' => $fileCount
                    ]);
                    exit;
                }
                
                if (!rmdir($fullPath)) {
                    http_response_code(500);
                    echo json_encode([
                        'error' => 'Failed to remove directory',
                        'details' => error_get_last()
                    ]);
                    exit;
                }
            } else {
                if (!unlink($fullPath)) {
                    http_response_code(500);
                    echo json_encode([
                        'error' => 'Failed to remove file',
                        'details' => error_get_last()
                    ]);
                    exit;
                }
            }
            
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTrace()
    ]);
}