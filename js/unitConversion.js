/**
 * Unit Conversion Engine for Zipper BOM Calculator
 * Handles Length, Weight, and Quantity unit conversions with numerical precision.
 */

// Length conversions based on millimeters (mm) as base unit
const LENGTH_CONVERSIONS_TO_MM = {
  mm: 1,
  cm: 10,
  in: 25.4,
  inch: 25.4,
  inches: 25.4,
  ft: 304.8,
  foot: 304.8,
  feet: 304.8,
  m: 1000,
  meter: 1000,
  meters: 1000,
  yd: 914.4,
  yard: 914.4,
  yards: 914.4
};

// Weight conversions based on grams (g) as base unit
const WEIGHT_CONVERSIONS_TO_G = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000
};

// Quantity conversions based on pieces (pcs) as base unit
const QUANTITY_CONVERSIONS_TO_PCS = {
  pcs: 1,
  pc: 1,
  piece: 1,
  pieces: 1,
  pair: 2,
  pairs: 2,
  doz: 12,
  dozen: 12,
  dozens: 12,
  gross: 144,
  set: 1,
  sets: 1,
  bundle: 1
};

/**
 * Normalize unit string (lowercase, trimmed)
 * @param {string} unit 
 * @returns {string}
 */
function normalizeUnit(unit) {
  if (!unit) return '';
  return String(unit).toLowerCase().trim();
}

/**
 * Identify unit category: 'length' | 'weight' | 'quantity' | 'unknown'
 * @param {string} unit 
 * @returns {string}
 */
function getUnitCategory(unit) {
  const norm = normalizeUnit(unit);
  if (LENGTH_CONVERSIONS_TO_MM[norm] !== undefined) return 'length';
  if (WEIGHT_CONVERSIONS_TO_G[norm] !== undefined) return 'weight';
  if (QUANTITY_CONVERSIONS_TO_PCS[norm] !== undefined) return 'quantity';
  return 'unknown';
}

/**
 * Check if two units belong to the same dimension and are convertible
 * @param {string} fromUnit 
 * @param {string} toUnit 
 * @returns {boolean}
 */
function areUnitsCompatible(fromUnit, toUnit) {
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);
  if (normFrom === normTo) return true;
  
  const catFrom = getUnitCategory(normFrom);
  const catTo = getUnitCategory(normTo);
  
  return catFrom !== 'unknown' && catFrom === catTo;
}

/**
 * Convert length value from one unit to another
 * @param {number} value 
 * @param {string} fromUnit 
 * @param {string} toUnit 
 * @returns {number}
 */
function convertLength(value, fromUnit, toUnit) {
  const val = Number(value);
  if (isNaN(val)) return 0;
  
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);
  
  if (normFrom === normTo) return val;
  
  const factorFrom = LENGTH_CONVERSIONS_TO_MM[normFrom];
  const factorTo = LENGTH_CONVERSIONS_TO_MM[normTo];
  
  if (!factorFrom || !factorTo) {
    console.warn(`Cannot convert length from "${fromUnit}" to "${toUnit}". Returning original value.`);
    return val;
  }
  
  // Convert from source unit to base (mm), then from base to target unit
  const inMm = val * factorFrom;
  return inMm / factorTo;
}

/**
 * Convert weight value from one unit to another
 * @param {number} value 
 * @param {string} fromUnit 
 * @param {string} toUnit 
 * @returns {number}
 */
function convertWeight(value, fromUnit, toUnit) {
  const val = Number(value);
  if (isNaN(val)) return 0;
  
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);
  
  if (normFrom === normTo) return val;
  
  const factorFrom = WEIGHT_CONVERSIONS_TO_G[normFrom];
  const factorTo = WEIGHT_CONVERSIONS_TO_G[normTo];
  
  if (!factorFrom || !factorTo) {
    console.warn(`Cannot convert weight from "${fromUnit}" to "${toUnit}". Returning original value.`);
    return val;
  }
  
  const inG = val * factorFrom;
  return inG / factorTo;
}

/**
 * Convert quantity value from one unit to another
 * @param {number} value 
 * @param {string} fromUnit 
 * @param {string} toUnit 
 * @returns {number}
 */
function convertQuantity(value, fromUnit, toUnit) {
  const val = Number(value);
  if (isNaN(val)) return 0;
  
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);
  
  if (normFrom === normTo) return val;
  
  const factorFrom = QUANTITY_CONVERSIONS_TO_PCS[normFrom];
  const factorTo = QUANTITY_CONVERSIONS_TO_PCS[normTo];
  
  if (!factorFrom || !factorTo) {
    console.warn(`Cannot convert quantity from "${fromUnit}" to "${toUnit}". Returning original value.`);
    return val;
  }
  
  const inPcs = val * factorFrom;
  return inPcs / factorTo;
}

/**
 * Universal unit converter with automatic category detection
 * @param {number} value 
 * @param {string} fromUnit 
 * @param {string} toUnit 
 * @returns {number}
 */
function convertUnit(value, fromUnit, toUnit) {
  const val = Number(value);
  if (isNaN(val)) return 0;
  
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);
  
  if (normFrom === normTo) return val;
  
  const cat = getUnitCategory(normFrom);
  
  if (cat === 'length') {
    return convertLength(val, normFrom, normTo);
  } else if (cat === 'weight') {
    return convertWeight(val, normFrom, normTo);
  } else if (cat === 'quantity') {
    return convertQuantity(val, normFrom, normTo);
  }
  
  return val;
}

/**
 * Format a unit display label nicely (e.g. 'in' -> 'inch', 'yd' -> 'yd', 'pcs' -> 'pcs')
 * @param {string} unit 
 * @returns {string}
 */
function formatUnitLabel(unit) {
  const norm = normalizeUnit(unit);
  const map = {
    mm: 'mm',
    cm: 'cm',
    in: 'inch',
    inch: 'inch',
    ft: 'ft',
    m: 'meter',
    yd: 'yard',
    g: 'g',
    kg: 'kg',
    pcs: 'pcs',
    pc: 'pcs',
    doz: 'doz',
    pair: 'pair',
    set: 'set'
  };
  return map[norm] || unit || '';
}

// Export functions for ES modules or attach to global window
if (typeof window !== 'undefined') {
  window.UnitConversion = {
    convertLength,
    convertWeight,
    convertQuantity,
    convertUnit,
    getUnitCategory,
    areUnitsCompatible,
    formatUnitLabel,
    normalizeUnit
  };
}
