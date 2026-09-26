/**
 * Comprehensive Automated Verification Suite for:
 * 1. Dynamic Slider Loss Percentage Table
 * 2. Slider Manual Override Preservation
 * 3. Pin Box Calculation & Dynamic Loss Table
 * 4. Pin Box Relevant Zipper Quantity (Open-End / Two-Way vs Closed-End)
 * 5. Pin Box Multiplier (Pin Box per Zipper)
 * 6. Pin Box Calculation Details (3-Step Breakdown)
 * 7. Unpriced Pin Box Handling (0 BDT / No Invented Prices)
 * 8. Single Consolidated Pin Box (Not Size-Specific)
 * 9. EXPLICIT REGRESSION CHECK: Meter-Based Tape/Chain Dynamic Class Loss System Unchanged
 */

const assert = require('assert');

// Load modules
require('./js/unitConversion.js');
require('./js/materials.js');
require('./js/bomRules.js');
const {
  formatBDT,
  formatQuantity,
  getMaterialDisplayDecimals,
  formatBOMQuantity,
  calculateFullEstimate,
  getVariantZipperClass,
  isClassEligibleForDynamicLoss,
  getDynamicLossPercentage,
  getSliderDynamicLossPercentage,
  getPinBoxDynamicLossPercentage,
  getRelevantPinBoxQuantity,
  calculateVariantBaseChainMtr,
  consolidateGroupClasses
} = require('./js/calculations.js');

const { calculateCZGroup, calculateCZMaster } = require('./js/formulas/cz.js');
const { calculateMZGroup, calculateMZMaster } = require('./js/formulas/mz.js');
const { calculatePZGroup, calculatePZMaster } = require('./js/formulas/pz.js');

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
console.log('TEST SUITE: PIN BOX & DYNAMIC SLIDER LOSS PERCENTAGE');
console.log('====================================================\n');

// =========================================================================
// SECTION 1: SLIDER DYNAMIC LOSS TABLE (PCS BASED)
// =========================================================================
console.log('--- SECTION 1: Slider Dynamic Loss Table (Pcs Based) ---');
testEquals(getSliderDynamicLossPercentage(0), 8.0, 'Slider 0 pcs -> 8%');
testEquals(getSliderDynamicLossPercentage(100), 8.0, 'Slider 100 pcs -> 8%');
testEquals(getSliderDynamicLossPercentage(500), 8.0, 'Slider 500 pcs -> 8%');
testEquals(getSliderDynamicLossPercentage(501), 4.0, 'Slider 501 pcs -> 4%');
testEquals(getSliderDynamicLossPercentage(1500), 4.0, 'Slider 1,500 pcs -> 4%');
testEquals(getSliderDynamicLossPercentage(2000), 4.0, 'Slider 2,000 pcs -> 4%');
testEquals(getSliderDynamicLossPercentage(2001), 2.5, 'Slider 2,001 pcs -> 2.5%');
testEquals(getSliderDynamicLossPercentage(3500), 2.5, 'Slider 3,500 pcs -> 2.5%');
testEquals(getSliderDynamicLossPercentage(5000), 2.5, 'Slider 5,000 pcs -> 2.5%');
testEquals(getSliderDynamicLossPercentage(5001), 1.5, 'Slider 5,001 pcs -> 1.5%');
testEquals(getSliderDynamicLossPercentage(10000), 1.5, 'Slider 10,000 pcs -> 1.5%');

// Test Slider calculation across CZ, MZ, PZ with dynamic default
const czSmallGroup = calculateCZGroup([{ quantity: 400, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(czSmallGroup.sliderAdditionPercent, 8.0, 'CZGroup 400 pcs receives 8% slider loss');
testEquals(czSmallGroup.sliderQuantity, 400 * 1.08, 'CZGroup 400 pcs -> 432 sliders');

const mzMidGroup = calculateMZGroup([{ quantity: 1200, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(mzMidGroup.sliderAdditionPercent, 4.0, 'MZGroup 1200 pcs receives 4% slider loss');
testEquals(mzMidGroup.sliderPcs, 1200 * 1.04, 'MZGroup 1200 pcs -> 1248 sliders');

const pzLargeGroup = calculatePZGroup([{ quantity: 3000, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(pzLargeGroup.sliderAdditionPercent, 2.5, 'PZGroup 3000 pcs receives 2.5% slider loss');
testEquals(pzLargeGroup.sliderQuantity, 3000 * 1.025, 'PZGroup 3000 pcs -> 3075 sliders');

const czHugeGroup = calculateCZGroup([{ quantity: 8000, length: 10, lengthUnit: 'inch' }], '#5');
testEquals(czHugeGroup.sliderAdditionPercent, 1.5, 'CZGroup 8000 pcs receives 1.5% slider loss');
testEquals(czHugeGroup.sliderQuantity, 8000 * 1.015, 'CZGroup 8000 pcs -> 8120 sliders');

// =========================================================================
// SECTION 2: SLIDER MANUAL OVERRIDE PRESERVATION
// =========================================================================
console.log('\n--- SECTION 2: Slider Manual Override Preservation ---');
const estimateWithOverride = {
  categoryGroups: [
    {
      id: 'g_override',
      name: 'CZ Custom Slider Group',
      category: 'cz',
      sliderAdditionPercent: 5.0,
      isSliderOverridden: true,
      variants: [
        { id: 'v1', quantity: 300, length: 10, lengthUnit: 'inch' }
      ]
    }
  ]
};

const resOverridden = calculateFullEstimate(estimateWithOverride);
testEquals(resOverridden.categoryGroups[0].sliderAdditionPercent, 5.0, 'Preserves overridden slider loss of 5.0% for 300 pcs (instead of default 8%)');

// Now simulate quantity change to 10,000 pcs on overridden group
estimateWithOverride.categoryGroups[0].variants[0].quantity = 10000;
const resOverriddenAfterQtyChange = calculateFullEstimate(estimateWithOverride);
testEquals(resOverriddenAfterQtyChange.categoryGroups[0].sliderAdditionPercent, 5.0, 'Preserves overridden slider loss of 5.0% after quantity increases to 10,000 pcs');

// =========================================================================
// SECTION 3: PIN BOX DYNAMIC LOSS TABLE (PCS BASED)
// =========================================================================
console.log('\n--- SECTION 3: Pin Box Dynamic Loss Table (Pcs Based) ---');
testEquals(getPinBoxDynamicLossPercentage(0), 8.0, 'Pin Box 0 pcs -> 8%');
testEquals(getPinBoxDynamicLossPercentage(250), 8.0, 'Pin Box 250 pcs -> 8%');
testEquals(getPinBoxDynamicLossPercentage(500), 8.0, 'Pin Box 500 pcs -> 8%');
testEquals(getPinBoxDynamicLossPercentage(501), 4.0, 'Pin Box 501 pcs -> 4%');
testEquals(getPinBoxDynamicLossPercentage(1000), 4.0, 'Pin Box 1,000 pcs -> 4%');
testEquals(getPinBoxDynamicLossPercentage(2000), 4.0, 'Pin Box 2,000 pcs -> 4%');
testEquals(getPinBoxDynamicLossPercentage(2001), 2.5, 'Pin Box 2,001 pcs -> 2.5%');
testEquals(getPinBoxDynamicLossPercentage(6000), 2.5, 'Pin Box 6,000 pcs -> 2.5%');

// =========================================================================
// SECTION 4: PIN BOX RELEVANT ZIPPER QUANTITY SCOPE
// =========================================================================
console.log('\n--- SECTION 4: Pin Box Relevant Zipper Quantity Scope ---');
const mixedTypeVariants = [
  { id: 'v_open1', zipperType: 'open_end', quantity: 1500 },
  { id: 'v_open2', zipperType: 'two_way', quantity: 600 },
  { id: 'v_closed', zipperType: 'closed_end', quantity: 3000 }
];
const relQty = getRelevantPinBoxQuantity(mixedTypeVariants);
testEquals(relQty, 5100, 'Relevant zipper quantity counts all variants in group = 5100 pcs (1 Pin Box per zipper)');

const closedOnlyVariants = [
  { id: 'v_closed1', zipperSize: '#5', zipperType: 'closed_end', quantity: 1200 },
  { id: 'v_closed2', zipperSize: '#5', zipperType: 'closed_end', quantity: 800 }
];
testEquals(getRelevantPinBoxQuantity(closedOnlyVariants), 2000, 'Relevant quantity for 2,000 pcs closed_end group is 2,000 pcs');

// In calculateCZMaster, 2,000 pcs produces Pin Box row with 4% dynamic loss (2,080 pcs)
const czClosedMaster = calculateCZMaster(closedOnlyVariants, { pinBoxPerZipper: 1 });
const czClosedPinBox = czClosedMaster.materials.processedRows.find(r => r.key === 'mat_cz_pin_box');
testAssert(czClosedPinBox !== undefined, 'Pin Box row generated for 2,000 pcs group');
testEquals(czClosedPinBox.totalQuantity, 2080, '2,000 pcs group -> 2,080 Pin Box pcs');

// =========================================================================
// SECTION 5: PIN BOX MULTIPLIER & CALCULATION DETAILS (3-STEP BREAKDOWN)
// =========================================================================
console.log('\n--- SECTION 5: Pin Box Multiplier & Calculation Details ---');
const openEndVariants = [
  { id: 'v_oe', zipperSize: '#5', zipperType: 'open_end', length: 24, lengthUnit: 'inch', quantity: 1000 }
];

// Test with default pinBoxPerZipper = 1
const czOpenMaster1 = calculateCZMaster(openEndVariants, { pinBoxPerZipper: 1 });
const pinBoxRow1 = czOpenMaster1.materials.processedRows.find(r => r.key === 'mat_cz_pin_box');
testAssert(pinBoxRow1 !== undefined, 'Pin Box row generated for open_end variant');
testEquals(pinBoxRow1.totalQuantity, 1000 * 1.04, '1,000 pcs (4% loss) -> 1,040 Pin Box pcs');
testEquals(pinBoxRow1.unitPrice, 0, 'Pin Box unit price is 0 BDT (unpriced, no invented prices)');
testEquals(pinBoxRow1.totalMaterialCost, 0, 'Pin Box total material cost is 0 BDT');

// Verify 3-step calculation details
testAssert(pinBoxRow1.calculationDetail !== undefined, 'Pin Box has calculationDetail');
testEquals(pinBoxRow1.calculationDetail.steps.length, 3, 'Pin Box calculation detail contains exactly 3 steps');
testEquals(pinBoxRow1.calculationDetail.relevantZipperQuantity, 1000, 'calculationDetail exposes relevantZipperQuantity = 1,000');
testEquals(pinBoxRow1.calculationDetail.pinBoxPerZipper, 1, 'calculationDetail exposes pinBoxPerZipper = 1');
testEquals(pinBoxRow1.calculationDetail.baseQuantity, 1000, 'calculationDetail exposes baseQuantity = 1,000');
testEquals(pinBoxRow1.calculationDetail.lossPercent, 4.0, 'calculationDetail exposes lossPercent = 4.0%');
testEquals(pinBoxRow1.calculationDetail.lossQuantity, 40, 'calculationDetail exposes lossQuantity = 40 Pcs');
testEquals(pinBoxRow1.calculationDetail.finalQuantity, 1040, 'calculationDetail exposes finalQuantity = 1040 Pcs');

// Step titles and explanations
testAssert(pinBoxRow1.calculationDetail.steps[0].formula.includes('1,000 pcs × Pin Box / Zipper: 1 = Base Pin Box: 1,000 Pcs'), 'Step 1 formula matches required Base formula');
testAssert(pinBoxRow1.calculationDetail.steps[1].formula.includes('Base Pin Box: 1,000 Pcs × Loss Rate: 4% = Loss Quantity: 40.00 Pcs'), 'Step 2 formula matches required Loss formula');
testAssert(pinBoxRow1.calculationDetail.steps[2].formula.includes('Base Pin Box: 1,000 Pcs + Loss Quantity: 40.00 Pcs = 1,040.00 Pcs'), 'Step 3 formula matches required Final formula');

// Test with custom multiplier pinBoxPerZipper = 2
const czOpenMaster2 = calculateCZMaster(openEndVariants, { pinBoxPerZipper: 2 });
const pinBoxRow2 = czOpenMaster2.materials.processedRows.find(r => r.key === 'mat_cz_pin_box');
testEquals(pinBoxRow2.totalQuantity, 1000 * 2 * 1.04, 'Pin Box multiplier = 2 -> Base 2,000 pcs + 4% loss = 2,080 Pcs');
testEquals(pinBoxRow2.calculationDetail.baseQuantity, 2000, 'calculationDetail baseQuantity doubles to 2,000 Pcs');

// =========================================================================
// SECTION 6: PIN BOX ACROSS MZ AND PZ CATEGORIES
// =========================================================================
console.log('\n--- SECTION 6: Pin Box in MZ and PZ Categories ---');
const mzOpenVariants = [
  { id: 'v_mz_oe', zipperSize: '#5', zipperType: 'open_end', length: 20, lengthUnit: 'inch', quantity: 300 }
];
const mzMaster = calculateMZMaster(mzOpenVariants, { pinBoxPerZipper: 1 });
const mzPinBox = mzMaster.materials.processedRows.find(r => r.key === 'mat_mz_pin_box');
testAssert(mzPinBox !== undefined, 'MZ generates Pin Box row for open_end');
testEquals(mzPinBox.totalQuantity, 300 * 1.08, '300 pcs (8% loss) -> 324 Pcs');
testEquals(mzPinBox.unitPrice, 0, 'MZ Pin Box unit price is 0 BDT');

const pzOpenVariants = [
  { id: 'v_pz_oe', zipperSize: '#5', zipperType: 'open_end', length: 18, lengthUnit: 'inch', quantity: 4000 }
];
const pzMaster = calculatePZMaster(pzOpenVariants, { pinBoxPerZipper: 1 });
const pzPinBox = pzMaster.materials.processedRows.find(r => r.key === 'mat_pz_pin_box');
testAssert(pzPinBox !== undefined, 'PZ generates Pin Box row for open_end');
testEquals(pzPinBox.totalQuantity, 4000 * 1.025, '4,000 pcs (2.5% loss) -> 4,100 Pcs');
testEquals(pzPinBox.unitPrice, 0, 'PZ Pin Box unit price is 0 BDT');

// =========================================================================
// SECTION 7: SINGLE CONSOLIDATED PIN BOX (NOT SIZE-SPECIFIC)
// =========================================================================
console.log('\n--- SECTION 7: Single Consolidated Pin Box (Not Size-Specific) ---');
const mixedSizeOpenVariants = [
  { id: 'v_cz5', zipperSize: '#5', zipperType: 'open_end', length: 20, lengthUnit: 'inch', quantity: 1000 },
  { id: 'v_cz3', zipperSize: '#3', zipperType: 'open_end', length: 14, lengthUnit: 'inch', quantity: 1500 }
];
const czMixedMaster = calculateCZMaster(mixedSizeOpenVariants, { pinBoxPerZipper: 1 });
const pinBoxRows = czMixedMaster.materials.processedRows.filter(r => r.component === 'PIN BOX' || r.key.includes('pin_box'));
testEquals(pinBoxRows.length, 1, 'Only 1 consolidated Pin Box line item generated for mixed #3 and #5 group');
testEquals(pinBoxRows[0].totalQuantity, (1000 + 1500) * 1.025, 'Total open quantity = 2500 pcs (2.5% loss) -> 2,562.5 Pcs');
testAssert(!pinBoxRows[0].materialName.includes('#3') && !pinBoxRows[0].materialName.includes('#5'), 'Pin Box material name is not size-specific');

// =========================================================================
// SECTION 8: FULL ESTIMATE END-TO-END INTEGRATION
// =========================================================================
console.log('\n--- SECTION 8: Full Estimate End-to-End Integration ---');
const fullEstimateInput = {
  categoryGroups: [
    {
      id: 'g_cz',
      name: 'Jacket Main Group',
      category: 'cz',
      pinBoxPerZipper: 1,
      variants: [
        { id: 'v_j1', zipperSize: '#5', zipperType: 'open_end', length: 24, lengthUnit: 'inch', quantity: 1200 },
        { id: 'v_j2', zipperSize: '#5', zipperType: 'closed_end', length: 10, lengthUnit: 'inch', quantity: 800 }
      ]
    }
  ]
};

const fullCalc = calculateFullEstimate(fullEstimateInput);
const group1 = fullCalc.categoryGroups[0];
testEquals(group1.sliderAdditionPercent, 4.0, 'Total group qty = 2,000 pcs -> Slider loss 4.0%');
testEquals(group1.pinBoxPerZipper, 1, 'Group preserves pinBoxPerZipper = 1');

const bomPinBox = group1.materials.processedRows.find(r => r.key === 'mat_cz_pin_box');
testAssert(bomPinBox !== undefined, 'Merged/processed BOM rows contain mat_cz_pin_box');
testEquals(bomPinBox.totalQuantity, 2000 * 1.04, 'Total group qty = 2,000 pcs (4% loss) -> 2,080 Pcs');

// SECTION 8b: Pin Box Loss % Manual Override
console.log('\n--- SECTION 8b: Pin Box Loss % Manual Override ---');
const overriddenEstimateInput = {
  categoryGroups: [
    {
      id: 'g_cz_ovr',
      name: 'Custom Pin Box Loss Group',
      category: 'cz',
      pinBoxLossPercent: 6.0,
      isPinBoxLossOverridden: true,
      variants: [
        { id: 'v_ovr', zipperSize: '#5', zipperType: 'open_end', length: 24, lengthUnit: 'inch', quantity: 1000 }
      ]
    }
  ]
};
const ovrCalc = calculateFullEstimate(overriddenEstimateInput);
const ovrGroup = ovrCalc.categoryGroups[0];
testEquals(ovrGroup.pinBoxLossPercent, 6.0, 'Preserves overridden Pin Box loss of 6.0% (instead of default 4.0%)');
const ovrBomPinBox = ovrGroup.materials.processedRows.find(r => r.key === 'mat_cz_pin_box');
testEquals(ovrBomPinBox.totalQuantity, 1000 * 1.06, 'Base 1,000 pcs + 6% overridden loss = 1,060 Pcs');
testEquals(ovrBomPinBox.calculationDetail.lossPercent, 6.0, 'Calculation detail exposes overridden lossPercent = 6.0%');
testEquals(ovrBomPinBox.calculationDetail.finalQuantity, 1060, 'Calculation detail exposes overridden finalQuantity = 1,060 Pcs');

// =========================================================================
// SECTION 9: EXPLICIT REGRESSION CHECK - TAPE/CHAIN DYNAMIC LOSS UNCHANGED
// =========================================================================
console.log('\n--- SECTION 9: EXPLICIT REGRESSION CHECK - Tape/Chain Dynamic Class Loss System Unchanged ---');
// Verify all 14 official tape/chain meterage-based dynamic loss brackets remain 100% exact:

// 1. CZC#3 & CZC#5
testEquals(getDynamicLossPercentage('CZC#3', 50), 8.0, 'CZC#3 50 Mtr -> 8%');
testEquals(getDynamicLossPercentage('CZC#3', 199), 8.0, 'CZC#3 199 Mtr -> 8%');
testEquals(getDynamicLossPercentage('CZC#3', 200), 3.0, 'CZC#3 200 Mtr -> 3%');
testEquals(getDynamicLossPercentage('CZC#3', 5000), 3.0, 'CZC#3 5000 Mtr -> 3%');
testEquals(getDynamicLossPercentage('CZC#3', 5001), 2.0, 'CZC#3 5001 Mtr -> 2%');

// 2. CZO#5
testEquals(getDynamicLossPercentage('CZO#5', 100), 8.0, 'CZO#5 100 Mtr -> 8%');
testEquals(getDynamicLossPercentage('CZO#5', 200), 3.0, 'CZO#5 200 Mtr -> 3%');
testEquals(getDynamicLossPercentage('CZO#5', 6000), 2.0, 'CZO#5 6000 Mtr -> 2%');

// 3. MZC#3
testEquals(getDynamicLossPercentage('MZC#3', 150), 8.0, 'MZC#3 150 Mtr -> 8%');
testEquals(getDynamicLossPercentage('MZC#3', 200), 7.0, 'MZC#3 200 Mtr -> 7%');
testEquals(getDynamicLossPercentage('MZC#3', 500), 7.0, 'MZC#3 500 Mtr -> 7%');
testEquals(getDynamicLossPercentage('MZC#3', 501), 3.0, 'MZC#3 501 Mtr -> 3%');
testEquals(getDynamicLossPercentage('MZC#3', 1000), 3.0, 'MZC#3 1000 Mtr -> 3%');
testEquals(getDynamicLossPercentage('MZC#3', 1001), 1.5, 'MZC#3 1001 Mtr -> 1.5%');

// 4. MZC#4 & MZC#5
testEquals(getDynamicLossPercentage('MZC#4', 199), 8.0, 'MZC#4 199 Mtr -> 8%');
testEquals(getDynamicLossPercentage('MZC#4', 200), 2.0, 'MZC#4 200 Mtr -> 2%');
testEquals(getDynamicLossPercentage('MZC#4', 1001), 1.5, 'MZC#4 1001 Mtr -> 1.5%');
testEquals(getDynamicLossPercentage('MZC#5', 200), 2.0, 'MZC#5 200 Mtr -> 2%');
testEquals(getDynamicLossPercentage('MZC#5', 1001), 1.5, 'MZC#5 1001 Mtr -> 1.5%');

// 5. MZO#5
testEquals(getDynamicLossPercentage('MZO#5', 199), 8.0, 'MZO#5 199 Mtr -> 8%');
testEquals(getDynamicLossPercentage('MZO#5', 200), 6.0, 'MZO#5 200 Mtr -> 6%');
testEquals(getDynamicLossPercentage('MZO#5', 501), 3.0, 'MZO#5 501 Mtr -> 3%');
testEquals(getDynamicLossPercentage('MZO#5', 2001), 1.5, 'MZO#5 2001 Mtr -> 1.5%');
testEquals(getDynamicLossPercentage('MZO#5', 5001), 1.0, 'MZO#5 5001 Mtr -> 1%');

// 6. PZC#3 & PZO#3
testEquals(getDynamicLossPercentage('PZC#3', 199), 8.0, 'PZC#3 199 Mtr -> 8%');
testEquals(getDynamicLossPercentage('PZC#3', 200), 6.0, 'PZC#3 200 Mtr -> 6%');
testEquals(getDynamicLossPercentage('PZC#3', 501), 3.0, 'PZC#3 501 Mtr -> 3%');
testEquals(getDynamicLossPercentage('PZC#3', 5001), 2.0, 'PZC#3 5001 Mtr -> 2%');
testEquals(getDynamicLossPercentage('PZC#3', 50001), 1.5, 'PZC#3 50001 Mtr -> 1.5%');
testEquals(getDynamicLossPercentage('PZO#3', 199), 8.0, 'PZO#3 199 Mtr -> 8%');
testEquals(getDynamicLossPercentage('PZO#3', 200), 6.0, 'PZO#3 200 Mtr -> 6%');
testEquals(getDynamicLossPercentage('PZO#3', 501), 3.0, 'PZO#3 501 Mtr -> 3%');
testEquals(getDynamicLossPercentage('PZO#3', 5001), 2.0, 'PZO#3 5001 Mtr -> 2%');
testEquals(getDynamicLossPercentage('PZO#3', 50001), 1.5, 'PZO#3 50001 Mtr -> 1.5%');

// 7. PZC#5 & PZO#5
testEquals(getDynamicLossPercentage('PZC#5', 199), 8.0, 'PZC#5 199 Mtr -> 8%');
testEquals(getDynamicLossPercentage('PZC#5', 200), 6.0, 'PZC#5 200 Mtr -> 6%');
testEquals(getDynamicLossPercentage('PZC#5', 501), 3.0, 'PZC#5 501 Mtr -> 3%');
testEquals(getDynamicLossPercentage('PZC#5', 5001), 2.0, 'PZC#5 5001 Mtr -> 2%');
testEquals(getDynamicLossPercentage('PZC#5', 50001), 1.5, 'PZC#5 50001 Mtr -> 1.5%');
testEquals(getDynamicLossPercentage('PZO#5', 199), 8.0, 'PZO#5 199 Mtr -> 8%');
testEquals(getDynamicLossPercentage('PZO#5', 200), 6.0, 'PZO#5 200 Mtr -> 6%');
testEquals(getDynamicLossPercentage('PZO#5', 501), 3.0, 'PZO#5 501 Mtr -> 3%');
testEquals(getDynamicLossPercentage('PZO#5', 5001), 2.0, 'PZO#5 5001 Mtr -> 2%');
testEquals(getDynamicLossPercentage('PZO#5', 50001), 1.5, 'PZO#5 50001 Mtr -> 1.5%');

// 8. Eligibility and exclusions
testAssert(isClassEligibleForDynamicLoss('CZC#3'), 'CZC#3 is eligible for dynamic loss');
testAssert(isClassEligibleForDynamicLoss('MZO#5'), 'MZO#5 is eligible for dynamic loss');
testAssert(!isClassEligibleForDynamicLoss('PZC#8'), 'PZC#8 is NOT eligible for dynamic loss');
testEquals(getDynamicLossPercentage('PZC#8', 500), null, 'PZC#8 returns null for dynamic loss');
testAssert(!isClassEligibleForDynamicLoss('MZO#5_two_way'), 'two_way is NOT eligible for dynamic loss');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (totalTests === passedTests) {
  console.log('ALL TESTS PASSED SUCCESSFULLY! (100% SUCCESS)');
  process.exit(0);
} else {
  console.error('SOME TESTS FAILED!');
  process.exit(1);
}
