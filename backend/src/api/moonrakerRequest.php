<?php
require __DIR__ . "/database.php";

function moonrakerRequest($endpoint = 'info', $method = 'printer', $data = null) {
    global $pdo;

    // Create task
    $stmt = $pdo->prepare("INSERT INTO PrinterTasks(endpoint, method, data, result) VALUES (:endpoint, :method, :data, '')");
	$chk = $stmt->execute([':endpoint' => $endpoint, ':method' => $method, ':data' => $data ? json_encode($data) : 'NULL']);
    
    if (!$chk) {
        throw new Exception("SQL Error: Create printer task error");
    }

    $id = $pdo->lastInsertId();

    $cnt = 0;
    $cnt_limit = 5;

    while ($cnt < $cnt_limit) {
        sleep(1);
        $stmt = $pdo->prepare("SELECT ready FROM PrinterTasks WHERE id=:id");
        $stmt->execute([':id' => $id]);
        $fetch = $stmt->fetch();

        if (!isset($fetch['ready'])) {
            throw new Exception("Fetch error: 'ready' not found: " . json_encode($fetch));
        }

        $result = $fetch['ready'];
        
        if ($result) {
            break;
        }

        $cnt++;
    }

    if ($cnt == $cnt_limit) {
        $stmt = $pdo->prepare("UPDATE PrinterTasks SET result='TL', error='Time limit', ready=True WHERE id=:id");
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

    if ($error) {
        throw new Exception("Moonraker error: " . $error);
    }
    
    if ($httpCode != 200) {
        throw new Exception("HTTP error code: " . $httpCode);
    }

    $stmt = $pdo->prepare("DELETE FROM PrinterTasks WHERE id=:id");
    $chk = $stmt->execute([':id' => $id]);
    if (!$chk) {
         throw new Exception("SQL Error: Error deleting task");
    }
    
    return json_decode($result, true);
}

?>