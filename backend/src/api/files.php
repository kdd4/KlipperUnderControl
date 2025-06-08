<?php
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка предварительного OPTIONS запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . "/moonrakerRequest.php";

// Путь к директории макросов
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

// Логирование входящего запроса
error_log("[$method] $path - " . json_encode($_GET));

$path = str_replace(['/prints', '//'], ['', '/'], $path);
$path = trim($path, '/');
$path = $path === '' ? '' : '/' . $path;

// Обработка тела запроса
$body = file_get_contents('php://input');

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['action']) && $_GET['action'] === 'content') {
                $response = moonrakerRequest('get_dirdownloadectory', 'files', ['root' => 'gcodes', 'filename' => trim($path, '/')]);
                
                if (!isset($response['TEXT'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Error api/files: "TEXT" not found. "path" can be wrong']);
                    exit;
                }
                echo json_encode(['content' => $response['TEXT']]);
                exit;
            }

            $response = moonrakerRequest('get_directory', 'files', ['path' => 'gcodes' . $path]);

            if (!isset($response['result'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Error api/files: "result" not found. "path" can be wrong']);
                exit;
            }
            
            $items = [];
            foreach ($response['result']['dirs'] as $file) {
                $items[] = [
                    'name' => $file['dirname'],
                    'isDir' => true,
                    'size' => $file['size'],
                    'modified' => $file['modified']
                ];
            }

            foreach ($response['result']['files'] as $file) {
                $items[] = [
                    'name' => $file['filename'],
                    'isDir' => false,
                    'size' => $file['size'],
                    'modified' => $file['modified']
                ];
            }
            echo json_encode(['files' => $items]);
            break;

        /*case 'PUT':
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
            $jsonBody = json_decode($body, true) ?? [];

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
*/
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'timestamp' => time()
    ];
	http_response_code(500);
	echo json_encode($response);
    exit(0);
}

?>