<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . "/moonrakerRequest.php";

try {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
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

            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['heater']) || !isset($input['target'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Necessary parametr(s) not found']);
                exit;
            }

            $heater = $input['heater'];
            $target = floatval($input['target']);

            // Валидация типа нагревателя
            $allowedHeaters = ['extruder', 'heater_bed'];
            if (!in_array($heater, $allowedHeaters)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Неверный тип нагревателя']);
                exit;
            }

            // Проверка диапазона температур
            $limits = [
                'extruder' => ['min' => 0, 'max' => 300],
                'heater_bed' => ['min' => 0, 'max' => 120]
            ];
            if ($target < $limits[$heater]['min'] || $target > $limits[$heater]['max']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'error' => sprintf(
                        'Temperature out of range (%d-%d°C)', 
                        $limits[$heater]['min'], 
                        $limits[$heater]['max']
                    )
                ]);
                break;
            }

            // Проверка состояния принтера
            $statusResponse = moonrakerRequest('info', 'printer');
            if ($statusResponse['result']['state'] !== 'ready') {
                throw new Exception('Printer state is not ready');
            }
            
            // Формирование G-code команды
            $gcode = $heater === 'extruder' 
                ? "M104 S{$target}" 
                : "M140 S{$target}";
            
            // Отправка команды
            $response = moonrakerRequest(
                'gcode/script', 'printer', ['script' => $gcode]
            );
            
            // Логирование операции
            error_log(sprintf(
                "[Temperature Set] %s: %d°C at %s",
                $heater,
                $target,
                date('Y-m-d H:i:s')
            ));

            // Получение актуального состояния после установки
            $currentStatus = moonrakerRequest(
                'objects/query', 'printer', ['objects' => [$heater => NULL]]
            );
            
            echo json_encode([
                'success' => true,
                'heater' => $heater,
                'target' => $target,
                'current' => $currentStatus['result']['status'][$heater]['temperature'] ?? null,
                'message' => $target > 0 
                    ? "Нагрев {$heater} до {$target}°C" 
                    : "Выключение нагревателя {$heater}",
                'timestamp' => time()
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