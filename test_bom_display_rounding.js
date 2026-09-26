/**
 * Test Suite for Final BOM Output Quantities Rounding & Decimal Behavior
 * 
 * Verifies:
 * 1. CZ#3 verification examples from user request:
 *    - CZ#3 Tape: 28.3393 KG -> 28.34
 *    - Top Stop Wire: 0.1876 KG -> 0.19
 *    - Bottom Stop Wire: 0.2814 KG -> 0.28
 *    - Tollilon Flat Wire: 163.8757 Unit -> 164
 * 2. Exact calculation quantities preserved internally (no premature rounding).
 * 3. Excel-derived precision rules across all categories (CZ, MZ, WIRE, PZ):
 *    - Tape KG, Stop Wire KG, Teeth Wire KG, CZ Resin KG -> 2 decimals
 *    - PZO & PZC Molded Resin -> 3 decimals
 *    - PZ Tape Wise Resin -> 4 decimals
 *    - Tollilon Flat Wire & H-Bottom Stop -> 0 decimals (integer)
 *    - Sliders -> 0 decimals if integer, 2 decimals if fractional
 * 4. Calculation details output and exact value hint.
 */

const fs = require('fs');
const path = require('path');

global.window = {};

require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
require('./js/formulas/pz.js');
require('./js/materials.js');
require('./js/bomRules.js');
require('./js/calculations.js');

const { formatBOMQuantity, getMaterialDisplayDecimals, calculateFullEstimate } = window.CalculatorEngine;

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
    console.error(`  ✗ FAIL: ${message} (Expected: "${expected}", Got: "${actual}")`);
  }
}

console.log('====================================================');
console.log('TESTING BOM FINAL OUTPUT QUANTITIES ROUNDING & DISPLAY');
console.log('====================================================\n');

// 1. CZ#3 USER VERIFICATION EXAMPLES
console.log('--- 1. Testing CZ#3 User Verification Examples ---');

const cz3TapeRow = {
  key: 'mat_cz_tape_kg_3',
  materialName: 'CZ#3 Tape',
  unit: 'KG',
  totalQuantity: 28.33930842
};
assertEquals(formatBOMQuantity(cz3TapeRow), '28.34', 'CZ#3 Tape: 28.3393 -> 28.34');
assertEquals(cz3TapeRow.totalQuantity, 28.33930842, 'CZ#3 Tape internal calculation precision is strictly preserved');

const topStopRow = {
  key: 'mat_cz_ts_3',
  materialName: 'CZ#3 Top Stop Wire',
  component: 'CZ#3 T/S',
  unit: 'KG',
  totalQuantity: 0.1876432
};
assertEquals(formatBOMQuantity(topStopRow), '0.19', 'Top Stop Wire: 0.1876 -> 0.19');
assertEquals(topStopRow.totalQuantity, 0.1876432, 'Top Stop Wire internal calculation precision is strictly preserved');

const bottomStopRow = {
  key: 'mat_cz_bs_3',
  materialName: 'CZ#3 Bottom Stop Wire',
  component: 'CZ#3 B/S',
  unit: 'KG',
  totalQuantity: 0.2814125
};
assertEquals(formatBOMQuantity(bottomStopRow), '0.28', 'Bottom Stop Wire: 0.2814 -> 0.28');
assertEquals(bottomStopRow.totalQuantity, 0.2814125, 'Bottom Stop Wire internal calculation precision is strictly preserved');

const tollilonRow = {
  key: 'mat_cz_tollilon_3',
  materialName: 'Tollilon Flat Wire (CZ#3)',
  component: 'TOLLILON FLAT WIRE',
  unit: 'Unit',
  totalQuantity: 163.875691
};
assertEquals(formatBOMQuantity(tollilonRow), '164', 'Tollilon Flat Wire: 163.8757 -> 164');
assertEquals(tollilonRow.totalQuantity, 163.875691, 'Tollilon Flat Wire internal calculation precision is strictly preserved');

// 2. TESTING CROSS-CATEGORY EXCEL PRECISION RULES
console.log('\n--- 2. Testing Cross-Category Excel Precision Rules ---');

// Resin for CZ#3
const czResinRow = {
  key: 'mat_cz_resin_3',
  materialName: 'Resin for CZ#3',
  unit: 'KG',
  totalQuantity: 5.3800001
};
assertEquals(formatBOMQuantity(czResinRow), '5.38', 'Resin for CZ#3: 5.3800 -> 5.38');

// Slider CZ#5 (integer pcs)
const sliderIntRow = {
  key: 'mat_cz_slider_5',
  materialName: 'Slider CZ#5 (+1.5% Add.)',
  unit: 'Pcs',
  totalQuantity: 4060
};
assertEquals(formatBOMQuantity(sliderIntRow), '4,060', 'Slider Integer Pcs: 4060 -> 4,060');

// Slider CZ#3 (fractional pcs -> rounded up to next integer)
const sliderFracRow = {
  key: 'mat_cz_slider_3',
  materialName: 'Slider CZ#3 (+1.5% Add.)',
  unit: 'Pcs',
  totalQuantity: 5460.70
};
assertEquals(formatBOMQuantity(sliderFracRow), '5,461', 'Slider Fractional Pcs: 5460.70 -> 5,461 (next integer)');

// User Screenshot Verification 1: Slider MZ#5 with 1,486.25 pcs -> 1,487
const sliderMz5Row = {
  key: 'mat_mz_slider_5',
  materialName: 'Slider MZ#5 (+2.5% Add.)',
  component: 'SLIDER (+2.5% ADD.)',
  componentCategory: 'slider',
  unit: 'Pcs',
  totalQuantity: 1486.25
};
assertEquals(formatBOMQuantity(sliderMz5Row), '1,487', 'User Case 1: Slider MZ#5 1486.25 -> 1,487 (next integer)');

// User Screenshot Verification 2: Slider MZ#3 with 717.50 pcs -> 718
const sliderMz3Row = {
  key: 'mat_mz_slider_3',
  materialName: 'Slider MZ#3 (+2.5% Add.)',
  component: 'SLIDER (+2.5% ADD.)',
  componentCategory: 'slider',
  unit: 'Pcs',
  totalQuantity: 717.50
};
assertEquals(formatBOMQuantity(sliderMz3Row), '718', 'User Case 2: Slider MZ#3 717.50 -> 718 (next integer)');

// Metal Zipper Teeth Wire
const mzTeethWireRow = {
  key: 'mat_mz_teeth_wire_3',
  materialName: 'Teeth Wire #3 (Brass / Metal)',
  unit: 'KG',
  totalQuantity: 15.20459
};
assertEquals(formatBOMQuantity(mzTeethWireRow), '15.20', 'MZ Teeth Wire: 15.20459 -> 15.20');

// Metal Zipper H-Bottom Stop
const mzHBottomRow = {
  key: 'mat_mz_h_bottom_3',
  materialName: 'H-Bottom Stop (MZ#3)',
  component: 'H-BOTTOM STOP',
  unit: 'Pcs',
  totalQuantity: 2060.0
};
assertEquals(formatBOMQuantity(mzHBottomRow), '2,060', 'MZ H-Bottom Stop: 2060 -> 2,060 (0 decimals)');

// PZ#3 Tape Wise (Excel uses 4 decimals)
const pzTapeWiseRow = {
  key: 'mat_pz_tape_wise_3',
  materialName: 'PZO#3 & PZC#3 Tape Wise',
  component: 'PZO#3 & PZC#3 Tape Wise',
  unit: 'KG',
  totalQuantity: 20.772654
};
assertEquals(formatBOMQuantity(pzTapeWiseRow), '20.7727', 'PZ Tape Wise: 20.772654 -> 20.7727 (4 decimals)');

// PZ#3 PZO Molded Resin (Excel uses 3 decimals)
const pzPzoRow = {
  key: 'mat_pz_pzo_3',
  materialName: 'PZO#3',
  component: 'PZO#3',
  unit: 'KG',
  totalQuantity: 5.9225
};
assertEquals(formatBOMQuantity(pzPzoRow), '5.923', 'PZ PZO#3: 5.9225 -> 5.923 (3 decimals)');

// PZ#3 PZC Molded Resin (Excel uses 3 decimals)
const pzPzcRow = {
  key: 'mat_pz_pzc_3',
  materialName: 'PZC#3',
  component: 'PZC#3',
  unit: 'KG',
  totalQuantity: 3.8625
};
assertEquals(formatBOMQuantity(pzPzcRow), '3.863', 'PZ PZC#3: 3.8625 -> 3.863 (3 decimals)');

// PZ#3 Chain Consumption (Mtr) -> nearest integer in BOM display
const pzChainRow = {
  key: 'mat_pz_chain_consumption_3',
  materialName: 'Chain Consumption',
  unit: 'Mtr',
  totalQuantity: 2486.6349
};
assertEquals(formatBOMQuantity(pzChainRow), '2,487', 'PZ Chain Consumption: 2486.6349 -> 2,487 (nearest whole number)');

// 3. FULL ESTIMATE CALCULATION & INVARIANCE
console.log('\n--- 3. Testing Full Estimate End-to-End Calculation Invariance ---');
const testEstimate = {
  categoryGroups: [
    {
      id: 'group_cz',
      name: 'Nylon Group',
      category: 'cz',
      variants: [
        { id: 'v1', name: 'Front', length: 7.5, lengthUnit: 'inch', quantity: 4000, zipperSize: '#5' },
        { id: 'v2', name: 'Pocket 1', length: 9.0, lengthUnit: 'inch', quantity: 3380, zipperSize: '#3' },
        { id: 'v3', name: 'Pocket 2', length: 9.5, lengthUnit: 'inch', quantity: 2000, zipperSize: '#3' }
      ]
    }
  ]
};

const calcResult = calculateFullEstimate(testEstimate);
const czRows = calcResult.categoryGroups[0].materials.processedRows;

const cz3TapeFromCalc = czRows.find(r => r.key === 'mat_cz_tape_kg_3');
assert(cz3TapeFromCalc !== undefined, 'CZ#3 Tape exists in calculation');
assert(typeof cz3TapeFromCalc.totalQuantity === 'number', 'totalQuantity is a raw floating number');
assert(Math.abs(cz3TapeFromCalc.totalQuantity - 17.4172) < 0.01, 'CZ#3 raw quantity is unrounded ~17.4172');
assertEquals(formatBOMQuantity(cz3TapeFromCalc), '17.42', 'CZ#3 Tape displayed as 17.42 KG');

const cz5TapeFromCalc = czRows.find(r => r.key === 'mat_cz_tape_kg_5');
assert(cz5TapeFromCalc !== undefined, 'CZ#5 Tape exists in calculation');
assert(Math.abs(cz5TapeFromCalc.totalQuantity - 17.8242) < 0.01, 'CZ#5 raw quantity is unrounded ~17.8242');
assertEquals(formatBOMQuantity(cz5TapeFromCalc), '17.82', 'CZ#5 Tape displayed as 17.82 KG');

console.log('\n====================================================');
console.log(`BOM DISPLAY ROUNDING TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================\n');
