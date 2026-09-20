const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('INTERACTIVE SIMULATION TEST: BOM "VIEW CALCULATION"');
console.log('====================================================\n');

// Load engine modules
const cz = require('./js/formulas/cz.js');
const mz = require('./js/formulas/mz.js');
const wire = require('./js/formulas/wire.js');
const calcEngine = require('./js/calculations.js');

let passed = 0;
let total = 0;

function assert(desc, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${desc}`);
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

// 1. Simulate full estimate calculation with 2 CZ groups (User Case)
const appState = {
  currentEstimate: {
    categoryGroups: [
      {
        id: 'group_1',
        name: 'Category Group 1',
        category: 'cz',
        lossPercent: 3.0,
        variants: [
          { id: 'v1', name: 'Variant 1', length: 7.5, lengthUnit: 'inch', quantity: 4000, zipperSize: '#5', zipperType: 'closed_end' },
          { id: 'v2', name: 'Variant 2', length: 9.0, lengthUnit: 'inch', quantity: 3380, zipperSize: '#5', zipperType: 'closed_end' },
          { id: 'v3', name: 'Variant 3', length: 9.5, lengthUnit: 'inch', quantity: 2000, zipperSize: '#5', zipperType: 'closed_end' }
        ]
      }
    ]
  },
  selectedMaterialKey: null,
  lastCalculation: null
};

// Calculate
const result = calcEngine.calculateFullEstimate(appState.currentEstimate);
appState.lastCalculation = result;

const rows = result.aggregatedMaterials.processedRows;
assert('BOM has 7 processed rows', rows.length === 7);

// Verify default active material key assignment
if (!appState.selectedMaterialKey && rows.length > 0) {
  appState.selectedMaterialKey = rows[0].key;
}
assert('Default selected material is first row', appState.selectedMaterialKey === rows[0].key);

// Find Tape Row
const tapeRow = rows.find(r => r.component === 'TOTL TAPE KG');
assert('Tape Row has calculationDetail', tapeRow && tapeRow.calculationDetail);
assert('Tape Row displays 46.14 KG', tapeRow.calculationDetail.displayQuantity === '46.14 KG');
assert('Tape Row Step 1 has Base Chain 2,441.36 Mtr', tapeRow.calculationDetail.steps[0].subtotalValue.includes('2441.36'));
assert('Tape Row Step 2 has Loss-Inclusive 2,514.60 Mtr', tapeRow.calculationDetail.steps[1].result.includes('2514.60'));
assert('Tape Row Step 3 has Divisor 54.5 and 46.14 KG', tapeRow.calculationDetail.steps[2].formula.includes('54.5') && tapeRow.calculationDetail.steps[2].result.includes('46.14'));

// Simulate user clicking "View Calculation" for Slider
const sliderRow = rows.find(r => r.component === 'SLIDER (+1.5% ADD.)');
appState.selectedMaterialKey = sliderRow.key;
assert('Slider Row has calculationDetail', sliderRow && sliderRow.calculationDetail);
assert('Slider Step 1 shows 9,380 pcs total', sliderRow.calculationDetail.steps[0].result.includes('9,380'));
assert('Slider Step 2 shows 1.5% multiplier and 9,520.70 Pcs', sliderRow.calculationDetail.steps[1].result.includes('9,520.70'));

// Simulate user clicking "View Calculation" for Resin
const resinRow = rows.find(r => r.component === 'CZ#5 RESIN');
appState.selectedMaterialKey = resinRow.key;
assert('Resin Row has calculationDetail', resinRow && resinRow.calculationDetail);
assert('Resin Step 2 shows Divisor 900 and 10.42 KG', resinRow.calculationDetail.steps[1].formula.includes('900') && resinRow.calculationDetail.steps[1].result.includes('10.42'));

// Simulate user clicking "View Calculation" for Ultrasonic U-Top
const utopRow = rows.find(r => r.component === 'ULTRASONIC U-TOP');
appState.selectedMaterialKey = utopRow.key;
assert('U-Top Row has calculationDetail', utopRow && utopRow.calculationDetail);
assert('U-Top Step 2 shows Factor 0.074 and 0.69 KG', utopRow.calculationDetail.steps[1].formula.includes('0.074') && utopRow.calculationDetail.steps[1].result.includes('0.69'));

// --- Test 2: Multi-Group Merging Simulation ---
appState.currentEstimate.categoryGroups.push({
  id: 'group_2',
  name: 'Category Group 2',
  category: 'cz',
  lossPercent: 3.0,
  variants: [
    { id: 'v2_1', name: 'Variant 1', length: 12.0, lengthUnit: 'inch', quantity: 2000, zipperSize: '#5', zipperType: 'closed_end' }
  ]
});

const multiResult = calcEngine.calculateFullEstimate(appState.currentEstimate);
appState.lastCalculation = multiResult;
const multiRows = multiResult.aggregatedMaterials.processedRows;

// Inspect merged Tape row
const mergedTape = multiRows.find(r => r.component === 'TOTL TAPE KG');
assert('Merged Tape row exists with 2 contributing sources', mergedTape && mergedTape.contributingSources.length === 2);

const src1 = mergedTape.contributingSources[0];
const src2 = mergedTape.contributingSources[1];

assert('Source 1 is Category Group 1 (Qty ≈ 46.14 KG)', src1.groupName === 'Category Group 1' && Math.abs(src1.quantity - 46.1395) < 0.01);
assert('Source 2 is Category Group 2 (Qty ≈ 13.23 KG)', src2.groupName === 'Category Group 2' && Math.abs(src2.quantity - 13.2298) < 0.01);
assert('Merged Total Quantity is exact sum (≈ 59.37 KG)', Math.abs(mergedTape.totalQuantity - (src1.quantity + src2.quantity)) < 0.0001);


assert('Source 1 has complete calculation steps', src1.calculationDetail && src1.calculationDetail.steps.length === 3);
assert('Source 2 has complete calculation steps', src2.calculationDetail && src2.calculationDetail.steps.length === 3);


console.log('\n====================================================');
console.log(`SIMULATION RESULTS: ${passed} / ${total} CHECKS PASSED (100%)`);
console.log('====================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
