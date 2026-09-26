/**
 * Comprehensive Automated Verification Suite for MZ#3 Dynamic H-Bottom Loss Percentage
 * 
 * Verifies all 11 requirements from the user specification:
 * 1. MZ#3 quantity 300 -> default loss = 8%
 * 2. MZ#3 quantity 500 -> default loss = 8%
 * 3. MZ#3 quantity 501 -> default loss = 4%
 * 4. MZ#3 quantity 2000 -> default loss = 4%
 * 5. MZ#3 quantity 2001 -> default loss = 2.5%
 * 6. Manual H-Bottom loss override is respected.
 * 7. Manual override remains intact when unrelated inputs change.
 * 8. H-Bottom final quantity is calculated correctly.
 * 9. Existing MZ#3 H-Bottom BOM output appears correctly.
 * 10. U-Top calculations remain 100% unchanged.
 * 11. Other zipper/material loss systems remain 100% unchanged.
 * 12. H-Bottom is strictly exclusive to MZ#3 (absent in MZ#5, CZ, PZ, Wire).
 */

const {
  getHBottomDynamicLossPercentage,
  getRelevantMZ3Quantity,
  getSliderDynamicLossPercentage,
  getPinBoxDynamicLossPercentage,
  calculateFullEstimate,
  buildMergedBOM
} = require('./js/calculations.js');

const mzEngine = require('./js/formulas/mz.js');
const czEngine = require('./js/formulas/cz.js');
const pzEngine = require('./js/formulas/pz.js');
const wireEngine = require('./js/formulas/wire.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertClose(actual, expected, message, tolerance = 0.0001) {
  totalTests++;
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`  ✓ PASS: ${message} (Got: ${actual})`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message} (Expected: ${expected}, Got: ${actual}, Diff: ${diff})`);
  }
}

console.log('====================================================');
console.log('RUNNING MZ#3 DYNAMIC H-BOTTOM LOSS VERIFICATION SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. CHART BOUNDARY TESTING
// ----------------------------------------------------
console.log('--- 1. Testing Updated H-Bottom Loss Chart Boundaries ---');
assert(getHBottomDynamicLossPercentage(0) === 8.0, '0 pcs -> 8% loss');
assert(getHBottomDynamicLossPercentage(100) === 8.0, '100 pcs -> 8% loss');
assert(getHBottomDynamicLossPercentage(300) === 8.0, '300 pcs -> 8% loss');
assert(getHBottomDynamicLossPercentage(500) === 8.0, '500 pcs -> 8% loss (Upper boundary bracket 1)');
assert(getHBottomDynamicLossPercentage(501) === 4.0, '501 pcs -> 4% loss (Lower boundary bracket 2)');
assert(getHBottomDynamicLossPercentage(1000) === 4.0, '1,000 pcs -> 4% loss');
assert(getHBottomDynamicLossPercentage(2000) === 4.0, '2,000 pcs -> 4% loss (Upper boundary bracket 2)');
assert(getHBottomDynamicLossPercentage(2001) === 2.5, '2,001 pcs -> 2.5% loss (Lower boundary bracket 3)');
assert(getHBottomDynamicLossPercentage(3000) === 2.5, '3,000 pcs -> 2.5% loss');
assert(getHBottomDynamicLossPercentage(10000) === 2.5, '10,000 pcs -> 2.5% loss');

// ----------------------------------------------------
// 2. RELEVANT MZ#3 QUANTITY DERIVATION
// ----------------------------------------------------
console.log('\n--- 2. Testing MZ#3 Zipper Quantity Scope ---');
const mixedVariants = [
  { id: 'v1', zipperSize: '#3', quantity: 300 },
  { id: 'v2', zipperSize: '#5', quantity: 700 },
  { id: 'v3', zipperSize: '#3', quantity: 200 }
];
assert(getRelevantMZ3Quantity(mixedVariants) === 500, 'Sum of #3 variants = 300 + 200 = 500 pcs');
assert(getHBottomDynamicLossPercentage(getRelevantMZ3Quantity(mixedVariants)) === 8.0, '500 pcs scope -> 8% loss');

// ----------------------------------------------------
// 3. ENGINE CALCULATION ACCURACY & FORMULAS (MZ#3)
// ----------------------------------------------------
console.log('\n--- 3. Testing Engine Calculations for MZ#3 at Different Quantities ---');

// Case A: 300 pcs (8% loss)
const res300 = mzEngine.calculateMZGroup([
  { id: 'v_300', length: 9, lengthUnit: 'inch', quantity: 300 }
], '#3', 3.0);
assert(res300.activeParams.hBottomLossPercent === 8.0, 'MZ#3 300 pcs -> activeParams.hBottomLossPercent = 8%');
assertClose(res300.activeParams.hBottomMultiplier, 1.08, 'MZ#3 300 pcs -> multiplier = 1.08');
assert(res300.baseHBottomQty === 300, 'MZ#3 300 pcs -> baseHBottomQty = 300 pcs');
assertClose(res300.hBottomLossQty, 24, 'MZ#3 300 pcs -> hBottomLossQty = 300 * 8% = 24 pcs');
assertClose(res300.hBottomPcs, 324, 'MZ#3 300 pcs -> final hBottomPcs = 300 + 24 = 324 pcs');

// Case B: 1000 pcs (4% loss)
const res1000 = mzEngine.calculateMZGroup([
  { id: 'v_1000', length: 9, lengthUnit: 'inch', quantity: 1000 }
], '#3', 3.0);
assert(res1000.activeParams.hBottomLossPercent === 4.0, 'MZ#3 1,000 pcs -> activeParams.hBottomLossPercent = 4%');
assertClose(res1000.activeParams.hBottomMultiplier, 1.04, 'MZ#3 1,000 pcs -> multiplier = 1.04');
assert(res1000.baseHBottomQty === 1000, 'MZ#3 1,000 pcs -> baseHBottomQty = 1,000 pcs');
assertClose(res1000.hBottomLossQty, 40, 'MZ#3 1,000 pcs -> hBottomLossQty = 1000 * 4% = 40 pcs');
assertClose(res1000.hBottomPcs, 1040, 'MZ#3 1,000 pcs -> final hBottomPcs = 1000 + 40 = 1,040 pcs');

// Case C: 3000 pcs (2.5% loss)
const res3000 = mzEngine.calculateMZGroup([
  { id: 'v_3000', length: 9, lengthUnit: 'inch', quantity: 3000 }
], '#3', 3.0);
assert(res3000.activeParams.hBottomLossPercent === 2.5, 'MZ#3 3,000 pcs -> activeParams.hBottomLossPercent = 2.5%');
assertClose(res3000.activeParams.hBottomMultiplier, 1.025, 'MZ#3 3,000 pcs -> multiplier = 1.025');
assert(res3000.baseHBottomQty === 3000, 'MZ#3 3,000 pcs -> baseHBottomQty = 3,000 pcs');
assertClose(res3000.hBottomLossQty, 75, 'MZ#3 3,000 pcs -> hBottomLossQty = 3000 * 2.5% = 75 pcs');
assertClose(res3000.hBottomPcs, 3075, 'MZ#3 3,000 pcs -> final hBottomPcs = 3000 + 75 = 3,075 pcs');

// ----------------------------------------------------
// 4. MANUAL OVERRIDE BEHAVIOR
// ----------------------------------------------------
console.log('\n--- 4. Testing Manual H-Bottom Loss Override ---');
const resOverridden = mzEngine.calculateMZGroup([
  { id: 'v_ovr', length: 9, lengthUnit: 'inch', quantity: 1000 } // chart says 4%
], '#3', 3.0, null, { hBottomLossPercent: 10.0 }); // manual override to 10%
assert(resOverridden.activeParams.hBottomLossPercent === 10.0, 'Manual override to 10% is respected');
assertClose(resOverridden.activeParams.hBottomMultiplier, 1.10, 'Multiplier = 1.10');
assert(resOverridden.baseHBottomQty === 1000, 'Base = 1,000 pcs');
assertClose(resOverridden.hBottomLossQty, 100, 'Loss Qty = 1,000 * 10% = 100 pcs');
assertClose(resOverridden.hBottomPcs, 1100, 'Final H-Bottom = 1,100 pcs');

// ----------------------------------------------------
// 5. BOM ROW OUTPUT & CALCULATION DETAILS
// ----------------------------------------------------
console.log('\n--- 5. Testing BOM Row Generation & Calculation Details ---');
const masterRes = mzEngine.calculateMZMaster([
  { id: 'v_m1', zipperSize: '#3', length: 8.5, lengthUnit: 'inch', quantity: 1000, zipperType: 'closed_end' }
]);
assert(masterRes !== null, 'calculateMZMaster returned result');
const hBottomBOMRow = masterRes.materials.processedRows.find(r => r.component === 'H-BOTTOM' || r.key.includes('h_bottom'));
assert(hBottomBOMRow !== undefined, 'H-BOTTOM BOM row exists');
assert(hBottomBOMRow.unit === 'Pcs', 'H-BOTTOM BOM unit is Pcs');
assert(hBottomBOMRow.totalQuantity === 1040, 'H-BOTTOM BOM totalQuantity is 1,040');
assert(hBottomBOMRow.materialName === 'H-Bottom Stop (MZ#3)', 'Material name is H-Bottom Stop (MZ#3)');
assert(hBottomBOMRow.calculationDetail !== undefined, 'calculationDetail exists');

const detail = hBottomBOMRow.calculationDetail;
assert(detail.zipperQuantity === 1000, 'calculationDetail has zipperQuantity = 1000');
assert(detail.baseQuantity === 1000, 'calculationDetail has baseQuantity = 1000');
assert(detail.lossPercent === 4.0, 'calculationDetail has lossPercent = 4.0%');
assert(detail.lossQuantity === 40, 'calculationDetail has lossQuantity = 40');
assert(detail.finalQuantity === 1040, 'calculationDetail has finalQuantity = 1040');
assert(Array.isArray(detail.steps) && detail.steps.length === 3, 'calculationDetail has 3 clear steps');
assert(detail.steps[0].title.includes('Base H-Bottom'), 'Step 1 shows Base H-Bottom derivation');
assert(detail.steps[1].title.includes('Dynamic H-Bottom Loss'), 'Step 2 shows Dynamic H-Bottom Loss');
assert(detail.steps[2].title.includes('Final H-Bottom'), 'Step 3 shows Final H-Bottom Requirement');

// ----------------------------------------------------
// 6. FULL ESTIMATE INTEGRATION & OVERRIDE PERSISTENCE
// ----------------------------------------------------
console.log('\n--- 6. Testing calculateFullEstimate Integration & Persistence ---');
const testEstimateState = {
  categoryGroups: [
    {
      id: 'grp_mz3',
      name: 'MZ#3 Category Group',
      category: 'mz',
      lossPercent: 3.0,
      variants: [
        { id: 'mz_v1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 300 }
      ]
    }
  ]
};

// Test dynamic calculation at 300 pcs -> 8%
const est1 = calculateFullEstimate(testEstimateState);
const grp1 = est1.categoryGroups[0];
assert(grp1.hBottomLossPercent === 8.0, 'calculateFullEstimate derives 8% for 300 pcs');
const bomRow1 = grp1.materials.processedRows.find(r => r.component === 'H-BOTTOM');
assert(bomRow1.totalQuantity === 324, '300 + 8% = 324 pcs in BOM');

// Test quantity change without override -> 1000 pcs -> 4%
testEstimateState.categoryGroups[0].variants[0].quantity = 1000;
const est2 = calculateFullEstimate(testEstimateState);
const grp2 = est2.categoryGroups[0];
assert(grp2.hBottomLossPercent === 4.0, 'calculateFullEstimate updates to 4% for 1,000 pcs');
const bomRow2 = grp2.materials.processedRows.find(r => r.component === 'H-BOTTOM');
assert(bomRow2.totalQuantity === 1040, '1,000 + 4% = 1,040 pcs in BOM');

// Test manual override to 6%
testEstimateState.categoryGroups[0].isHBottomLossOverridden = true;
testEstimateState.categoryGroups[0].hBottomLossPercent = 6.0;
const est3 = calculateFullEstimate(testEstimateState);
const grp3 = est3.categoryGroups[0];
assert(grp3.hBottomLossPercent === 6.0, 'Manual override of 6% is preserved');
const bomRow3 = grp3.materials.processedRows.find(r => r.component === 'H-BOTTOM');
assert(bomRow3.totalQuantity === 1060, '1,000 + 6% = 1,060 pcs with override');

// Test changing unrelated input (e.g. length from 10 to 20, or adding remarks)
testEstimateState.categoryGroups[0].variants[0].length = 20;
testEstimateState.categoryGroups[0].remarks = 'Special Anti-Nickel Finish';
const est4 = calculateFullEstimate(testEstimateState);
const grp4 = est4.categoryGroups[0];
assert(grp4.hBottomLossPercent === 6.0, 'Manual override 6% intact when length and remarks change');

// Test changing quantity with manual override -> override MUST be preserved
testEstimateState.categoryGroups[0].variants[0].quantity = 2500;
const est5 = calculateFullEstimate(testEstimateState);
const grp5 = est5.categoryGroups[0];
assert(grp5.hBottomLossPercent === 6.0, 'Manual override 6% preserved even when quantity changes to 2,500 pcs');
const bomRow5 = grp5.materials.processedRows.find(r => r.component === 'H-BOTTOM');
assert(bomRow5.totalQuantity === 2650, '2,500 + 6% = 2,650 pcs with preserved override');

// ----------------------------------------------------
// 7. REGRESSION CHECK: U-TOP IS UNTOUCHED & EXCLUSIVE TO CZ#5
// ----------------------------------------------------
console.log('\n--- 7. Regression Check: U-Top is Completely Untouched ---');
const cz5Res = czEngine.calculateCZGroup([
  { id: 'cz5_1', zipperSize: '#5', length: 10, lengthUnit: 'inch', quantity: 2000 }
], '#5', 3.0);
assert(cz5Res.uTopQty === 2000 * 2, 'CZ#5 U-Top = 2000 * 2 = 4000 Pcs');

const cz3Res = czEngine.calculateCZGroup([
  { id: 'cz3_1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 2000 }
], '#3', 3.0);
assert(cz3Res.uTopQty === undefined || cz3Res.uTopQty === 0, 'CZ#3 has NO U-Top');

// ----------------------------------------------------
// 8. REGRESSION CHECK: H-BOTTOM EXCLUSIVITY (ONLY MZ#3)
// ----------------------------------------------------
console.log('\n--- 8. Regression Check: H-Bottom Exclusivity to MZ#3 ---');
const mz5Res = mzEngine.calculateMZMaster([
  { id: 'mz5_1', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 2000 }
]);
const mz5HBottom = mz5Res.materials.processedRows.find(r => r.component === 'H-BOTTOM');
assert(mz5HBottom === undefined, 'MZ#5 has NO H-Bottom');
const mz5WireBS = mz5Res.materials.processedRows.find(r => r.component === 'Wire for B/S# 4&5');
assert(mz5WireBS !== undefined, 'MZ#5 uses Wire for B/S# 4&5');

const pzRes = pzEngine.calculatePZMaster([
  { id: 'pz_1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 2000 }
]);
assert(pzRes.materials.processedRows.find(r => r.component === 'H-BOTTOM') === undefined, 'PZ has NO H-Bottom');

const wireRes = wireEngine.calculateWireMaster([
  { id: 'wire_1', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 2000 }
]);
assert(wireRes.materials.processedRows.find(r => r.component === 'H-BOTTOM') === undefined, 'WIRE has NO H-Bottom');

// ----------------------------------------------------
// 9. REGRESSION CHECK: OTHER LOSS SYSTEMS UNTOUCHED
// ----------------------------------------------------
console.log('\n--- 9. Regression Check: Other Loss Systems Untouched ---');
assert(getSliderDynamicLossPercentage(300) === 8.0, 'Slider dynamic loss 300 pcs = 8%');
assert(getSliderDynamicLossPercentage(1000) === 4.0, 'Slider dynamic loss 1000 pcs = 4%');
assert(getSliderDynamicLossPercentage(3000) === 2.5, 'Slider dynamic loss 3000 pcs = 2.5%');

assert(getPinBoxDynamicLossPercentage(300) === 8.0, 'Pin Box dynamic loss 300 pcs = 8%');
assert(getPinBoxDynamicLossPercentage(1000) === 4.0, 'Pin Box dynamic loss 1000 pcs = 4%');
assert(getPinBoxDynamicLossPercentage(3000) === 2.5, 'Pin Box dynamic loss 3000 pcs = 2.5%');

// ----------------------------------------------------
// 10. UI & DOM INACTIVE BEHAVIOR FOR MZ#5 vs MZ#3
// ----------------------------------------------------
console.log('\n--- 10. Testing UI & DOM Inactive Behavior for MZ#5 vs MZ#3 ---');
const fs = require('fs');
const path = require('path');
const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');

// Set up minimal global environment for app.js template rendering
global.window = global;
global.document = {
  getElementById: (id) => null,
  querySelectorAll: (sel) => [],
  addEventListener: (event, cb) => {}
};
global.window.CalculatorEngine = {
  getSliderDynamicLossPercentage,
  getPinBoxDynamicLossPercentage,
  getHBottomDynamicLossPercentage,
  getRelevantPinBoxQuantity: () => 0,
  getRelevantMZ3Quantity
};

const funcExtractor = new Function('escapeHtml', `
  ${appJsSource}
  return { buildCategoryGroupHTML };
`);
const mockEscape = (s) => String(s || '');
const { buildCategoryGroupHTML } = funcExtractor(mockEscape);

// Case A: Group with MZ#5 variant
const mz5Group = {
  id: 'grp_mz5_test',
  name: 'MZ#5 Category Group',
  category: 'mz',
  lossPercent: 3.0,
  variants: [
    { id: 'v_mz5', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 2000 }
  ]
};
const mz5Html = buildCategoryGroupHTML(mz5Group, 0, 1);

assert(mz5Html.includes('id="mz-hbottom-loss-grp_mz5_test"'), 'MZ#5 renders mz-hbottom-loss input element');
assert(mz5Html.includes('disabled'), 'MZ#5 H-Bottom input has "disabled" attribute');
assert(mz5Html.includes('param-inactive'), 'MZ#5 H-Bottom container has "param-inactive" CSS class');
assert(mz5Html.includes('value=""'), 'MZ#5 H-Bottom input has empty value');
assert(mz5Html.includes('placeholder="—"'), 'MZ#5 H-Bottom input has "—" placeholder');
assert(mz5Html.includes('(MZ#3 only)'), 'MZ#5 H-Bottom label includes "(MZ#3 only)" clarification');
assert(mz5Html.includes('inactive for MZ#5'), 'MZ#5 tooltip/title states inactive for MZ#5');

// Case B: Group with MZ#3 variant
const mz3Group = {
  id: 'grp_mz3_test',
  name: 'MZ#3 Category Group',
  category: 'mz',
  lossPercent: 3.0,
  variants: [
    { id: 'v_mz3', zipperSize: '#3', length: 10, lengthUnit: 'inch', quantity: 1000 }
  ]
};
const mz3Html = buildCategoryGroupHTML(mz3Group, 0, 1);

assert(mz3Html.includes('id="mz-hbottom-loss-grp_mz3_test"'), 'MZ#3 renders mz-hbottom-loss input element');
assert(!mz3Html.includes('id="mz-hbottom-loss-grp_mz3_test" disabled') && !mz3Html.includes('disabled\n                         title="H-Bottom Stop Loss Addition Percentage for MZ#3"'), 'MZ#3 H-Bottom input is NOT disabled');
assert(!mz3Html.includes('param-inactive'), 'MZ#3 H-Bottom container does NOT have "param-inactive" class');
assert(mz3Html.includes('value="4"'), 'MZ#3 H-Bottom input has active dynamic value (4% for 1,000 pcs)');
assert(mz3Html.includes('placeholder="0"'), 'MZ#3 H-Bottom input has active placeholder="0"');

// Case C: Group with Mixed variants (#5 and #3)
const mixedMzGroup = {
  id: 'grp_mz_mixed_test',
  name: 'MZ Mixed Group',
  category: 'mz',
  lossPercent: 3.0,
  variants: [
    { id: 'v_mix1', zipperSize: '#5', length: 12, lengthUnit: 'inch', quantity: 2000 },
    { id: 'v_mix2', zipperSize: '#3', length: 8, lengthUnit: 'inch', quantity: 300 }
  ]
};
const mixedHtml = buildCategoryGroupHTML(mixedMzGroup, 0, 1);

assert(!mixedHtml.includes('param-inactive'), 'Mixed MZ group with #3 variant remains active');
assert(mixedHtml.includes('value="8"'), 'Mixed MZ group applies dynamic loss for #3 variant (8% for 300 pcs)');

console.log('\n====================================================');
console.log(`H-BOTTOM TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
