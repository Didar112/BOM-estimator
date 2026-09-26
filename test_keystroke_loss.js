/**
 * test_keystroke_loss.js
 * 
 * Verifies real-time keystroke reactivity for variant quantity and length inputs.
 * Ensures that typing quantities immediately updates the Loss % and chain consumption
 * without requiring the user to switch zipper types or blur inputs.
 */

const fs = require('fs');
const assert = require('assert');

// Minimal DOM mock
class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      contains: (c) => this.className.split(' ').includes(c),
      add: (c) => { if (!this.classList.contains(c)) this.className += ' ' + c; },
      remove: (c) => { this.className = this.className.split(' ').filter(x => x !== c).join(' '); }
    };
    this.attributes = {};
    this.children = [];
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.eventListeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  addEventListener(evt, fn) {
    if (!this.eventListeners[evt]) this.eventListeners[evt] = [];
    this.eventListeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    if (this.eventListeners[evt.type]) {
      this.eventListeners[evt.type].forEach(fn => fn(evt));
    }
  }
  querySelector(sel) {
    const match = (el) => {
      if (sel.startsWith('.') && el.classList.contains(sel.slice(1))) return true;
      if (sel.startsWith('#') && el.id === sel.slice(1)) return true;
      return false;
    };
    for (const child of this.children) {
      if (match(child)) return child;
      const found = child.querySelector(sel);
      if (found) return found;
    }
    return null;
  }
  querySelectorAll(sel) {
    let results = [];
    const match = (el) => {
      const parts = sel.split(',').map(s => s.trim());
      return parts.some(p => {
        if (p.startsWith('.') && el.classList.contains(p.slice(1))) return true;
        if (p.startsWith('#') && el.id === p.slice(1)) return true;
        return false;
      });
    };
    for (const child of this.children) {
      if (match(child)) results.push(child);
      results = results.concat(child.querySelectorAll(sel));
    }
    return results;
  }
}

// Setup environment
global.window = global;
global.document = {
  activeElement: null,
  elements: {},
  getElementById: (id) => global.document.elements[id] || null,
  createElement: (tag) => new MockElement(tag)
};

global.CalculatorEngine = require('./js/calculations.js');
global.BOMRules = require('./js/bomRules.js');
global.MaterialsDB = require('./js/materials.js');

// Mock render functions
global.renderConsolidatedBOM = () => {};
global.renderCalculationDetails = () => {};

// Load appState and functions from app.js
const appCode = fs.readFileSync(__dirname + '/js/app.js', 'utf8');

// Extract updateClassLossDisplay
eval(appCode.slice(appCode.indexOf('function updateClassLossDisplay('), appCode.indexOf('function buildCategoryGroupHTML(')));
// Extract updateLiveCalculations
eval(appCode.slice(appCode.indexOf('function updateLiveCalculations('), appCode.indexOf('function findActiveMaterial(')));

global.appState = {
  currentEstimate: {
    categoryGroups: [{
      id: 'g1',
      name: 'Category Group 1',
      category: 'cz',
      lossPercent: 3.0,
      classLossOverrides: {},
      variants: [
        { id: 'v1', zipperSize: '#3', zipperType: 'closed_end', length: 7.5, lengthUnit: 'inch', quantity: 50 },
        { id: 'v2', zipperSize: '#3', zipperType: 'open_end', length: 9, lengthUnit: 'inch', quantity: 10 }
      ]
    }]
  },
  selectedMaterialKey: null
};

// Create DOM elements for variant cards
const colV1 = new MockElement('div', 'var-loss-col-v1', 'variant-loss-col');
const badgeV1 = new MockElement('span', '', 'var-class-badge');
const mtrV1 = new MockElement('span', '', 'var-loss-mtr-text');
const tagV1 = new MockElement('span', '', 'var-loss-status-tag');
const inputV1 = new MockElement('input', 'input-var-loss-v1', 'input-var-loss');
colV1.children = [badgeV1, mtrV1, tagV1, inputV1];

const colV2 = new MockElement('div', 'var-loss-col-v2', 'variant-loss-col');
const badgeV2 = new MockElement('span', '', 'var-class-badge');
const mtrV2 = new MockElement('span', '', 'var-loss-mtr-text');
const tagV2 = new MockElement('span', '', 'var-loss-status-tag');
const inputV2 = new MockElement('input', 'input-var-loss-v2', 'input-var-loss');
colV2.children = [badgeV2, mtrV2, tagV2, inputV2];

global.document.elements['var-loss-col-v1'] = colV1;
global.document.elements['var-loss-col-v2'] = colV2;

console.log('--- Testing Real-Time Keystroke Reactivity ---');

// Initial display (50 pcs -> 12 Mtr -> 8% bracket)
updateClassLossDisplay('g1');
assert.strictEqual(mtrV1.textContent, '12 Mtr', 'Initial V1 Mtr should be 12 Mtr');
assert.strictEqual(inputV1.value, 8, 'Initial V1 Loss % should be 8%');
assert.strictEqual(inputV2.value, 8, 'Initial V2 Loss % should be 8%');
console.log('✓ Initial state verified: 12 Mtr @ 8% Loss');

// Keystroke 1: user types '865' (865 pcs -> 199.49 Mtr -> rounds to 199 Mtr -> 8% bracket)
global.appState.currentEstimate.categoryGroups[0].variants[0].quantity = 865;
updateClassLossDisplay('g1');
updateLiveCalculations();
assert.strictEqual(mtrV1.textContent, '199 Mtr');
assert.strictEqual(inputV1.value, 8);
console.log('✓ Keystroke "865" verified: 199 Mtr @ 8% Loss (< 200 Mtr)');

// Keystroke 2: user types '867' (867 pcs -> 199.96 Mtr -> rounds to 200 Mtr -> 3% bracket)
global.appState.currentEstimate.categoryGroups[0].variants[0].quantity = 867;
updateClassLossDisplay('g1');
updateLiveCalculations();
assert.strictEqual(mtrV1.textContent, '200 Mtr', 'V1 Mtr should display 200 Mtr');
assert.strictEqual(inputV1.value, 3, 'V1 Loss % at 200 Mtr should be 3% (200-5000 MTR range)');
console.log('✓ Keystroke "867" verified: 200 Mtr @ 3% Loss (Official Chart 200-5000 range)');

// Keystroke 3: user types '5000' (5000 pcs -> 1153.16 Mtr -> 1,153 Mtr -> 3% bracket)
global.appState.currentEstimate.categoryGroups[0].variants[0].quantity = 5000;
updateClassLossDisplay('g1');
updateLiveCalculations();
assert.strictEqual(mtrV1.textContent, '1,153 Mtr', 'V1 Mtr should update to 1,153 Mtr');
assert.strictEqual(inputV1.value, 3, 'V1 Loss % should be 3%');
console.log('✓ Keystroke "5000" verified: 1,153 Mtr @ 3% Loss');

console.log('All keystroke reactivity tests passed (100% SUCCESS)!');
