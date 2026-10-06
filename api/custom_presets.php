<?php
/**
 * Custom Parameter Presets REST API Endpoint
 * Handles CRUD operations for machine parameter presets in MySQL.
 */
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';

handleCorsHeaders();

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetPresets($pdo);
        break;

    case 'POST':
        handlePostPresets($pdo);
        break;

    case 'DELETE':
        handleDeletePresets($pdo);
        break;

    default:
        sendJsonResponse('Method not allowed', 405, false);
        break;
}

/**
 * Normalize variant key for consistent database querying
 */
function normalizeVariantKey(string $key): string {
    $v = strtolower(trim($key));
    if ($v === 'mz3' || $v === 'mz#3') return 'mz_3';
    if ($v === 'mz5' || $v === 'mz#5') return 'mz_5';
    if ($v === 'cz3' || $v === 'cz#3') return 'cz_3';
    if ($v === 'cz5' || $v === 'cz#5') return 'cz_5';
    if ($v === 'pz3' || $v === 'pz#3') return 'pz_3';
    if ($v === 'pz5' || $v === 'pz#5') return 'pz_5';
    if ($v === 'pz8' || $v === 'pz#8') return 'pz_8';
    return $v;
}

/**
 * Normalize length unit
 */
function normalizeUnit(string $unit): string {
    $u = strtolower(trim($unit));
    return ($u === 'cm' || $u === 'centimeter' || $u === 'centimeters' || $u === 'mm') ? 'cm' : 'inch';
}

/**
 * Format category and size display tag for preset name, e.g. "mz#3" or "cz#5"
 */
function formatCategorySizeTag(string $variantKey): string {
    $v = normalizeVariantKey($variantKey);
    if (str_starts_with($v, 'wire')) {
        if (str_contains($v, '3')) return 'wire#3';
        if (str_contains($v, 'long')) return 'wire#5 long';
        return 'wire#5';
    }
    $parts = explode('_', $v);
    if (count($parts) >= 2) {
        return "{$parts[0]}#{$parts[1]}";
    }
    return $v;
}

/**
 * Handle GET requests (list all or scoped by variant & unit)
 */
function handleGetPresets(PDO $pdo): void {
    $variantKey = isset($_GET['variantKey']) ? normalizeVariantKey((string)$_GET['variantKey']) : null;
    $unit = isset($_GET['unit']) ? normalizeUnit((string)$_GET['unit']) : (isset($_GET['lengthUnit']) ? normalizeUnit((string)$_GET['lengthUnit']) : null);

    if ($variantKey !== null && $unit !== null) {
        $stmt = $pdo->prepare("SELECT * FROM custom_presets WHERE variant_key = :vk AND unit = :unit ORDER BY updated_at DESC");
        $stmt->execute(['vk' => $variantKey, 'unit' => $unit]);
    } elseif ($variantKey !== null) {
        $stmt = $pdo->prepare("SELECT * FROM custom_presets WHERE variant_key = :vk ORDER BY updated_at DESC");
        $stmt->execute(['vk' => $variantKey]);
    } else {
        $stmt = $pdo->query("SELECT * FROM custom_presets ORDER BY updated_at DESC");
    }

    $rows = $stmt->fetchAll();
    $presets = [];
    foreach ($rows as $row) {
        $params = json_decode($row['parameters'], true);
        $presets[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'displayName' => $row['display_name'],
            'variantKey' => $row['variant_key'],
            'unit' => $row['unit'],
            'lengthUnit' => $row['unit'],
            'parameters' => is_array($params) ? $params : [],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    sendJsonResponse($presets);
}

/**
 * Handle POST requests (save or update custom preset)
 */
function handlePostPresets(PDO $pdo): void {
    $data = getJsonInput();
    if (empty($data)) {
        sendJsonResponse('Invalid or empty JSON payload', 400, false);
    }

    $name = isset($data['name']) && trim((string)$data['name']) !== '' ? trim((string)$data['name']) : 'custom-1';
    $rawVariant = (string)($data['variantKey'] ?? 'cz_5');
    $rawUnit = (string)($data['lengthUnit'] ?? $data['unit'] ?? 'inch');
    $variantKey = normalizeVariantKey($rawVariant);
    $unit = normalizeUnit($rawUnit);

    $catTag = formatCategorySizeTag($variantKey);
    $displayName = !empty($data['displayName']) ? (string)$data['displayName'] : "{$name} ({$catTag}, {$unit})";

    $id = isset($data['id']) && trim((string)$data['id']) !== ''
        ? trim((string)$data['id'])
        : ('preset_' . $variantKey . '_' . $unit . '_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid((string)mt_rand(), true)), 0, 4));

    $parameters = isset($data['parameters']) && is_array($data['parameters']) ? $data['parameters'] : [];
    $jsonParams = json_encode($parameters, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $now = date('Y-m-d H:i:s');
    $isoNow = date('c');

    $stmt = $pdo->prepare("
        INSERT INTO custom_presets (id, name, display_name, variant_key, unit, parameters, created_at, updated_at)
        VALUES (:id, :name, :display_name, :variant_key, :unit, :parameters, :created_at, :updated_at)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            display_name = VALUES(display_name),
            variant_key = VALUES(variant_key),
            unit = VALUES(unit),
            parameters = VALUES(parameters),
            updated_at = VALUES(updated_at)
    ");

    $stmt->execute([
        'id' => $id,
        'name' => $name,
        'display_name' => $displayName,
        'variant_key' => $variantKey,
        'unit' => $unit,
        'parameters' => $jsonParams,
        'created_at' => $now,
        'updated_at' => $now
    ]);

    $result = [
        'id' => $id,
        'name' => $name,
        'displayName' => $displayName,
        'variantKey' => $variantKey,
        'unit' => $unit,
        'lengthUnit' => $unit,
        'parameters' => $parameters,
        'createdAt' => $data['createdAt'] ?? $isoNow,
        'updatedAt' => $isoNow
    ];

    sendJsonResponse($result, 200);
}

/**
 * Handle DELETE requests
 */
function handleDeletePresets(PDO $pdo): void {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

    if ($id === '') {
        $input = getJsonInput();
        $id = isset($input['id']) ? trim((string)$input['id']) : '';
    }

    if ($id === '') {
        sendJsonResponse('Missing preset ID to delete', 400, false);
    }

    $stmt = $pdo->prepare("DELETE FROM custom_presets WHERE id = :id");
    $stmt->execute(['id' => $id]);

    sendJsonResponse([
        'deletedId' => $id,
        'affectedRows' => $stmt->rowCount()
    ]);
}
