-- ==========================================================
-- Zipper BOM Estimator - MySQL Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `bom_estimator`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `bom_estimator`;

-- ==========================================================
-- 1. Estimates Table
-- Stores complete multi-variant BOM calculation snapshots
-- High-frequency query columns are indexed for fast searching
-- ==========================================================
CREATE TABLE IF NOT EXISTS `estimates` (
    `id` VARCHAR(64) NOT NULL COMMENT 'Unique calculation ID (e.g. calc_1774691234567_a8b9c2)',
    `name` VARCHAR(255) NOT NULL DEFAULT 'Untitled Calculation',
    `reference` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Order or reference number',
    `item_count` INT UNSIGNED NOT NULL DEFAULT 1,
    `total_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total_estimated_cost` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
    `cost_per_zipper` DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    `estimate_data` LONGTEXT NOT NULL COMMENT 'Complete normalized JSON snapshot (items, categoryGroups, labor, overhead, etc.)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_estimates_updated_at` (`updated_at` DESC),
    INDEX `idx_estimates_ref` (`reference`),
    INDEX `idx_estimates_name` (`name`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 2. Custom Parameter Presets Table
-- Stores machine calibration and divisor overrides scoped by
-- zipper variant (mz_3, cz_5, wire_5_long, pz_8) and unit (inch, cm)
-- ==========================================================
CREATE TABLE IF NOT EXISTS `custom_presets` (
    `id` VARCHAR(64) NOT NULL COMMENT 'Preset ID (e.g. preset_mz_3_inch_1774691234_abc1)',
    `name` VARCHAR(100) NOT NULL COMMENT 'User-assigned preset name (e.g. custom-1)',
    `display_name` VARCHAR(150) NOT NULL COMMENT 'Formatted display label (e.g. custom-1 (mz#3, inch))',
    `variant_key` VARCHAR(32) NOT NULL COMMENT 'Target variant (e.g. mz_3, cz_5, wire_5_long, pz_8)',
    `unit` ENUM('inch', 'cm') NOT NULL DEFAULT 'inch',
    `parameters` TEXT NOT NULL COMMENT 'JSON key-value map of static parameter overrides',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_presets_scope` (`variant_key`, `unit`),
    INDEX `idx_presets_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
