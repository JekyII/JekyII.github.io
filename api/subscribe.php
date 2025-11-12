<?php
// Newsletter subscription handler - submits to Google Apps Script
define('API_ACCESS', true);
$configPath = dirname(__DIR__, 2) . '/private/config/config.php';
if (file_exists($configPath)) {
    require_once $configPath;
} else {
    // Fallback config
    define('GOOGLE_SUBSCRIBE_FORM_URL', '');
    function setSecurityHeaders() {}
    function checkRateLimit($id) { return true; }
    function sanitizeInput($v) { return htmlspecialchars(trim($v), ENT_QUOTES, 'UTF-8'); }
    function logEvent($e, $d = []) {}
}

header('Content-Type: application/json');
setSecurityHeaders();

// Rate limiting
$clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit($clientIP . '_subscribe')) {
    logEvent('rate_limit_exceeded', ['ip' => $clientIP]);
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Too many requests. Try again later.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$email = sanitizeInput($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    logEvent('invalid_email_subscribe', ['email' => $email]);
    echo json_encode(['success' => false, 'message' => 'Invalid email.']);
    exit;
}

// Submit to Google Apps Script
$googleUrl = defined('GOOGLE_SUBSCRIBE_FORM_URL') ? GOOGLE_SUBSCRIBE_FORM_URL : '';

if (!empty($googleUrl)) {
    $postData = http_build_query([
        'email' => $email,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $clientIP
    ]);
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $postData,
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    $result = @file_get_contents($googleUrl, false, $context);
    
    if ($result !== false) {
        $response = json_decode($result, true);
        // Check if Google Apps Script returned a duplicate message
        if (isset($response['message']) && strpos($response['message'], 'already') !== false) {
            echo json_encode(['success' => false, 'message' => 'Already subscribed.']);
        } else {
            logEvent('subscribe_success', ['email' => $email]);
            echo json_encode(['success' => true, 'message' => 'Thank you for subscribing!']);
        }
    } else {
        logEvent('google_subscribe_failed', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Subscription failed. Try again later.']);
    }
} else {
    // Fallback: Just return success
    logEvent('subscribe_received', ['email' => $email]);
    echo json_encode(['success' => true, 'message' => 'Thank you for subscribing!']);
}
?>
