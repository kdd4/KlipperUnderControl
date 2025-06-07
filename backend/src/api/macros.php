<?php
header('Content-Type: application/json; charset=UTF-8');
// Dynamic CORS for credentials
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$rootDir = realpath(__DIR__ . '/../../../printer/macros');
if ($rootDir === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Root macros dir not found']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Normalize path to stay inside macros root
$path = isset($_GET['path']) ? $_GET['path'] : '/';
if ($path === '' || $path === '/' || $path === '/macros' || $path === 'macros') {
    $path = '/';
}
// Strip leading "/macros" if present
$path = preg_replace('#^/macros#', '/', $path);
$path = preg_replace('#/+#', '/', $path); // collapse slashes

if ($fullPath === false || strpos($fullPath, $rootDir) !== 0) {
}

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'content') {
            if (!is_file($fullPath)) {
            }
        } else {
            // list directory
            foreach (scandir($fullPath) as $file) {
                $items[] = [
                    'name' => $file,
                    'isDir' => is_dir($fp),
                    'size'   => is_file($fp) ? filesize($fp) : 0,
                    'modified' => date('Y-m-d H:i:s', filemtime($fp))
            }
        }
    case 'PUT':
        if (!$body || !isset($body['content'])) {
        }
    case 'POST':
        // create new macro/directory
        if ($type === 'dir') {
        } else {
        }
    
case 'PATCH':
    if (!$body || !isset($body['action'])) {
    }
    if ($body['action'] === 'rename') {
        if (!isset($body['newName']) || $body['newName'] === '') {
        }
        if (file_exists($newPath)) {
        }
        if (!rename($fullPath, $newPath)) {
        }
    } elseif ($body['action'] === 'metadata') {
        if (!isset($body['metadata'])) {
        }
    } else {
    }

case 'DELETE':
        if (is_dir($fullPath)) {
        } else {
        }
    default:
}
?>