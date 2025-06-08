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
            // Запрос состояния принтера через Moonraker API
            $printerData = moonrakerRequest('info', 'printer', ['objects' => ['extruder'=>NULL, 'heater_bed'=>NULL]]);
            
            if (!isset($printerData['result'])) {
                throw new Exception("Invalid response from Moonraker: " . $printerData);
            }

            $status = $printerData['result'];

            // Формирование ответа
            $response = [
                'success' => true,
                'state' => $status['state'],
                'state_message' => $status['state_message'],
                'print_stats' => [
                    'filename' => '',
                    'total_duration' => 0,
                    'print_duration' => 0,
                    'filament_used' => 0,
                    'progress' => 1,
                ]   
            ];
            echo json_encode($response);

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