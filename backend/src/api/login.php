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
			$data = jsonInput();
			$login = $data['login'] ?? '';
            $password = $data['password'] ?? '';
            $user = getUserByLogin($login);
            if (!$user || !password_verify($password, $user['password_hash'])) {
                jsonResponse(['error' => 'Invalid credentials'], 401);
            }
            $access  = makeJwt($user['id']);
            $refresh = bin2hex(random_bytes(32));
            storeRefresh($user['id'], $refresh, now() + REFRESH_LIFETIME);
            jsonResponse([
                'access_token'  => $access,
                'expires_in'    => ACCESS_LIFETIME,
                'refresh_token' => $refresh
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