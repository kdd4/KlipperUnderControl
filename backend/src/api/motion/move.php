<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . "/../moonrakerRequest.php";

try {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['x']) || !isset($input['y']) || !isset($input['z']) || !isset($input['feedrate']) || !isset($input['absolute'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Necessary parametr(s) not found']);
                exit;
            }
            $script = 'G1 X' . $input['x'] . ' Y' . $input['y'] . ' Z' . $input['z'] . ' F' . $input['feedrate'];

            if ($input['absolute'] === true) {
                $script = 'G90\n' . $script;
            } else {
                $script = 'G91\n' . $script;
            }

            moonrakerRequest('gcode/script', 'printer', ['script' => $script]);

            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method "' . $method . '" not allowed']);
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