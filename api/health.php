<?php
/**
 * Health & Diagnostics Endpoint
 * Checks database connectivity and table status.
 */
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';

handleCorsHeaders();

try {
    $pdo = Database::getConnection();
    
    // Check estimates table
    $stmt1 = $pdo->query("SELECT COUNT(*) AS total FROM estimates");
    $estimatesCount = (int)$stmt1->fetchColumn();

    // Check presets table
    $stmt2 = $pdo->query("SELECT COUNT(*) AS total FROM custom_presets");
    $presetsCount = (int)$stmt2->fetchColumn();

    sendJsonResponse([
        'status' => 'healthy',
        'database' => 'connected',
        'estimatesCount' => $estimatesCount,
        'presetsCount' => $presetsCount,
        'phpVersion' => PHP_VERSION,
        'timestamp' => date('c')
    ]);
} catch (Throwable $e) {
    sendJsonResponse([
        'status' => 'unhealthy',
        'database' => 'disconnected',
        'error' => $e->getMessage()
    ], 503, false);
}
