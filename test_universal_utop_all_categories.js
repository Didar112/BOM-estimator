/**
 * Comprehensive Verification Suite: Universal U-Top Across All Zipper Categories
 * 
 * Verifies that U-Top is applicable to all zipper categories (CZ, MZ, PZ) and all sizes,
 * keeping the exact calculation formula as in CZ#5:
 *   - Normal order: 2 pcs per zipper (orderQuantity * 2)
 *   - Special order (isSpecialUTopOrder = true): 1 pc per zipper (orderQuantity * 1)
 *   - Unit: Pcs, Unit Price: 350.00 BDT
 *   - Calculation Detail & Step-by-Step explanation
 *   - Excluded from non-zipper categories (WIRE)
 *   - Full integration with calculateFullEstimate, BOM Rules, Storage, and UI Previews
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = {
  CalculatorEngine: null,
  BOMRules: null,
  CZFormulaEngine: null,
  MZFormulaEngine: null,
  PZFormulaEngine: null,
  WireFormulaEngine: null
};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

require('./js/unitConversion.js');
const czEngine = require('./js/formulas/cz.js');
const mzEngine = require('./js/formulas/mz.js');
const pzEngine = require('./js/formulas/pz.js');
const wireEngine = require('./js/formulas/wire.js');
const materials = require('./js/materials.js');
const bomRules = require('./js/bomRules.js');
const calculations = require('./js/calculations.js');
const storage = require('./js/storage.js');

global.window.CalculatorEngine = calculations;
global.window.BOMRules = bomRules;
global.window.CZFormulaEngine = czEngine;
global.window.MZFormulaEngine = mzEngine;
global.window.PZFormulaEngine = pzEngine;
global.window.WireFormulaEngine = wireEngine;

const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
const funcExtractor = new Function('escapeHtml', `
  ${appJsSource}
  return { buildCategoryGroupHTML, getCategoryParamPreviewData };
`);
const mockEscape = (s) => String(s || '');
const { buildCategoryGroupHTML, getCategoryParamPreviewData } = funcExtractor(mockEscape);

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`  ✓ PASS: ${message} (Got: ${actual})`);
  } else {
    console.error(`  ✗ FAIL: ${message} (Expected: ${expected}, Got: ${actual})`);
  }
}

console.log('===============================================================');
console.log('UNIVERSAL U-TOP VERIFICATION ACROSS ALL ZIPPER CATEGORIES');
console.log('===============================================================');

// --- 1. NYLON / COIL ZIPPER (CZ) ---
console.log('\n--- 1. Testing Nylon Zipper (CZ#3 & CZ#5) ---');

// CZ#3 Normal
const cz3Normal = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 12, lengthUnit: 'inch', quantity: 500 }],
  '#3',
  3.0,
  null,
  { isSpecialUTopOrder: false }
);
assertEquals(cz3Normal.uTopQty, 1000, 'CZ#3 Normal (500 pcs) -> 1,000 pcs U-Top');
assertEquals(cz3Normal.uTopMultiplier, 2, 'CZ#3 Normal multiplier is 2');
const cz3BOMNormal = czEngine.buildCZConsolidatedBOMRows(cz3Normal);
const cz3UTopRow = cz3BOMNormal.find(r => r.component === 'U-TOP');
assert(cz3UTopRow !== undefined, 'CZ#3 BOM contains U-TOP row');
assertEquals(cz3UTopRow.materialName, 'U-Top (CZ#3)', 'CZ#3 Material Name is U-Top (CZ#3)');
assertEquals(cz3UTopRow.unit, 'Pcs', 'CZ#3 BOM unit is Pcs');
assertEquals(cz3UTopRow.unitPrice, 350.00, 'CZ#3 Unit Price is 350.00 BDT');

// CZ#3 Special
const cz3Special = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 12, lengthUnit: 'inch', quantity: 500 }],
  '#3',
  3.0,
  null,
  { isSpecialUTopOrder: true }
);
assertEquals(cz3Special.uTopQty, 500, 'CZ#3 Special (500 pcs) -> 500 pcs U-Top');
assertEquals(cz3Special.uTopMultiplier, 1, 'CZ#3 Special multiplier is 1');

// CZ#5 Normal & Special
const cz5Normal = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 1500 }],
  '#5',
  3.0,
  null,
  { isSpecialUTopOrder: false }
);
assertEquals(cz5Normal.uTopQty, 3000, 'CZ#5 Normal (1500 pcs) -> 3,000 pcs U-Top');
const cz5Special = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 1500 }],
  '#5',
  3.0,
  null,
  { isSpecialUTopOrder: true }
);
assertEquals(cz5Special.uTopQty, 1500, 'CZ#5 Special (1500 pcs) -> 1,500 pcs U-Top');


// --- 2. METAL ZIPPER (MZ) ---
console.log('\n--- 2. Testing Metal Zipper (MZ#3 & MZ#5) ---');

// MZ#3 Normal
const mz3Normal = mzEngine.calculateMZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 8, lengthUnit: 'inch', quantity: 600 }],
  '#3',
  3.0,
  null,
  { isSpecialUTopOrder: false }
);
assertEquals(mz3Normal.uTopQty, 1200, 'MZ#3 Normal (600 pcs) -> 1,200 pcs U-Top');
assertEquals(mz3Normal.uTopMultiplier, 2, 'MZ#3 Normal multiplier is 2');

// MZ#3 Special
const mz3Special = mzEngine.calculateMZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 8, lengthUnit: 'inch', quantity: 600 }],
  '#3',
  3.0,
  null,
  { isSpecialUTopOrder: true }
);
assertEquals(mz3Special.uTopQty, 600, 'MZ#3 Special (600 pcs) -> 600 pcs U-Top');
assertEquals(mz3Special.uTopMultiplier, 1, 'MZ#3 Special multiplier is 1');

// MZ#5 Master Normal & Special
const mz5MasterNormal = mzEngine.calculateMZMaster(
  [{ id: 'v1', zipperSize: '#5', length: 14, lengthUnit: 'inch', quantity: 2000 }],
  { isSpecialUTopOrder: false }
);
const mz5UTopRowNormal = mz5MasterNormal.materials.processedRows.find(r => r.component === 'U-TOP');
assert(mz5UTopRowNormal !== undefined, 'MZ#5 Master BOM contains U-TOP row');
assertEquals(mz5UTopRowNormal.totalQuantity, 4000, 'MZ#5 Master Normal (2,000 pcs) -> 4,000 pcs U-Top');
assertEquals(mz5UTopRowNormal.unit, 'Pcs', 'MZ#5 BOM unit is Pcs');
assertEquals(mz5UTopRowNormal.unitPrice, 350.00, 'MZ#5 Unit price is 350.00 BDT');
assert(mz5UTopRowNormal.calculationDetail !== undefined, 'MZ#5 U-Top has calculationDetail');
assert(mz5UTopRowNormal.calculationDetail.baseFormula.includes('MZ#5 Order Quantity: 2,000 pcs'), 'MZ#5 calculationDetail includes order quantity');
assert(mz5UTopRowNormal.calculationDetail.baseFormula.includes('Required U-Top Quantity: 2,000 × 2 = 4,000 pcs'), 'MZ#5 calculationDetail includes required quantity');

const mz5MasterSpecial = mzEngine.calculateMZMaster(
  [{ id: 'v1', zipperSize: '#5', length: 14, lengthUnit: 'inch', quantity: 2000 }],
  { isSpecialUTopOrder: true }
);
const mz5UTopRowSpecial = mz5MasterSpecial.materials.processedRows.find(r => r.component === 'U-TOP');
assertEquals(mz5UTopRowSpecial.totalQuantity, 2000, 'MZ#5 Master Special (2,000 pcs) -> 2,000 pcs U-Top');


// --- 3. PLASTIC / MOLDED ZIPPER (PZ) ---
console.log('\n--- 3. Testing Plastic / Molded Zipper (PZ#3, PZ#5, PZ#8) ---');

// PZ#3 Normal & Special
const pz3Normal = pzEngine.calculatePZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 20, lengthUnit: 'inch', quantity: 800 }],
  '#3',
  3.0,
  null,
  { isSpecialUTopOrder: false }
);
assertEquals(pz3Normal.uTopQty, 1600, 'PZ#3 Normal (800 pcs) -> 1,600 pcs U-Top');

const pz3Special = pzEngine.calculatePZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 20, lengthUnit: 'inch', quantity: 800 }],
  '#3',
  3.0,
  null,
  { isSpecialUTopOrder: true }
);
assertEquals(pz3Special.uTopQty, 800, 'PZ#3 Special (800 pcs) -> 800 pcs U-Top');

// PZ#5 Master Normal & Special
const pz5MasterNormal = pzEngine.calculatePZMaster(
  [{ id: 'v1', zipperSize: '#5', length: 24, lengthUnit: 'inch', quantity: 1200 }],
  { isSpecialUTopOrder: false }
);
const pz5UTopRowNormal = pz5MasterNormal.materials.processedRows.find(r => r.component === 'U-TOP');
assert(pz5UTopRowNormal !== undefined, 'PZ#5 Master BOM contains U-TOP row');
assertEquals(pz5UTopRowNormal.totalQuantity, 2400, 'PZ#5 Master Normal (1,200 pcs) -> 2,400 pcs U-Top');
assertEquals(pz5UTopRowNormal.unit, 'Pcs', 'PZ#5 BOM unit is Pcs');
assertEquals(pz5UTopRowNormal.unitPrice, 350.00, 'PZ#5 Unit price is 350.00 BDT');
assert(pz5UTopRowNormal.calculationDetail !== undefined, 'PZ#5 U-Top has calculationDetail');

const pz5MasterSpecial = pzEngine.calculatePZMaster(
  [{ id: 'v1', zipperSize: '#5', length: 24, lengthUnit: 'inch', quantity: 1200 }],
  { isSpecialUTopOrder: true }
);
const pz5UTopRowSpecial = pz5MasterSpecial.materials.processedRows.find(r => r.component === 'U-TOP');
assertEquals(pz5UTopRowSpecial.totalQuantity, 1200, 'PZ#5 Master Special (1,200 pcs) -> 1,200 pcs U-Top');

// PZ#8 Master Normal
const pz8MasterNormal = pzEngine.calculatePZMaster(
  [{ id: 'v1', zipperSize: '#8', length: 30, lengthUnit: 'inch', quantity: 500 }],
  { isSpecialUTopOrder: false }
);
const pz8UTopRowNormal = pz8MasterNormal.materials.processedRows.find(r => r.component === 'U-TOP');
assert(pz8UTopRowNormal !== undefined, 'PZ#8 Master BOM contains U-TOP row');
assertEquals(pz8UTopRowNormal.totalQuantity, 1000, 'PZ#8 Master Normal (500 pcs) -> 1,000 pcs U-Top');


// --- 4. NON-ZIPPER CATEGORY (WIRE) ---
console.log('\n--- 4. Testing Non-Zipper Category (WIRE) ---');
const wireMaster = wireEngine.calculateWireMaster([
  { id: 'w1', zipperSize: '#5_normal', length: 15, lengthUnit: 'inch', quantity: 2000 }
]);
const wireUTopRow = wireMaster.materials.processedRows.find(r => r.component === 'U-TOP' || (r.materialName && r.materialName.toLowerCase().includes('u-top')));
assert(wireUTopRow === undefined, 'WIRE Master BOM does NOT contain U-Top');


// --- 5. MULTI-CATEGORY FULL ESTIMATE INTEGRATION ---
console.log('\n--- 5. Testing Multi-Category Estimate Integration (calculateFullEstimate) ---');
const multiEstimate = {
  id: 'est_multi_utop',
  categoryGroups: [
    {
      id: 'g_cz',
      name: 'CZ Group',
      category: 'cz',
      isSpecialUTopOrder: false,
      variants: [{ id: 'v_cz', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 1000 }]
    },
    {
      id: 'g_mz',
      name: 'MZ Group',
      category: 'mz',
      isSpecialUTopOrder: true,
      variants: [{ id: 'v_mz', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 1500 }]
    },
    {
      id: 'g_pz',
      name: 'PZ Group',
      category: 'pz',
      isSpecialUTopOrder: false,
      variants: [{ id: 'v_pz', zipperSize: '#5', length: 20, lengthUnit: 'inch', quantity: 2000 }]
    },
    {
      id: 'g_wire',
      name: 'Wire Group',
      category: 'wire',
      variants: [{ id: 'v_wire', zipperSize: '#5_normal', length: 10, lengthUnit: 'inch', quantity: 1000 }]
    }
  ]
};

const fullCalcResult = calculations.calculateFullEstimate(multiEstimate);
assert(fullCalcResult !== null, 'calculateFullEstimate succeeded');

// Group 1 CZ#3: 1,000 pcs * 2 = 2,000 pcs @ 4% loss = 2,080 pcs
const czGroupRow = fullCalcResult.categoryGroups[0].calculation.materials.processedRows.find(r => r.component === 'U-TOP');
assertEquals(Math.round(czGroupRow.totalQuantity), 2080, 'Group 1 (CZ#3 Normal) U-Top = 2,080 pcs (2,000 + 4% loss)');

// Group 2 MZ#5: 1,500 pcs * 1 = 1,500 pcs @ 4% loss = 1,560 pcs (Special)
const mzGroupRow = fullCalcResult.categoryGroups[1].calculation.materials.processedRows.find(r => r.component === 'U-TOP');
assertEquals(Math.round(mzGroupRow.totalQuantity), 1560, 'Group 2 (MZ#5 Special) U-Top = 1,560 pcs (1,500 + 4% loss)');

// Group 3 PZ#5: 2,000 pcs * 2 = 4,000 pcs @ 4% loss = 4,160 pcs (Normal)
const pzGroupRow = fullCalcResult.categoryGroups[2].calculation.materials.processedRows.find(r => r.component === 'U-TOP');
assertEquals(Math.round(pzGroupRow.totalQuantity), 4160, 'Group 3 (PZ#5 Normal) U-Top = 4,160 pcs (4,000 + 4% loss)');

// Group 4 WIRE: NO U-Top
const wireGroupRow = fullCalcResult.categoryGroups[3].calculation.materials.processedRows.find(r => r.component === 'U-TOP');
assert(wireGroupRow === undefined, 'Group 4 (WIRE) has NO U-Top');

// Aggregated Materials: Common items across all different zipper categories (U-Top) are calculated and displayed together in a single row
const allAggUTopRows = fullCalcResult.aggregatedMaterials.processedRows.filter(r => r.component === 'U-TOP');
assert(allAggUTopRows.length === 1, 'Aggregated BOM contains exactly 1 consolidated U-TOP row across all zipper categories');

const mergedUTopRow = allAggUTopRows[0];
assertEquals(Math.round(mergedUTopRow.totalQuantity), 7800, 'Consolidated U-Top BOM quantity = 7,800 pcs (2,080 + 1,560 + 4,160)');
assertEquals(mergedUTopRow.unit, 'Pcs', 'Consolidated U-Top unit is Pcs');
assert(mergedUTopRow.groupNames.length === 3, 'Merged across 3 category groups');
assert(mergedUTopRow.usedInCategories.length === 3, 'Merged across CZ, MZ, PZ categories');
assertEquals(mergedUTopRow.contributingSources.length, 3, 'Merged U-Top row has 3 contributing sources');

const czSrc = mergedUTopRow.contributingSources.find(s => s.groupCategory === 'cz');
assert(czSrc !== undefined, 'Contributing sources contains CZ');
assertEquals(Math.round(czSrc.quantity), 2080, 'CZ contributing source quantity is 2,080 pcs');

const mzSrc = mergedUTopRow.contributingSources.find(s => s.groupCategory === 'mz');
assert(mzSrc !== undefined, 'Contributing sources contains MZ');
assertEquals(Math.round(mzSrc.quantity), 1560, 'MZ contributing source quantity is 1,560 pcs');

const pzSrc = mergedUTopRow.contributingSources.find(s => s.groupCategory === 'pz');
assert(pzSrc !== undefined, 'Contributing sources contains PZ');
assertEquals(Math.round(pzSrc.quantity), 4160, 'PZ contributing source quantity is 4,160 pcs');

// Verify identical category/size groups merge together in aggregatedMaterials
const sameCatEstimate = {
  id: 'est_same_cat',
  categoryGroups: [
    {
      id: 'g1',
      category: 'mz',
      isSpecialUTopOrder: false,
      variants: [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1000 }]
    },
    {
      id: 'g2',
      category: 'mz',
      isSpecialUTopOrder: true,
      variants: [{ id: 'v2', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 1000 }]
    }
  ]
};
const sameCatResult = calculations.calculateFullEstimate(sameCatEstimate);
const mergedMzUTopRow = sameCatResult.aggregatedMaterials.processedRows.find(r => r.materialId === 'mat_mz_utop_5');
assert(mergedMzUTopRow !== undefined, 'Same category/size MZ#5 U-Top merges into single row');
assertEquals(Math.round(mergedMzUTopRow.totalQuantity), 3120, 'Merged MZ#5 U-Top quantity = 3,120 pcs (2,080 Normal + 1,040 Special)');


// --- 6. UI HTML GENERATION & PARAMETER PREVIEWS ---
console.log('\n--- 6. Testing UI HTML & Parameter Previews ---');

// Check CZ UI
const czHtml = buildCategoryGroupHTML({
  id: 'g_cz_ui',
  name: 'CZ Group',
  category: 'cz',
  variants: [{ id: 'v1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 1000 }]
}, 0, 1);
assert(czHtml.includes('input-cz-utop-special') || czHtml.includes('input-utop-special'), 'CZ UI renders U-Top checkbox input');
assert(czHtml.includes('preview-cz-utop-g_cz_ui'), 'CZ UI renders preview-cz-utop badge');

// Check MZ UI
const mzHtml = buildCategoryGroupHTML({
  id: 'g_mz_ui',
  name: 'MZ Group',
  category: 'mz',
  variants: [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1000 }]
}, 0, 1);
assert(mzHtml.includes('input-mz-utop-special') || mzHtml.includes('input-utop-special'), 'MZ UI renders U-Top checkbox input');
assert(mzHtml.includes('preview-mz-utop-g_mz_ui'), 'MZ UI renders preview-mz-utop badge');

// Check PZ UI
const pzHtml = buildCategoryGroupHTML({
  id: 'g_pz_ui',
  name: 'PZ Group',
  category: 'pz',
  variants: [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1000 }]
}, 0, 1);
assert(pzHtml.includes('input-pz-utop-special') || pzHtml.includes('input-utop-special'), 'PZ UI renders U-Top checkbox input');
assert(pzHtml.includes('preview-pz-utop-g_pz_ui'), 'PZ UI renders preview-pz-utop badge');

// Check WIRE UI (must NOT render U-Top)
const wireHtml = buildCategoryGroupHTML({
  id: 'g_wire_ui',
  name: 'WIRE Group',
  category: 'wire',
  variants: [{ id: 'v1', zipperSize: '#5_normal', length: 10, lengthUnit: 'inch', quantity: 1000 }]
}, 0, 1);
assert(!wireHtml.includes('utop-special'), 'WIRE UI does NOT render U-Top checkbox');

// Check Previews Data
const czPreviewData = getCategoryParamPreviewData({
  id: 'g_cz_p',
  category: 'cz',
  variants: [{ id: 'v1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 1000 }]
});
assertEquals(czPreviewData.czUTop, 'U-Top: 2,080 Pcs', 'CZ Preview computes "U-Top: 2,080 Pcs"');

const mzPreviewData = getCategoryParamPreviewData({
  id: 'g_mz_p',
  category: 'mz',
  variants: [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1000 }]
});
assertEquals(mzPreviewData.mzUTop, 'U-Top: 2,080 Pcs', 'MZ Preview computes "U-Top: 2,080 Pcs"');

const pzPreviewData = getCategoryParamPreviewData({
  id: 'g_pz_p',
  category: 'pz',
  variants: [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1000 }]
});
assertEquals(pzPreviewData.pzUTop, 'U-Top: 2,080 Pcs', 'PZ Preview computes "U-Top: 2,080 Pcs"');

// --- 7. SUGGESTED BOM RECIPE RULES ---
console.log('\n--- 7. Testing Suggested BOM Recipe Rules (bomRules.js) ---');
const czSuggested = bomRules.generateSuggestedBOM({ zipperSize: '#3' }, 'cz');
assert(czSuggested.some(r => r.component === 'U-TOP'), 'CZ#3 suggested BOM includes U-TOP');

const mz3Suggested = bomRules.generateSuggestedBOM({ zipperSize: '#3' }, 'mz');
assert(mz3Suggested.some(r => r.component === 'U-TOP'), 'MZ#3 suggested BOM includes U-TOP');

const mz5Suggested = bomRules.generateSuggestedBOM({ zipperSize: '#5' }, 'mz');
assert(mz5Suggested.some(r => r.component === 'U-TOP'), 'MZ#5 suggested BOM includes U-TOP');

const pzSuggested = bomRules.generateSuggestedBOM({ zipperSize: '#5' }, 'pz');
assert(pzSuggested.some(r => r.component === 'U-TOP'), 'PZ#5 suggested BOM includes U-TOP');

const wireSuggested = bomRules.generateSuggestedBOM({ zipperSize: '#5_normal' }, 'wire');
assert(!wireSuggested.some(r => r.component === 'U-TOP'), 'WIRE suggested BOM does NOT include U-TOP');


console.log('\n===============================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('===============================================================');

if (totalTests === passedTests) {
  console.log('ALL UNIVERSAL U-TOP VERIFICATION CHECKS PASSED (100% SUCCESS)!');
} else {
  process.exit(1);
}
