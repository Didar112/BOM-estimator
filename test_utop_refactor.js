/**
 * Test Suite: U-Top Refactor for CZ#5
 * 
 * Verifies:
 * 1. Test 1: Normal CZ#5 (100 pcs, Checkbox OFF) -> 200 pcs U-Top
 * 2. Test 2: Special CZ#5 (100 pcs, Checkbox ON) -> 100 pcs U-Top
 * 3. Test 3: Large Normal CZ#5 (2500 pcs, Checkbox OFF) -> 5000 pcs U-Top
 * 4. Test 4: Large Special CZ#5 (2500 pcs, Checkbox ON) -> 2500 pcs U-Top
 * 5. Edge cases: Qty = 0 -> 0 pcs U-Top
 * 6. Exclusivity: CZ#3, MZ, PZ, Wire have NO U-Top
 * 7. BOM Output: Unit is 'Pcs', Component is 'U-TOP', Material is 'U-Top (CZ#5)'
 * 8. Calculation Details: Multipliers 2 vs 1, no '0.074', no 'Ultrasonic' in material name
 * 9. Persistence: isSpecialUTopOrder persists in category groups
 * 10. No mixing with loss systems (tape loss, slider add %, pin box loss, etc.)
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

require('./js/unitConversion.js');
const czEngine = require('./js/formulas/cz.js');
const mzEngine = require('./js/formulas/mz.js');
const wireEngine = require('./js/formulas/wire.js');
const materials = require('./js/materials.js');
const bomRules = require('./js/bomRules.js');
const calculations = require('./js/calculations.js');
const storage = require('./js/storage.js');

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

console.log('====================================================');
console.log('U-TOP REFACTOR VERIFICATION SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// SECTION 1: MANDATORY USER ACCEPTANCE TESTS (1-4)
// ----------------------------------------------------
console.log('--- SECTION 1: Mandatory Acceptance Tests (Tests 1-4) ---');

// Test 1 — Normal CZ#5 order: Qty = 100, Checkbox = OFF -> 200 pcs
const test1Res = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 100 }],
  '#5',
  3.0,
  1.5,
  { isSpecialUTopOrder: false }
);
assertEquals(test1Res.uTopQty, 200, 'Test 1: CZ#5 Qty=100, Checkbox=OFF -> 200 pcs U-Top');
assertEquals(test1Res.uTopMultiplier, 2, 'Test 1: Multiplier is 2');

// Test 2 — Special CZ#5 order: Qty = 100, Checkbox = ON -> 100 pcs
const test2Res = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 100 }],
  '#5',
  3.0,
  1.5,
  { isSpecialUTopOrder: true }
);
assertEquals(test2Res.uTopQty, 100, 'Test 2: CZ#5 Qty=100, Checkbox=ON -> 100 pcs U-Top');
assertEquals(test2Res.uTopMultiplier, 1, 'Test 2: Multiplier is 1');

// Test 3 — Larger normal order: Qty = 2500, Checkbox = OFF -> 5000 pcs
const test3Res = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 2500 }],
  '#5',
  3.0,
  1.5,
  { isSpecialUTopOrder: false }
);
assertEquals(test3Res.uTopQty, 5000, 'Test 3: CZ#5 Qty=2500, Checkbox=OFF -> 5000 pcs U-Top');
assertEquals(test3Res.uTopMultiplier, 2, 'Test 3: Multiplier is 2');

// Test 4 — Larger special order: Qty = 2500, Checkbox = ON -> 2500 pcs
const test4Res = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 2500 }],
  '#5',
  3.0,
  1.5,
  { isSpecialUTopOrder: true }
);
assertEquals(test4Res.uTopQty, 2500, 'Test 4: CZ#5 Qty=2500, Checkbox=ON -> 2500 pcs U-Top');
assertEquals(test4Res.uTopMultiplier, 1, 'Test 4: Multiplier is 1');

// Edge Case: Qty = 0 -> 0 pcs U-Top
const testZeroRes = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 0 }],
  '#5',
  3.0,
  1.5,
  { isSpecialUTopOrder: false }
);
assertEquals(testZeroRes.uTopQty, 0, 'Edge Case: CZ#5 Qty=0 -> 0 pcs U-Top');

// ----------------------------------------------------
// SECTION 2: EXCLUSIVITY TO CZ#5
// ----------------------------------------------------
console.log('\n--- SECTION 2: Exclusivity to CZ#5 ---');

// CZ#3
const cz3Res = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 1000 }],
  '#3',
  3.0
);
assertEquals(cz3Res.uTopQty, 0, 'CZ#3 has 0 U-Top');
const cz3BOM = czEngine.buildCZConsolidatedBOMRows(cz3Res);
assert(!cz3BOM.some(r => r.component === 'U-TOP' || (r.materialName && r.materialName.toLowerCase().includes('u-top'))), 'CZ#3 BOM does NOT contain U-Top');

// MZ#3
const mz3Res = mzEngine.calculateMZGroup(
  [{ id: 'v1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 1000 }],
  '#3',
  3.0
);
assert(!mz3Res.uTopQty, 'MZ#3 has NO uTopQty');
const mz3Master = mzEngine.calculateMZMaster([{ id: 'v1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 1000 }]);
assert(!mz3Master.materials.processedRows.some(r => r.component === 'U-TOP' || (r.materialName && r.materialName.toLowerCase().includes('u-top'))), 'MZ#3 BOM does NOT contain U-Top');

// MZ#5
const mz5Master = mzEngine.calculateMZMaster([{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1000 }]);
assert(!mz5Master.materials.processedRows.some(r => r.component === 'U-TOP' || (r.materialName && r.materialName.toLowerCase().includes('u-top'))), 'MZ#5 BOM does NOT contain U-Top');

// WIRE
const wireMaster = wireEngine.calculateWireMaster([{ id: 'v1', zipperSize: '#5_normal', length: 10, lengthUnit: 'inch', quantity: 1000 }]);
assert(!wireMaster.materials.processedRows.some(r => r.component === 'U-TOP' || (r.materialName && r.materialName.toLowerCase().includes('u-top'))), 'WIRE BOM does NOT contain U-Top');

// ----------------------------------------------------
// SECTION 3: BOM ROW STRUCTURE, UNIT, PRICING & RENAMING
// ----------------------------------------------------
console.log('\n--- SECTION 3: BOM Output, Unit, Pricing & Renaming ---');

const bomRowsNormal = czEngine.buildCZConsolidatedBOMRows(test1Res);
const utopBOMNormal = bomRowsNormal.find(r => r.component === 'U-TOP');

assert(utopBOMNormal !== undefined, 'U-Top BOM row exists in CZ#5');
assertEquals(utopBOMNormal.component, 'U-TOP', 'Component name is exactly U-TOP');
assertEquals(utopBOMNormal.materialName, 'U-Top (CZ#5)', 'Material name is exactly U-Top (CZ#5)');
assertEquals(utopBOMNormal.unit, 'Pcs', 'BOM Unit is Pcs');
assertEquals(utopBOMNormal.totalQuantity, 200, 'BOM totalQuantity = 200 pcs');
assertEquals(utopBOMNormal.unitPrice, 350.00, 'Unit price preserved at 350.00 BDT');
assert(!utopBOMNormal.materialName.toLowerCase().includes('ultrasonic'), 'Material name does NOT contain "ultrasonic"');
assert(!utopBOMNormal.component.toLowerCase().includes('ultrasonic'), 'Component name does NOT contain "ultrasonic"');

// Special BOM row
const bomRowsSpecial = czEngine.buildCZConsolidatedBOMRows(test2Res);
const utopBOMSpecial = bomRowsSpecial.find(r => r.component === 'U-TOP');
assertEquals(utopBOMSpecial.totalQuantity, 100, 'Special Order BOM totalQuantity = 100 pcs');
assertEquals(utopBOMSpecial.unit, 'Pcs', 'Special Order BOM Unit is Pcs');

// ----------------------------------------------------
// SECTION 4: CALCULATION DETAILS & ZERO OLD FORMULA
// ----------------------------------------------------
console.log('\n--- SECTION 4: Calculation Details & Old Formula Removal ---');

// Normal Calculation Details
const normalDetail = utopBOMNormal.calculationDetail;
assert(normalDetail !== undefined, 'Normal U-Top has calculationDetail');
assertEquals(normalDetail.displayUnit, 'Pcs', 'Display unit is Pcs');
assertEquals(normalDetail.displayQuantity, '200 Pcs', 'Display quantity is 200 Pcs');
assert(normalDetail.baseFormula.includes('CZ#5 Order Quantity: 100 pcs'), 'Base formula includes CZ#5 Order Quantity: 100 pcs');
assert(normalDetail.baseFormula.includes('U-Top per Zipper: 2 pcs'), 'Base formula includes U-Top per Zipper: 2 pcs');
assert(normalDetail.baseFormula.includes('Required U-Top Quantity: 100 × 2 = 200 pcs'), 'Base formula includes Required U-Top Quantity: 100 × 2 = 200 pcs');
assertEquals(normalDetail.steps.length, 2, 'Calculation detail has 2 steps');
assertEquals(normalDetail.steps[0].result, '100 pcs', 'Step 1 result is 100 pcs');
assert(normalDetail.steps[1].formula.includes('2 pcs/zipper'), 'Step 2 formula includes "2 pcs/zipper"');
assertEquals(normalDetail.steps[1].result, '200 Pcs', 'Step 2 result is 200 Pcs');

// Special Calculation Details
const specialDetail = utopBOMSpecial.calculationDetail;
assert(specialDetail !== undefined, 'Special U-Top has calculationDetail');
assertEquals(specialDetail.displayQuantity, '100 Pcs', 'Special display quantity is 100 Pcs');
assert(specialDetail.baseFormula.includes('CZ#5 Order Quantity: 100 pcs'), 'Special base formula includes CZ#5 Order Quantity: 100 pcs');
assert(specialDetail.baseFormula.includes('Special U-Top Requirement: Yes'), 'Special base formula includes Special U-Top Requirement: Yes');
assert(specialDetail.baseFormula.includes('U-Top per Zipper: 1 pc'), 'Special base formula includes U-Top per Zipper: 1 pc');
assert(specialDetail.baseFormula.includes('Required U-Top Quantity: 100 × 1 = 100 pcs'), 'Special base formula includes Required U-Top Quantity: 100 × 1 = 100 pcs');
assertEquals(specialDetail.steps.length, 2, 'Special calculation detail has 2 steps');
assert(specialDetail.steps[1].formula.includes('1 pc/zipper'), 'Step 2 formula includes "1 pc/zipper"');
assertEquals(specialDetail.steps[1].result, '100 Pcs', 'Step 2 result is 100 Pcs');

// Verify NO "0.074" or "0.074 / 1000" or "ultrasonic" anywhere in details
const normalJson = JSON.stringify(normalDetail);
const specialJson = JSON.stringify(specialDetail);
assert(!normalJson.includes('0.074'), 'Normal calculation detail does NOT contain 0.074');
assert(!normalJson.includes('/ 1000'), 'Normal calculation detail does NOT contain / 1000');
assert(!normalJson.toLowerCase().includes('ultrasonic'), 'Normal calculation detail does NOT contain "ultrasonic"');
assert(!specialJson.includes('0.074'), 'Special calculation detail does NOT contain 0.074');
assert(!specialJson.includes('/ 1000'), 'Special calculation detail does NOT contain / 1000');
assert(!specialJson.toLowerCase().includes('ultrasonic'), 'Special calculation detail does NOT contain "ultrasonic"');

// ----------------------------------------------------
// SECTION 5: FULL ESTIMATE INTEGRATION & PERSISTENCE
// ----------------------------------------------------
console.log('\n--- SECTION 5: Full Estimate Integration & Persistence ---');

const estimate = {
  categoryGroups: [
    {
      id: 'cz_group_1',
      name: 'CZ#5 Normal',
      category: 'cz',
      lossPercent: 3.0,
      isSpecialUTopOrder: false,
      variants: [
        { id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1500 }
      ]
    },
    {
      id: 'cz_group_2',
      name: 'CZ#5 Special',
      category: 'cz',
      lossPercent: 3.0,
      isSpecialUTopOrder: true,
      variants: [
        { id: 'v2', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 1500 }
      ]
    }
  ]
};

const fullEstResult = calculations.calculateFullEstimate(estimate);
assert(fullEstResult !== null, 'calculateFullEstimate succeeded');

// Group 1: Normal (1500 * 2 = 3000 pcs)
const g1Result = fullEstResult.categoryGroups[0];
assertEquals(g1Result.isSpecialUTopOrder, false, 'Group 1 isSpecialUTopOrder is false');
const g1UTopRow = g1Result.calculation.materials.processedRows.find(r => r.component === 'U-TOP');
assertEquals(g1UTopRow.totalQuantity, 3000, 'Group 1 U-Top BOM quantity = 3000 pcs');

// Group 2: Special (1500 * 1 = 1500 pcs)
const g2Result = fullEstResult.categoryGroups[1];
assertEquals(g2Result.isSpecialUTopOrder, true, 'Group 2 isSpecialUTopOrder is true');
const g2UTopRow = g2Result.calculation.materials.processedRows.find(r => r.component === 'U-TOP');
assertEquals(g2UTopRow.totalQuantity, 1500, 'Group 2 U-Top BOM quantity = 1500 pcs');

// Check Aggregated BOM: 3000 + 1500 = 4500 pcs
const aggUTopRow = fullEstResult.aggregatedMaterials.processedRows.find(r => r.component === 'U-TOP');
assert(aggUTopRow !== undefined, 'Aggregated BOM contains U-TOP');
assertEquals(aggUTopRow.totalQuantity, 4500, 'Aggregated U-Top BOM quantity = 4500 pcs (3000 + 1500)');
assertEquals(aggUTopRow.unit, 'Pcs', 'Aggregated U-Top BOM Unit is Pcs');

// Check Storage normalization
const normalizedEstimate = storage.normalizeEstimate({
  categoryGroups: [
    {
      category: 'cz',
      isSpecialUTopOrder: true,
      variants: []
    },
    {
      category: 'cz',
      variants: []
    }
  ]
});
assertEquals(normalizedEstimate.categoryGroups[0].isSpecialUTopOrder, true, 'Storage normalization preserves isSpecialUTopOrder = true');
assertEquals(normalizedEstimate.categoryGroups[1].isSpecialUTopOrder, false, 'Storage normalization defaults isSpecialUTopOrder = false');

// ----------------------------------------------------
// SECTION 6: NO LOSS MIXING
// ----------------------------------------------------
console.log('\n--- SECTION 6: No Loss Mixing ---');

// Confirm changing lossPercent, sliderAdditionPercent, etc., does NOT change U-Top
const highLossRes = czEngine.calculateCZGroup(
  [{ id: 'v1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 1000 }],
  '#5',
  10.0, // 10% loss
  5.0,  // 5% slider add
  { isSpecialUTopOrder: false }
);
assertEquals(highLossRes.uTopQty, 2000, 'U-Top is strictly 1000 * 2 = 2000 pcs regardless of loss percentages');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (totalTests === passedTests) {
  console.log('ALL U-TOP REFACTOR TESTS PASSED (100% SUCCESS)!');
} else {
  console.error('SOME TESTS FAILED!');
  process.exit(1);
}
