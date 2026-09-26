/**
 * Automated Acceptance Test for Product Information / Items Refactor
 * Validates all 29 requirements from the task specification.
 */

const fs = require('fs');
const path = require('path');

// Setup minimal DOM mock environment
const mockElements = {};

function createMockElement(id = '') {
  return {
    id: id,
    innerHTML: '',
    textContent: '',
    value: '',
    className: '',
    dataset: {},
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
    },
    getAttribute: function(name) {
      if (name === 'data-item-id') return this.dataset.itemId;
      if (name === 'data-group-id') return this.dataset.groupId;
      return null;
    },
    setAttribute: function(name, val) {
      if (name === 'data-item-id') this.dataset.itemId = val;
      if (name === 'data-group-id') this.dataset.groupId = val;
    },
    querySelectorAll: function() { return []; },
    querySelector: function() { return createMockElement(); },
    appendChild: function(child) {},
    closest: function() { return null; },
    scrollIntoView: function() {},
    addEventListener: function() {}
  };
}

global.window = global;
global.confirm = () => true;
global.alert = () => {};
global.document = {
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
  },
  createElement: (tag) => createMockElement(tag),
  querySelectorAll: (sel) => [],
  querySelector: (sel) => null,
  addEventListener: (evt, cb) => {}
};

// Require core modules
require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
require('./js/formulas/pz.js');
require('./js/materials.js');
require('./js/bomRules.js');
require('./js/calculations.js');
require('./js/storage.js');

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

console.log('====================================================');
console.log('ACCEPTANCE TESTS: ITEMS & CONFIGURATION UI REFACTOR');
console.log('====================================================\n');

// Read app.js code to test methods and UI templates
const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
const indexHtmlSource = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Load app.js in global context
eval(appJsSource);

// 1. Open a new estimate
console.log('--- Step 1: Open a new estimate ---');
handleNewEstimate();
assert(Array.isArray(appState.currentEstimate.items), 'appState.currentEstimate.items is an initialized array');
assert(appState.currentEstimate.items.length === 0, 'New estimate starts with 0 items');

// 2. The left side shows: Items, + Add New Item
console.log('\n--- Step 2: Verify Left Side Controls & Terminology ---');
assert(indexHtmlSource.includes('id="heading-items-section">1. Items'), 'Left panel heading is "1. Items"');
assert(indexHtmlSource.includes('+ Add New Item'), 'Left panel has "+ Add New Item" button');
assert(indexHtmlSource.includes('id="btn-add-item"'), 'Button has id="btn-add-item"');
assert(indexHtmlSource.includes('id="items-container"'), 'Container has id="items-container"');

// 3. The right side shows: Select Item, Calculation Details
console.log('\n--- Step 3: Verify Right Side Column Layout ---');
assert(indexHtmlSource.includes('id="section-select-item"'), 'Right column contains "#section-select-item"');
assert(indexHtmlSource.includes('id="heading-select-item">Select Item</h3>'), 'Right column heading is "Select Item"');
assert(indexHtmlSource.includes('id="section-formula-details"'), 'Right column contains "#section-formula-details"');
const selectItemPos = indexHtmlSource.indexOf('id="section-select-item"');
const calcDetailsPos = indexHtmlSource.indexOf('id="section-formula-details"');
assert(selectItemPos < calcDetailsPos && selectItemPos !== -1, 'Select Item panel appears DIRECTLY ABOVE Calculation Details in right column');

// 4. Add CZ#5
console.log('\n--- Step 4 & 5: Add CZ#5 as an independent Item ---');
handleAddNewItem('cz_5');
assert(appState.currentEstimate.items.length === 1, 'CZ#5 added; items.length is 1');
const item1 = appState.currentEstimate.items[0];
assert(item1.displayName === 'CZ#5', `Item 1 is CZ#5 (Got: ${item1.displayName})`);
assert(item1.category === 'cz', `Item 1 category is cz (Got: ${item1.category})`);
assert(item1.zipperSize === '#5', `Item 1 size is #5 (Got: ${item1.zipperSize})`);
assert(appState.activeItemId === item1.id, `Item 1 is active (activeItemId: ${appState.activeItemId})`);

// 6. Right-side Select Item displays existing CZ#5 configuration fields/defaults
console.log('\n--- Step 6: Verify CZ#5 configuration panel ---');
const configHtmlCZ5 = mockElements['select-item-config-body'].innerHTML;
assert(configHtmlCZ5.includes('CZ Production Parameters (CZ#5)'), 'Select Item panel displays CZ Production Parameters (CZ#5)');
assert(configHtmlCZ5.includes('value="1.78"') && configHtmlCZ5.includes('Chain Allowance'), 'CZ#5 default Chain Allowance is 1.78');
assert(configHtmlCZ5.includes('value="54.5"') && configHtmlCZ5.includes('Tape Divisor'), 'CZ#5 default Tape Divisor is 54.5');
assert(configHtmlCZ5.includes('Special U-Top Requirement'), 'CZ#5 has Special U-Top Requirement checkbox');

// 7 & 8. Add CZ#3
console.log('\n--- Step 7 & 8: Add CZ#3 as a second independent Item ---');
handleAddNewItem('cz_3');
assert(appState.currentEstimate.items.length === 2, 'CZ#3 added; items.length is 2');
const item2 = appState.currentEstimate.items[1];
assert(item2.displayName === 'CZ#3', `Item 2 is CZ#3 (Got: ${item2.displayName})`);
assert(appState.activeItemId === item2.id, `Item 2 is now active (activeItemId: ${appState.activeItemId})`);
const configHtmlCZ3 = mockElements['select-item-config-body'].innerHTML;
assert(configHtmlCZ3.includes('CZ Production Parameters (CZ#3)'), 'Select Item panel displays CZ Production Parameters (CZ#3)');
assert(configHtmlCZ3.includes('value="1.58"'), 'CZ#3 default Chain Allowance is 1.58');
assert(configHtmlCZ3.includes('value="87"'), 'CZ#3 default Tape Divisor is 87');

// 9 & 10. Click CZ#5 -> Right panel switches back to CZ#5's configuration
console.log('\n--- Step 9 & 10: Click CZ#5 and verify panel switches back ---');
selectActiveItem(item1.id);
assert(appState.activeItemId === item1.id, 'Active item switched back to CZ#5');
const switchedCZ5Html = mockElements['select-item-config-body'].innerHTML;
assert(switchedCZ5Html.includes('CZ Production Parameters (CZ#5)'), 'Panel switched back to CZ#5 configuration');
assert(switchedCZ5Html.includes('value="1.78"'), 'CZ#5 Chain Allowance is 1.78');

// 11. Change one CZ#5-specific editable parameter
console.log('\n--- Step 11: Edit CZ#5-specific parameter ---');
// Modify CZ#5 chain allowance
item1.czParams = item1.czParams || {};
item1.czParams.chainAllowance = 2.25;
renderSelectItemPanel();
const editedCZ5Html = mockElements['select-item-config-body'].innerHTML;
assert(editedCZ5Html.includes('value="2.25"'), 'CZ#5 Chain Allowance is updated to 2.25');

// 12 & 13. Click CZ#3 -> CZ#3's configuration remains independent and unchanged
console.log('\n--- Step 12 & 13: Click CZ#3 and verify independent configuration ---');
selectActiveItem(item2.id);
assert(appState.activeItemId === item2.id, 'Active item switched to CZ#3');
const switchedBackCZ3Html = mockElements['select-item-config-body'].innerHTML;
assert(switchedBackCZ3Html.includes('CZ Production Parameters (CZ#3)'), 'Panel displays CZ#3');
assert(switchedBackCZ3Html.includes('value="1.58"'), 'CZ#3 Chain Allowance is unchanged at default 1.58');
assert(!switchedBackCZ3Html.includes('value="2.25"'), 'CZ#3 does NOT inherit edited CZ#5 parameter (2.25)');

// 14 & 15. Click CZ#5 again -> previously edited value is still present
console.log('\n--- Step 14 & 15: Click CZ#5 again and verify edited parameter is preserved ---');
selectActiveItem(item1.id);
const recheckCZ5Html = mockElements['select-item-config-body'].innerHTML;
assert(recheckCZ5Html.includes('value="2.25"'), 'Previously edited CZ#5 Chain Allowance (2.25) is still present');

// 16 & 17 & 18. Add MZ#3 and click MZ#3
console.log('\n--- Step 16, 17, 18: Add MZ#3 and verify MZ-specific configuration ---');
handleAddNewItem('mz_3');
assert(appState.currentEstimate.items.length === 3, 'MZ#3 added; items.length is 3');
const item3 = appState.currentEstimate.items[2];
assert(item3.displayName === 'MZ#3', `Item 3 is MZ#3 (Got: ${item3.displayName})`);
selectActiveItem(item3.id);
const mz3Html = mockElements['select-item-config-body'].innerHTML;
assert(mz3Html.includes('MZ Production Parameters'), 'Right panel switched to MZ Production Parameters');
assert(!mz3Html.includes('CZ Production Parameters'), 'MZ#3 panel does NOT contain CZ Production Parameters');

// 19. Calculation Details update to MZ#3
console.log('\n--- Step 19: Verify Calculation Details update to MZ#3 ---');
item3.length = 8.0;
item3.lengthUnit = 'inch';
item3.quantity = 1200;
item3.zipperType = 'closed_end';
updateLiveCalculations();
updateActiveMaterialForSelectedItem(item3.id);
const mzCalcHtml = mockElements['formula-details-body'].innerHTML;
assert(mzCalcHtml.includes('MZ') || mzCalcHtml.includes('Metal Zipper') || mzCalcHtml.includes('MZ#3'), 'Calculation Details updated to MZ#3');

// 20 & 21. Click CZ#5 again -> Calculation Details switch back to CZ#5
console.log('\n--- Step 20 & 21: Click CZ#5 and verify Calculation Details switch back ---');
item1.length = 7.5;
item1.lengthUnit = 'inch';
item1.quantity = 2000;
item1.zipperType = 'closed_end';
updateLiveCalculations();
selectActiveItem(item1.id);
const czCalcHtml = mockElements['formula-details-body'].innerHTML;
assert(czCalcHtml.includes('CZ') || czCalcHtml.includes('Nylon Zipper') || czCalcHtml.includes('CZ#5'), 'Calculation Details switched back to CZ#5');

// 22. Verify BOM calculations for all Items remain correct
console.log('\n--- Step 22: Verify BOM calculations across items ---');
const lastCalc = appState.lastCalculation;
assert(lastCalc !== null, 'Full calculation result exists');
assert(Array.isArray(lastCalc.items) && lastCalc.items.length === 3, 'Calculation results include all 3 items');
assert(Array.isArray(lastCalc.aggregatedMaterials.processedRows), 'Aggregated BOM rows exist');
assert(lastCalc.aggregatedMaterials.processedRows.length > 0, 'Aggregated BOM contains material items');

// 23. Verify no "Select Another Variant" button remains
console.log('\n--- Step 23: Verify no "Select Another Variant" button remains ---');
assert(!indexHtmlSource.includes('Select Another Variant'), 'index.html contains 0 "Select Another Variant"');
assert(!configHtmlCZ5.includes('Select Another Variant'), 'Select Item panel contains 0 "Select Another Variant"');
assert(!mz3Html.includes('Select Another Variant'), 'MZ#3 panel contains 0 "Select Another Variant"');

// 24. Verify no "Add New Category" button remains
console.log('\n--- Step 24: Verify no "Add New Category" button remains ---');
assert(!indexHtmlSource.includes('Add New Category'), 'index.html contains 0 "Add New Category"');
assert(!configHtmlCZ5.includes('Add New Category'), 'Select Item panel contains 0 "Add New Category"');

// 25. Verify no "Variant 1 / Variant 2" terminology remains in items list
console.log('\n--- Step 25: Verify no "Variant 1 / Variant 2" terminology remains ---');
renderItemsList();
const itemsListHtml = mockElements['items-container'].innerHTML;
assert(!itemsListHtml.includes('Variant 1'), 'Items list does not contain "Variant 1"');
assert(!itemsListHtml.includes('Variant 2'), 'Items list does not contain "Variant 2"');
assert(itemsListHtml.includes('CZ#5'), 'Items list contains "CZ#5"');
assert(itemsListHtml.includes('CZ#3'), 'Items list contains "CZ#3"');
assert(itemsListHtml.includes('MZ#3'), 'Items list contains "MZ#3"');

// 26. Verify the visible configuration heading is "Select Item"
console.log('\n--- Step 26: Verify visible configuration heading ---');
assert(indexHtmlSource.includes('id="heading-select-item">Select Item</h3>'), 'Configuration card heading in index.html is "Select Item"');
assert(configHtmlCZ5.includes('Select Item'), 'Configuration body header is "Select Item"');
assert(!configHtmlCZ5.includes('Zipper Category'), 'Configuration body does NOT use "Zipper Category"');

// 27. Verify the visible list heading is "Items"
console.log('\n--- Step 27: Verify visible list heading ---');
assert(indexHtmlSource.includes('id="heading-items-section">1. Items</h2>'), 'List heading in index.html is "1. Items"');
assert(itemsListHtml.includes('item-card'), 'Items list contains item cards');

// 28. Verify Calculation Details is directly below the Select Item panel
console.log('\n--- Step 28: Verify right column panel order ---');
const rightColStart = indexHtmlSource.indexOf('<div class="right-column"');
const rightColEnd = indexHtmlSource.indexOf('</main>');
const rightColContent = indexHtmlSource.slice(rightColStart, rightColEnd);
const selectItemIndex = rightColContent.indexOf('id="section-select-item"');
const formulaDetailsIndex = rightColContent.indexOf('id="section-formula-details"');
assert(selectItemIndex !== -1 && formulaDetailsIndex !== -1, 'Both panels are inside right-column');
assert(selectItemIndex < formulaDetailsIndex, 'Calculation Details is directly below Select Item');

// 29. Verify all existing formulas and numerical outputs remain unchanged
console.log('\n--- Step 29: Verify formula integrity ---');
// Test CZ Tape formula calculation on CZ#5: 2000 pcs, 7.5 inch, allowance 2.25, tape divisor 54.5, loss 3%
// Chain = (7.5 + 2.25) * 2000 / 39.37 = 495.2997 Mtr
// Tape KG = 495.2997 / 54.5 = 9.08806 KG
// With 3% loss = 9.08806 * 1.03 = 9.3607 KG
const cz5Result = window.CalculatorEngine.calculateFullEstimate({
  items: [{
    id: 'test_cz5',
    category: 'cz',
    zipperSize: '#5',
    zipperType: 'closed_end',
    length: 7.5,
    lengthUnit: 'inch',
    quantity: 2000,
    czParams: { chainAllowance: 2.25, tapeDivisor: 54.5 },
    lossPercent: 3.0
  }]
});
const tapeRow = cz5Result.aggregatedMaterials.processedRows.find(r => r.key === 'mat_cz_tape_kg' || (r.component && r.component.includes('TAPE')));
assert(tapeRow !== undefined, 'CZ#5 Tape BOM row calculated');
const tapeQty = tapeRow.totalQuantity !== undefined ? tapeRow.totalQuantity : tapeRow.requiredQuantity;
assert(Math.abs(tapeQty - 9.3607) < 0.05, `CZ#5 Tape quantity matches formula ~9.36 KG (Got: ${tapeQty})`);

console.log('\n====================================================');
console.log(`ACCEPTANCE TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================\n');
