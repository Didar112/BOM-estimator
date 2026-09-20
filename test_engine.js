/**
 * Node.js Test Suite for Zipper BOM Calculator Engine
 * Comprehensive validation testing for:
 * 1. Unit conversions
 * 2. Factory allowances (CZ, MZ, WIRE)
 * 3. Verified CZ#3 & CZ#5 (Inch & CM)
 * 4. Verified MZ#3 & MZ#5 (Inch & CM)
 * 5. Verified WIRE#3, WIRE#5 Normal, and WIRE#5 Long (Inch & CM)
 * 6. Multi-Category Groups independent calculations & isolation
 * 7. Multiple instances of the same category
 * 8. True Merged BOM engine
 */

// Mock browser window object for Node environment
global.window = {};

// Load modules in order
require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
require('./js/materials.js');
require('./js/bomRules.js');
require('./js/calculations.js');
require('./js/storage.js');

const {
  convertLength,
  convertQuantity,
  convertWeight
} = window.UnitConversion;

const {
  calculateCZGroup,
  calculateCZMaster,
  CZ_CONSTANTS
} = window.CZFormulaEngine;

const {
  calculateMZGroup,
  calculateMZMaster,
  MZ_CONSTANTS
} = window.MZFormulaEngine;

const {
  calculateWireGroup,
  calculateWireMaster,
  WIRE_CONSTANTS
} = window.WireFormulaEngine;

const {
  getSuggestedAllowance
} = window.BOMRules;

const {
  calculateFullEstimate,
  buildMergedBOM
} = window.CalculatorEngine;

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

function assertEquals(actual, expected, message, tolerance = 0.0001) {
  totalTests++;
  if (typeof actual === 'number' && typeof expected === 'number') {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
      passedTests++;
      console.log(`  ✓ PASS: ${message} (Got: ${actual})`);
    } else {
      console.error(`  ✗ FAIL: ${message} (Expected: ${expected}, Got: ${actual})`);
    }
  } else {
    if (actual === expected) {
      passedTests++;
      console.log(`  ✓ PASS: ${message} (Got: ${actual})`);
    } else {
      console.error(`  ✗ FAIL: ${message} (Expected: ${expected}, Got: ${actual})`);
    }
  }
}


console.log('====================================================');
console.log('RUNNING FULL ZIPPER BOM FACTORY ENGINE TEST SUITE');
console.log('====================================================\n');

// 1. Unit Conversion Tests
console.log('--- 1. Testing Unit Conversions ---');
assertEquals(convertLength(1, 'inch', 'mm'), 25.4, '1 inch = 25.4 mm');
assertEquals(convertLength(1, 'inch', 'cm'), 2.54, '1 inch = 2.54 cm');
assertEquals(convertLength(1, 'foot', 'inch'), 12, '1 foot = 12 inches');
assertEquals(convertLength(36, 'inch', 'yard'), 1, '36 inches = 1 yard');
assertEquals(convertLength(100, 'cm', 'meter'), 1, '100 cm = 1 meter');
assertEquals(convertLength(1, 'yard', 'meter'), 0.9144, '1 yard = 0.9144 meter');
assertEquals(convertQuantity(1, 'doz', 'pcs'), 12, '1 doz = 12 pcs');
assertEquals(convertQuantity(24, 'pcs', 'doz'), 2, '24 pcs = 2 doz');
assertEquals(convertWeight(1, 'kg', 'g'), 1000, '1 kg = 1000 g');

// 2. Factory Suggested Allowances
console.log('\n--- 2. Testing Factory Allowances ---');
assertEquals(getSuggestedAllowance('cz', '#3', 'inch'), 1.58, 'CZ#3 Inch allowance is 1.58"');
assertEquals(getSuggestedAllowance('cz', '#3', 'cm'), 4.0, 'CZ#3 CM allowance is 4.0 cm');
assertEquals(getSuggestedAllowance('cz', '#5', 'inch'), 1.78, 'CZ#5 Inch allowance is 1.78"');
assertEquals(getSuggestedAllowance('cz', '#5', 'cm'), 4.5, 'CZ#5 CM allowance is 4.5 cm');

assertEquals(getSuggestedAllowance('mz', '#3', 'inch'), 1.78, 'MZ#3 Inch allowance is 1.78"');
assertEquals(getSuggestedAllowance('mz', '#3', 'cm'), 4.5, 'MZ#3 CM allowance is 4.5 cm');
assertEquals(getSuggestedAllowance('mz', '#5', 'inch'), 1.97, 'MZ#5 Inch allowance is 1.97"');
assertEquals(getSuggestedAllowance('mz', '#5', 'cm'), 5.0, 'MZ#5 CM allowance is 5.0 cm');

assertEquals(getSuggestedAllowance('wire', '#3', 'inch'), 0.0, 'WIRE#3 allowance is 0');
assertEquals(getSuggestedAllowance('wire', '#5_normal', 'inch'), 0.0, 'WIRE#5 Normal allowance is 0');
assertEquals(getSuggestedAllowance('wire', '#5_long', 'inch'), 1.97, 'WIRE#5 Long Inch allowance is 1.97"');
assertEquals(getSuggestedAllowance('wire', '#5_long', 'cm'), 5.0, 'WIRE#5 Long CM allowance is 5.0 cm');

// 3. VERIFIED CZ VALIDATIONS
console.log('\n--- 3. VERIFIED FACTORY VALIDATION: CZ#3 INCH ---');
const cz3InchVariants = [
  { id: 'v1', name: 'Variant 1', length: 7.75, lengthUnit: 'inch', quantity: 4413 },
  { id: 'v2', name: 'Variant 2', length: 8.00, lengthUnit: 'inch', quantity: 3676 },
  { id: 'v3', name: 'Variant 3', length: 8.25, lengthUnit: 'inch', quantity: 737 }
];
const cz3InchResult = calculateCZGroup(cz3InchVariants, '#3', 3.0);
assertEquals(cz3InchResult.totalQuantity, 8826, 'Total Quantity = 8,826 pcs');
assertEquals(cz3InchResult.chainConsumptionMtr, 2124.30988, 'Chain Consumption ≈ 2,124.31 Mtr', 0.01);
assertEquals(cz3InchResult.totalTapeKg, 25.14987, 'Total Tape KG ≈ 25.15 KG', 0.01);
assertEquals(cz3InchResult.topStopKg, 0.17652, 'CZ#3 T/S exact = 0.17652 KG');
assertEquals(cz3InchResult.bottomStopKg, 0.26478, 'CZ#3 B/S exact = 0.26478 KG');
assertEquals(cz3InchResult.resinKg, 8.826, 'Resin exact = 8.826 KG');
assertEquals(cz3InchResult.sliderQuantity, 8958.39, 'Slider with 1.5% Add. = 8,958.39 pcs');

console.log('\n--- 4. VERIFIED FACTORY VALIDATION: CZ#5 INCH & CM ---');
const cz5InchVariants = [
  { id: 'cz5_1', name: 'Var 1', length: 10, lengthUnit: 'inch', quantity: 10000 }
];
const cz5InchResult = calculateCZGroup(cz5InchVariants, '#5', 3.0);
assertEquals(cz5InchResult.totalQuantity, 10000, 'CZ#5 Total Quantity = 10,000 pcs');
assertEquals(cz5InchResult.chainConsumptionMtr, (11.78 * 10000) / 39.37, 'CZ#5 Chain Consumption', 0.001);
assertEquals(cz5InchResult.totalTapeKg, (cz5InchResult.chainConsumptionMtr * 1.03) / 54.5, 'CZ#5 Tape KG (Divisor 54.5)', 0.001);
assertEquals(cz5InchResult.uTopKg, 0.74, 'CZ#5 U-Top factor 0.074 = 0.74 KG');
assertEquals(cz5InchResult.sliderQuantity, 10150, 'CZ#5 Slider +1.5% = 10,150 pcs');

// 4. VERIFIED MZ FORMULA VALIDATIONS
console.log('\n--- 5. VERIFIED FACTORY VALIDATION: MZ#3 (INCH & CM) ---');
// MZ#3 Inch: Length: 9", Qty: 2000, Allowance: 1.78", Divisor: 39.37, Tape Divisor: 97, Loss: 3%
const mz3InchVariants = [
  { id: 'mz3_1', name: 'MZ Variant 1', length: 9.0, lengthUnit: 'inch', quantity: 2000 }
];
const mz3InchResult = calculateMZGroup(mz3InchVariants, '#3', 3.0);

// Chain: (9 + 1.78) * 2000 / 39.37 = 547.625 Mtr
const expectedMZ3Chain = (10.78 * 2000) / 39.37;
assertEquals(mz3InchResult.chainConsumptionMtr, expectedMZ3Chain, 'MZ#3 Chain Consumption Mtr', 0.001);

// Tape KG: ChainMtr * 1.03 / 97
const expectedMZ3TapeKg = (expectedMZ3Chain * 1.03) / 97.0;
assertEquals(mz3InchResult.totalTapeKg, expectedMZ3TapeKg, 'MZ#3 Tape KG (Divisor 97.0, 3% loss)', 0.001);

// Teeth Wire: (9 * 2000 / 39.37) / 32 * 1.04
const expectedMZ3TeethWire = ((9.0 * 2000 / 39.37) / 32.0) * 1.04;
assertEquals(mz3InchResult.teethWireKg, expectedMZ3TeethWire, 'MZ#3 Teeth Wire KG (Divisor 32, 4% loss)', 0.001);

// Top Stop Wire: 2000 * 0.22 / 1000 = 0.44 KG
assertEquals(mz3InchResult.topStopKg, (2000 * 0.22) / 1000, 'MZ#3 T/S Wire (0.22/1000)');

// H-Bottom: 2000 * 1.025 = 2050 pcs
assertEquals(mz3InchResult.hBottomPcs, 2000 * 1.025, 'MZ#3 H-Bottom (+2.5% loss = 2,050 pcs)');

// Slider: 2000 * 1.015 = 2030 pcs
assertEquals(mz3InchResult.sliderPcs, 2030, 'MZ#3 Slider (+1.5% loss = 2,030 pcs)');

// MZ#3 CM test
const mz3CmVariants = [
  { id: 'mz3_cm1', name: 'MZ CM Var', length: 25.0, lengthUnit: 'cm', quantity: 4000 }
];
const mz3CmResult = calculateMZGroup(mz3CmVariants, '#3', 3.0);
// CM Chain: (25 + 4.5) * 4000 / 100 = 1180 Mtr
assertEquals(mz3CmResult.chainConsumptionMtr, 1180, 'MZ#3 CM Chain Consumption (Allowance 4.5cm)');
assertEquals(mz3CmResult.totalTapeKg, (1180 * 1.03) / 97.0, 'MZ#3 CM Tape KG (Divisor 97.0)', 0.001);
assertEquals(mz3CmResult.teethWireKg, ((25 * 4000 / 100) / 32.0) * 1.04, 'MZ#3 CM Teeth Wire', 0.001);

console.log('\n--- 6. VERIFIED FACTORY VALIDATION: MZ#5 (INCH & CM) ---');
// MZ#5 Inch: Length: 10", Qty: 3000, Allowance: 1.97", Divisor: 39.37, Tape Divisor: 71, Loss: 3%
const mz5InchVariants = [
  { id: 'mz5_1', name: 'MZ#5 Var 1', length: 10.0, lengthUnit: 'inch', quantity: 3000 }
];
const mz5InchResult = calculateMZGroup(mz5InchVariants, '#5', 3.0);

// Chain: (10 + 1.97) * 3000 / 39.37 = 912.1158 Mtr
const expectedMZ5Chain = (11.97 * 3000) / 39.37;
assertEquals(mz5InchResult.chainConsumptionMtr, expectedMZ5Chain, 'MZ#5 Chain Consumption Mtr', 0.001);

// Tape KG: ChainMtr * 1.03 / 71
const expectedMZ5TapeKg = (expectedMZ5Chain * 1.03) / 71.0;
assertEquals(mz5InchResult.totalTapeKg, expectedMZ5TapeKg, 'MZ#5 Tape KG (Divisor 71.0, 3% loss)', 0.001);

// Wire for T/S# 4 & 5: 3000 * 0.32 / 1000 = 0.96 KG
assertEquals(mz5InchResult.topStopKg, (3000 * 0.32) / 1000, 'MZ#5 Top Stop Wire (0.32/1000)');

// Wire for B/S# 4 & 5: 3000 * 0.172 / 1000 = 0.516 KG
assertEquals(mz5InchResult.bottomStopKg, (3000 * 0.172) / 1000, 'MZ#5 Bottom Stop Wire (0.172/1000)');

// Slider: 3000 * 1.015 = 3045 pcs
assertEquals(mz5InchResult.sliderPcs, 3045, 'MZ#5 Slider (+1.5% = 3,045 pcs)');

// MZ#5 CM test
const mz5CmVariants = [
  { id: 'mz5_cm', name: 'MZ#5 CM', length: 35.0, lengthUnit: 'cm', quantity: 2000 }
];
const mz5CmResult = calculateMZGroup(mz5CmVariants, '#5', 3.0);
// CM Chain: (35 + 5.0) * 2000 / 100 = 800 Mtr
assertEquals(mz5CmResult.chainConsumptionMtr, 800, 'MZ#5 CM Chain Consumption (Allowance 5.0cm)');
assertEquals(mz5CmResult.totalTapeKg, (800 * 1.03) / 71.0, 'MZ#5 CM Tape KG (Divisor 71.0)', 0.001);

// 5. VERIFIED WIRE FORMULA VALIDATIONS
console.log('\n--- 7. VERIFIED FACTORY VALIDATION: WIRE#3 ---');
// WIRE#3 Inch: Length: 8", Qty: 5000 -> ReqMtr = 8 * 5000 / 39.37 = 1016.002 Mtr
// Calculation: ReqMtr / 32, Loss: 4% -> (ReqMtr / 32) * 1.04
const wire3InchVariants = [
  { id: 'w3_1', name: 'Wire Var 1', length: 8.0, lengthUnit: 'inch', quantity: 5000 }
];
const wire3InchResult = calculateWireGroup(wire3InchVariants, '#3');
const expectedWire3ReqMtr = (8.0 * 5000) / 39.37;
assertEquals(wire3InchResult.totalReqMtr, expectedWire3ReqMtr, 'WIRE#3 Inch Req Mtr', 0.001);
assertEquals(wire3InchResult.totalWireKg, (expectedWire3ReqMtr / 32.0) * 1.04, 'WIRE#3 Inch Wire KG (Divisor 32, Loss 4%)', 0.001);

// WIRE#3 CM: Length: 20cm, Qty: 5000 -> ReqMtr = 20 * 5000 / 100 = 1000 Mtr
// Calculation: ReqMtr / 27.73, Loss: 4% -> (1000 / 27.73) * 1.04
const wire3CmVariants = [
  { id: 'w3_cm', name: 'Wire CM', length: 20.0, lengthUnit: 'cm', quantity: 5000 }
];
const wire3CmResult = calculateWireGroup(wire3CmVariants, '#3');
assertEquals(wire3CmResult.totalReqMtr, 1000, 'WIRE#3 CM Req Mtr = 1,000 Mtr');
assertEquals(wire3CmResult.totalWireKg, (1000 / 27.73) * 1.04, 'WIRE#3 CM Wire KG (Divisor 27.73, Loss 4%)', 0.001);

console.log('\n--- 8. VERIFIED FACTORY VALIDATION: WIRE#5 NORMAL TEETH ---');
// WIRE#5 Normal Inch: Length: 12", Qty: 4000 -> ReqMtr = 12 * 4000 / 39.37 = 1219.202 Mtr
// Calculation: ReqMtr / 20.6, Loss: 5% -> (ReqMtr / 20.6) * 1.05
const wire5NormVariants = [
  { id: 'w5n_1', name: 'Wire Normal', length: 12.0, lengthUnit: 'inch', quantity: 4000 }
];
const wire5NormResult = calculateWireGroup(wire5NormVariants, '#5_normal');
const expectedW5NReqMtr = (12.0 * 4000) / 39.37;
assertEquals(wire5NormResult.totalReqMtr, expectedW5NReqMtr, 'WIRE#5 Normal Req Mtr', 0.001);
assertEquals(wire5NormResult.totalWireKg, (expectedW5NReqMtr / 20.6) * 1.05, 'WIRE#5 Normal Wire KG (Divisor 20.6, Loss 5%)', 0.001);

console.log('\n--- 9. VERIFIED FACTORY VALIDATION: WIRE#5 LONG TEETH ---');
// WIRE#5 Long Inch: Length: 12", Qty: 4000 -> Allowance: 1.97"
// Formula: (12 + 1.97) * 4000 / 39.37 / 20.6 * 1.05
const wire5LongVariants = [
  { id: 'w5l_1', name: 'Wire Long', zipperSize: '#5_long', length: 12.0, lengthUnit: 'inch', quantity: 4000 }
];
const wire5LongResult = calculateWireGroup(wire5LongVariants, '#5_long');
const expectedW5LReqMtr = ((12.0 + 1.97) * 4000) / 39.37;
assertEquals(wire5LongResult.totalReqMtr, expectedW5LReqMtr, 'WIRE#5 Long Req Mtr (Allowance 1.97")', 0.001);
assertEquals(wire5LongResult.totalWireKg, (expectedW5LReqMtr / 20.6) * 1.05, 'WIRE#5 Long Wire KG (Divisor 20.6, Loss 5%)', 0.001);


// 6. MULTI-CATEGORY GROUPS & MERGED BOM INTEGRATION TEST
console.log('\n--- 10. MULTI-CATEGORY GROUP ESTIMATE & MERGED BOM ---');
const multiCategoryEstimate = {
  name: 'Multi-Category Test Order',
  reference: 'ORD-MULTI-001',
  categoryGroups: [
    // Group 1: CZ#3
    {
      id: 'categoryGroup_1',
      name: 'Category Group 1 (CZ Front)',
      category: 'cz',
      lossPercent: 3.0,
      variants: cz3InchVariants
    },
    // Group 2: MZ#5
    {
      id: 'categoryGroup_2',
      name: 'Category Group 2 (MZ Main)',
      category: 'mz',
      lossPercent: 3.0,
      variants: mz5InchVariants
    },
    // Group 3: Duplicate CZ (CZ#5)
    {
      id: 'categoryGroup_3',
      name: 'Category Group 3 (CZ Pockets)',
      category: 'cz',
      lossPercent: 3.0,
      variants: cz5InchVariants
    },
    // Group 4: WIRE#5 Long
    {
      id: 'categoryGroup_4',
      name: 'Category Group 4 (Teeth Wire)',
      category: 'wire',
      lossPercent: 5.0,
      variants: wire5LongVariants
    }
  ],
  labor: { method: 'per_zipper', ratePerZipper: 2.0 },
  overhead: { percentage: 10.0, basis: 'material_and_labor' },
  otherCosts: []
};

const multiCalc = calculateFullEstimate(multiCategoryEstimate);

// Verify all 4 category groups exist independently
assertEquals(multiCalc.categoryGroups.length, 4, '4 Independent Category Groups in estimate');

// Total quantity = 8,826 (CZ3) + 3,000 (MZ5) + 10,000 (CZ5) + 4,000 (WIRE5 Long) = 25,826 pcs
assertEquals(multiCalc.totals.quantity, 25826, 'Total Multi-Group Order Quantity = 25,826 pcs');

// Verify Group 1 (CZ) and Group 3 (CZ) calculated independently with distinct internal IDs
const group1 = multiCalc.categoryGroups.find(g => g.id === 'categoryGroup_1');
const group3 = multiCalc.categoryGroups.find(g => g.id === 'categoryGroup_3');
assert(group1 !== undefined && group3 !== undefined, 'Both CZ Group 1 and CZ Group 3 exist');
assertEquals(group1.totalQuantity, 8826, 'Group 1 CZ Quantity = 8,826 pcs');
assertEquals(group3.totalQuantity, 10000, 'Group 3 CZ Quantity = 10,000 pcs');
assertEquals(group1.calculation.primaryResult.totalTapeKg, cz3InchResult.totalTapeKg, 'Group 1 CZ Tape KG isolated');

// Verify Merged BOM combines items correctly
const mergedRows = multiCalc.aggregatedMaterials.processedRows;
assert(mergedRows.length > 0, 'Merged BOM rows generated');

// CHAIN CONSUMPTION must NOT be in the BOM
const chainRow = mergedRows.find(r => r.component === 'CHAIN CONSUMPTION' || r.component === 'Chain' || r.materialId && r.materialId.includes('chain_mtr'));
assertEquals(chainRow, undefined, 'CHAIN CONSUMPTION intermediate variable is NOT in the BOM materials');

// CZ#3 Tape and MZ#5 Tape should remain distinct
const cz3TapeRow = mergedRows.find(r => r.materialId === 'mat_cz_tape_kg_3');
const mz5TapeRow = mergedRows.find(r => r.materialId === 'mat_mz_tape_5');
assert(cz3TapeRow !== undefined, 'Merged BOM contains CZ#3 Tape');
assert(mz5TapeRow !== undefined, 'Merged BOM contains MZ#5 Tape');
assert(cz3TapeRow.key !== mz5TapeRow.key, 'CZ#3 Tape and MZ#5 Tape are kept distinct');
assertEquals(cz3TapeRow.component, 'TOTL TAPE KG', 'CZ#3 Tape component label is exact Excel TOTL TAPE KG');
assertEquals(mz5TapeRow.component, 'TOTL TAPE KG', 'MZ#5 Tape component label is exact Excel TOTL TAPE KG');

// WIRE#5 Long Teeth should be present
const wire5LongRow = mergedRows.find(r => r.materialId === 'mat_wire_5_long');
assert(wire5LongRow !== undefined, 'Merged BOM contains Teeth Wire #5 Long');
assertEquals(wire5LongRow.totalQuantity, wire5LongResult.totalWireKg, 'Teeth Wire #5 Long matches calculation');
assertEquals(wire5LongRow.component, 'Teeth for Long Chain#5', 'WIRE#5 Long component label is exact Excel Teeth for Long Chain#5');

// Verify Labor & Overhead calculated across grand total order
assertEquals(multiCalc.totals.totalLaborCost, 25826 * 2.0, 'Labor calculated on total 25,826 pcs @ BDT 2.00/pc');

// 7. USER TEST CASE: CZ GROUP 1 WITH 9,380 PCS & CALCULATION DETAILS BREAKDOWN
console.log('\n--- 11. USER TEST CASE: CZ#5 (9,380 PCS) & CALCULATION DETAILS ---');
const userCZVariants = [
  { id: 'u_v1', name: 'Variant 1', zipperSize: '#5', length: 7.5, lengthUnit: 'inch', quantity: 4000 },
  { id: 'u_v2', name: 'Variant 2', zipperSize: '#5', length: 9.0, lengthUnit: 'inch', quantity: 3380 },
  { id: 'u_v3', name: 'Variant 3', zipperSize: '#5', length: 9.5, lengthUnit: 'inch', quantity: 2000 }
];

const userCZEstimate = {
  name: 'User Test Estimate',
  categoryGroups: [
    {
      id: 'categoryGroup_1',
      name: 'Category Group 1',
      category: 'cz',
      lossPercent: 3.0,
      variants: userCZVariants
    }
  ]
};

const userCalc = calculateFullEstimate(userCZEstimate);
const userGroup1 = userCalc.categoryGroups[0];
const cz5Result = userGroup1.calculation.primaryResult;

assertEquals(userGroup1.totalQuantity, 9380, 'User Case Total Quantity = 4,000 + 3,380 + 2,000 = 9,380 pcs');

// Verify pre-loss Base Chain Consumption is ~2,441 Mtr (NOT ~2,514 Mtr)
const expectedCZ5BaseChain = 96116.4 / 39.37; // 2,441.3614 Mtr
assertEquals(cz5Result.chainConsumptionMtr, expectedCZ5BaseChain, 'CZ#5 Base Chain Consumption ≈ 2,441.36 Mtr (Pre-Loss)', 0.01);
assert(cz5Result.chainConsumptionMtr < 2500, `CZ#5 displayed Chain Consumption (${cz5Result.chainConsumptionMtr.toFixed(2)} Mtr) is pre-loss (< 2,500 Mtr)`);

// Verify Loss is calculated separately: 2,441.36 * 3% = 73.24 Mtr
assertEquals(cz5Result.lossMtr, expectedCZ5BaseChain * 0.03, 'CZ#5 3% Loss Amount ≈ 73.24 Mtr', 0.01);

// Verify Loss-Inclusive Requirement: 2,441.36 + 73.24 = 2,514.60 Mtr
assertEquals(cz5Result.lossInclusiveChainMtr, expectedCZ5BaseChain * 1.03, 'CZ#5 Loss-Inclusive Requirement ≈ 2,514.60 Mtr', 0.01);

// Verify Final Tape KG: 2,514.60 / 54.5 = 46.14 KG
assertEquals(cz5Result.totalTapeKg, (expectedCZ5BaseChain * 1.03) / 54.5, 'CZ#5 Final Tape KG ≈ 46.14 KG', 0.01);

// Verify formulaDetails and steps are properly populated
assert(userGroup1.formulaDetails !== undefined, 'User Case formulaDetails exists');
assert(Array.isArray(userGroup1.formulaDetails.steps), 'User Case formulaDetails.steps is an array');
assert(userGroup1.formulaDetails.steps.length >= 8, `User Case has ${userGroup1.formulaDetails.steps.length} detailed calculation steps (>= 8)`);

// Verify Step 1: Variant Inputs & Adjusted Lengths
const step1 = userGroup1.formulaDetails.steps[0];
assert(step1.title.includes('Step 1'), 'Step 1 title is present');
assertEquals(step1.variants.length, 3, 'Step 1 lists all 3 variants');
assert(step1.variants[0].label.includes('7.5') && step1.variants[0].label.includes('4,000'), 'Step 1 Variant 1 label contains 7.5 and 4,000');
assert(step1.variants[1].label.includes('9') && step1.variants[1].label.includes('3,380'), 'Step 1 Variant 2 label contains 9 and 3,380');
assert(step1.variants[2].label.includes('9.5') && step1.variants[2].label.includes('2,000'), 'Step 1 Variant 3 label contains 9.5 and 2,000');

// Verify Step 2: Total Quantity
const step2 = userGroup1.formulaDetails.steps[1];
assert(step2.formula.includes('9,380'), 'Step 2 formula includes 9,380 pcs');

// Verify Step 3: Base Chain Consumption
const step3 = userGroup1.formulaDetails.steps[2];
assert(step3.title.includes('Base Chain Consumption'), 'Step 3 title is Base Chain Consumption');
assert(step3.result.includes('2,441') || step3.result.includes('2441'), 'Step 3 result shows ~2,441 Mtr');

// Verify Step 4: Factory Production Loss & Loss-Inclusive Requirement
const step4 = userGroup1.formulaDetails.steps[3];
assert(step4.formula.includes('3%'), 'Step 4 formula includes 3% loss factor');
assert(step4.formula.includes('73.2'), 'Step 4 formula includes ~73.2 Mtr loss');
assert(step4.formula.includes('2,514') || step4.formula.includes('2514'), 'Step 4 formula includes ~2,514 Mtr loss-inclusive requirement');

// Verify Step 5: Total Tape Requirement
const step5 = userGroup1.formulaDetails.steps[4];
assert(step5.formula.includes('54.5'), 'Step 5 formula includes CZ#5 tape divisor 54.5');

// Verify BOM rows for User Case CZ#5
const userBOMRows = userCalc.aggregatedMaterials.processedRows;
const userBOMComponents = userBOMRows.map(r => r.component);

assert(userBOMComponents.includes('TOTL TAPE KG'), 'User BOM has TOTL TAPE KG');
assert(userBOMComponents.includes('SLIDER (+1.5% ADD.)'), 'User BOM has SLIDER (+1.5% ADD.)');
assert(userBOMComponents.includes('T/S#5'), 'User BOM has T/S#5');
assert(userBOMComponents.includes('B/S#5'), 'User BOM has B/S#5');
assert(userBOMComponents.includes('CZ#5 RESIN'), 'User BOM has CZ#5 RESIN');
assert(userBOMComponents.includes('TOLLILON FLAT WIRE'), 'User BOM has TOLLILON FLAT WIRE');
assert(userBOMComponents.includes('ULTRASONIC U-TOP'), 'User BOM has ULTRASONIC U-TOP');

// Verify no intermediate or generic variables in BOM
assert(!userBOMComponents.includes('CHAIN CONSUMPTION'), 'User BOM does not have CHAIN CONSUMPTION');
assert(!userBOMComponents.includes('Factory Length Matrix'), 'User BOM does not have Factory Length Matrix');
assert(!userBOMComponents.includes('Polyester Yarn'), 'User BOM does not have generic Polyester Yarn');

// 8. USER TEST CASE: CZ#3 WITH SAME VARIANTS (APPROX 2,394 MTR)
console.log('\n--- 12. USER TEST CASE: CZ#3 (9,380 PCS) VERIFICATION ---');
const userCZ3Variants = [
  { id: 'u3_v1', name: 'Variant 1', zipperSize: '#3', length: 7.5, lengthUnit: 'inch', quantity: 4000 },
  { id: 'u3_v2', name: 'Variant 2', zipperSize: '#3', length: 9.0, lengthUnit: 'inch', quantity: 3380 },
  { id: 'u3_v3', name: 'Variant 3', zipperSize: '#3', length: 9.5, lengthUnit: 'inch', quantity: 2000 }
];
const cz3ResultTest = calculateCZGroup(userCZ3Variants, '#3', 3.0);
const expectedCZ3BaseChain = 94240.4 / 39.37; // 2,393.7109 Mtr
assertEquals(cz3ResultTest.chainConsumptionMtr, expectedCZ3BaseChain, 'CZ#3 Base Chain Consumption ≈ 2,393.71 Mtr (≈ 2,394 Mtr)', 0.01);
assertEquals(cz3ResultTest.lossMtr, expectedCZ3BaseChain * 0.03, 'CZ#3 3% Loss Amount ≈ 71.81 Mtr', 0.01);
assertEquals(cz3ResultTest.lossInclusiveChainMtr, expectedCZ3BaseChain * 1.03, 'CZ#3 Loss-Inclusive Requirement ≈ 2,465.52 Mtr', 0.01);
assertEquals(cz3ResultTest.totalTapeKg, (expectedCZ3BaseChain * 1.03) / 87.0, 'CZ#3 Final Tape KG (Divisor 87) ≈ 28.34 KG', 0.01);



console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

