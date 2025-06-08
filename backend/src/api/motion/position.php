<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . "/../moonrakerRequest.php";

try {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            $printerData = moonrakerRequest('objects/query', 'printer', ['objects' => ['toolhead'=>['homed_axes', 'position']]]);
            
            if (!isset($printerData['result']['status'])) {
                throw new Exception("Invalid response from Moonraker: " . $printerData);
            }

            $data = $printerData['result']['status']['toolhead'];

            echo json_encode([
                'success' => true,
                'position' => [
                    'x' => $data['position'][0],
                    'y' => $data['position'][1],
                    'z' => $data['position'][2],
                    'e' => $data['position'][3]
                ],
                "homed_axes" => [
                    $data[homed_axes]
                ]
            ]);
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