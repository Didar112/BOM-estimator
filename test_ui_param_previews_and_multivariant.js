/**
 * Test Suite: At-a-Glance BOM Parameter Previews & Multi-Variant Component Activation
 */

const fs = require('fs');
const path = require('path');

// Setup minimal DOM mock
global.window = global;
const mockDOM = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        children: [],
        querySelector(sel) {
          if (sel === '.preview-text') return this._textSpan || (this._textSpan = { textContent: '' });
          if (sel === '.preview-badge') return this._badge || (this._badge = {
            classList: {
              classes: new Set(),
              add(c) { this.classes.add(c); },
              remove(c) { this.classes.delete(c); },
              contains(c) { return this.classes.has(c); }
            }
          });
          return null;
        }
      };
    }
    return this.elements[id];
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};
global.document = mockDOM;

require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
require('./js/formulas/pz.js');
require('./js/materials.js');
require('./js/bomRules.js');
require('./js/calculations.js');
require('./js/storage.js');

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

console.log('====================================================');
console.log('TESTING AT-A-GLANCE BOM PREVIEWS & MULTI-VARIANT UI');
console.log('====================================================\n');

// Read app.js source to extract functions
const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');

const funcExtractor = new Function('escapeHtml', `
  ${appJsSource}
  return { 
    buildCategoryGroupHTML, 
    getCategoryParamPreviewData, 
    updateCategoryParameterPreviews,
    appState 
  };
`);

const mockEscape = (s) => String(s || '');
const { buildCategoryGroupHTML, getCategoryParamPreviewData, updateCategoryParameterPreviews, appState } = funcExtractor(mockEscape);

// ----------------------------------------------------
// SECTION 1: Verification of Parameter Preview Containers in HTML
// ----------------------------------------------------
console.log('--- SECTION 1: Preview Containers in Category Card HTML ---');

const czGroup = {
  id: 'g_cz_all',
  name: 'CZ Test Group',
  category: 'cz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#5', lengthUnit: 'inch', quantity: 2000, length: 10, endType: 'open_end' }
  ]
};

const czHtml = buildCategoryGroupHTML(czGroup, 0, 1);
assert('Slider Add % has preview container preview-slider-g_cz_all', czHtml.includes('id="preview-slider-g_cz_all"'));
assert('Pin Box Loss % has preview container preview-pin-box-g_cz_all', czHtml.includes('id="preview-pin-box-g_cz_all"'));
assert('Chain Allowance has preview-cz-allowance-g_cz_all', czHtml.includes('id="preview-cz-allowance-g_cz_all"'));
assert('Tape Divisor has preview-cz-tape-g_cz_all', czHtml.includes('id="preview-cz-tape-g_cz_all"'));
assert('Top Stop has preview-cz-top-g_cz_all', czHtml.includes('id="preview-cz-top-g_cz_all"'));
assert('Bottom Stop has preview-cz-bottom-g_cz_all', czHtml.includes('id="preview-cz-bottom-g_cz_all"'));
assert('Resin Divisor has preview-cz-resin-g_cz_all', czHtml.includes('id="preview-cz-resin-g_cz_all"'));
assert('Tollilon 1 Divisor has preview-cz-tollilon1-g_cz_all', czHtml.includes('id="preview-cz-tollilon1-g_cz_all"'));
assert('Tollilon 2 Divisor has preview-cz-tollilon2-g_cz_all', czHtml.includes('id="preview-cz-tollilon2-g_cz_all"'));
assert('U-Top has preview-cz-utop-g_cz_all', czHtml.includes('id="preview-cz-utop-g_cz_all"'));

// MZ Group HTML
const mzGroup = {
  id: 'g_mz_test',
  name: 'MZ Test Group',
  category: 'mz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#3', lengthUnit: 'inch', quantity: 1000, length: 10, endType: 'closed_end' }
  ]
};
const mzHtml = buildCategoryGroupHTML(mzGroup, 0, 1);
assert('MZ Tape Divisor has preview-mz-tape-g_mz_test', mzHtml.includes('id="preview-mz-tape-g_mz_test"'));
assert('MZ Teeth Wire Divisor has preview-mz-teeth-g_mz_test', mzHtml.includes('id="preview-mz-teeth-g_mz_test"'));
assert('MZ Top Stop has preview-mz-top-g_mz_test', mzHtml.includes('id="preview-mz-top-g_mz_test"'));
assert('MZ H-Bottom has preview-mz-hbottom-g_mz_test', mzHtml.includes('id="preview-mz-hbottom-g_mz_test"'));

// WIRE Group HTML
const wireGroup = {
  id: 'g_wire_test',
  name: 'WIRE Test Group',
  category: 'wire',
  lossPercent: 5.0,
  variants: [
    { id: 'v1', zipperSize: '#5_long', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};
const wireHtml = buildCategoryGroupHTML(wireGroup, 0, 1);
assert('WIRE Allowance has preview-wire-allowance-g_wire_test', wireHtml.includes('id="preview-wire-allowance-g_wire_test"'));
assert('WIRE Divisor has preview-wire-div-g_wire_test', wireHtml.includes('id="preview-wire-div-g_wire_test"'));

// ----------------------------------------------------
// SECTION 2: Special U-Top Checkbox Placement
// ----------------------------------------------------
console.log('\n--- SECTION 2: U-Top Checkbox Layout & Placement ---');
assert('U-Top checkbox item has .category-dynamic-param-utop-card class', czHtml.includes('category-dynamic-param-utop-card'));
assert('U-Top checkbox uses .utop-checkbox-inner-card', czHtml.includes('utop-checkbox-inner-card'));

// Tollilon 2 comes before U-Top in CZ#5 HTML
const tollilon2Pos = czHtml.indexOf('cz-tollilon2-div-g_cz_all');
const uTopPos = czHtml.indexOf('cz-utop-special-g_cz_all');
assert('Tollilon Divisor 2 appears before Special U-Top checkbox (Row 2 order)', tollilon2Pos !== -1 && uTopPos !== -1 && tollilon2Pos < uTopPos);

// CZ#3 Group does not render U-Top
const cz3OnlyGroup = {
  id: 'g_cz3_only',
  name: 'CZ#3 Group',
  category: 'cz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#3', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};
const cz3OnlyHtml = buildCategoryGroupHTML(cz3OnlyGroup, 0, 1);
assert('CZ#3-only group does NOT render U-Top checkbox card', !cz3OnlyHtml.includes('cz-utop-special') && !cz3OnlyHtml.includes('category-dynamic-param-utop-card'));

// ----------------------------------------------------
// SECTION 3: Multi-Variant Component Activation
// ----------------------------------------------------
console.log('\n--- SECTION 3: Multi-Variant Component Activation ---');

// Case A: CZ Group with BOTH CZ#3 and CZ#5 variants
// Requirement: "if one variant have a certain component that other variant doesn't need, keep that component active"
const czMultiGroup = {
  id: 'g_cz_multi',
  name: 'CZ Multi Group (#3 and #5)',
  category: 'cz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#3', lengthUnit: 'inch', quantity: 500, length: 8 },
    { id: 'v2', zipperSize: '#5', lengthUnit: 'inch', quantity: 1500, length: 12 }
  ]
};
const czMultiHtml = buildCategoryGroupHTML(czMultiGroup, 0, 1);
assert('CZ Multi Group (#3 & #5) title shows "CZ#5 & CZ#3"', czMultiHtml.includes('CZ Production Parameters (CZ#5 & CZ#3)'));
assert('CZ Multi Group (#3 & #5) KEEPS U-Top checkbox active because #5 is present', czMultiHtml.includes('cz-utop-special-g_cz_multi') && czMultiHtml.includes('Special U-Top Requirement (1 pc per zipper)'));

// Case B: MZ Group with BOTH MZ#5 and MZ#3 variants
// MZ#3 needs H-Bottom, MZ#5 does not. H-Bottom MUST remain active!
const mzMultiGroup = {
  id: 'g_mz_multi',
  name: 'MZ Multi Group (#5 and #3)',
  category: 'mz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#5', lengthUnit: 'inch', quantity: 2000, length: 14 },
    { id: 'v2', zipperSize: '#3', lengthUnit: 'inch', quantity: 800, length: 7 }
  ]
};
const mzMultiHtml = buildCategoryGroupHTML(mzMultiGroup, 0, 1);
assert('MZ Multi Group (#5 & #3) title shows "MZ#5 & MZ#3"', mzMultiHtml.includes('MZ Production Parameters (MZ#5 & MZ#3)'));
assert('MZ Multi Group (#5 & #3) KEEPS H-Bottom Loss active & NOT disabled because #3 is present', 
  mzMultiHtml.includes('mz-hbottom-loss-g_mz_multi') && 
  !mzMultiHtml.includes('param-inactive') && 
  !mzMultiHtml.includes('id="mz-hbottom-loss-g_mz_multi" class="form-input font-mono category-styled-input input-mz-param input-group-hbottom-loss" data-group-id="g_mz_multi" data-param="hBottomLossPercent" value="4" placeholder="0" disabled') &&
  !mzMultiHtml.includes('disabled title="H-Bottom Stop is applicable to MZ#3 only')
);

// Case C: WIRE Group with BOTH Normal Teeth and Long Teeth variants
// Long Teeth needs Wire Allowance, Normal does not. Wire Allowance MUST remain active!
const wireMultiGroup = {
  id: 'g_wire_multi',
  name: 'WIRE Multi Group (Normal & Long)',
  category: 'wire',
  lossPercent: 5.0,
  variants: [
    { id: 'v1', zipperSize: '#5_normal', lengthUnit: 'inch', quantity: 1000, length: 10 },
    { id: 'v2', zipperSize: '#5_long', lengthUnit: 'inch', quantity: 1000, length: 12 }
  ]
};
const wireMultiHtml = buildCategoryGroupHTML(wireMultiGroup, 0, 1);
assert('WIRE Multi Group title shows "WIRE#5 Normal & Long Teeth"', wireMultiHtml.includes('WIRE Production Parameters (WIRE#5 Normal & Long Teeth)'));
assert('WIRE Multi Group KEEPS Wire Allowance active because Long Teeth is present', wireMultiHtml.includes('wire-allowance-g_wire_multi'));
assert('WIRE Multi Group KEEPS Wire Divisor active', wireMultiHtml.includes('wire-div-g_wire_multi'));

// Case D: Zipper Group with BOTH Closed End and Open End variants
// Open End needs Pin Box, Closed End does not. Pin Box Preview should show pcs for Open End
const zipperMultiEndGroup = {
  id: 'g_mixed_ends',
  name: 'Mixed Ends Group',
  category: 'cz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#5', endType: 'closed_end', lengthUnit: 'inch', quantity: 500, length: 10 },
    { id: 'v2', zipperSize: '#5', endType: 'open_end', lengthUnit: 'inch', quantity: 1500, length: 10 }
  ]
};
// Attach mock calculation in appState
appState.lastCalculation = {
  categoryGroups: [
    {
      id: 'g_mixed_ends',
      calculation: {
        sliderQuantity: 2080,
        pinBoxQuantity: 1560,
        baseChainConsumptionMtr: 600,
        totalTapeKg: 11.5,
        topStopKg: 0.08,
        bottomStopKg: 0.08,
        resinKg: 2.22,
        tollilonOne: 0.26,
        tollilonTwo: 0.23,
        totalTollilon: 0.49,
        uTopQty: 3000
      },
      materials: {
        processedRows: [
          { component: 'PIN BOX', totalQuantity: 1560 }
        ]
      }
    }
  ]
};
const mixedPreviews = getCategoryParamPreviewData(zipperMultiEndGroup);
assert('Pin Box preview shows active quantity (1,560 Pcs) for mixed group with open end', mixedPreviews.pinBox === 'Pin Box: 1,560 Pcs');
assert('Slider preview shows active quantity (2,080 Pcs)', mixedPreviews.slider === 'Slider: 2,080 Pcs');
assert('U-Top preview shows active quantity (3,000 Pcs)', mixedPreviews.czUTop === 'U-Top: 3,000 Pcs');

// ----------------------------------------------------
// SECTION 4: Live DOM Preview Update Function
// ----------------------------------------------------
console.log('\n--- SECTION 4: Live DOM Preview Updates ---');
appState.currentEstimate = {
  categoryGroups: [zipperMultiEndGroup]
};

updateCategoryParameterPreviews();

const sliderEl = document.getElementById('preview-slider-g_mixed_ends');
const pinBoxEl = document.getElementById('preview-pin-box-g_mixed_ends');
const uTopEl = document.getElementById('preview-cz-utop-g_mixed_ends');

assert('preview-slider DOM element updated with text', sliderEl._textSpan && sliderEl._textSpan.textContent === 'Slider: 2,080 Pcs');
assert('preview-pin-box DOM element updated with text', pinBoxEl._textSpan && pinBoxEl._textSpan.textContent === 'Pin Box: 1,560 Pcs');
assert('preview-cz-utop DOM element updated with text', uTopEl._textSpan && uTopEl._textSpan.textContent === 'U-Top: 3,000 Pcs');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log('====================================================');

if (total === passed) {
  console.log('ALL PARAMETER PREVIEW & MULTI-VARIANT TESTS PASSED!');
  process.exit(0);
} else {
  console.error('SOME TESTS FAILED!');
  process.exit(1);
}
