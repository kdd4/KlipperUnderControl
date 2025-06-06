<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require __DIR__ . "/moonrakerRequest.php";

// Обработка preflight запросовs
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не разрешен']);
    exit;
}

// Получение и валидация входных данных
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['heater']) || !isset($input['target'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Отсутствуют обязательные параметры']);
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
            'Температура вне допустимого диапазона (%d-%d°C)', 
            $limits[$heater]['min'], 
            $limits[$heater]['max']
        )
    ]);
    exit;
}

try {
    // Проверка состояния принтера
    $statusResponse = moonrakerRequest('info', 'printer');
    if ($statusResponse['result']['state'] !== 'ready') {
        throw new Exception('Принтер не готов к работе');
    }
    
    // Формирование G-code команды
    $gcode = $heater === 'extruder' 
        ? "M104 S{$target}" 
        : "M140 S{$target}";
    
    // Отправка команды
    $response = moonrakerRequest(
        'script', 'printer', ['script' => $gcode]
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
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'timestamp' => time()
    ]);
}
?>