<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require __DIR__ . "/moonrakerRequest.php";

try {
    // Запрос состояния принтера через Moonraker API
    $printerData = moonrakerRequest('objects/query', 'printer', ['objects' => ['extruder'=>NULL, 'heater_bed'=>NULL]]);
    
    if (!isset($printerData['result']['status'])) {
        throw new Exception("Invalid response from Moonraker: " . $printerData);
    }
    
    $status = $printerData['result']['status'];
    
    // Формирование ответа
    $response = [
        'success' => true,
        'data' => [
            'extruder' => [
                'temperature' => $status['extruder']['temperature'] ?? 0,
                'target' => $status['extruder']['target'] ?? 0,
                'power' => $status['extruder']['power'] ?? 0
            ],
            'heater_bed' => [
                'temperature' => $status['heater_bed']['temperature'] ?? 0,
                'target' => $status['heater_bed']['target'] ?? 0,
                'power' => $status['heater_bed']['power'] ?? 0
            ]
        ],
        'timestamp' => time()
    ];
    echo json_encode($response);
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'timestamp' => time()
    ];
    http_response_code(500);
    echo json_encode($response);
}
?>