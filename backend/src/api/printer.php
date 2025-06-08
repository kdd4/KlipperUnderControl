<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . "/database.php";
require_once __DIR__ . "/jwtFunctions.php";

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
		case 'GET':
			$stmt = $pdo->prepare("SELECT * FROM PrinterTasks WHERE completed=False AND user_id=:user_id");
			$stmt->execute([':user_id' => $user_id]);
			$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
			echo json_encode([
					'success' => true,
					'result' => $tasks
			]);
			break;
			
		case 'POST':
			$data = json_decode(file_get_contents('php://input'), true);
			if (isset($data['result']) and isset($data['httpCode']) and isset($data['error']) and isset($data['id'])) {
				$stmt = $pdo->prepare("UPDATE PrinterTasks SET result=:result, httpCode=:httpCode, error=:error, completed=true WHERE id=:id AND user_id=:user_id");
				$chk = $stmt->execute([
					':id' => $data['id'],
					':user_id' => $user_id,
					':result' =>  json_encode($data['result']),
					':httpCode' => $data['httpCode'],
					':error' => $data['error']
				]);

				if (!$chk) {
					http_response_code(500);
					echo json_encode([
						'success' => false,
						'error' => 'Error with updating task'
					]);
				}

				echo json_encode([
					'success' => true
				]);
			} else {
				http_response_code(400);
				echo json_encode([
					'success' => false,
					'error' => 'Wrong format: ' . $data
				]);
			}
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