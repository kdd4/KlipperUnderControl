<?php
require_once __DIR__ . "/database.php";

function moonrakerRequest($endpoint = 'info', $method = 'printer', $data = null) {
    global $pdo;

    // Create task
    $stmt = $pdo->prepare("INSERT INTO PrinterTasks(user_id, endpoint, method, data, result) VALUES (1, :endpoint, :method, :data, '')");
	$chk = $stmt->execute([':endpoint' => $endpoint, ':method' => $method, ':data' => $data ? json_encode($data) : 'NULL']);
    
    if (!$chk) {
        throw new Exception("SQL Error: Create printer task error");
    }

    $id = $pdo->lastInsertId();

    $cnt = 0;
    $cnt_limit = 5;

    while ($cnt < $cnt_limit) {
        sleep(1);
        $stmt = $pdo->prepare("SELECT completed FROM PrinterTasks WHERE id=:id");
        $stmt->execute([':id' => $id]);
        $fetch = $stmt->fetch();

        if (!isset($fetch['completed'])) {
            throw new Exception("Fetch error: 'completed' not found: " . json_encode($fetch));
        }

        $result = $fetch['completed'];
        
        if ($result) {
            break;
        }

        $cnt++;
    }

    if ($cnt == $cnt_limit) {
        $stmt = $pdo->prepare("UPDATE PrinterTasks SET result='TL', error='Time limit', completed=True WHERE id=:id");
        $chk = $stmt->execute([':id' => $id]);
        if (!$chk) {
            throw new Exception("SQL Error: Error updating task (TL)");
        }
    }
    
    $stmt = $pdo->prepare("SELECT error, httpCode, result FROM PrinterTasks WHERE id=:id");
    $stmt->execute([':id' => $id]);
    $fetch = $stmt->fetch();
    $error = $fetch['error'];
    $httpCode = $fetch['httpCode'];
    $result = $fetch['result'];

    $stmt = $pdo->prepare("DELETE FROM PrinterTasks WHERE id=:id");
    $chk = $stmt->execute([':id' => $id]);
    if (!$chk) {
         throw new Exception("SQL Error: Error deleting task");
    }

    if ($error) {
        throw new Exception("Moonraker error: " . $error);
    }
    
    if ($httpCode != 200) {
        throw new Exception("HTTP error code: " . $httpCode);
    }
    
    return json_decode($result, true);
}

?>