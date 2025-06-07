<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$body = json_decode(file_get_contents('php://input'), true);
if (!$body || !isset($body['axis']) || !isset($body['distance']) || !isset($body['speed'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Bad request']);
    exit;
}

$axis = strtoupper($body['axis']);
$distance = floatval($body['distance']);
$speed = intval($body['speed']);

// Build G-code command
$gcode = sprintf("G0 %s%.3f F%d", $axis, $distance, $speed*60);

// Send to Moonraker
$moonraker = getenv('MOONRAKER_URL') ?: 'http://localhost:7125';
$url = $moonraker . '/printer/gcode/script';
$payload = json_encode(['script' => $gcode]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpcode >= 200 && $httpcode < 300) {
    echo json_encode(['success' => true, 'cmd' => $gcode]);
} else {
    http_response_code(502);
    echo json_encode(['error' => 'Moonraker response error', 'detail' => $response]);
}
?>
