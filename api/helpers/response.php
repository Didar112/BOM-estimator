<?php
/**
 * API Response & CORS Helper
 */
declare(strict_types=1);

function handleCorsHeaders(): void {
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function sendJsonResponse(mixed $data, int $statusCode = 200, bool $success = true): void {
    handleCorsHeaders();
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($statusCode);
    }

    $payload = [
        'success' => $success
    ];

    if ($success) {
        $payload['data'] = $data;
    } else {
        $payload['error'] = is_string($data) ? $data : 'An unexpected error occurred';
        if (is_array($data)) {
            $payload['details'] = $data;
        }
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
