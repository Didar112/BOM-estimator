/**
 * Comprehensive Test Suite for Dynamic Zipper Class Loss Percentage Mechanism
 */

global.window = {};

require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
require('./js/formulas/pz.js');
require('./js/materials.js');
require('./js/bomRules.js');
require('./js/calculations.js');
require('./js/storage.js');

const calc = window.CalculatorEngine;

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message, tolerance = 0.0001) {
  totalTests++;
  let pass = false;
  if (typeof actual === 'string' || typeof expected === 'string') {
    pass = actual === expected;
  } else {
    pass = Math.abs(actual - expected) <= tolerance;
  }
  if (pass) {
    passedTests++;
    console.log(`  ✓ PASS: ${message} (Got: ${actual})`);
  } else {
    console.error(`  ✗ FAIL: ${message} (Expected: ${expected}, Got: ${actual})`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('\n====================================================');
console.log('TESTING DYNAMIC ZIPPER CLASS LOSS PERCENTAGE');
console.log('====================================================\n');

// 1. Zipper Class Identification
console.log('--- 1. Testing Zipper Class Identification & Exclusions ---');
assertEquals(calc.getVariantZipperClass('cz', 'closed_end', '#3'), 'CZC#3', 'CZ Closed-End #3 is CZC#3');
assertEquals(calc.getVariantZipperClass('cz', 'open_end', '#5'), 'CZO#5', 'CZ Open-End #5 is CZO#5');
assertEquals(calc.getVariantZipperClass('mz', 'closed_end', '#3'), 'MZC#3', 'MZ Closed-End #3 is MZC#3');
assertEquals(calc.getVariantZipperClass('mz', 'closed_end', '#4'), 'MZC#4', 'MZ Closed-End #4 is MZC#4');
assertEquals(calc.getVariantZipperClass('mz', 'closed_end', '#5'), 'MZC#5', 'MZ Closed-End #5 is MZC#5');
assertEquals(calc.getVariantZipperClass('mz', 'open_end', '#5'), 'MZO#5', 'MZ Open-End #5 is MZO#5');

// EXCLUSION: two_way must NOT be classified as Open-End
assert(calc.getVariantZipperClass('mz', 'two_way', '#5') === 'MZO#5_two_way' || !calc.isClassEligibleForDynamicLoss(calc.getVariantZipperClass('mz', 'two_way', '#5')), 'MZ two_way is NOT classified as eligible Open-End class');
assert(!calc.isClassEligibleForDynamicLoss('MZO#5_two_way'), 'MZO#5_two_way is ineligible for dynamic loss');
assert(calc.getDynamicLossPercentage('MZO#5_two_way', 1000) === null, 'MZO#5_two_way dynamic loss is null');

// PZ Classes
assertEquals(calc.getVariantZipperClass('pz', 'closed_end', '#3'), 'PZC#3', 'PZ Closed-End #3 is PZC#3');
assertEquals(calc.getVariantZipperClass('pz', 'open_end', '#3'), 'PZO#3', 'PZ Open-End #3 is PZO#3');
assertEquals(calc.getVariantZipperClass('pz', 'closed_end', '#5'), 'PZC#5', 'PZ Closed-End #5 is PZC#5');
assertEquals(calc.getVariantZipperClass('pz', 'open_end', '#5'), 'PZO#5', 'PZ Open-End #5 is PZO#5');

// EXCLUSION: PZ#8 is NOT in the chart and must remain blank / ineligible
const pz8Class = calc.getVariantZipperClass('pz', 'closed_end', '#8');
assert(!calc.isClassEligibleForDynamicLoss(pz8Class), 'PZ#8 is ineligible for dynamic loss');
assert(calc.getDynamicLossPercentage(pz8Class, 1000) === null, 'PZ#8 dynamic loss returns null (blank)');

// EXCLUSION: PZ two_way is NOT treated as Open-End
const pzTwoWayClass = calc.getVariantZipperClass('pz', 'two_way', '#5');
assert(!calc.isClassEligibleForDynamicLoss(pzTwoWayClass), 'PZ two_way is ineligible for dynamic loss');
assert(calc.getDynamicLossPercentage(pzTwoWayClass, 1000) === null, 'PZ two_way dynamic loss returns null');

// 2. Bracket Boundaries for CZ (CZC#3, CZO#3, CZC#5, CZO#5)
console.log('\n--- 2. Testing CZ Dynamic Loss Boundaries (Official Chart) ---');
assertEquals(calc.getDynamicLossPercentage('CZC#3', 50), 8.0, 'CZC#3 50 MTR -> 8%');
assertEquals(calc.getDynamicLossPercentage('CZC#3', 199), 8.0, 'CZC#3 199 MTR -> 8%');
assertEquals(calc.getDynamicLossPercentage('CZC#3', 200), 3.0, 'CZC#3 200 MTR -> 3% (200-5000 range)');
assertEquals(calc.getDynamicLossPercentage('CZC#3', 5000), 3.0, 'CZC#3 5000 MTR -> 3%');
assertEquals(calc.getDynamicLossPercentage('CZC#3', 5001), 2.0, 'CZC#3 5001 MTR -> 2% (ABOVE 5000)');
assertEquals(calc.getDynamicLossPercentage('CZO#5', 199), 8.0, 'CZO#5 199 MTR -> 8%');
assertEquals(calc.getDynamicLossPercentage('CZO#5', 200), 3.0, 'CZO#5 200 MTR -> 3%');
assertEquals(calc.getDynamicLossPercentage('CZO#5', 5001), 2.0, 'CZO#5 5001 MTR -> 2%');

// 3. Bracket Boundaries for MZ
console.log('\n--- 3. Testing MZ Dynamic Loss Boundaries (Official Chart) ---');
// MZC#3: 0-200: 8%, 200-500: 7%, 500-1000: 3%, 1000-2000: 1.5%, >2000: 0%
assertEquals(calc.getDynamicLossPercentage('MZC#3', 100), 8.0, 'MZC#3 100 MTR -> 8%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 199), 8.0, 'MZC#3 199 MTR -> 8%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 200), 7.0, 'MZC#3 200 MTR -> 7%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 500), 7.0, 'MZC#3 500 MTR -> 7%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 501), 3.0, 'MZC#3 501 MTR -> 3%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 1000), 3.0, 'MZC#3 1000 MTR -> 3%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 1001), 1.5, 'MZC#3 1001 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 2000), 1.5, 'MZC#3 2000 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 2001), 0.0, 'MZC#3 2001 MTR -> 0% (beyond 2000 MTR limit)');
assertEquals(calc.getDynamicLossPercentage('MZC#3', 5000), 0.0, 'MZC#3 5000 MTR -> 0% (beyond 2000 MTR limit)');

// MZC#4 & MZC#5: 0-200: 8%, 200-1000: 2%, 1000-2000: 1.5%, >2000: 0%
assertEquals(calc.getDynamicLossPercentage('MZC#4', 199), 8.0, 'MZC#4 199 MTR -> 8%');
assertEquals(calc.getDynamicLossPercentage('MZC#4', 200), 2.0, 'MZC#4 200 MTR -> 2%');
assertEquals(calc.getDynamicLossPercentage('MZC#4', 1000), 2.0, 'MZC#4 1000 MTR -> 2%');
assertEquals(calc.getDynamicLossPercentage('MZC#4', 1001), 1.5, 'MZC#4 1001 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZC#4', 2000), 1.5, 'MZC#4 2000 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZC#4', 2001), 0.0, 'MZC#4 2001 MTR -> 0% (beyond 2000 MTR limit)');
assertEquals(calc.getDynamicLossPercentage('MZC#5', 200), 2.0, 'MZC#5 200 MTR -> 2%');
assertEquals(calc.getDynamicLossPercentage('MZC#5', 1001), 1.5, 'MZC#5 1001 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZC#5', 2000), 1.5, 'MZC#5 2000 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZC#5', 2001), 0.0, 'MZC#5 2001 MTR -> 0% (beyond 2000 MTR limit)');
assertEquals(calc.getDynamicLossPercentage('MZC#5', 10000), 0.0, 'MZC#5 10000 MTR -> 0% (beyond 2000 MTR limit)');

// MZO#5: 0-200: 8%, 200-500: 6%, 500-2000: 3%, 2000-5000: 1.5%, ABOVE 5000: 1%
assertEquals(calc.getDynamicLossPercentage('MZO#5', 199), 8.0, 'MZO#5 199 MTR -> 8%');
assertEquals(calc.getDynamicLossPercentage('MZO#5', 200), 6.0, 'MZO#5 200 MTR -> 6%');
assertEquals(calc.getDynamicLossPercentage('MZO#5', 500), 6.0, 'MZO#5 500 MTR -> 6%');
assertEquals(calc.getDynamicLossPercentage('MZO#5', 501), 3.0, 'MZO#5 501 MTR -> 3%');
assertEquals(calc.getDynamicLossPercentage('MZO#5', 2000), 3.0, 'MZO#5 2000 MTR -> 3%');
assertEquals(calc.getDynamicLossPercentage('MZO#5', 2001), 1.5, 'MZO#5 2001 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZO#5', 5000), 1.5, 'MZO#5 5000 MTR -> 1.5%');
assertEquals(calc.getDynamicLossPercentage('MZO#5', 5001), 1.0, 'MZO#5 5001 MTR -> 1%');

// 4. Bracket Boundaries for PZ
console.log('\n--- 4. Testing PZ Dynamic Loss Boundaries (Official Chart) ---');
// PZC#3, PZO#3, PZC#5, PZO#5: 0-200: 8%, 200-500: 6%, 500-5000: 3%, 5000-50000: 2%, ABOVE 50000: 1.5%
['PZC#3', 'PZO#3', 'PZC#5', 'PZO#5'].forEach(cls => {
  assertEquals(calc.getDynamicLossPercentage(cls, 199), 8.0, `${cls} 199 MTR -> 8%`);
  assertEquals(calc.getDynamicLossPercentage(cls, 200), 6.0, `${cls} 200 MTR -> 6%`);
  assertEquals(calc.getDynamicLossPercentage(cls, 500), 6.0, `${cls} 500 MTR -> 6%`);
  assertEquals(calc.getDynamicLossPercentage(cls, 501), 3.0, `${cls} 501 MTR -> 3%`);
  assertEquals(calc.getDynamicLossPercentage(cls, 5000), 3.0, `${cls} 5000 MTR -> 3%`);
  assertEquals(calc.getDynamicLossPercentage(cls, 5001), 2.0, `${cls} 5001 MTR -> 2%`);
  assertEquals(calc.getDynamicLossPercentage(cls, 50000), 2.0, `${cls} 50000 MTR -> 2%`);
  assertEquals(calc.getDynamicLossPercentage(cls, 50001), 1.5, `${cls} 50001 MTR -> 1.5%`);
});

// 5. User Prompt Example 1: CZ#3
console.log('\n--- 5. User Example 1: CZ#3 (9,380 PCS) End-to-End ---');
const cz3Group = {
  id: 'g_cz3_user',
  name: 'CZ#3 Order',
  category: 'cz',
  variants: [
    { id: 'v1', zipperSize: '#3', zipperType: 'closed_end', length: 7.5, lengthUnit: 'inch', quantity: 4000 },
    { id: 'v2', zipperSize: '#3', zipperType: 'closed_end', length: 9.0, lengthUnit: 'inch', quantity: 3380 },
    { id: 'v3', zipperSize: '#3', zipperType: 'closed_end', length: 9.5, lengthUnit: 'inch', quantity: 2000 }
  ]
};

const consolidation = calc.consolidateGroupClasses(cz3Group.variants, 'cz', {}, {});
assert(consolidation['CZC#3'] !== undefined, 'Consolidation created CZC#3 class');
assertEquals(consolidation['CZC#3'].baseChainMtr, 2393.71, 'Combined base chain consumption ≈ 2,393.71 MTR', 0.01);
assertEquals(Math.round(consolidation['CZC#3'].baseChainMtr), 2394, 'Rounded display consumption = 2,394 MTR');
assertEquals(consolidation['CZC#3'].defaultLossPercent, 3.0, 'Dynamic bracket loss = 3%');
assertEquals(consolidation['CZC#3'].effectiveLossPercent, 3.0, 'Effective loss = 3%');

const fullEst = calc.calculateFullEstimate({ categoryGroups: [cz3Group] });
const calcRes = fullEst.categoryGroups[0];
const tapeRow = calcRes.materials.processedRows.find(r => r.component === 'TOTL TAPE KG');
assert(tapeRow !== undefined, 'TOTL TAPE KG row exists');
// Formula check: 2393.71 * 1.03 / 87 = 28.339 kg
assertEquals(tapeRow.totalQuantity, 28.339, 'Final Tape KG with 3% dynamic loss ≈ 28.34 KG', 0.01);

// 6. User Manual Override
console.log('\n--- 6. User Manual Override Test ---');
const overrideConsolidation = calc.consolidateGroupClasses(cz3Group.variants, 'cz', {}, { 'CZC#3': 4.0 });
assert(overrideConsolidation['CZC#3'].isOverridden === true, 'isOverridden flag is true');
assertEquals(overrideConsolidation['CZC#3'].effectiveLossPercent, 4.0, 'Effective loss is overridden to 4.0%');

const overriddenGroup = {
  ...cz3Group,
  classLossOverrides: { 'CZC#3': 4.0 }
};
const overrideFullEst = calc.calculateFullEstimate({ categoryGroups: [overriddenGroup] });
const overrideCalcRes = overrideFullEst.categoryGroups[0];
const overrideTapeRow = overrideCalcRes.materials.processedRows.find(r => r.component === 'TOTL TAPE KG');
// 2393.71 * 1.04 / 87 = 28.614 kg
assertEquals(overrideTapeRow.totalQuantity, 28.614, 'Final Tape KG with 4% manual override ≈ 28.61 KG', 0.01);

// 7. Multi-Class Group within Same Category
console.log('\n--- 7. Multi-Class Group in Same Category (MZ) ---');
const mixedMzGroup = {
  id: 'g_mz_mixed',
  name: 'Mixed MZ',
  category: 'mz',
  variants: [
    // MZC#3: 10" closed_end @ 1,000 pcs -> (10 + 1.78) * 1000 / 39.37 = 299.21 MTR -> 201-500 MTR -> 7% loss
    { id: 'v_mzc3', zipperSize: '#3', zipperType: 'closed_end', length: 10, lengthUnit: 'inch', quantity: 1000 },
    // MZO#5: 10" open_end @ 300 pcs -> (10 + 1.97) * 300 / 39.37 = 91.21 MTR -> 0-200 MTR -> 8% loss
    { id: 'v_mzo5', zipperSize: '#5', zipperType: 'open_end', length: 10, lengthUnit: 'inch', quantity: 300 }
  ]
};

const mixedMzConsolidation = calc.consolidateGroupClasses(mixedMzGroup.variants, 'mz', {}, {});
assertEquals(mixedMzConsolidation['MZC#3'].defaultLossPercent, 7.0, 'MZC#3 299 MTR gets 7% loss');
assertEquals(mixedMzConsolidation['MZO#5'].defaultLossPercent, 8.0, 'MZO#5 91 MTR gets 8% loss');

const mixedMzFullEst = calc.calculateFullEstimate({ categoryGroups: [mixedMzGroup] });
const mixedMzCalc = mixedMzFullEst.categoryGroups[0];
assert(mixedMzCalc.classConsolidation['MZC#3'].effectiveLossPercent === 7.0, 'MZC#3 effective loss = 7%');
assert(mixedMzCalc.classConsolidation['MZO#5'].effectiveLossPercent === 8.0, 'MZO#5 effective loss = 8%');

// 8. PZ#8 Ineligibility and Blank UI Behavior
console.log('\n--- 8. PZ#8 Ineligible / Blank Test ---');
const pz8Group = {
  id: 'g_pz8',
  name: 'PZ#8 Order',
  category: 'pz',
  variants: [
    { id: 'v_pz8', zipperSize: '#8', zipperType: 'closed_end', length: 12, lengthUnit: 'inch', quantity: 1000 }
  ]
};
const pz8Consolidation = calc.consolidateGroupClasses(pz8Group.variants, 'pz', {}, {});
assert(pz8Consolidation['PZC#8'] !== undefined, 'PZC#8 entry exists');
assert(pz8Consolidation['PZC#8'].isEligible === false, 'PZC#8 is NOT eligible for dynamic loss');
assert(pz8Consolidation['PZC#8'].defaultLossPercent === null, 'PZC#8 default loss is null (blank)');
assert(pz8Consolidation['PZC#8'].effectiveLossPercent === null, 'PZC#8 effective loss is null (blank)');

console.log('\n====================================================');
console.log(`DYNAMIC CLASS LOSS TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================\n');
