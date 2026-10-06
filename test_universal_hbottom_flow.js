/**
 * Verification Test: Universal H-Bottom for Closed-End Zippers across all categories (CZ, MZ, PZ)
 * and Complete Absence on Open-End Zippers
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
console.log('RUNNING FULL UNIVERSAL H-BOTTOM FLOW VERIFICATION');
console.log('===============================================================');

// Mock browser globals for app.js template rendering
global.window = {
  CalculatorEngine: calcEngine,
  BOMRules: bomRules,
  CZFormulaEngine: czEngine,
  MZFormulaEngine: mzEngine,
  PZFormulaEngine: pzEngine,
  WireFormulaEngine: wireEngine
};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
const funcExtractor = new Function('escapeHtml', `
  ${appJsSource}
  return { buildCategoryGroupHTML, getCategoryParamPreviewData };
`);
const mockEscape = (s) => String(s || '');
const { buildCategoryGroupHTML, getCategoryParamPreviewData } = funcExtractor(mockEscape);

// --- 1. CZ: Closed-End vs Open-End ---
console.log('\n--- 1. Testing Nylon Zipper (CZ) ---');
// 1a. Closed-End CZ#5
const czClosedEst = {
  items: [{
    id: 'item_cz_c',
    displayName: 'CZ#5 Closed End',
    category: 'cz',
    zipperSize: '#5',
    zipperType: 'closed_end',
    length: 12,
    lengthUnit: 'inch',
    quantity: 1000
  }]
};
const czClosedCalc = calcEngine.calculateFullEstimate(czClosedEst);
const czClosedRows = czClosedCalc.aggregatedMaterials.processedRows;
const czHBottomRow = czClosedRows.find(r => r.component === 'H-BOTTOM');
assert(czHBottomRow, 'CZ Closed-End MUST have H-Bottom BOM row');
assert.strictEqual(czHBottomRow.unit, 'Pcs', 'H-Bottom unit must be Pcs');
assert.strictEqual(czHBottomRow.totalQuantity, 1040, '1000 pcs closed-end CZ with 4% dynamic loss = 1040 Pcs');
console.log('  ✓ PASS: CZ#5 Closed-End produces H-BOTTOM in BOM (1,040 Pcs)');

// Check CZ Closed-End UI HTML
const czClosedHtml = buildCategoryGroupHTML(czClosedCalc.categoryGroups[0], 0, 1);
const czClosedGid = czClosedCalc.categoryGroups[0].id;
assert(czClosedHtml.includes(`cz-hbottom-loss-${czClosedGid}`), 'CZ grid renders cz-hbottom-loss');
assert(!czClosedHtml.includes(`cz-hbottom-loss-${czClosedGid}" 
                         class="form-input font-mono category-styled-input input-cz-param input-group-hbottom-loss" 
                         data-group-id="${czClosedGid}" 
                         data-param="hBottomLossPercent" 
                         value="4" 
                         placeholder="0" 
                         disabled`), 'CZ Closed-End H-Bottom input is NOT disabled');
assert(!czClosedHtml.includes('param-inactive'), 'CZ Closed-End H-Bottom container is NOT param-inactive');
console.log('  ✓ PASS: CZ#5 Closed-End UI renders active H-Bottom Loss % input');

// 1b. Open-End CZ#5
const czOpenEst = {
  items: [{
    id: 'item_cz_o',
    displayName: 'CZ#5 Open End',
    category: 'cz',
    zipperSize: '#5',
    zipperType: 'open_end',
    length: 12,
    lengthUnit: 'inch',
    quantity: 1000
  }]
};
const czOpenCalc = calcEngine.calculateFullEstimate(czOpenEst);
const czOpenRows = czOpenCalc.aggregatedMaterials.processedRows;
assert(!czOpenRows.some(r => r.component === 'H-BOTTOM'), 'CZ Open-End MUST NOT have H-Bottom BOM row');
console.log('  ✓ PASS: CZ#5 Open-End has NO H-BOTTOM in BOM');

// Check CZ Open-End UI HTML
const czOpenHtml = buildCategoryGroupHTML(czOpenCalc.categoryGroups[0], 0, 1);
const czOpenGid = czOpenCalc.categoryGroups[0].id;
assert(czOpenHtml.includes(`cz-hbottom-loss-${czOpenGid}`), 'CZ grid renders cz-hbottom-loss');
assert(czOpenHtml.includes('disabled'), 'CZ Open-End H-Bottom input has disabled attribute');
assert(czOpenHtml.includes('param-inactive'), 'CZ Open-End H-Bottom container has param-inactive class');
assert(czOpenHtml.includes('(Closed-End only)'), 'CZ Open-End label includes (Closed-End only)');
console.log('  ✓ PASS: CZ#5 Open-End UI renders disabled H-Bottom input with (Closed-End only)');

// --- 2. MZ: Closed-End vs Open-End (#3 and #5) ---
console.log('\n--- 2. Testing Metal Zipper (MZ) ---');
// 2a. MZ#5 Closed-End
const mz5ClosedEst = {
  items: [{
    id: 'item_mz5_c',
    displayName: 'MZ#5 Closed End',
    category: 'mz',
    zipperSize: '#5',
    zipperType: 'closed_end',
    length: 10,
    lengthUnit: 'inch',
    quantity: 2000
  }]
};
const mz5ClosedCalc = calcEngine.calculateFullEstimate(mz5ClosedEst);
const mz5ClosedRows = mz5ClosedCalc.aggregatedMaterials.processedRows;
assert(mz5ClosedRows.some(r => r.component === 'H-BOTTOM'), 'MZ#5 Closed-End MUST have H-Bottom');
assert(mz5ClosedRows.some(r => r.component === 'Wire for B/S# 4&5'), 'MZ#5 MUST still have Wire for B/S# 4&5');
assert(!mz5ClosedRows.some(r => r.component === 'PIN BOX'), 'MZ#5 Closed-End MUST NOT have PIN BOX');
console.log('  ✓ PASS: MZ#5 Closed-End has H-BOTTOM AND Wire for B/S# 4&5, and NO Pin Box');

// 2b. MZ#5 Open-End
const mz5OpenEst = {
  items: [{
    id: 'item_mz5_o',
    displayName: 'MZ#5 Open End',
    category: 'mz',
    zipperSize: '#5',
    zipperType: 'open_end',
    length: 10,
    lengthUnit: 'inch',
    quantity: 2000
  }]
};
const mz5OpenCalc = calcEngine.calculateFullEstimate(mz5OpenEst);
const mz5OpenRows = mz5OpenCalc.aggregatedMaterials.processedRows;
assert(!mz5OpenRows.some(r => r.component === 'H-BOTTOM'), 'MZ#5 Open-End MUST NOT have H-Bottom');
assert(mz5OpenRows.some(r => r.component === 'PIN BOX'), 'MZ#5 Open-End MUST have PIN BOX');
assert(mz5OpenRows.some(r => r.component === 'Wire for B/S# 4&5'), 'MZ#5 Open-End has Wire for B/S# 4&5');
console.log('  ✓ PASS: MZ#5 Open-End has NO H-BOTTOM, and HAS Pin Box and Wire for B/S');

// 2c. MZ#3 Closed-End
const mz3ClosedEst = {
  items: [{
    id: 'item_mz3_c',
    displayName: 'MZ#3 Closed End',
    category: 'mz',
    zipperSize: '#3',
    zipperType: 'closed_end',
    length: 8,
    lengthUnit: 'inch',
    quantity: 500
  }]
};
const mz3ClosedCalc = calcEngine.calculateFullEstimate(mz3ClosedEst);
const mz3ClosedRows = mz3ClosedCalc.aggregatedMaterials.processedRows;
const mz3HBottom = mz3ClosedRows.find(r => r.component === 'H-BOTTOM');
assert(mz3HBottom, 'MZ#3 Closed-End MUST have H-Bottom');
assert.strictEqual(mz3HBottom.totalQuantity, 540, '500 pcs closed-end MZ#3 with 8% dynamic loss = 540 Pcs');
assert(!mz3ClosedRows.some(r => r.component === 'PIN BOX'), 'MZ#3 Closed-End MUST NOT have PIN BOX');
console.log('  ✓ PASS: MZ#3 Closed-End has H-BOTTOM (540 Pcs) and NO Pin Box');

// 2d. MZ#3 Open-End
const mz3OpenEst = {
  items: [{
    id: 'item_mz3_o',
    displayName: 'MZ#3 Open End',
    category: 'mz',
    zipperSize: '#3',
    zipperType: 'open_end',
    length: 8,
    lengthUnit: 'inch',
    quantity: 500
  }]
};
const mz3OpenCalc = calcEngine.calculateFullEstimate(mz3OpenEst);
const mz3OpenRows = mz3OpenCalc.aggregatedMaterials.processedRows;
assert(!mz3OpenRows.some(r => r.component === 'H-BOTTOM'), 'MZ#3 Open-End MUST NOT have H-Bottom');
assert(mz3OpenRows.some(r => r.component === 'PIN BOX'), 'MZ#3 Open-End MUST have PIN BOX');
console.log('  ✓ PASS: MZ#3 Open-End has NO H-BOTTOM, and HAS Pin Box');

// --- 3. PZ: Closed-End vs Open-End (#3, #5, #8) ---
console.log('\n--- 3. Testing Plastic / Molded Zipper (PZ) ---');
// 3a. PZ#5 Closed-End
const pz5ClosedEst = {
  items: [{
    id: 'item_pz5_c',
    displayName: 'PZ#5 Closed End',
    category: 'pz',
    zipperSize: '#5',
    zipperType: 'closed_end',
    length: 12,
    lengthUnit: 'inch',
    quantity: 3000
  }]
};
const pz5ClosedCalc = calcEngine.calculateFullEstimate(pz5ClosedEst);
const pz5ClosedRows = pz5ClosedCalc.aggregatedMaterials.processedRows;
const pzHBottomRow = pz5ClosedRows.find(r => r.component === 'H-BOTTOM');
assert(pzHBottomRow, 'PZ#5 Closed-End MUST have H-Bottom');
assert.strictEqual(pzHBottomRow.totalQuantity, 3075, '3000 pcs closed-end PZ with 2.5% dynamic loss = 3075 Pcs');
assert(!pz5ClosedRows.some(r => r.component === 'PIN BOX'), 'PZ Closed-End MUST NOT have PIN BOX');
console.log('  ✓ PASS: PZ#5 Closed-End has H-BOTTOM (3,075 Pcs) and NO Pin Box');

// Check PZ Closed-End UI HTML
const pzClosedHtml = buildCategoryGroupHTML(pz5ClosedCalc.categoryGroups[0], 0, 1);
const pzClosedGid = pz5ClosedCalc.categoryGroups[0].id;
assert(pzClosedHtml.includes(`pz-hbottom-loss-${pzClosedGid}`), 'PZ grid renders pz-hbottom-loss');
assert(!pzClosedHtml.includes('disabled\n                         title="H-Bottom Stop Loss Addition Percentage for PZ"'), 'PZ Closed-End H-Bottom input is NOT disabled');
console.log('  ✓ PASS: PZ#5 Closed-End UI renders active H-Bottom Loss % input');

// 3b. PZ#5 Open-End
const pz5OpenEst = {
  items: [{
    id: 'item_pz5_o',
    displayName: 'PZ#5 Open End',
    category: 'pz',
    zipperSize: '#5',
    zipperType: 'open_end',
    length: 12,
    lengthUnit: 'inch',
    quantity: 3000
  }]
};
const pz5OpenCalc = calcEngine.calculateFullEstimate(pz5OpenEst);
const pz5OpenRows = pz5OpenCalc.aggregatedMaterials.processedRows;
assert(!pz5OpenRows.some(r => r.component === 'H-BOTTOM'), 'PZ#5 Open-End MUST NOT have H-Bottom');
assert(!pz5OpenRows.some(r => r.component === 'PIN BOX'), 'PZ Open-End MUST NOT have PIN BOX');
console.log('  ✓ PASS: PZ#5 Open-End has NO H-BOTTOM and NO Pin Box');

// Check PZ Open-End UI HTML
const pzOpenHtml = buildCategoryGroupHTML(pz5OpenCalc.categoryGroups[0], 0, 1);
assert(pzOpenHtml.includes('disabled'), 'PZ Open-End H-Bottom input has disabled attribute');
assert(pzOpenHtml.includes('param-inactive'), 'PZ Open-End H-Bottom container has param-inactive class');
assert(pzOpenHtml.includes('(Closed-End only)'), 'PZ Open-End label includes (Closed-End only)');
console.log('  ✓ PASS: PZ#5 Open-End UI renders disabled H-Bottom input with (Closed-End only)');

// --- 4. Wire Category Verification ---
console.log('\n--- 4. Testing Brass / Metal Wire (WIRE) ---');
const wireEst = {
  items: [{
    id: 'item_wire_1',
    displayName: 'WIRE#5 Normal Teeth',
    category: 'wire',
    zipperSize: '#5_normal',
    length: 10,
    lengthUnit: 'inch',
    quantity: 2000
  }]
};
const wireCalc = calcEngine.calculateFullEstimate(wireEst);
const wireRows = wireCalc.aggregatedMaterials.processedRows;
assert(!wireRows.some(r => r.component === 'H-BOTTOM'), 'WIRE MUST NOT have H-Bottom');
assert(!wireRows.some(r => r.component === 'PIN BOX'), 'WIRE MUST NOT have Pin Box');
console.log('  ✓ PASS: WIRE category has NO H-Bottom and NO Pin Box');

// --- 5. At-a-Glance Preview Text Verification ---
console.log('\n--- 5. Testing At-a-Glance Parameter Previews ---');
const pClosed = getCategoryParamPreviewData(czClosedCalc.categoryGroups[0]);
assert(pClosed.czHBottom.includes('H-Bottom: 1,040 Pcs'), 'CZ Closed-End preview shows H-Bottom: 1,040 Pcs');

const pOpen = getCategoryParamPreviewData(czOpenCalc.categoryGroups[0]);
assert(pOpen.czHBottom === '— (Closed-End only)', 'CZ Open-End preview shows — (Closed-End only)');

console.log('  ✓ PASS: Previews display exact "H-Bottom: X Pcs" when closed-end and "— (Closed-End only)" when open-end');

console.log('\n===============================================================');
console.log('ALL UNIVERSAL H-BOTTOM CHECKS PASSED SUCCESSFULLY!');
console.log('===============================================================');
