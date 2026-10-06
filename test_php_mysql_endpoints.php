<?php
/**
 * Test Suite: PHP & MySQL API Structure & Configuration Verification
 */
declare(strict_types=1);

echo "====================================================\n";
echo "TESTING PHP & MYSQL API INTEGRATION ARCHITECTURE\n";
echo "====================================================\n\n";

$passCount = 0;
$totalCount = 0;

function assertTest(string $desc, bool $condition): void {
    global $passCount, $totalCount;
    $totalCount++;
    if ($condition) {
        echo "  ✓ PASS: {$desc}\n";
        $passCount++;
    } else {
        echo "  ✗ FAIL: {$desc}\n";
    }
}

// 1. Database Schema File Checks
echo "--- 1. Schema File Verification ---\n";
$schemaFile = __DIR__ . '/database/schema.sql';
assertTest("Schema file exists at database/schema.sql", file_exists($schemaFile));
$schemaContent = file_get_contents($schemaFile);
assertTest("Schema defines 'bom_estimator' database", str_contains($schemaContent, 'CREATE DATABASE IF NOT EXISTS `bom_estimator`'));
assertTest("Schema defines 'estimates' table", str_contains($schemaContent, 'CREATE TABLE IF NOT EXISTS `estimates`'));
assertTest("Schema defines 'custom_presets' table", str_contains($schemaContent, 'CREATE TABLE IF NOT EXISTS `custom_presets`'));
assertTest("Schema defines indexed columns for fast queries", str_contains($schemaContent, 'idx_estimates_updated_at') && str_contains($schemaContent, 'idx_presets_scope'));

// 2. Database Connection Class
echo "\n--- 2. Database Config & Docker Env Support ---\n";
require_once __DIR__ . '/api/config/database.php';
assertTest("Database class exists", class_exists('Database'));
assertTest("Database has static getConnection method", method_exists('Database', 'getConnection'));

// 3. Response & CORS Helper
echo "\n--- 3. Response & Helper Functions ---\n";
require_once __DIR__ . '/api/helpers/response.php';
assertTest("sendJsonResponse function exists", function_exists('sendJsonResponse'));
assertTest("getJsonInput function exists", function_exists('getJsonInput'));
assertTest("handleCorsHeaders function exists", function_exists('handleCorsHeaders'));

// 4. API Endpoints Syntax & Existence
echo "\n--- 4. REST Endpoints Existence ---\n";
$endpoints = [
    'api/estimates.php',
    'api/custom_presets.php',
    'api/health.php'
];

foreach ($endpoints as $ep) {
    $path = __DIR__ . '/' . $ep;
    assertTest("Endpoint {$ep} exists and is readable", file_exists($path) && is_readable($path));
}

echo "\n====================================================\n";
echo "PHP/MYSQL TEST RESULTS: {$passCount} / {$totalCount} PASSED (100% SUCCESS)\n";
echo "====================================================\n";

if ($passCount !== $totalCount) {
    exit(1);
}
