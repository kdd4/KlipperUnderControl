<?php
header('Content-Type: application/json; charset=UTF-8');
// Dynamic CORS for credentials
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$rootDir = realpath(__DIR__ . '/../../../printer/gcodes');
if ($rootDir === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Gcodes dir not found']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

$path = isset($_GET['path']) ? $_GET['path'] : '/';
if ($path === '' || $path === '/' || $path === '/prints' || $path === 'prints') {
    $path = '/';
}
$path = preg_replace('#^/prints#', '/', $path);
$path = preg_replace('#/+#', '/', $path); // collapse


switch ($method) {
    case 'GET':
        // list directory
        foreach (scandir($fullPath) as $file) {
            $items[] = [
                'name' => $file,
                'isDir' => is_dir($fp),
                'size'   => is_file($fp) ? filesize($fp) : 0,
                'modified' => date('Y-m-d H:i:s', filemtime($fp))
        }
    case 'POST':
        // upload file
        if (!isset($_FILES['file'])) {
        }
    case 'DELETE':
        if (is_dir($fullPath)) {
        } else {
        }
    default:
}
?>