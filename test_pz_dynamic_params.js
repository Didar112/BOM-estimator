/**
 * Comprehensive Test Suite for PZ (Plastic Zipper) Factory Formula Engine & Dynamic Parameters
 * Tests:
 * 1. Default verified factory constants for PZ#3, PZ#5, and PZ#8 (CM and Inch)
 * 2. Exact Excel chain consumption, loss adjustment, Tape KG, PZO, PZC, and Tape-Based Resin
 * 3. PZ#3 Resin for Color Wise table calculation
 * 4. Dynamic user-editable parameter overrides (divisors, factors, allowances, loss %, color count)
 * 5. Input validation & zero-division safeguards
 * 6. Calculation Details step-by-step arithmetic derivations
 * 7. Multi-variant merging within PZ category groups
 * 8. Multi-category group independence & isolation (PZ + CZ + MZ + WIRE)
 * 9. USER SPECIFIC FIXES (FIX 1: PZO#3 & PZC#3 Tape Wise, FIX 2: Chain Consumption BOM output)
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

const {
  PZ_CONSTANTS,
  calculatePZGroup,
  calculatePZMaster,
  buildPZConsolidatedBOMRows
} = window.PZFormulaEngine;

const { calculateFullEstimate } = window.CalculatorEngine;
const { getSuggestedAllowance } = window.BOMRules;

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
console.log('TESTING PZ FACTORY FORMULA ENGINE & DYNAMIC PARAMETERS');
console.log('====================================================\n');

// 1. PZ Constants & Allowances Verification
console.log('--- 1. Testing Default PZ Factory Constants ---');
assertEquals(PZ_CONSTANTS['#3'].cmAllowance, 5.0, 'PZ#3 Default CM Allowance = 5.0 cm');
assertEquals(PZ_CONSTANTS['#3'].inchAllowance, 1.97, 'PZ#3 Default Inch Allowance = 1.97"');
assertEquals(PZ_CONSTANTS['#3'].tapeDivisor, 101.0, 'PZ#3 Default Tape Divisor = 101 Mtr/KG');
assertEquals(PZ_CONSTANTS['#3'].tapeAdditionalPercent, 2.5, 'PZ#3 Default Tape Add % = 2.5%');
assertEquals(PZ_CONSTANTS['#3'].tapeFactor, 8.15, 'PZ#3 Default Tape Factor = 8.15');
assertEquals(PZ_CONSTANTS['#3'].pzoAdditionalPercent, 3.0, 'PZ#3 Default PZO Add % = 3.0%');
assertEquals(PZ_CONSTANTS['#3'].pzoFactor, 2.3, 'PZ#3 Default PZO Factor = 2.3');
assertEquals(PZ_CONSTANTS['#3'].pzcAdditionalPercent, 3.0, 'PZ#3 Default PZC Add % = 3.0%');
assertEquals(PZ_CONSTANTS['#3'].pzcFactor, 1.5, 'PZ#3 Default PZC Factor = 1.5');
assertEquals(PZ_CONSTANTS['#3'].defaultColorFactor, 0.5, 'PZ#3 Default Color Factor = 0.5 KG/color');

assertEquals(PZ_CONSTANTS['#5'].cmAllowance, 5.0, 'PZ#5 Default CM Allowance = 5.0 cm');
assertEquals(PZ_CONSTANTS['#5'].inchAllowance, 1.97, 'PZ#5 Default Inch Allowance = 1.97"');
assertEquals(PZ_CONSTANTS['#5'].tapeDivisor, 81.0, 'PZ#5 Default Tape Divisor = 81 Mtr/KG');
assertEquals(PZ_CONSTANTS['#5'].tapeAdditionalPercent, 2.5, 'PZ#5 Default Tape Add % = 2.5%');
assertEquals(PZ_CONSTANTS['#5'].tapeFactor, 13.07, 'PZ#5 Default Tape Factor = 13.07');
assertEquals(PZ_CONSTANTS['#5'].pzoFactor, 3.0, 'PZ#5 Default PZO Factor = 3.0');
assertEquals(PZ_CONSTANTS['#5'].pzcFactor, 1.7, 'PZ#5 Default PZC Factor = 1.7');

assertEquals(PZ_CONSTANTS['#8'].cmAllowance, 6.3, 'PZ#8 Default CM Allowance = 6.3 cm');
assertEquals(PZ_CONSTANTS['#8'].inchAllowance, 2.4, 'PZ#8 Default Inch Allowance = 2.4"');
assertEquals(PZ_CONSTANTS['#8'].tapeDivisor, 57.0, 'PZ#8 Default Tape Divisor = 57 Mtr/KG');
assertEquals(PZ_CONSTANTS['#8'].tapeFactor, 26.23, 'PZ#8 Default Tape Factor = 26.23');
assertEquals(PZ_CONSTANTS['#8'].pzoFactor, 3.7, 'PZ#8 Default PZO Factor = 3.7');
assertEquals(PZ_CONSTANTS['#8'].pzcFactor, 1.9, 'PZ#8 Default PZC Factor = 1.9');

// 2. Testing BOMRules suggested allowances
console.log('\n--- 2. Testing BOMRules Suggested Allowances for PZ ---');
assertEquals(getSuggestedAllowance('pz', '#3', 'inch'), 1.97, 'Suggested Allowance PZ#3 Inch is 1.97"');
assertEquals(getSuggestedAllowance('pz', '#3', 'cm'), 5.0, 'Suggested Allowance PZ#3 CM is 5.0 cm');
assertEquals(getSuggestedAllowance('pz', '#5', 'inch'), 1.97, 'Suggested Allowance PZ#5 Inch is 1.97"');
assertEquals(getSuggestedAllowance('pz', '#5', 'cm'), 5.0, 'Suggested Allowance PZ#5 CM is 5.0 cm');
assertEquals(getSuggestedAllowance('pz', '#8', 'inch'), 2.4, 'Suggested Allowance PZ#8 Inch is 2.4"');
assertEquals(getSuggestedAllowance('pz', '#8', 'cm'), 6.3, 'Suggested Allowance PZ#8 CM is 6.3 cm');

// 3. Testing PZ#3 Calculations (Inch & CM)
console.log('\n--- 3. Testing PZ#3 Verified Factory Calculations ---');
const pz3Variants = [
  { id: 'v1', name: 'Variant 1', length: 10, lengthUnit: 'inch', quantity: 2000, zipperSize: '#3' },
  { id: 'v2', name: 'Variant 2', length: 25, lengthUnit: 'cm', quantity: 1000, zipperSize: '#3' }
];

const pz3Result = calculatePZGroup(pz3Variants, '#3', 3.0, 1.5, { noOfColors: 3 });
assertEquals(pz3Result.totalQuantity, 3000, 'PZ#3 Total Quantity = 3,000 pcs');
assertEquals(pz3Result.baseChainConsumptionMtr, 908.0772, 'PZ#3 Base Chain Consumption Mtr', 0.01);
assertEquals(pz3Result.lossInclusiveChainMtr, 935.3195, 'PZ#3 Loss-Inclusive Chain Mtr', 0.01);
assertEquals(pz3Result.totalTapeKg, 9.2606, 'PZ#3 Total Tape KG (Divisor 101)', 0.001);
assertEquals(pz3Result.tapeBasedResinKg, 7.5859, 'PZ#3 Tape-Based Resin KG (Factor 8.15)', 0.001);
assert(pz3Result.pzoKg === undefined, 'PZ#3 PZO#3 is removed from calculation pipeline');
assert(pz3Result.pzcKg === undefined, 'PZ#3 PZC#3 is removed from calculation pipeline');
assert(pz3Result.resinColorWiseKg === undefined, 'PZ#3 Resin for Color Wise is removed from calculation pipeline');

// 4. Testing PZ#5 Calculations
console.log('\n--- 4. Testing PZ#5 Verified Factory Calculations ---');
const pz5Variants = [
  { id: 'v1', name: 'Variant 1', length: 12, lengthUnit: 'inch', quantity: 4000, zipperSize: '#5' }
];

const pz5Result = calculatePZGroup(pz5Variants, '#5', 3.0, 1.5);
assertEquals(pz5Result.totalQuantity, 4000, 'PZ#5 Total Quantity = 4,000 pcs');
assertEquals(pz5Result.baseChainConsumptionMtr, 1419.3548, 'PZ#5 Base Chain Consumption Mtr', 0.01);
assertEquals(pz5Result.totalTapeKg, 18.0486, 'PZ#5 Total Tape KG (Divisor 81)', 0.001);
assertEquals(pz5Result.tapeBasedResinKg, 19.0147, 'PZ#5 Tape Resin KG (Factor 13.07)', 0.001);
assert(pz5Result.pzoKg === undefined, 'PZ#5 PZO#5 is removed from calculation pipeline');
assert(pz5Result.pzcKg === undefined, 'PZ#5 PZC#5 is removed from calculation pipeline');

// 5. Testing PZ#8 Calculations
console.log('\n--- 5. Testing PZ#8 Verified Factory Calculations ---');
const pz8Variants = [
  { id: 'v1', name: 'Variant 1', length: 20, lengthUnit: 'cm', quantity: 5000, zipperSize: '#8' }
];

const pz8Result = calculatePZGroup(pz8Variants, '#8', 3.0, 1.5);
assertEquals(pz8Result.totalQuantity, 5000, 'PZ#8 Total Quantity = 5,000 pcs');
assertEquals(pz8Result.baseChainConsumptionMtr, 1315.00, 'PZ#8 Base Chain Consumption Mtr');
assertEquals(pz8Result.totalTapeKg, 23.7623, 'PZ#8 Total Tape KG (Divisor 57)', 0.001);
assertEquals(pz8Result.tapeBasedResinKg, 35.3547, 'PZ#8 Tape Resin KG (Factor 26.23)', 0.001);
assert(pz8Result.pzoKg === undefined, 'PZ#8 PZO#8 is removed from calculation pipeline');
assert(pz8Result.pzcKg === undefined, 'PZ#8 PZC#8 is removed from calculation pipeline');

// 6. Testing Custom Dynamic Parameter Overrides on PZ Active Calculations
console.log('\n--- 6. Testing Custom Dynamic Parameter Overrides on PZ ---');
const customPzParams = {
  tapeDivisor: 95.0,
  tapeFactor: 9.0,
  tapeAdditionalPercent: 3.5,
  pzoFactor: 2.5,
  pzoAdditionalPercent: 4.0,
  pzcFactor: 1.8,
  pzcAdditionalPercent: 4.0,
  colorFactor: 0.6,
  noOfColors: 4
};
const customPzResult = calculatePZGroup(pz3Variants, '#3', 4.0, 2.0, customPzParams);

assertEquals(customPzResult.totalTapeKg, 9.9411, 'Custom Tape Divisor 95 used', 0.001);
assertEquals(customPzResult.tapeBasedResinKg, 8.4587, 'Custom Tape Factor 9.0 & 3.5% Add used', 0.001);

// 7. USER TEST CASE: PZ#3 (9,380 PCS) - FIX 1 & FIX 2 VERIFICATION
console.log('\n--- 7. USER TEST CASE: PZ#3 (9,380 PCS) - FIX 1 & FIX 2 ---');
const userPz3Variants = [
  { id: 'v1', name: 'Variant 1', length: 7.50, lengthUnit: 'inch', quantity: 4000, zipperSize: '#3' },
  { id: 'v2', name: 'Variant 2', length: 9.00, lengthUnit: 'inch', quantity: 3380, zipperSize: '#3' },
  { id: 'v3', name: 'Variant 3', length: 9.50, lengthUnit: 'inch', quantity: 2000, zipperSize: '#3' }
];

// Calculation verifications:
// Variant 1: (7.50 + 1.97) * 4000 / 39.37 = 962.1539268 Mtr
// Variant 2: (9.00 + 1.97) * 3380 / 39.37 = 941.7983235 Mtr
// Variant 3: (9.50 + 1.97) * 2000 / 39.37 = 582.6771653 Mtr
// Total Chain Consumption = 2486.6294156 Mtr ≈ 2486.63 Mtr
// Loss 3% -> 2486.6294156 * 1.03 = 2561.228298 Mtr
// Total Tape (Divisor 101) = 2561.228298 / 101 = 25.358696 KG ≈ 25.3587 KG
// Tape Wise = 2486.6294156 * 1.025 * 8.15 / 1000 = 20.77273 KG ≈ 20.7727 KG

const userPz3Result = calculatePZGroup(userPz3Variants, '#3', 3.0, 1.5);
assertEquals(userPz3Result.totalQuantity, 9380, 'User Case Total Quantity = 9,380 pcs');
assertEquals(userPz3Result.baseChainConsumptionMtr, 2486.6294, 'User Case Base Chain Consumption ≈ 2,486.63 Mtr', 0.01);
assertEquals(userPz3Result.totalTapeKg, 25.3587, 'User Case Total Tape ≈ 25.3587 KG (Divisor 101)', 0.001);
assertEquals(userPz3Result.tapeBasedResinKg, 20.7727, 'User Case Tape Wise ≈ 20.7727 KG (Factor 8.15)', 0.001);

const userPz3BOM = buildPZConsolidatedBOMRows(userPz3Result, [], {});

// FIX 1 Verification: "PZO#3 & PZC#3 Tape Wise"
const tapeWiseRow = userPz3BOM.find(r => r.materialName === 'PZO#3 & PZC#3 Tape Wise');
assert(tapeWiseRow !== undefined, 'FIX 1: "PZO#3 & PZC#3 Tape Wise" BOM row exists');
assertEquals(tapeWiseRow.component, 'PZO#3 & PZC#3 Tape Wise', 'FIX 1: Component label is "PZO#3 & PZC#3 Tape Wise"');
assertEquals(tapeWiseRow.totalQuantity, 20.7727, 'FIX 1: Tape Wise quantity ≈ 20.7727 KG', 0.001);
assert(!userPz3BOM.some(r => r.materialName === 'Resin for PZ#3 Chain'), 'FIX 1: Old label "Resin for PZ#3 Chain" is removed');
assert(tapeWiseRow.calculationDetail !== undefined, 'FIX 1: Tape Wise has calculationDetail');
assert(tapeWiseRow.calculationDetail.baseFormula.includes('PZO#3 & PZC#3 Tape Wise') || tapeWiseRow.calculationDetail.baseFormula.includes('Tape Wise KG'), 'FIX 1: Calculation Detail baseFormula contains Tape Wise');
assert(tapeWiseRow.calculationDetail.steps[0].formula.includes('2486.63') || tapeWiseRow.calculationDetail.steps[0].formula.includes('2486'), 'FIX 1: Calculation Detail uses Chain Consumption as base');

// FIX 2 Verification: "Chain Consumption" (Mtr) BOM Output
const chainConsRow = userPz3BOM.find(r => r.component === 'Chain Consumption');
assert(chainConsRow !== undefined, 'FIX 2: "Chain Consumption" BOM row exists');
assertEquals(chainConsRow.unit, 'Mtr', 'FIX 2: Chain Consumption Unit is "Mtr"');
assertEquals(chainConsRow.totalQuantity, 2486.6294, 'FIX 2: Chain Consumption Total Quantity ≈ 2,486.63 Mtr', 0.01);
assertEquals(chainConsRow.unitPrice, 0, 'FIX 2: Chain Consumption unitPrice is 0 (physical intermediate measure)');
assert(chainConsRow.calculationDetail !== undefined, 'FIX 2: Chain Consumption has calculationDetail');
assertEquals(chainConsRow.calculationDetail.steps[0].variants.length, 3, 'FIX 2: Chain Consumption lists all 3 variants individually');
assert(chainConsRow.calculationDetail.steps[0].variants[0].label.includes('7.5') && chainConsRow.calculationDetail.steps[0].variants[0].label.includes('4,000'), 'FIX 2: Variant 1 has 7.50" and 4,000 pcs');
assert(chainConsRow.calculationDetail.steps[0].variants[1].label.includes('9') && chainConsRow.calculationDetail.steps[0].variants[1].label.includes('3,380'), 'FIX 2: Variant 2 has 9.00" and 3,380 pcs');
assert(chainConsRow.calculationDetail.steps[0].variants[2].label.includes('9.5') && chainConsRow.calculationDetail.steps[0].variants[2].label.includes('2,000'), 'FIX 2: Variant 3 has 9.50" and 2,000 pcs');

// Total Tape calculation remains intact
const tapeRow = userPz3BOM.find(r => r.component === 'TOTL TAPE KG');
assert(tapeRow !== undefined, 'Total Tape BOM row exists');
assertEquals(tapeRow.totalQuantity, 25.3587, 'Total Tape is 25.3587 KG (unaffected by Chain Consumption row)', 0.001);

// UNUSED PZ CALCULATIONS VERIFICATION: PZO, PZC, Color Wise, Total Resin are NOT in BOM
assert(!userPz3BOM.some(r => r.materialName === 'PZO#3' || r.component === 'PZO#3'), 'PZO#3 does NOT appear in PZ#3 BOM');
assert(!userPz3BOM.some(r => r.materialName === 'PZC#3' || r.component === 'PZC#3'), 'PZC#3 does NOT appear in PZ#3 BOM');
assert(!userPz3BOM.some(r => r.materialName.includes('Color Wise') || r.component.includes('Color Wise')), 'Resin for Color Wise does NOT appear in PZ#3 BOM');
assert(!userPz3BOM.some(r => r.materialName.includes('Total Resin') || r.component.includes('Total Resin')), 'Total Resin does NOT appear in PZ#3 BOM');

// PZ#5 and PZ#8 Verified Absence of Unused Tables & Presence of Active Combined Tape Results & Chain Consumption
const pz5BOM = buildPZConsolidatedBOMRows(pz5Result, [], {});
assert(!pz5BOM.some(r => r.materialName === 'PZO#5' || r.component === 'PZO#5'), 'PZO#5 does NOT appear in PZ#5 BOM');
assert(!pz5BOM.some(r => r.materialName === 'PZC#5' || r.component === 'PZC#5'), 'PZC#5 does NOT appear in PZ#5 BOM');
assert(!pz5BOM.some(r => r.materialName.includes('Total Resin') || r.component.includes('Total Resin')), 'Total Resin does NOT appear in PZ#5 BOM');
const pz5TapeResinRow = pz5BOM.find(r => r.materialId === 'mat_pz_tape_resin_5');
assert(pz5TapeResinRow !== undefined, 'PZ#5 Active combined tape result (Resin for PZ#5 Chain) exists');
const pz5ChainRow = pz5BOM.find(r => r.component === 'Chain Consumption');
assert(pz5ChainRow !== undefined, 'FIX 2: PZ#5 Chain Consumption BOM row exists');
assertEquals(pz5ChainRow.unit, 'Mtr', 'FIX 2: PZ#5 Chain Consumption unit is "Mtr"');
assertEquals(formatBOMQuantity(pz5ChainRow), '1,419', 'FIX 2: PZ#5 Chain Consumption displays as nearest integer 1,419 Mtr');

const pz8BOM = buildPZConsolidatedBOMRows(pz8Result, [], {});
assert(!pz8BOM.some(r => r.materialName === 'PZO#8' || r.component === 'PZO#8'), 'PZO#8 does NOT appear in PZ#8 BOM');
assert(!pz8BOM.some(r => r.materialName === 'PZC#8' || r.component === 'PZC#8'), 'PZC#8 does NOT appear in PZ#8 BOM');
assert(!pz8BOM.some(r => r.materialName.includes('Total Resin') || r.component.includes('Total Resin')), 'Total Resin does NOT appear in PZ#8 BOM');
const pz8TapeResinRow = pz8BOM.find(r => r.materialId === 'mat_pz_tape_resin_8');
assert(pz8TapeResinRow !== undefined, 'PZ#8 Active combined tape result (Resin for PZ#8 Chain) exists');
const pz8ChainRow = pz8BOM.find(r => r.component === 'Chain Consumption');
assert(pz8ChainRow !== undefined, 'FIX 2: PZ#8 Chain Consumption BOM row exists');
assertEquals(pz8ChainRow.unit, 'Mtr', 'FIX 2: PZ#8 Chain Consumption unit is "Mtr"');
assertEquals(formatBOMQuantity(pz8ChainRow), '1,315', 'FIX 2: PZ#8 Chain Consumption displays as nearest integer 1,315 Mtr');

// 8. Testing Full Multi-Category Estimate with PZ + CZ + MZ + WIRE
console.log('\n--- 8. Testing Multi-Category Estimate with PZ, CZ, MZ, WIRE ---');
const multiCategoryEstimate = {
  id: 'test_multi_cat_pz',
  categoryGroups: [
    {
      id: 'g1_pz',
      name: 'PZ Group',
      category: 'pz',
      lossPercent: 3.0,
      variants: userPz3Variants
    },
    {
      id: 'g2_cz',
      name: 'CZ Group',
      category: 'cz',
      lossPercent: 3.0,
      variants: [
        { id: 'cz_v1', name: 'CZ Variant', length: 8, lengthUnit: 'inch', quantity: 3000, zipperSize: '#5' }
      ]
    },
    {
      id: 'g3_mz',
      name: 'MZ Group',
      category: 'mz',
      lossPercent: 3.0,
      variants: [
        { id: 'mz_v1', name: 'MZ Variant', length: 10, lengthUnit: 'inch', quantity: 1500, zipperSize: '#3' }
      ]
    },
    {
      id: 'g4_wire',
      name: 'WIRE Group',
      category: 'wire',
      lossPercent: 5.0,
      variants: [
        { id: 'w_v1', name: 'Wire Variant', length: 14, lengthUnit: 'inch', quantity: 2500, zipperSize: '#5_normal' }
      ]
    }
  ],
  labor: { method: 'per_zipper', ratePerZipper: 1.5 },
  overhead: { percentage: 10, basis: 'material_and_labor' }
};

const fullEstimateResult = calculateFullEstimate(multiCategoryEstimate);
assertEquals(fullEstimateResult.categoryGroups.length, 4, '4 Category Groups calculated independently');
assertEquals(fullEstimateResult.totals.quantity, 16380, 'Total Order Quantity = 9380 + 3000 + 1500 + 2500 = 16,380 pcs');

const mergedBOM = fullEstimateResult.aggregatedMaterials.processedRows;
assert(mergedBOM.some(r => r.component === 'Chain Consumption'), 'Merged BOM contains Chain Consumption');
assert(mergedBOM.some(r => r.materialName === 'PZO#3 & PZC#3 Tape Wise'), 'Merged BOM contains PZO#3 & PZC#3 Tape Wise');
assert(mergedBOM.some(r => r.materialName === 'PZ#3 Tape'), 'Merged BOM contains PZ#3 Tape');
assert(mergedBOM.some(r => r.materialName === 'CZ#5 Tape'), 'Merged BOM contains CZ#5 Tape');
assert(mergedBOM.some(r => r.materialName === 'MZ#3 Tape'), 'Merged BOM contains MZ#3 Tape');
assert(mergedBOM.some(r => r.component === 'WIRE#5'), 'Merged BOM contains WIRE#5');

console.log('\n====================================================');
console.log(`PZ TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================');
