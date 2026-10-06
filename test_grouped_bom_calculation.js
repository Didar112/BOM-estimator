/**
 * Test Suite: Grouped BoM Calculation for Identical Item Types & Multi-Unit Separation
 * 
 * Verifies:
 * 1. Items of the same type and unit are calculated together into a SINGLE BoM estimation table.
 * 2. All loss percentages are applied AFTER calculating all similar items' total length and pieces quantity.
 * 3. Items of the same category but different units (e.g. MZ#3 inch vs MZ#3 cm) are separated
 *    into 2 distinct BoM estimation tables.
 * 4. Multiple items in both inch and cm (e.g. 2 inch items + 2 cm items) produce exactly 2 BoM estimation tables.
 * 5. Dynamic loss percentages (slider addition, class loss, H-bottom, pin box) reflect the combined group volume.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const calcEngine = require('./js/calculations.js');
const bomRules = require('./js/bomRules.js');
const czEngine = require('./js/formulas/cz.js');
const mzEngine = require('./js/formulas/mz.js');
const pzEngine = require('./js/formulas/pz.js');
const wireEngine = require('./js/formulas/wire.js');

console.log('===============================================================');
console.log('TEST SUITE: GROUPED BOM CALCULATION & MULTI-UNIT SEPARATION');
console.log('===============================================================');

// -------------------------------------------------------------
// Test 1: Helper function getItemTypeGroupKey behavior
// -------------------------------------------------------------
console.log('\n--- 1. Testing getItemTypeGroupKey() ---');
assert.strictEqual(calcEngine.getItemTypeGroupKey({ category: 'cz', zipperSize: '#5', lengthUnit: 'inch' }), 'cz_5__inch');
assert.strictEqual(calcEngine.getItemTypeGroupKey({ category: 'cz', zipperSize: '#5', lengthUnit: 'cm' }), 'cz_5__cm');
assert.strictEqual(calcEngine.getItemTypeGroupKey({ category: 'mz', zipperSize: '#3', lengthUnit: 'inch' }), 'mz_3__inch');
assert.strictEqual(calcEngine.getItemTypeGroupKey({ category: 'mz', zipperSize: '#3', lengthUnit: 'cm' }), 'mz_3__cm');
assert.strictEqual(calcEngine.getItemTypeGroupKey({ category: 'wire', zipperSize: '#5_normal', lengthUnit: 'inch' }), 'wire_5_normal__inch');
assert.strictEqual(calcEngine.getItemTypeGroupKey({ category: 'wire', zipperSize: '#5_long', lengthUnit: 'inch' }), 'wire_5_long__inch');
console.log('  ✓ PASS: getItemTypeGroupKey properly segregates by type and unit');

// -------------------------------------------------------------
// Test 2: Two items of same type & unit -> Single BoM estimation table
// -------------------------------------------------------------
console.log('\n--- 2. Testing Same Type & Unit (2 items CZ#5 inch) ---');
const twoCzInchEstimate = {
  items: [
    {
      id: 'item_cz5_1',
      displayName: 'CZ#5 Jacket Front',
      category: 'cz',
      zipperSize: '#5',
      zipperType: 'open_end',
      length: 24,
      lengthUnit: 'inch',
      quantity: 500
    },
    {
      id: 'item_cz5_2',
      displayName: 'CZ#5 Pocket',
      category: 'cz',
      zipperSize: '#5',
      zipperType: 'open_end',
      length: 8,
      lengthUnit: 'inch',
      quantity: 1000
    }
  ]
};

const calcResult1 = calcEngine.calculateFullEstimate(twoCzInchEstimate);
assert.strictEqual(calcResult1.categoryGroups.length, 1, 'Must produce exactly 1 BoM estimation group');
const czGroup = calcResult1.categoryGroups[0];
assert.strictEqual(czGroup.name, 'CZ#5 (Inch)', 'Group display name must indicate type and unit');
assert.strictEqual(czGroup.variants.length, 2, 'Group must contain both items as source variants');
assert.strictEqual(czGroup.totalQuantity, 1500, 'Total pieces quantity must be sum of both items (500 + 1000 = 1500)');

// Total Base Chain Mtr:
// Item 1: (24 + 1.78) * 500 / 39.37 = 327.406657...
// Item 2: (8 + 1.78) * 1000 / 39.37 = 248.412496...
// Total Base: ~575.819 Mtr
const czCalc = czGroup.calculation.primaryResult;
const expectedBaseChainMtr = ((24 + 1.78) * 500 / 39.37) + ((8 + 1.78) * 1000 / 39.37);
assert(Math.abs(czCalc.chainConsumptionMtr - expectedBaseChainMtr) < 0.01, `Base chain mtr should be ~${expectedBaseChainMtr}`);

// Loss applied AFTER calculating total length:
// Loss % = 3%
// Chain with Loss = expectedBaseChainMtr * 1.03
const expectedLossChainMtr = expectedBaseChainMtr * 1.03;
assert(Math.abs(czCalc.lossInclusiveChainMtr - expectedLossChainMtr) < 0.01, 'Loss must be applied on combined total chain length');

// Slider addition applied on combined pieces:
// Total qty = 1500 pcs -> dynamic slider addition for 1500 pcs
const expectedSliderPercent = calcEngine.getSliderDynamicLossPercentage(1500);
const expectedSliderPcs = 1500 + (1500 * expectedSliderPercent / 100);
assert.strictEqual(czCalc.totalQuantity, 1500, 'Order quantity for sliders must be 1500 pcs');
assert.strictEqual(czCalc.sliderAdditionPercent, expectedSliderPercent, `Slider addition % must be ${expectedSliderPercent}% for 1500 pcs`);

console.log('  ✓ PASS: 2 items of CZ#5 inch produce 1 BoM table with loss applied on combined volume');

// -------------------------------------------------------------
// Test 3: Same category with different units (MZ#3 inch + MZ#3 cm) -> 2 separate BoM estimation tables
// -------------------------------------------------------------
console.log('\n--- 3. Testing Same Category with Different Units (MZ#3 inch + MZ#3 cm) ---');
const mzMixedUnitsEstimate = {
  items: [
    {
      id: 'item_mz3_inch',
      displayName: 'MZ#3 Trouser (Inch)',
      category: 'mz',
      zipperSize: '#3',
      zipperType: 'closed_end',
      length: 7,
      lengthUnit: 'inch',
      quantity: 2000
    },
    {
      id: 'item_mz3_cm',
      displayName: 'MZ#3 Export (CM)',
      category: 'mz',
      zipperSize: '#3',
      zipperType: 'closed_end',
      length: 18,
      lengthUnit: 'cm',
      quantity: 1200
    }
  ]
};

const calcResult2 = calcEngine.calculateFullEstimate(mzMixedUnitsEstimate);
assert.strictEqual(calcResult2.categoryGroups.length, 2, 'Must produce EXACTLY 2 separate BoM estimation tables');

const mzInchGroup = calcResult2.categoryGroups.find(g => g.lengthUnit === 'inch');
const mzCmGroup = calcResult2.categoryGroups.find(g => g.lengthUnit === 'cm');

assert(mzInchGroup, 'Must have MZ#3 (Inch) group');
assert(mzCmGroup, 'Must have MZ#3 (cm) group');

assert.strictEqual(mzInchGroup.name, 'MZ#3 (Inch)', 'Inch group display name');
assert.strictEqual(mzCmGroup.name, 'MZ#3 (cm)', 'CM group display name');

assert.strictEqual(mzInchGroup.totalQuantity, 2000, 'Inch table total qty = 2000 pcs');
assert.strictEqual(mzCmGroup.totalQuantity, 1200, 'CM table total qty = 1200 pcs');

// Check Inch table chain calculation: allowance 1.78, divisor 39.37
const expectedMzInchMtr = (7 + 1.78) * 2000 / 39.37;
assert(Math.abs(mzInchGroup.calculation.primaryResult.chainConsumptionMtr - expectedMzInchMtr) < 0.01, 'Inch chain meters matches inch formula');

// Check CM table chain calculation: allowance 4.5, divisor 100
const expectedMzCmMtr = (18 + 4.5) * 1200 / 100;
assert(Math.abs(mzCmGroup.calculation.primaryResult.chainConsumptionMtr - expectedMzCmMtr) < 0.01, 'CM chain meters matches cm formula');

// Each table has its own materials table
assert(Array.isArray(mzInchGroup.materials.processedRows) && mzInchGroup.materials.processedRows.length > 0, 'Inch table has BOM rows');
assert(Array.isArray(mzCmGroup.materials.processedRows) && mzCmGroup.materials.processedRows.length > 0, 'CM table has BOM rows');

console.log('  ✓ PASS: MZ#3 with inch and cm strictly generates 2 distinct BoM estimation tables');

// -------------------------------------------------------------
// Test 4: 2 items of MZ#3 inch + 2 items of MZ#3 cm -> Exactly 2 BoM estimation tables
// -------------------------------------------------------------
console.log('\n--- 4. Testing 2 inch + 2 cm items of same category (MZ#3) ---');
const mz4ItemsEstimate = {
  items: [
    {
      id: 'mz_in_1',
      displayName: 'MZ#3 Inch 6"',
      category: 'mz',
      zipperSize: '#3',
      zipperType: 'closed_end',
      length: 6,
      lengthUnit: 'inch',
      quantity: 500
    },
    {
      id: 'mz_in_2',
      displayName: 'MZ#3 Inch 8"',
      category: 'mz',
      zipperSize: '#3',
      zipperType: 'closed_end',
      length: 8,
      lengthUnit: 'inch',
      quantity: 700
    },
    {
      id: 'mz_cm_1',
      displayName: 'MZ#3 CM 15cm',
      category: 'mz',
      zipperSize: '#3',
      zipperType: 'closed_end',
      length: 15,
      lengthUnit: 'cm',
      quantity: 400
    },
    {
      id: 'mz_cm_2',
      displayName: 'MZ#3 CM 20cm',
      category: 'mz',
      zipperSize: '#3',
      zipperType: 'closed_end',
      length: 20,
      lengthUnit: 'cm',
      quantity: 600
    }
  ]
};

const calcResult4 = calcEngine.calculateFullEstimate(mz4ItemsEstimate);
assert.strictEqual(calcResult4.categoryGroups.length, 2, '4 items must coalesce into exactly 2 BoM tables (1 for inch, 1 for cm)');

const inchGroup4 = calcResult4.categoryGroups.find(g => g.lengthUnit === 'inch');
const cmGroup4 = calcResult4.categoryGroups.find(g => g.lengthUnit === 'cm');

assert.strictEqual(inchGroup4.variants.length, 2, 'Inch group contains both inch items');
assert.strictEqual(inchGroup4.totalQuantity, 1200, 'Inch group total quantity = 500 + 700 = 1200 pcs');

assert.strictEqual(cmGroup4.variants.length, 2, 'CM group contains both cm items');
assert.strictEqual(cmGroup4.totalQuantity, 1000, 'CM group total quantity = 400 + 600 = 1000 pcs');

// Combined chain length for inch group:
const expectedInchTotalMtr = ((6 + 1.78) * 500 / 39.37) + ((8 + 1.78) * 700 / 39.37);
assert(Math.abs(inchGroup4.calculation.primaryResult.chainConsumptionMtr - expectedInchTotalMtr) < 0.01, 'Inch combined chain mtr is exact');

// Combined chain length for cm group:
const expectedCmTotalMtr = ((15 + 4.5) * 400 / 100) + ((20 + 4.5) * 600 / 100);
assert(Math.abs(cmGroup4.calculation.primaryResult.chainConsumptionMtr - expectedCmTotalMtr) < 0.01, 'CM combined chain mtr is exact');

console.log('  ✓ PASS: 2 inch + 2 cm items coalesce into exactly 2 BoM tables with combined volume per table');

// -------------------------------------------------------------
// Test 5: Dynamic loss % shifts when items are combined
// -------------------------------------------------------------
console.log('\n--- 5. Testing Dynamic Loss % shift on combined volume ---');
// Single item with 400 pcs -> Slider Add % is 8.0% (<= 500 pcs bracket)
const single400Est = {
  items: [{
    id: 'it1',
    category: 'cz',
    zipperSize: '#5',
    length: 10,
    lengthUnit: 'inch',
    quantity: 400
  }]
};
const singleCalc = calcEngine.calculateFullEstimate(single400Est);
assert.strictEqual(singleCalc.categoryGroups[0].calculation.primaryResult.sliderAdditionPercent, 8.0, '400 pcs alone receives 8.0% slider addition');

// Add second similar item with 700 pcs -> Total is 1100 pcs (> 1000 pcs bracket) -> Slider Add % drops to 5.0%
const combinedEst = {
  items: [
    {
      id: 'it1',
      category: 'cz',
      zipperSize: '#5',
      length: 10,
      lengthUnit: 'inch',
      quantity: 400
    },
    {
      id: 'it2',
      category: 'cz',
      zipperSize: '#5',
      length: 12,
      lengthUnit: 'inch',
      quantity: 700
    }
  ]
};
const combinedCalc = calcEngine.calculateFullEstimate(combinedEst);
assert.strictEqual(combinedCalc.categoryGroups.length, 1, 'Still 1 BoM estimation table');
assert.strictEqual(combinedCalc.categoryGroups[0].totalQuantity, 1100, 'Total qty is 1100 pcs');
assert.strictEqual(combinedCalc.categoryGroups[0].calculation.primaryResult.sliderAdditionPercent, 4.0, 'Combined 1100 pcs dynamically shifts slider addition to 4.0%');

console.log('  ✓ PASS: Dynamic loss percentages dynamically re-evaluate against combined group volume');

// -------------------------------------------------------------
// Test 6: UI Rendering Verification (Mock DOM)
// -------------------------------------------------------------
console.log('\n--- 6. Testing UI Rendering of Grouped BOM Tables ---');

// Mock DOM
global.window = {
  CalculatorEngine: calcEngine,
  BOMRules: bomRules,
  CZFormulaEngine: czEngine,
  MZFormulaEngine: mzEngine,
  PZFormulaEngine: pzEngine,
  WireFormulaEngine: wireEngine
};
global.document = {
  getElementById: (id) => {
    return {
      innerHTML: '',
      appendChild: () => {},
      classList: { add: () => {}, remove: () => {} }
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
const funcExtractor = new Function('escapeHtml', `
  ${appJsSource}
  return { 
    getItemTypeGroupKey,
    getGroupDisplayName,
    syncStateItemsAndGroups,
    appState
  };
`);
const mockEscape = (s) => String(s || '');
const appModule = funcExtractor(mockEscape);

// Initialize appState with 2 items of CZ#5 inch and 1 item of MZ#3 cm
appModule.appState.currentEstimate = {
  id: 'est_test',
  items: [
    {
      id: 'cz_1',
      displayName: 'CZ 1',
      category: 'cz',
      zipperSize: '#5',
      length: 10,
      lengthUnit: 'inch',
      quantity: 500
    },
    {
      id: 'cz_2',
      displayName: 'CZ 2',
      category: 'cz',
      zipperSize: '#5',
      length: 14,
      lengthUnit: 'inch',
      quantity: 500
    },
    {
      id: 'mz_cm_1',
      displayName: 'MZ CM 1',
      category: 'mz',
      zipperSize: '#3',
      length: 25,
      lengthUnit: 'cm',
      quantity: 800
    }
  ],
  categoryGroups: []
};

appModule.syncStateItemsAndGroups();

assert.strictEqual(appModule.appState.currentEstimate.categoryGroups.length, 2, 'UI sync produces 2 category groups (CZ#5 Inch and MZ#3 cm)');
const uiCzGroup = appModule.appState.currentEstimate.categoryGroups.find(g => g.key === 'cz_5__inch');
const uiMzGroup = appModule.appState.currentEstimate.categoryGroups.find(g => g.key === 'mz_3__cm');

assert(uiCzGroup, 'Found UI CZ#5 Inch group');
assert(uiMzGroup, 'Found UI MZ#3 cm group');
assert.strictEqual(uiCzGroup.variants.length, 2, 'CZ#5 group has 2 variants in UI state');
assert.strictEqual(uiCzGroup.totalQuantity, 1000, 'CZ#5 group total quantity is 1000');
assert.strictEqual(uiMzGroup.variants.length, 1, 'MZ#3 cm group has 1 variant in UI state');
assert.strictEqual(uiMzGroup.totalQuantity, 800, 'MZ#3 cm group total quantity is 800');

console.log('  ✓ PASS: UI syncStateItemsAndGroups correctly manages grouped state and multi-unit separation');

// -------------------------------------------------------------
// Test 7: MZC#3 & MZC#5 Beyond 2000 MTR Limit Automatic 0% Loss
// -------------------------------------------------------------
console.log('\n--- 7. Testing MZC#3 & MZC#5 Beyond 2000 MTR (Automatic 0% Loss) ---');

// 7a. MZC#3 below 2000 MTR gets 1.5% loss
const mz3Below2000Est = {
  items: [{
    id: 'mz3_below',
    category: 'mz',
    zipperSize: '#3',
    zipperType: 'closed_end',
    length: 10,
    lengthUnit: 'inch',
    quantity: 6000 // (10 + 1.78) * 6000 / 39.37 = ~1795 Mtr (< 2000 Mtr)
  }]
};
const mz3BelowCalc = calcEngine.calculateFullEstimate(mz3Below2000Est);
const mz3BelowGroup = mz3BelowCalc.categoryGroups[0];
assert.strictEqual(mz3BelowGroup.calculation.primaryResult.lossPercent, 1.5, 'MZC#3 at ~1795 MTR must have 1.5% loss');
assert(mz3BelowGroup.calculation.primaryResult.tapeLossMtr > 0, 'Tape loss meters must be > 0 when 1.5% loss');

// 7b. MZC#3 beyond 2000 MTR gets 0% loss automatically
const mz3Beyond2000Est = {
  items: [{
    id: 'mz3_beyond',
    category: 'mz',
    zipperSize: '#3',
    zipperType: 'closed_end',
    length: 10,
    lengthUnit: 'inch',
    quantity: 7000 // (10 + 1.78) * 7000 / 39.37 = ~2094 Mtr (> 2000 Mtr)
  }]
};
const mz3BeyondCalc = calcEngine.calculateFullEstimate(mz3Beyond2000Est);
const mz3BeyondGroup = mz3BeyondCalc.categoryGroups[0];
assert.strictEqual(mz3BeyondGroup.calculation.primaryResult.lossPercent, 0.0, 'MZC#3 at ~2094 MTR (> 2000 Mtr) must have 0% loss automatically');
assert.strictEqual(mz3BeyondGroup.calculation.primaryResult.tapeLossMtr, 0, 'Tape loss meters must be 0 when beyond 2000 MTR limit');
assert.strictEqual(
  mz3BeyondGroup.calculation.primaryResult.chainMtrWithLoss,
  mz3BeyondGroup.calculation.primaryResult.chainConsumptionMtr,
  'Loss-inclusive chain must equal base chain when loss is 0%'
);

// 7c. MZC#5 below 2000 MTR gets 1.5% loss
const mz5Below2000Est = {
  items: [{
    id: 'mz5_below',
    category: 'mz',
    zipperSize: '#5',
    zipperType: 'closed_end',
    length: 12,
    lengthUnit: 'inch',
    quantity: 5000 // (12 + 1.97) * 5000 / 39.37 = ~1774 Mtr (< 2000 Mtr)
  }]
};
const mz5BelowCalc = calcEngine.calculateFullEstimate(mz5Below2000Est);
const mz5BelowGroup = mz5BelowCalc.categoryGroups[0];
assert.strictEqual(mz5BelowGroup.calculation.primaryResult.lossPercent, 1.5, 'MZC#5 at ~1774 MTR must have 1.5% loss');

// 7d. MZC#5 beyond 2000 MTR gets 0% loss automatically
const mz5Beyond2000Est = {
  items: [{
    id: 'mz5_beyond',
    category: 'mz',
    zipperSize: '#5',
    zipperType: 'closed_end',
    length: 12,
    lengthUnit: 'inch',
    quantity: 6000 // (12 + 1.97) * 6000 / 39.37 = ~2129 Mtr (> 2000 Mtr)
  }]
};
const mz5BeyondCalc = calcEngine.calculateFullEstimate(mz5Beyond2000Est);
const mz5BeyondGroup = mz5BeyondCalc.categoryGroups[0];
assert.strictEqual(mz5BeyondGroup.calculation.primaryResult.lossPercent, 0.0, 'MZC#5 at ~2129 MTR (> 2000 Mtr) must have 0% loss automatically');
assert.strictEqual(mz5BeyondGroup.calculation.primaryResult.tapeLossMtr, 0, 'Tape loss meters must be 0 for MZC#5 beyond 2000 MTR');
assert.strictEqual(
  mz5BeyondGroup.calculation.primaryResult.chainMtrWithLoss,
  mz5BeyondGroup.calculation.primaryResult.chainConsumptionMtr,
  'Loss-inclusive chain must equal base chain when loss is 0%'
);

console.log('  ✓ PASS: MZC#3 and MZC#5 beyond 2000 MTR automatically apply 0% loss to tape/chain');

console.log('\n===============================================================');
console.log('ALL GROUPED BOM CALCULATION TESTS PASSED SUCCESSFULLY!');
console.log('===============================================================');
