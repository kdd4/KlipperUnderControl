<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require __DIR__ . "/database.php";

try {
	$method = '';
	if (isset($_SERVER['REQUEST_METHOD'])) {
		$method = $_SERVER['REQUEST_METHOD'];
	}

	switch ($method) {
		case 'GET':
			$stmt = $pdo->query("SELECT * FROM PrinterTasks WHERE ready=False");
			$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
			echo json_encode([
					'success' => true,
					'result' => $tasks
			]);
			break;
			
		case 'PUT':
			$data = json_decode(file_get_contents('php://input'), true);
			if (isset($data['result']) and isset($data['httpCode']) and isset($data['error']) and isset($data['id'])) {
				$stmt = $pdo->prepare("UPDATE PrinterTasks SET result=:result, httpCode=:httpCode, error=:error, ready=true WHERE id=:id");
				$chk = $stmt->execute([
					':id' => $data['id'],
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
			
		case 'OPTIONS':
			echo json_encode(['Allow' => 'GET,PUT,OPTIONS']);
			break;
			
		default:
			http_response_code(405);
			echo json_encode([
				'success' => false,
				'error' => 'Method not allowed'
			]);
	}

} catch (PDOException $e) {
	http_response_code(500);
	echo json_encode([
		'success' => false,
		'error' => $e->getMessage()
	]);
}
?>