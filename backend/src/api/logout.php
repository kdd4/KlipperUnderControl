<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . "/database.php";
require_once __DIR__ . "/utils.php";
require_once __DIR__ . "/jwtFunctions.php";

try {
	$method = $_SERVER['REQUEST_METHOD'];

	switch ($method) {	
		case 'POST':
			$data = json_decode(file_get_contents('php://input'), true);;
			$refresh = $data['refresh_token'] ?? '';

            consumeRefresh($refresh);
			jsonResponse([
				'success' => true,
				'status' => 'logged_out'
			]);
			break;
			
		default:
			http_response_code(405);
			echo json_encode([
				'success' => false,
				'error' => 'Method not allowed'
			]);
	}

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode([
		'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'timestamp' => time()
	]);
	exit(0);
}
?>