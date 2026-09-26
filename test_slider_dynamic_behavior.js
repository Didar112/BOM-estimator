/**
 * Verification Test Suite for Dynamic "Slider Add %" Parameter Behavior
 * 
 * Verifies:
 * 1. 300 zipper pcs -> default Slider Add % = 8%
 * 2. 500 zipper pcs -> default Slider Add % = 8%
 * 3. 501 zipper pcs -> default Slider Add % = 4%
 * 4. 2000 zipper pcs -> default Slider Add % = 4%
 * 5. 2001 zipper pcs -> default Slider Add % = 2.5%
 * 6. 5000 zipper pcs -> default Slider Add % = 2.5%
 * 7. 5001+ zipper pcs -> default Slider Add % = 1.5%
 * 8. User can manually change Slider Add %
 * 9. Manual Slider Add % overrides the chart-derived default
 * 10. Manual override remains intact when zipper quantity changes
 * 11. Clearing/resetting the override returns to the chart-derived default
 * 12. Existing Slider calculation uses the overridden/default sliderAddPercent correctly
 * 13. No second Slider loss percentage parameter is created (no sliderLossPercent)
 * 14. Existing Slider BOM output remains unchanged except where the percentage naturally changes the calculated result
 * 15. Tape/Chain, Pin Box, H-Bottom, U-Top, Wire, and other calculations remain unchanged
 */

const assert = require('assert');

// Load modules
require('./js/unitConversion.js');
require('./js/materials.js');
require('./js/bomRules.js');
const {
  calculateFullEstimate,
  getSliderDynamicLossPercentage,
  getSliderDynamicAddPercentage,
  getPinBoxDynamicLossPercentage,
  getHBottomDynamicLossPercentage,
  getDynamicLossPercentage
} = require('./js/calculations.js');

const { calculateCZGroup, calculateCZMaster } = require('./js/formulas/cz.js');
const { calculateMZGroup, calculateMZMaster } = require('./js/formulas/mz.js');
const { calculatePZGroup, calculatePZMaster } = require('./js/formulas/pz.js');
const { calculateWireMaster } = require('./js/formulas/wire.js');

let totalTests = 0;
let passedTests = 0;

function testAssert(condition, desc) {
  totalTests++;
  try {
    assert(condition, desc);
    passedTests++;
    console.log(`  ✓ PASS: ${desc}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(err);
  }
}

function testEquals(actual, expected, desc, tolerance = 0.0001) {
  totalTests++;
  try {
    if (typeof actual === 'number' && typeof expected === 'number') {
      const diff = Math.abs(actual - expected);
      assert(diff <= tolerance, `${desc} -> Expected ${expected}, got ${actual}`);
    } else {
      assert.strictEqual(actual, expected, desc);
    }
    passedTests++;
    console.log(`  ✓ PASS: ${desc} (Got: ${actual})`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc} -> Expected ${expected}, got ${actual}`);
  }
}

console.log('====================================================');
console.log('TEST SUITE: DYNAMIC "SLIDER ADD %" PARAMETER');
console.log('====================================================\n');

// =========================================================================
// SECTION 1: VERIFY EXACT BRACKETS & BOUNDARIES (TESTS 1 to 7)
// =========================================================================
console.log('--- SECTION 1: Exact Brackets & Boundaries (Zipper Quantity in PCS) ---');

// 1. 300 zipper pcs -> 8%
testEquals(getSliderDynamicLossPercentage(300), 8.0, '1. 300 zipper pcs -> default Slider Add % = 8%');
testEquals(getSliderDynamicAddPercentage(300), 8.0, '1b. getSliderDynamicAddPercentage(300) alias -> 8%');

// 2. 500 zipper pcs -> 8%
testEquals(getSliderDynamicLossPercentage(500), 8.0, '2. 500 zipper pcs -> default Slider Add % = 8%');

// 3. 501 zipper pcs -> 4%
testEquals(getSliderDynamicLossPercentage(501), 4.0, '3. 501 zipper pcs -> default Slider Add % = 4%');

// 4. 2000 zipper pcs -> 4%
testEquals(getSliderDynamicLossPercentage(2000), 4.0, '4. 2000 zipper pcs -> default Slider Add % = 4%');

// 5. 2001 zipper pcs -> 2.5%
testEquals(getSliderDynamicLossPercentage(2001), 2.5, '5. 2001 zipper pcs -> default Slider Add % = 2.5%');

// 6. 5000 zipper pcs -> 2.5%
testEquals(getSliderDynamicLossPercentage(5000), 2.5, '6. 5000 zipper pcs -> default Slider Add % = 2.5%');

// 7. 5001+ zipper pcs -> 1.5%
testEquals(getSliderDynamicLossPercentage(5001), 1.5, '7a. 5001 zipper pcs -> default Slider Add % = 1.5%');
testEquals(getSliderDynamicLossPercentage(8000), 1.5, '7b. 8000 zipper pcs -> default Slider Add % = 1.5%');
testEquals(getSliderDynamicLossPercentage(50000), 1.5, '7c. 50000 zipper pcs -> default Slider Add % = 1.5%');

// =========================================================================
// SECTION 2: ESTIMATE INTEGRATION WITH DYNAMIC DEFAULT (TESTS 1 to 7 via calculateFullEstimate)
// =========================================================================
console.log('\n--- SECTION 2: calculateFullEstimate dynamic defaults across categories ---');

function createTestEstimate(category, qty) {
  return {
    categoryGroups: [
      {
        id: 'group_test',
        name: `Test ${category.toUpperCase()} Group`,
        category: category,
        isSliderOverridden: false,
        variants: [
          { id: 'v1', quantity: qty, length: 12, lengthUnit: 'inch' }
        ]
      }
    ]
  };
}

// CZ 300 pcs -> 8%
const cz300 = calculateFullEstimate(createTestEstimate('cz', 300));
testEquals(cz300.categoryGroups[0].sliderAdditionPercent, 8.0, 'CZ 300 pcs -> sliderAdditionPercent = 8.0%');
testEquals(cz300.categoryGroups[0].sliderAddPercent, 8.0, 'CZ 300 pcs -> sliderAddPercent alias = 8.0%');

// CZ 500 pcs -> 8%
const cz500 = calculateFullEstimate(createTestEstimate('cz', 500));
testEquals(cz500.categoryGroups[0].sliderAdditionPercent, 8.0, 'CZ 500 pcs -> sliderAdditionPercent = 8.0%');

// MZ 501 pcs -> 4%
const mz501 = calculateFullEstimate(createTestEstimate('mz', 501));
testEquals(mz501.categoryGroups[0].sliderAdditionPercent, 4.0, 'MZ 501 pcs -> sliderAdditionPercent = 4.0%');

// MZ 2000 pcs -> 4%
const mz2000 = calculateFullEstimate(createTestEstimate('mz', 2000));
testEquals(mz2000.categoryGroups[0].sliderAdditionPercent, 4.0, 'MZ 2000 pcs -> sliderAdditionPercent = 4.0%');

// PZ 2001 pcs -> 2.5%
const pz2001 = calculateFullEstimate(createTestEstimate('pz', 2001));
testEquals(pz2001.categoryGroups[0].sliderAdditionPercent, 2.5, 'PZ 2001 pcs -> sliderAdditionPercent = 2.5%');

// PZ 5000 pcs -> 2.5%
const pz5000 = calculateFullEstimate(createTestEstimate('pz', 5000));
testEquals(pz5000.categoryGroups[0].sliderAdditionPercent, 2.5, 'PZ 5000 pcs -> sliderAdditionPercent = 2.5%');

// CZ 5001 pcs -> 1.5%
const cz5001 = calculateFullEstimate(createTestEstimate('cz', 5001));
testEquals(cz5001.categoryGroups[0].sliderAdditionPercent, 1.5, 'CZ 5001 pcs -> sliderAdditionPercent = 1.5%');

// Multi-variant sum counts all pcs in group: 300 + 201 = 501 pcs -> 4.0%
const multiVarEstimate = {
  categoryGroups: [
    {
      id: 'group_multi',
      name: 'CZ Multi Group',
      category: 'cz',
      isSliderOverridden: false,
      variants: [
        { id: 'v1', quantity: 300, length: 10, lengthUnit: 'inch' },
        { id: 'v2', quantity: 201, length: 14, lengthUnit: 'inch' }
      ]
    }
  ]
};
const resMulti = calculateFullEstimate(multiVarEstimate);
testEquals(resMulti.categoryGroups[0].sliderAdditionPercent, 4.0, 'Multi-variant group (300 + 201 = 501 pcs) -> 4.0%');

// =========================================================================
// SECTION 3: MANUAL USER OVERRIDE (TESTS 8, 9, 10)
// =========================================================================
console.log('\n--- SECTION 3: Manual User Override Behavior ---');

const overrideEstimate = {
  categoryGroups: [
    {
      id: 'group_ovr',
      name: 'CZ Group with Override',
      category: 'cz',
      sliderAdditionPercent: 7.0,
      isSliderOverridden: true,
      variants: [
        { id: 'v1', quantity: 2000, length: 10, lengthUnit: 'inch' } // default would be 4.0%
      ]
    }
  ]
};

// 8 & 9. User enters 7% -> calculation uses 7%
const resOvr = calculateFullEstimate(overrideEstimate);
testEquals(resOvr.categoryGroups[0].sliderAdditionPercent, 7.0, '8 & 9. Overridden Slider Add % = 7% used instead of chart default 4%');

const sliderBomRow = resOvr.aggregatedMaterials.processedRows.find(r => r.componentCategory === 'slider' || (r.materialName && r.materialName.includes('Slider')));
testAssert(sliderBomRow !== undefined, 'Slider BOM row is present');
// 2000 pcs * 1.07 = 2140 pcs
testEquals(sliderBomRow.totalQuantity, 2140, 'Slider BOM total quantity = 2,000 * 1.07 = 2,140 pcs');
testEquals(sliderBomRow.calculationDetail.sliderAdditionPercent, 7.0, 'Calculation Detail shows Slider Add %: 7%');

// 10. Manual override remains intact when zipper quantity changes
overrideEstimate.categoryGroups[0].variants[0].quantity = 10000; // default for 10000 is 1.5%
const resOvrAfterChange = calculateFullEstimate(overrideEstimate);
testEquals(resOvrAfterChange.categoryGroups[0].sliderAdditionPercent, 7.0, '10. Manual override 7% preserved when quantity changes from 2,000 to 10,000 pcs');
const sliderBomAfterChange = resOvrAfterChange.aggregatedMaterials.processedRows.find(r => r.componentCategory === 'slider' || (r.materialName && r.materialName.includes('Slider')));
testEquals(sliderBomAfterChange.totalQuantity, 10700, 'Slider BOM total quantity = 10,000 * 1.07 = 10,700 pcs');

// =========================================================================
// SECTION 4: CLEARING / RESETTING OVERRIDE (TEST 11)
// =========================================================================
console.log('\n--- SECTION 4: Reset / Return to Default ---');

// Clear manual override flag
overrideEstimate.categoryGroups[0].isSliderOverridden = false;
delete overrideEstimate.categoryGroups[0].sliderAdditionPercent;
delete overrideEstimate.categoryGroups[0].sliderAddPercent;

// For 10,000 pcs, reset should revert to 1.5%
const resReset = calculateFullEstimate(overrideEstimate);
testEquals(resReset.categoryGroups[0].sliderAdditionPercent, 1.5, '11a. Reset override with 10,000 pcs returns to chart default 1.5%');
const sliderBomReset = resReset.aggregatedMaterials.processedRows.find(r => r.componentCategory === 'slider' || (r.materialName && r.materialName.includes('Slider')));
testEquals(sliderBomReset.totalQuantity, 10150, '11b. Slider BOM reverts to 10,000 * 1.015 = 10,150 pcs');

// Change quantity to 400 pcs without override -> returns 8.0%
overrideEstimate.categoryGroups[0].variants[0].quantity = 400;
const resReset400 = calculateFullEstimate(overrideEstimate);
testEquals(resReset400.categoryGroups[0].sliderAdditionPercent, 8.0, '11c. Quantity reduced to 400 pcs without override dynamically becomes 8.0%');
const sliderBomReset400 = resReset400.aggregatedMaterials.processedRows.find(r => r.componentCategory === 'slider' || (r.materialName && r.materialName.includes('Slider')));
testEquals(sliderBomReset400.totalQuantity, 432, '11d. Slider BOM updates to 400 * 1.08 = 432 pcs');

// =========================================================================
// SECTION 5: SLIDER CALCULATION ENGINE VERIFICATION ACROSS CZ, MZ, PZ (TEST 12, 14)
// =========================================================================
console.log('\n--- SECTION 5: Existing Slider Calculation Across CZ, MZ, PZ ---');

// CZ Group formula verification
const czCalc = calculateCZGroup([{ quantity: 1500, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(czCalc.sliderAdditionPercent, 4.0, 'CZ 1500 pcs -> Slider Add % = 4.0%');
testEquals(czCalc.sliderQuantity, 1500 * 1.04, 'CZ 1500 pcs -> 1560 sliders');

// MZ Group formula verification
const mzCalc = calculateMZGroup([{ quantity: 2500, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(mzCalc.sliderAdditionPercent, 2.5, 'MZ 2500 pcs -> Slider Add % = 2.5%');
testEquals(mzCalc.sliderPcs, 2500 * 1.025, 'MZ 2500 pcs -> 2562.5 sliders');

// PZ Group formula verification
const pzCalc = calculatePZGroup([{ quantity: 300, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(pzCalc.sliderAdditionPercent, 8.0, 'PZ 300 pcs -> Slider Add % = 8.0%');
testEquals(pzCalc.sliderQuantity, 300 * 1.08, 'PZ 300 pcs -> 324 sliders');

// Verify calculation detail structure is intact
const czMaster = calculateCZMaster([{ quantity: 400, length: 10, lengthUnit: 'inch', zipperSize: '#3' }]);
const czSliderRow = czMaster.materials.processedRows.find(r => r.componentCategory === 'slider');
testAssert(czSliderRow !== undefined, 'CZ Slider BOM row exists');
testAssert(czSliderRow.calculationDetail !== undefined, 'CZ Slider row has calculationDetail');
testAssert(Array.isArray(czSliderRow.calculationDetail.steps), 'CZ calculationDetail has steps array');
testEquals(czSliderRow.calculationDetail.sliderAdditionPercent, 8.0, 'CZ calculationDetail exposes sliderAdditionPercent = 8.0');
testAssert(czSliderRow.calculationDetail.steps[1].title.includes('Slider Requirement with +8% Addition'), 'Step title shows +8% Addition');

// =========================================================================
// SECTION 6: NO SECOND SLIDER PARAMETER (TEST 13)
// =========================================================================
console.log('\n--- SECTION 6: Single Source of Truth / No Second Parameter ---');

testAssert(resOvr.categoryGroups[0].sliderLossPercent === undefined, 'No sliderLossPercent property created on group');
testAssert(resOvr.categoryGroups[0].dynamicSliderLossPercent === undefined, 'No dynamicSliderLossPercent property created on group');
testAssert(resOvr.categoryGroups[0].sliderLossPercentage === undefined, 'No sliderLossPercentage property created on group');
testAssert(resOvr.categoryGroups[0].sliderAdditionPercent !== undefined, 'sliderAdditionPercent is the sole source of truth');

// =========================================================================
// SECTION 7: REGRESSION CHECKS: OTHER MATERIAL SYSTEMS UNCHANGED (TEST 15)
// =========================================================================
console.log('\n--- SECTION 7: Regression Checks (Tape/Chain, Pin Box, H-Bottom, U-Top, Wire Unchanged) ---');

// 1. Tape/Chain dynamic class loss is untouched
testEquals(getDynamicLossPercentage('CZC#3', 50), 8.0, 'CZC#3 50 Mtr -> 8% loss (Untouched)');
testEquals(getDynamicLossPercentage('CZC#3', 250), 3.0, 'CZC#3 250 Mtr -> 3% loss (Untouched)');
testEquals(getDynamicLossPercentage('MZC#3', 300), 7.0, 'MZC#3 300 Mtr -> 7% loss (Untouched)');
testEquals(getDynamicLossPercentage('PZC#3', 300), 6.0, 'PZC#3 300 Mtr -> 6% loss (Untouched)');

// 2. Pin Box dynamic loss table is untouched (0-500: 8%, 501-2000: 4%, 2001+: 2.5%)
testEquals(getPinBoxDynamicLossPercentage(300), 8.0, 'Pin Box 300 pcs -> 8% (Untouched)');
testEquals(getPinBoxDynamicLossPercentage(1000), 4.0, 'Pin Box 1000 pcs -> 4% (Untouched)');
testEquals(getPinBoxDynamicLossPercentage(3000), 2.5, 'Pin Box 3000 pcs -> 2.5% (Untouched)');

// 3. H-Bottom dynamic loss table is untouched
testEquals(getHBottomDynamicLossPercentage(300), 8.0, 'H-Bottom 300 pcs -> 8% (Untouched)');
testEquals(getHBottomDynamicLossPercentage(1000), 4.0, 'H-Bottom 1000 pcs -> 4% (Untouched)');
testEquals(getHBottomDynamicLossPercentage(3000), 2.5, 'H-Bottom 3000 pcs -> 2.5% (Untouched)');

// 4. U-Top Stop in CZ#5
const cz5UTopGroup = calculateCZGroup([{ quantity: 2000, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(cz5UTopGroup.uTopQty, 2000 * 2, 'CZ#5 U-Top Stop calculation is 2000 * 2 = 4000 pcs');

// 5. WIRE calculation does NOT have Slider Add % or Slider materials
const wireMaster = calculateWireMaster([{ quantity: 1000, length: 10, lengthUnit: 'inch', zipperSize: '#5_normal' }]);
const wireSlider = wireMaster.materials.processedRows.find(r => r.componentCategory === 'slider' || (r.materialName && r.materialName.toLowerCase().includes('slider')));
testAssert(wireSlider === undefined, 'WIRE has NO Slider materials');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (totalTests === passedTests) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! (100% SUCCESS)');
} else {
  console.error('SOME TESTS FAILED!');
  process.exit(1);
}
