<?php
/**
 * Estimates REST API Endpoint
 * Handles CRUD operations for BOM calculation snapshots in MySQL.
 */
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';

handleCorsHeaders();

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetEstimates($pdo);
        break;

    case 'POST':
        handlePostEstimates($pdo);
        break;

    case 'DELETE':
        handleDeleteEstimates($pdo);
        break;

    default:
        sendJsonResponse('Method not allowed', 405, false);
        break;
}

/**
 * Handle GET requests (list all or single by ID)
 */
function handleGetEstimates(PDO $pdo): void {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : null;

    if ($id !== null && $id !== '') {
        $stmt = $pdo->prepare("SELECT * FROM estimates WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            sendJsonResponse('Estimate not found', 404, false);
        }

        $estimate = json_decode($row['estimate_data'], true);
        if (!is_array($estimate)) {
            $estimate = [
                'id' => $row['id'],
                'name' => $row['name'],
                'reference' => $row['reference'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }
        sendJsonResponse($estimate);
    }

    // List all estimates sorted by most recently updated
    $stmt = $pdo->query("SELECT * FROM estimates ORDER BY updated_at DESC");
    $rows = $stmt->fetchAll();

    $estimates = [];
    foreach ($rows as $row) {
        $parsed = json_decode($row['estimate_data'], true);
        if (is_array($parsed)) {
            $estimates[] = $parsed;
        } else {
            $estimates[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'reference' => $row['reference'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }
    }

    sendJsonResponse($estimates);
}

/**
 * Handle POST requests (save/update, or duplicate)
 */
function handlePostEstimates(PDO $pdo): void {
    $action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';

    if ($action === 'duplicate') {
        $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
        if ($id === '') {
            $input = getJsonInput();
            $id = isset($input['id']) ? trim((string)$input['id']) : '';
        }

        if ($id === '') {
            sendJsonResponse('Missing ID for duplicate action', 400, false);
        }

        $stmt = $pdo->prepare("SELECT * FROM estimates WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $original = $stmt->fetch();

        if (!$original) {
            sendJsonResponse('Original estimate not found to duplicate', 404, false);
        }

        $parsed = json_decode($original['estimate_data'], true);
        if (!is_array($parsed)) {
            sendJsonResponse('Corrupt original estimate data', 500, false);
        }

        $now = date('Y-m-d H:i:s');
        $isoNow = date('c');
        $newId = 'calc_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid((string)mt_rand(), true)), 0, 6);

        $parsed['id'] = $newId;
        $parsed['name'] = ($parsed['name'] ?? 'Calculation') . ' (Copy)';
        $parsed['createdAt'] = $isoNow;
        $parsed['updatedAt'] = $isoNow;
        $parsed['savedAt'] = $isoNow;

        $insertStmt = $pdo->prepare("
            INSERT INTO estimates (id, name, reference, item_count, total_quantity, total_estimated_cost, cost_per_zipper, estimate_data, created_at, updated_at)
            VALUES (:id, :name, :reference, :item_count, :total_quantity, :total_estimated_cost, :cost_per_zipper, :estimate_data, :created_at, :updated_at)
        ");

        $insertStmt->execute([
            'id' => $newId,
            'name' => $parsed['name'],
            'reference' => $parsed['reference'] ?? null,
            'item_count' => (int)$original['item_count'],
            'total_quantity' => (float)$original['total_quantity'],
            'total_estimated_cost' => (float)$original['total_estimated_cost'],
            'cost_per_zipper' => (float)$original['cost_per_zipper'],
            'estimate_data' => json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'created_at' => $now,
            'updated_at' => $now
        ]);

        sendJsonResponse($parsed, 201);
    }

    // Standard Save / Update
    $data = getJsonInput();
    if (empty($data)) {
        sendJsonResponse('Invalid or empty JSON payload', 400, false);
    }

    $id = isset($data['id']) && trim((string)$data['id']) !== ''
        ? trim((string)$data['id'])
        : ('calc_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid((string)mt_rand(), true)), 0, 6));

    $data['id'] = $id;
    $now = date('Y-m-d H:i:s');
    $isoNow = date('c');

    if (empty($data['createdAt'])) {
        $data['createdAt'] = $isoNow;
    }
    $data['updatedAt'] = $isoNow;
    $data['savedAt'] = $data['savedAt'] ?? $isoNow;

    $name = isset($data['name']) && trim((string)$data['name']) !== '' ? trim((string)$data['name']) : 'Untitled Calculation';
    $reference = isset($data['reference']) && trim((string)$data['reference']) !== '' ? trim((string)$data['reference']) : null;

    // Calculate metadata summary for indexed columns
    $itemCount = 1;
    $totalQty = 0.0;
    if (isset($data['items']) && is_array($data['items'])) {
        $itemCount = max(1, count($data['items']));
        foreach ($data['items'] as $it) {
            $totalQty += isset($it['quantity']) ? (float)$it['quantity'] : 0.0;
        }
    } elseif (isset($data['categoryGroups']) && is_array($data['categoryGroups'])) {
        $itemCount = max(1, count($data['categoryGroups']));
        foreach ($data['categoryGroups'] as $g) {
            if (isset($g['variants']) && is_array($g['variants'])) {
                foreach ($g['variants'] as $v) {
                    $totalQty += isset($v['quantity']) ? (float)$v['quantity'] : 0.0;
                }
            }
        }
    }

    $totalCost = 0.0;
    $costPerZipper = 0.0;
    if (isset($data['calculationSnapshot']) && is_array($data['calculationSnapshot'])) {
        $snap = $data['calculationSnapshot'];
        if (isset($snap['totalOrderQuantity']) && (float)$snap['totalOrderQuantity'] > 0) {
            $totalQty = (float)$snap['totalOrderQuantity'];
        }
        $totalCost = isset($snap['totalEstimatedCost']) ? (float)$snap['totalEstimatedCost'] : 0.0;
        $costPerZipper = isset($snap['costPerZipper']) ? (float)$snap['costPerZipper'] : 0.0;
    }

    $jsonPayload = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $stmt = $pdo->prepare("
        INSERT INTO estimates (id, name, reference, item_count, total_quantity, total_estimated_cost, cost_per_zipper, estimate_data, created_at, updated_at)
        VALUES (:id, :name, :reference, :item_count, :total_quantity, :total_estimated_cost, :cost_per_zipper, :estimate_data, :created_at, :updated_at)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            reference = VALUES(reference),
            item_count = VALUES(item_count),
            total_quantity = VALUES(total_quantity),
            total_estimated_cost = VALUES(total_estimated_cost),
            cost_per_zipper = VALUES(cost_per_zipper),
            estimate_data = VALUES(estimate_data),
            updated_at = VALUES(updated_at)
    ");

    $stmt->execute([
        'id' => $id,
        'name' => $name,
        'reference' => $reference,
        'item_count' => $itemCount,
        'total_quantity' => $totalQty,
        'total_estimated_cost' => $totalCost,
        'cost_per_zipper' => $costPerZipper,
        'estimate_data' => $jsonPayload,
        'created_at' => $now,
        'updated_at' => $now
    ]);

    sendJsonResponse($data, 200);
}

/**
 * Handle DELETE requests
 */
function handleDeleteEstimates(PDO $pdo): void {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

    if ($id === '') {
        $input = getJsonInput();
        $id = isset($input['id']) ? trim((string)$input['id']) : '';
    }

    if ($id === '') {
        sendJsonResponse('Missing ID to delete', 400, false);
    }

    $stmt = $pdo->prepare("DELETE FROM estimates WHERE id = :id");
    $stmt->execute(['id' => $id]);

    sendJsonResponse([
        'deletedId' => $id,
        'affectedRows' => $stmt->rowCount()
    ]);
}
