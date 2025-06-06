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

    $stmt = $pdo->prepare("SELECT MAX(id) as curId FROM PrinterTasks");
    $chk = $stmt->execute();

    if (!$chk) {
        throw new Exception("SQL Error: Error getting last id");
    }

    $fetch = $stmt->fetch();
    if (!isset($fetch['curId'])) {
        throw new Exception("Fetch error: 'curId' not found: " . json_encode($fetch));
    }

    $id = $fetch['curId'];

    $cnt = 0;

    while ($cnt < 5) {
        sleep(1);
        $stmt = $pdo->prepare("SELECT result FROM PrinterTasks WHERE id=:id");
        $stmt->execute([':id' => $id]);
        $fetch = $stmt->fetch();

        if (!isset($fetch['result'])) {
            throw new Exception("Fetch error: 'result' not found: " . json_encode($fetch));
        }

        $result = $fetch['result'];
        
        if ($result != '') {
            break;
        }

        $cnt++;
    }

    if ($cnt == 5) {
        $stmt = $pdo->prepare("UPDATE PrinterTasks SET result='TL', error='Time limit' WHERE id=:id");
        $stmt->execute([':id' => $id]);
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
    
    return json_decode($result, true);
}

?>