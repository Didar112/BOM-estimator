const fs = require('fs');
const assert = require('assert');

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
    this.title = '';
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
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

global.document = {
  elements: {},
  getElementById: (id) => global.document.elements[id] || null,
  activeElement: null
};
global.window = {};

const calc = require('./js/calculations.js');
global.window.CalculatorEngine = calc;

const appCode = fs.readFileSync(__dirname + '/js/app.js', 'utf8');

eval(appCode.slice(appCode.indexOf('function renderGroupLossMeta('), appCode.indexOf('function buildClassLossSectionHTML(')));
eval(appCode.slice(appCode.indexOf('function updateClassLossDisplay('), appCode.indexOf('function buildCategoryGroupHTML(')));

// User's exact scenario:
// Variant 1: CZ#3, 7.5", 868 pcs -> CZC#3 (200 Mtr)
// Variant 2: CZ#5, 7.75", 722 pcs -> CZC#5 (175 Mtr)
// Variant 3: CZ#5, 9", 92 pcs -> CZC#5 (25 Mtr)
global.appState = {
  currentEstimate: {
    categoryGroups: [{
      id: 'g1',
      name: 'Category Group 1',
      category: 'cz',
      lossPercent: 3.0,
      classLossOverrides: {},
      variants: [
        { id: 'v1', zipperSize: '#3', zipperType: 'closed_end', length: 7.5, lengthUnit: 'inch', quantity: 868 },
        { id: 'v2', zipperSize: '#5', zipperType: 'closed_end', length: 7.75, lengthUnit: 'inch', quantity: 722 },
        { id: 'v3', zipperSize: '#5', zipperType: 'closed_end', length: 9, lengthUnit: 'inch', quantity: 92 }
      ]
    }]
  }
};

function setupVariantDom(vId) {
  const col = new MockElement('div', `var-loss-col-${vId}`, 'variant-loss-col');
  const badge = new MockElement('span', '', 'var-class-badge');
  const metaContainer = new MockElement('div', '', 'variant-loss-meta');
  const input = new MockElement('input', `input-var-loss-${vId}`, 'input-var-loss');
  col.children = [badge, input, metaContainer];
  global.document.elements[`var-loss-col-${vId}`] = col;
  return { col, badge, input, metaContainer };
}

const domV1 = setupVariantDom('v1');
const domV2 = setupVariantDom('v2');
const domV3 = setupVariantDom('v3');

console.log('--- Testing Shared Class Loss Clarification ---');

updateClassLossDisplay('g1');

// Variant 1 check (Single variant in CZC#3)
assert.strictEqual(domV1.badge.textContent, 'CZC#3', 'V1 badge should be CZC#3 without Shared tag');
assert.strictEqual(domV1.input.value, 3, 'V1 loss % should be 3%');
assert.ok(domV1.metaContainer.innerHTML.includes('200 Mtr'), 'V1 meta should show 200 Mtr');

// Variant 2 check (Shared in CZC#5 with V3)
assert.strictEqual(domV2.badge.textContent, 'CZC#5', 'V2 badge should indicate CZC#5');
assert.strictEqual(domV2.input.value, 3, 'V2 loss % should be 3% (due to combined 200 Mtr total)');
assert.ok(domV2.metaContainer.innerHTML.includes('Current: <strong class="var-loss-own-val">175m</strong>'), 'V2 should show own requirement of 175m');
assert.ok(domV2.metaContainer.innerHTML.includes('Total: <strong class="var-loss-pool-val">200m</strong>'), 'V2 should show combined total of 200m');
assert.ok(!domV2.metaContainer.innerHTML.includes('Shared'), 'V2 meta should NOT contain Shared tag');
assert.ok(!domV2.metaContainer.innerHTML.includes('Bracket'), 'V2 meta should NOT contain Bracket tag');

// Variant 3 check (Shared in CZC#5 with V2)
assert.strictEqual(domV3.badge.textContent, 'CZC#5', 'V3 badge should indicate CZC#5');
assert.strictEqual(domV3.input.value, 3, 'V3 loss % should be 3% (due to combined 200 Mtr total)');
assert.ok(domV3.metaContainer.innerHTML.includes('Current: <strong class="var-loss-own-val">25m</strong>'), 'V3 should show own requirement of 25m');
assert.ok(domV3.metaContainer.innerHTML.includes('Total: <strong class="var-loss-pool-val">200m</strong>'), 'V3 should show combined total of 200m');
assert.ok(!domV3.metaContainer.innerHTML.includes('Shared'), 'V3 meta should NOT contain Shared tag');
assert.ok(!domV3.metaContainer.innerHTML.includes('Bracket'), 'V3 meta should NOT contain Bracket tag');

// Group loss meta summary check
const metaSummary = renderGroupLossMeta(global.appState.currentEstimate.categoryGroups[0]);
console.log('Group Meta Summary:', metaSummary);
assert.ok(metaSummary.includes('CZC#5 (2 vars, 200m): 3%'), 'Summary should display 2 vars and 200m for CZC#5');

console.log('✓ All shared class UI tests passed successfully!');
