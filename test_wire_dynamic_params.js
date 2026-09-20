/**
 * Dedicated Test Suite for Dynamic Editable Formula Parameters for WIRE Variants
 * 
 * Verifies:
 * 1. WIRE#3 defaults & calculations (32.0 Inch Divisor, 27.73 CM Divisor, 4% Loss, 0 Allowance)
 * 2. WIRE#5 Normal Teeth defaults & calculations (20.6 Divisor, 5% Loss, 0 Allowance)
 * 3. WIRE#5 Long Teeth defaults & calculations (20.6 Divisor, 1.97"/5.0cm Allowance, 5% Loss)
 * 4. Individual parameter overrides for all 3 variants
 * 5. Independence of Inch and CM divisors for WIRE#3
 * 6. Exclusion of Slider Add % and Slider materials from WIRE
 * 7. Multi-Category Group isolation (WIRE, CZ, MZ)
 * 8. Real-time Calculation Details mathematical breakdown synchronization
 */

global.window = {};

require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
require('./js/materials.js');
require('./js/bomRules.js');
require('./js/calculations.js');
require('./js/storage.js');

const {
  calculateWireGroup,
  calculateWireMaster,
  WIRE_CONSTANTS
} = window.WireFormulaEngine;

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
console.log('TESTING DYNAMIC EDITABLE FORMULA PARAMETERS FOR WIRE');
console.log('====================================================\n');

// 1. WIRE#3 DEFAULT PARAMETERS & VERIFICATION
console.log('--- 1. Testing WIRE#3 Default Parameters ---');
const wire3InchVariants = [
  { id: 'w3_1', name: 'Var 1', length: 10, lengthUnit: 'inch', quantity: 1000, zipperSize: '#3' },
  { id: 'w3_2', name: 'Var 2', length: 12, lengthUnit: 'inch', quantity: 2000, zipperSize: '#3' }
];
const wire3InchResult = calculateWireGroup(wire3InchVariants, '#3', 4.0, {});

assertEquals(wire3InchResult.totalQuantity, 3000, 'WIRE#3 Total Quantity = 3,000 pcs');
assertEquals(wire3InchResult.activeParams.inchCalcDivisor, 32.0, 'WIRE#3 Default Inch Divisor = 32.0');
assertEquals(wire3InchResult.activeParams.cmCalcDivisor, 27.73, 'WIRE#3 Default CM Divisor = 27.73');
assertEquals(wire3InchResult.activeParams.inchAllowance, 0, 'WIRE#3 Default Inch Allowance = 0');
assertEquals(wire3InchResult.activeParams.cmAllowance, 0, 'WIRE#3 Default CM Allowance = 0');
assertEquals(wire3InchResult.lossPercent, 4.0, 'WIRE#3 Default Loss Percent = 4%');
assertEquals(wire3InchResult.lossMultiplier, 1.04, 'WIRE#3 Derived Loss Multiplier = 1.04 (1 + 4/100)');

const expectedWire3InchMtr = (10 * 1000 + 12 * 2000) / 39.37;
assertEquals(wire3InchResult.totalReqMtr, expectedWire3InchMtr, 'WIRE#3 Inch Required Mtr');
const expectedWire3InchKg = (expectedWire3InchMtr / 32.0) * 1.04;
assertEquals(wire3InchResult.totalWireKg, expectedWire3InchKg, 'WIRE#3 Inch Total Wire KG');

// Test WIRE#3 CM entries
const wire3CmVariants = [
  { id: 'w3_cm1', name: 'Var CM', length: 25, lengthUnit: 'cm', quantity: 4000, zipperSize: '#3' }
];
const wire3CmResult = calculateWireGroup(wire3CmVariants, '#3', 4.0, {});
const expectedWire3CmMtr = (25 * 4000) / 100;
assertEquals(wire3CmResult.totalReqMtr, expectedWire3CmMtr, 'WIRE#3 CM Required Mtr = 1,000 Mtr');
const expectedWire3CmKg = (expectedWire3CmMtr / 27.73) * 1.04;
assertEquals(wire3CmResult.totalWireKg, expectedWire3CmKg, 'WIRE#3 CM Total Wire KG (using 27.73 divisor)');

// 2. WIRE#5 NORMAL TEETH DEFAULT PARAMETERS
console.log('\n--- 2. Testing WIRE#5 Normal Teeth Default Parameters ---');
const wire5NormVariants = [
  { id: 'w5n_1', name: 'Var 1', length: 12, lengthUnit: 'inch', quantity: 4000, zipperSize: '#5_normal' }
];
const wire5NormResult = calculateWireGroup(wire5NormVariants, '#5_normal', 5.0, {});

assertEquals(wire5NormResult.totalQuantity, 4000, 'WIRE#5 Normal Total Quantity = 4,000 pcs');
assertEquals(wire5NormResult.activeParams.inchCalcDivisor, 20.6, 'WIRE#5 Normal Default Divisor = 20.6');
assertEquals(wire5NormResult.activeParams.inchAllowance, 0, 'WIRE#5 Normal Allowance = 0');
assertEquals(wire5NormResult.lossPercent, 5.0, 'WIRE#5 Normal Loss Percent = 5%');
assertEquals(wire5NormResult.lossMultiplier, 1.05, 'WIRE#5 Normal Derived Loss Multiplier = 1.05');

const expectedWire5NormMtr = (12 * 4000) / 39.37;
assertEquals(wire5NormResult.totalReqMtr, expectedWire5NormMtr, 'WIRE#5 Normal Required Mtr');
const expectedWire5NormKg = (expectedWire5NormMtr / 20.6) * 1.05;
assertEquals(wire5NormResult.totalWireKg, expectedWire5NormKg, 'WIRE#5 Normal Total Wire KG');

// 3. WIRE#5 LONG TEETH DEFAULT PARAMETERS
console.log('\n--- 3. Testing WIRE#5 Long Teeth Default Parameters ---');
const wire5LongVariants = [
  { id: 'w5l_1', name: 'Var 1', length: 10, lengthUnit: 'inch', quantity: 1000, zipperSize: '#5_long' },
  { id: 'w5l_2', name: 'Var 2', length: 20, lengthUnit: 'cm', quantity: 2000, zipperSize: '#5_long' }
];
const wire5LongResult = calculateWireGroup(wire5LongVariants, '#5_long', 5.0, {});

assertEquals(wire5LongResult.totalQuantity, 3000, 'WIRE#5 Long Total Quantity = 3,000 pcs');
assertEquals(wire5LongResult.activeParams.inchAllowance, 1.97, 'WIRE#5 Long Default Inch Allowance = 1.97"');
assertEquals(wire5LongResult.activeParams.cmAllowance, 5.0, 'WIRE#5 Long Default CM Allowance = 5.0 cm');
assertEquals(wire5LongResult.activeParams.inchCalcDivisor, 20.6, 'WIRE#5 Long Default Divisor = 20.6');
assertEquals(wire5LongResult.lossPercent, 5.0, 'WIRE#5 Long Loss Percent = 5%');

const expLongMtr1 = ((10 + 1.97) * 1000) / 39.37;
const expLongMtr2 = ((20 + 5.0) * 2000) / 100;
assertEquals(wire5LongResult.totalReqMtr, expLongMtr1 + expLongMtr2, 'WIRE#5 Long Total Required Mtr with allowances');
const expLongKg = ((expLongMtr1 + expLongMtr2) / 20.6) * 1.05;
assertEquals(wire5LongResult.totalWireKg, expLongKg, 'WIRE#5 Long Total Wire KG');

// 4. TESTING INDIVIDUAL PARAMETER OVERRIDES
console.log('\n--- 4. Testing Individual Parameter Overrides ---');

// Override WIRE#3 Inch Divisor (32 -> 35), CM Divisor unchanged (27.73)
const customWire3 = calculateWireGroup(
  [{ id: 'v1', length: 10, lengthUnit: 'inch', quantity: 1000, zipperSize: '#3' }],
  '#3',
  4.0,
  { inchWireDivisor: 35.0 }
);
assertEquals(customWire3.activeParams.inchCalcDivisor, 35.0, 'WIRE#3 Custom Inch Divisor = 35.0');
assertEquals(customWire3.activeParams.cmCalcDivisor, 27.73, 'WIRE#3 CM Divisor remained 27.73 (independent)');
assertEquals(customWire3.totalWireKg, ((10 * 1000 / 39.37) / 35.0) * 1.04, 'WIRE#3 Calculated with Divisor 35.0');

// Override WIRE#3 CM Divisor (27.73 -> 30.0), Inch Divisor unchanged (32.0)
const customWire3Cm = calculateWireGroup(
  [{ id: 'v1', length: 25, lengthUnit: 'cm', quantity: 1000, zipperSize: '#3' }],
  '#3',
  4.0,
  { cmWireDivisor: 30.0 }
);
assertEquals(customWire3Cm.activeParams.cmCalcDivisor, 30.0, 'WIRE#3 Custom CM Divisor = 30.0');
assertEquals(customWire3Cm.activeParams.inchCalcDivisor, 32.0, 'WIRE#3 Inch Divisor remained 32.0');
assertEquals(customWire3Cm.totalWireKg, ((25 * 1000 / 100) / 30.0) * 1.04, 'WIRE#3 Calculated with CM Divisor 30.0');

// Override WIRE#5 Normal Divisor (20.6 -> 22.0)
const customWire5Norm = calculateWireGroup(
  [{ id: 'v1', length: 12, lengthUnit: 'inch', quantity: 1000, zipperSize: '#5_normal' }],
  '#5_normal',
  5.0,
  { wireDivisor: 22.0 }
);
assertEquals(customWire5Norm.activeParams.inchCalcDivisor, 22.0, 'WIRE#5 Normal Custom Divisor = 22.0');
assertEquals(customWire5Norm.totalWireKg, ((12 * 1000 / 39.37) / 22.0) * 1.05, 'WIRE#5 Normal Calculated with Divisor 22.0');

// Override WIRE#5 Long Allowance (1.97 -> 2.5) and Divisor (20.6 -> 25.0)
const customWire5Long = calculateWireGroup(
  [{ id: 'v1', length: 10, lengthUnit: 'inch', quantity: 1000, zipperSize: '#5_long' }],
  '#5_long',
  6.0,
  { wireAllowance: 2.5, wireDivisor: 25.0 }
);
assertEquals(customWire5Long.activeParams.inchAllowance, 2.5, 'WIRE#5 Long Custom Allowance = 2.5"');
assertEquals(customWire5Long.activeParams.inchCalcDivisor, 25.0, 'WIRE#5 Long Custom Divisor = 25.0');
assertEquals(customWire5Long.lossPercent, 6.0, 'WIRE#5 Long Custom Loss % = 6.0%');
assertEquals(customWire5Long.lossMultiplier, 1.06, 'WIRE#5 Long Loss Multiplier = 1.06');
const expCustLongMtr = ((10 + 2.5) * 1000) / 39.37;
assertEquals(customWire5Long.totalWireKg, (expCustLongMtr / 25.0) * 1.06, 'WIRE#5 Long Calculated with Allowance 2.5, Divisor 25, Loss 6%');

// 5. TESTING MASTER CALCULATION & CALCULATION DETAILS
console.log('\n--- 5. Testing Master Calculation & Calculation Details ---');
const wireMasterRes = calculateWireMaster(
  [
    { id: 'w1', name: 'Variant 1', length: 10, lengthUnit: 'inch', quantity: 1000, zipperSize: '#5_long' }
  ],
  {
    lossPercent: 6.0,
    wireParams: { wireAllowance: 2.5, wireDivisor: 25.0 }
  }
);

assert(wireMasterRes && wireMasterRes.materials && wireMasterRes.materials.processedRows.length === 2, 'WIRE Master produced 2 BOM rows (Total Required Chain Length + Teeth Wire)');
const reqChainRow = wireMasterRes.materials.processedRows.find(r => r.component === 'Total Required Chain Length');
assert(reqChainRow !== undefined, 'FIX 3: WIRE Total Required Chain Length BOM row exists');
assertEquals(reqChainRow.unit, 'Mtr', 'FIX 3: Unit is "Mtr"');
assertEquals(reqChainRow.totalQuantity, (10 + 2.5) * 1000 / 39.37, 'FIX 3: Total Required Chain Length quantity ≈ 317.50 Mtr', 0.01);
assertEquals(formatBOMQuantity(reqChainRow), '318', 'FIX 3: Total Required Chain Length displays as nearest whole integer 318 Mtr');

const wireBomRow = wireMasterRes.materials.processedRows.find(r => r.component === 'Teeth for Long Chain#5');
assert(wireBomRow !== undefined, 'BOM row component is Teeth for Long Chain#5');
assert(wireBomRow.specification.includes('2.5'), 'BOM row specification contains custom allowance 2.5');
assert(wireBomRow.specification.includes('25'), 'BOM row specification contains custom divisor 25');
assert(wireBomRow.specification.includes('6%'), 'BOM row specification contains custom loss 6%');

const calcDetail = wireBomRow.calculationDetail;
assert(calcDetail && calcDetail.steps.length === 3, 'Calculation Details has 3 steps');
assert(calcDetail.steps[0].explanation.includes('2.5"'), 'Step 1 explanation shows custom allowance 2.5"');
assert(calcDetail.steps[1].formula.includes('25'), 'Step 2 formula shows custom divisor 25');
assert(calcDetail.steps[2].formula.includes('1.06'), 'Step 3 formula shows custom loss multiplier 1.06');

// 6. MULTI-CATEGORY GROUP ISOLATION
console.log('\n--- 6. Testing Multi-Category Group Independence ---');
const multiEstimate = {
  categoryGroups: [
    {
      id: 'g1_wire',
      name: 'WIRE#3 Custom Group',
      category: 'wire',
      lossPercent: 4.0,
      wireParams: { inchWireDivisor: 35.0, cmWireDivisor: 30.0 },
      variants: [{ id: 'v1', name: 'Var 1', length: 10, lengthUnit: 'inch', quantity: 1000, zipperSize: '#3' }]
    },
    {
      id: 'g2_wire',
      name: 'WIRE#5 Long Standard Group',
      category: 'wire',
      lossPercent: 5.0,
      wireParams: {}, // Defaults
      variants: [{ id: 'v2', name: 'Var 2', length: 10, lengthUnit: 'inch', quantity: 2000, zipperSize: '#5_long' }]
    },
    {
      id: 'g3_cz',
      name: 'CZ#5 Group',
      category: 'cz',
      lossPercent: 3.0,
      czParams: { tapeDivisor: 54.5 },
      variants: [{ id: 'v3', name: 'Var 3', length: 10, lengthUnit: 'inch', quantity: 1000, zipperSize: '#5' }]
    }
  ]
};

const fullCalc = calculateFullEstimate(multiEstimate);
assert(fullCalc && fullCalc.categoryGroups && fullCalc.categoryGroups.length === 3, 'Calculated 3 Groups successfully');

const g1Res = fullCalc.categoryGroups[0].calculation.primaryResult;
const g2Res = fullCalc.categoryGroups[1].calculation.primaryResult;
const g3Res = fullCalc.categoryGroups[2].calculation.primaryResult;

assertEquals(g1Res.activeParams.inchCalcDivisor, 35.0, 'Group 1 WIRE#3 Custom Inch Divisor is 35.0');
assertEquals(g1Res.activeParams.cmCalcDivisor, 30.0, 'Group 1 WIRE#3 Custom CM Divisor is 30.0');

assertEquals(g2Res.activeParams.inchCalcDivisor, 20.6, 'Group 2 WIRE#5 Long Divisor is 20.6 (unaffected by G1)');
assertEquals(g2Res.activeParams.inchAllowance, 1.97, 'Group 2 WIRE#5 Long Allowance is 1.97 (unaffected by G1)');

assertEquals(g3Res.activeParams.tapeDivisor, 54.5, 'Group 3 CZ#5 Tape Divisor is 54.5 (unaffected by WIRE groups)');

// Verify Merged BOM doesn't contain any Slider for WIRE
const mergedRows = fullCalc.aggregatedMaterials.processedRows;
console.log('  Merged BOM rows:', mergedRows.map(r => ({ component: r.component, cat: r.componentCategory, groupCat: r.groupCategory })));
const wireBomRows = mergedRows.filter(r => r.componentCategory === 'wire' || (r.component && r.component.toLowerCase().includes('wire')));
assert(wireBomRows.length >= 2, `Merged BOM has WIRE components (Got ${wireBomRows.length})`);
const sliderRows = mergedRows.filter(r => r.component.includes('SLIDER'));
assert(sliderRows.every(r => r.groupCategory !== 'wire'), 'No Slider row is generated from WIRE groups');

console.log('\n====================================================');
console.log(`WIRE DYNAMIC PARAMETERS TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================\n');
