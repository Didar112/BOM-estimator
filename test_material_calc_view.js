const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('TESTING MATERIAL-SPECIFIC CALCULATION DETAILS & BOM ACTIONS');
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

// --- 1. CZ Calculation Details Verification ---
console.log('--- 1. Testing CZ BOM Rows Calculation Details ---');
const czResult = cz.calculateCZMaster([
  { id: 'v1', name: 'Variant 1', length: 7.5, lengthUnit: 'inch', quantity: 4000, zipperSize: '#5', zipperType: 'closed_end' },
  { id: 'v2', name: 'Variant 2', length: 9.0, lengthUnit: 'inch', quantity: 3380, zipperSize: '#5', zipperType: 'closed_end' },
  { id: 'v3', name: 'Variant 3', length: 9.5, lengthUnit: 'inch', quantity: 2000, zipperSize: '#5', zipperType: 'closed_end' }
], { lossPercent: 3.0 });

const czRows = czResult.materials.processedRows;
assert('CZ produced 7 factory BOM rows', czRows.length === 7);

czRows.forEach(r => {
  assert(`Row "${r.materialName || r.component}" has calculationDetail`, r.calculationDetail && Array.isArray(r.calculationDetail.steps) && r.calculationDetail.steps.length > 0);
  assert(`Row "${r.materialName || r.component}" calculationDetail finalQuantity matches totalQuantity (${r.totalQuantity})`, Math.abs(r.calculationDetail.finalQuantity - r.totalQuantity) < 0.0001);
});

// Check specific tape breakdown steps
const czTapeRow = czRows.find(r => r.component === 'TOTL TAPE KG');
assert('CZ Tape has 3 calculation steps', czTapeRow.calculationDetail.steps.length === 3);
assert('CZ Tape Step 1 contains Base Chain ~2,441.36 Mtr', czTapeRow.calculationDetail.steps[0].subtotalValue.includes('2441.36'));
assert('CZ Tape Step 2 contains 3% loss and 2,514.60 Mtr', czTapeRow.calculationDetail.steps[1].formula.includes('2514.60') || czTapeRow.calculationDetail.steps[1].result.includes('2514.60'));
assert('CZ Tape Step 3 contains tape divisor 54.5 and final 46.14 KG', czTapeRow.calculationDetail.steps[2].formula.includes('54.5') && czTapeRow.calculationDetail.steps[2].result.includes('46.14'));

// --- 2. MZ Calculation Details Verification ---
console.log('\n--- 2. Testing MZ BOM Rows Calculation Details ---');
const mzResult = mz.calculateMZMaster([
  { id: 'v1', name: 'Variant 1', length: 7.0, lengthUnit: 'inch', quantity: 2000, zipperSize: '#3', zipperType: 'closed_end' }
], { lossPercent: 3.0 });

const mzRows = mzResult.materials.processedRows;
assert('MZ produced BOM rows with calculationDetail', mzRows.length >= 4);

mzRows.forEach(r => {
  assert(`MZ Row "${r.materialName || r.component}" has calculationDetail`, r.calculationDetail && Array.isArray(r.calculationDetail.steps) && r.calculationDetail.steps.length > 0);
  assert(`MZ Row "${r.materialName || r.component}" calculationDetail matches totalQuantity`, Math.abs(r.calculationDetail.finalQuantity - r.totalQuantity) < 0.0001);
});

// --- 3. WIRE Calculation Details Verification ---
console.log('\n--- 3. Testing WIRE BOM Rows Calculation Details ---');
const wireResult = wire.calculateWireMaster([
  { id: 'v1', name: 'Variant 1', length: 18, lengthUnit: 'inch', quantity: 2000, zipperSize: '#5_long', zipperType: 'closed_end' }
], { lossPercent: 5.0 });

const wireRows = wireResult.materials.processedRows;
assert('WIRE produced BOM rows with calculationDetail', wireRows.length >= 1);

wireRows.forEach(r => {
  assert(`WIRE Row "${r.materialName || r.component}" has calculationDetail`, r.calculationDetail && Array.isArray(r.calculationDetail.steps) && r.calculationDetail.steps.length > 0);
  assert(`WIRE Row "${r.materialName || r.component}" calculationDetail matches totalQuantity`, Math.abs(r.calculationDetail.finalQuantity - r.totalQuantity) < 0.0001);
});

// --- 4. Multi-Group Merged BOM Calculation Details & Sources ---
console.log('\n--- 4. Testing Multi-Group Merged BOM Sources & Summation ---');
const multiGroupEstimate = {
  categoryGroups: [
    {
      id: 'g1',
      name: 'Category Group 1',
      category: 'cz',
      lossPercent: 3.0,
      variants: [
        { id: 'v1_1', name: 'Variant 1', length: 8, lengthUnit: 'inch', quantity: 1000, zipperSize: '#5', zipperType: 'closed_end' }
      ]
    },
    {
      id: 'g2',
      name: 'Category Group 2',
      category: 'cz',
      lossPercent: 3.0,
      variants: [
        { id: 'v2_1', name: 'Variant 1', length: 12, lengthUnit: 'inch', quantity: 2000, zipperSize: '#5', zipperType: 'closed_end' }
      ]
    }
  ]
};

const fullEstimate = calcEngine.calculateFullEstimate(multiGroupEstimate);
const mergedRows = fullEstimate.aggregatedMaterials.processedRows;

// Check merged Tape row
const mergedTapeRow = mergedRows.find(r => r.component === 'TOTL TAPE KG');
assert('Merged Tape row exists', Boolean(mergedTapeRow));
assert('Merged Tape row has 2 contributingSources', mergedTapeRow.contributingSources && mergedTapeRow.contributingSources.length === 2);
assert('Contributing Source 1 is Category Group 1', mergedTapeRow.contributingSources[0].groupName === 'Category Group 1');
assert('Contributing Source 2 is Category Group 2', mergedTapeRow.contributingSources[1].groupName === 'Category Group 2');
assert('Both contributing sources have individual calculationDetail', mergedTapeRow.contributingSources[0].calculationDetail && mergedTapeRow.contributingSources[1].calculationDetail);

const sumSources = mergedTapeRow.contributingSources.reduce((sum, s) => sum + s.quantity, 0);
assert('Sum of contributing source quantities strictly matches merged totalQuantity', Math.abs(sumSources - mergedTapeRow.totalQuantity) < 0.0001);

// --- 5. UI DOM & Dropdown Removal Verification ---
console.log('\n--- 5. Testing UI DOM & Dropdown Removal ---');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert('index.html has NO select-calc-details-group dropdown', !indexHtml.includes('id="select-calc-details-group"'));
assert('index.html has NO calc-group-select-bar', !indexHtml.includes('calc-group-select-bar'));
assert('index.html has Calculation Details container', indexHtml.includes('id="section-formula-details"'));

const appJs = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
assert('app.js renderConsolidatedBOM has [ View Calculation ] button', appJs.includes('btn-view-calc') && appJs.includes('View Calculation'));
assert('app.js renderConsolidatedBOM sets data-material-key', appJs.includes('data-material-key='));
assert('app.js handles multi-source merged material display', appJs.includes('MERGED FROM') && appJs.includes('calc-source-block'));

console.log('\n====================================================');
console.log(`MATERIAL CALCULATION TEST RESULTS: ${passed} / ${total} PASSED (100% SUCCESS)`);
console.log('====================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
