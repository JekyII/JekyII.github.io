<?php
// Contact form handler - submits to Google Apps Script
define('API_ACCESS', true);
$configPath = dirname(__DIR__, 2) . '/private/config/config.php';
if (file_exists($configPath)) {
    require_once $configPath;
} else {
    // Fallback config
    define('GOOGLE_CONTACT_FORM_URL', '');
    define('RECAPTCHA_SECRET_KEY', '6LcXZQcsAAAAANLKVrks3JLxlLg-w0cNoRLKpRMl');
    define('RECAPTCHA_MIN_SCORE', 0.5);
    function setSecurityHeaders() {}
    function checkRateLimit($id) { return true; }
    function sanitizeInput($v) { return htmlspecialchars(trim($v), ENT_QUOTES, 'UTF-8'); }
    function logEvent($e, $d = []) {}
}

header('Content-Type: application/json');
setSecurityHeaders();

// Rate limiting
$clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit($clientIP . '_contact')) {
    logEvent('rate_limit_exceeded', ['ip' => $clientIP]);
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Too many requests. Try again later.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

// Get and validate inputs
$name = sanitizeInput($_POST['name'] ?? '');
$email = sanitizeInput($_POST['email'] ?? '');
$message = sanitizeInput($_POST['message'] ?? '');
$recaptchaToken = $_POST['g-recaptcha-response'] ?? '';

if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    logEvent('invalid_email', ['email' => $email]);
    echo json_encode(['success' => false, 'message' => 'Invalid email.']);
    exit;
}

// Verify reCAPTCHA
if (!empty($recaptchaToken)) {
    $verify = @file_get_contents('https://www.google.com/recaptcha/api/siteverify?' . http_build_query([
        'secret' => RECAPTCHA_SECRET_KEY,
        'response' => $recaptchaToken,
        'remoteip' => $clientIP
    ]));
    
    if ($verify) {
        $data = json_decode($verify, true);
        if (!$data['success'] || ($data['score'] ?? 0) < RECAPTCHA_MIN_SCORE) {
            logEvent('recaptcha_failed', ['ip' => $clientIP, 'score' => $data['score'] ?? 0]);
            echo json_encode(['success' => false, 'message' => 'Security check failed.']);
            exit;
        }
    }
}

// Submit to Google Apps Script
$googleUrl = defined('GOOGLE_CONTACT_FORM_URL') ? GOOGLE_CONTACT_FORM_URL : '';

if (!empty($googleUrl)) {
    $postData = http_build_query([
        'name' => $name,
        'email' => $email,
        'message' => $message,
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
        logEvent('contact_success', ['email' => $email]);
        echo json_encode(['success' => true, 'message' => 'Thank you! We\'ll get back to you soon.']);
    } else {
        logEvent('google_submit_failed', ['email' => $email]);
        echo json_encode(['success' => false, 'message' => 'Submission failed. Try again later.']);
    }
} else {
    // Fallback: Just return success (or log to file)
    logEvent('contact_received', ['name' => $name, 'email' => $email]);
    echo json_encode(['success' => true, 'message' => 'Thank you! We\'ll get back to you soon.']);
}
?>
