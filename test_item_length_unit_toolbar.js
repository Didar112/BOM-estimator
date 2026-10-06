/**
 * Automated Test: Length Unit Selector in Toolbar & Removal from Item Body
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('TEST: LENGTH UNIT TOOLBAR SELECTOR & ITEM BODY CLEANUP');
console.log('====================================================\n');

// 1. Verify index.html structure
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

assert(html.includes('id="select-item-unit"'), 'index.html contains #select-item-unit');
assert(html.includes('id="btn-add-item"'), 'index.html contains #btn-add-item');

// Verify select-item-unit is in the items toolbar beside btn-add-item
const unitSelectPos = html.indexOf('id="select-item-unit"');
const btnAddItemPos = html.indexOf('id="btn-add-item"');
const itemsContainerPos = html.indexOf('id="items-container"');
assert(unitSelectPos !== -1 && btnAddItemPos !== -1, 'Both elements exist');
assert(Math.abs(unitSelectPos - btnAddItemPos) < 400, 'select-item-unit is right beside btn-add-item');
assert(itemsContainerPos !== -1 && itemsContainerPos < btnAddItemPos, 'Add Item toolbar is located at the bottom of items list (after #items-container)');

assert(html.includes('<option value="inch" selected>Inch</option>'), 'Default unit is Inch');
assert(html.includes('<option value="cm">cm</option>'), 'cm option exists');

console.log('  ✓ PASS: index.html markup verified');

// 2. Setup mock environment to test js/app.js behavior
const mockElements = {};
function createMockElement(id = '') {
  return {
    id: id,
    innerHTML: '',
    textContent: '',
    value: id === 'select-item-unit' ? 'inch' : '',
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
    appendChild: function() {},
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

// Require core dependencies
require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
require('./js/formulas/pz.js');
require('./js/materials.js');
require('./js/bomRules.js');
require('./js/calculations.js');
require('./js/storage.js');

const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
eval(appJsSource);

// 3. Test item card rendering has NO dropdown inside item body
handleNewEstimate();
handleAddNewItem('cz_5');

const itemsHtml = mockElements['items-container'].innerHTML;
assert(!itemsHtml.includes('<select class="form-select form-select-sm input-addon-select input-item-unit'), 
  'Item card does NOT contain unit select dropdown in its body');
assert(itemsHtml.includes('item-unit-addon-label'), 
  'Item card contains item-unit-addon-label');
assert(itemsHtml.includes('>inch</span>') || itemsHtml.includes('>Inch</span>'), 
  'Item card displays inch unit addon');

console.log('  ✓ PASS: Item card body contains no dropdown and displays static unit addon');

// 4. Test switching unit in toolbar to 'cm'
mockElements['select-item-unit'].value = 'cm';
handleUnitChange('cm');

assert(appState.lengthUnit === 'cm', 'appState.lengthUnit is cm');
assert(appState.currentEstimate.items[0].lengthUnit === 'cm', 'Item 1 lengthUnit updated to cm');

const updatedHtml = mockElements['items-container'].innerHTML;
assert(updatedHtml.includes('>cm</span>'), 'Item card displays cm unit addon after switch');

console.log('  ✓ PASS: handleUnitChange updates existing items to cm');

// 5. Test adding a new item when 'cm' is active
handleAddNewItem('mz_3');
assert(appState.currentEstimate.items.length === 2, 'Two items exist');
const item2 = appState.currentEstimate.items[1];
assert(item2.lengthUnit === 'cm', `New item has lengthUnit cm (Got: ${item2.lengthUnit})`);

console.log('  ✓ PASS: New items automatically inherit cm when cm is active in toolbar');

// 6. Test switching back to 'inch'
mockElements['select-item-unit'].value = 'inch';
handleUnitChange('inch');

assert(appState.currentEstimate.items[0].lengthUnit === 'inch', 'Item 1 updated back to inch');
assert(appState.currentEstimate.items[1].lengthUnit === 'inch', 'Item 2 updated back to inch');

console.log('  ✓ PASS: Switching back to inch updates all items');
console.log('\n====================================================');
console.log('ALL UNIT TOOLBAR TESTS PASSED SUCCESSFULLY!');
console.log('====================================================\n');
