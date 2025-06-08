<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . "/../database.php";
require_once __DIR__ . "/../utils.php";

try {
	$user_id = requireAuth();
	if (!$user_id) {
		http_response_code(401);
		echo json_encode([
				'success' => false,
				'error' => "Unauthorized"
		]);
		exit(0);
	}

	$method = $_SERVER['REQUEST_METHOD'];

	switch ($method) {	
		case 'POST':
			$data = json_decode(file_get_contents('php://input'), true);;
			$password = $data['password'] ?? '';
            $new_login = $data['new_login'] ?? '';

            $user = getUserById($user_id);
			if (!password_verify($password, $user['password_hash'])) {
				jsonResponse([
					'success' => false,
					'error' => 'Wrong password'
				], 401);
			}

			changeLogin($user_id, $new_login);
			echo json_encode([
				'success' => true
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