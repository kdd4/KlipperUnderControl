<?php
// Включение отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Базовые заголовки CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

// Динамический CORS
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка предварительного OPTIONS запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Max-Age: 86400');
    exit(0);
}

// Путь к директории G-кодов
$rootDir = __DIR__ . '/../../printer_data/gcodes';
if (!file_exists($rootDir)) {
    mkdir($rootDir, 0755, true);
}
$rootDir = realpath($rootDir);

if ($rootDir === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Gcodes dir not found or cannot be created: ' . __DIR__]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '/';

// Логирование входящего запроса
error_log("[$method] $path - " . json_encode($_GET));

// Нормализация пути
$path = str_replace(['/prints', '//'], ['', '/'], $path);
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

try {
    switch ($method) {
        case 'GET':
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

        case 'POST':
            // Создание директории
            if (isset($jsonBody['action']) && $jsonBody['action'] === 'create_dir') {
                $name = $jsonBody['name'] ?? null;
                if (!$name) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing directory name']);
                    exit;
                }
                
                $newDirPath = $fullPath . '/' . $name;
                if (file_exists($newDirPath)) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Directory already exists']);
                    exit;
                }
                
                if (!mkdir($newDirPath, 0755, true)) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to create directory']);
                    exit;
                }
                
                echo json_encode(['success' => true]);
                break;
            }
            
            // Переименование директории
            if (isset($jsonBody['action']) && $jsonBody['action'] === 'rename_dir') {
                $newName = $jsonBody['newName'] ?? null;
                if (!$newName) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing new name']);
                    exit;
                }
                
                $newPath = dirname($fullPath) . '/' . $newName;
                if (file_exists($newPath)) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Directory already exists']);
                    exit;
                }
                
                if (!rename($fullPath, $newPath)) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to rename directory']);
                    exit;
                }
                
                echo json_encode(['success' => true]);
                break;
            }

            // Загрузка файла
            if (!isset($_FILES['file'])) {
                http_response_code(400);
                echo json_encode(['error' => 'No file uploaded']);
                exit;
            }
            
            $file = $_FILES['file'];
            $targetPath = $fullPath . '/' . basename($file['name']);
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'error' => 'Failed to move uploaded file',
                    'details' => error_get_last()
                ]);
            }
            break;

        case 'DELETE':
            $type = $_GET['type'] ?? 'file';
            
            if ($type === 'dir') {
                // Проверка что директория пуста
                if (count(scandir($fullPath)) > 2) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Directory not empty']);
                    exit;
                }
                
                if (!rmdir($fullPath)) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to remove directory']);
                    exit;
                }
            } else {
                // Удаление файла
                if (!unlink($fullPath)) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to remove file']);
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