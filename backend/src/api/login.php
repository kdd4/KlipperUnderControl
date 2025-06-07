<?php
header('Content-Type: application/json; charset=UTF-8');
// Dynamic CORS for credentials
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$body = json_decode(file_get_contents('php://input'), true);
if (!$body || !isset($body['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Password required']);
    exit;
}
$correct = getenv('KUC_ADMIN_PWD') ?: 'admin';
if ($body['password'] !== $correct) {
    http_response_code(401);
    echo json_encode(['error' => 'Wrong credentials']);
    exit;
}
// generate JWT token (HS256)
$secret = getenv('KUC_JWT_SECRET') ?: 'change_this_secret';
$header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
$payload = json_encode([
    'sub' => 'admin',
    'iat' => time(),
    'exp' => time() + 86400
]);
function base64UrlEncode($str) {
    return rtrim(strtr(base64_encode($str), '+/', '-_'), '=');
}
$jwt_header = base64UrlEncode($header);
$jwt_payload = base64UrlEncode($payload);
$signature = hash_hmac('sha256', $jwt_header . '.' . $jwt_payload, $secret, true);
$jwt = $jwt_header . '.' . $jwt_payload . '.' . base64UrlEncode($signature);

setcookie('auth', $jwt, [
    'expires' => time() + 86400,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax'
]);
echo json_encode(['success' => true, 'token' => $jwt]);
exit;
?>