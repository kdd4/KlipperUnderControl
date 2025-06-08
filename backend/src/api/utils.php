<?php

function jsonResponse($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit(0);
}

function now(): int { return time(); }
?>