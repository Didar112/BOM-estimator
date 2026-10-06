<?php
/**
 * Database Connection Configuration
 * Supports environment variables for Docker deployment with fallback to local defaults.
 */
declare(strict_types=1);

class Database {
    private static ?PDO $pdo = null;

    /**
     * Get or initialize the PDO MySQL connection
     * @return PDO
     */
    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $db   = getenv('DB_NAME') ?: 'bom_estimator';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') ?: '';
            $charset = 'utf8mb4';

            $explicitPort = getenv('DB_PORT');
            $candidatePorts = $explicitPort ? [(string)$explicitPort] : ['3306', '3307', '3308'];
            $lastException = null;

            foreach ($candidatePorts as $port) {
                $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_TIMEOUT            => 2,
                ];

                try {
                    self::$pdo = new PDO($dsn, $user, $pass, $options);
                    return self::$pdo;
                } catch (PDOException $e) {
                    $lastException = $e;
                }
            }

            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                header('Access-Control-Allow-Origin: *');
            }
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed: ' . ($lastException ? $lastException->getMessage() : 'Unknown error')
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        return self::$pdo;
    }
}
