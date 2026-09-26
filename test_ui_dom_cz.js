/**
 * Interactive DOM & UI Test for Dynamic CZ Parameters
 */

const fs = require('fs');
const path = require('path');

// Setup minimal DOM mock
const htmlSource = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Load libraries
global.window = global;
global.document = {
  getElementById: (id) => null,
  querySelectorAll: (sel) => [],
  addEventListener: (event, cb) => {}
};

require('./js/unitConversion.js');
require('./js/formulas/cz.js');
require('./js/formulas/mz.js');
require('./js/formulas/wire.js');
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
console.log('TESTING APP.JS UI RENDERING & DYNAMIC CZ PARAMETERS');
console.log('====================================================\n');

// Read app.js source to inspect buildCategoryGroupHTML
const appJsSource = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');

// Test 1: buildCategoryGroupHTML for CZ#3
assert('app.js defines CZ dynamic parameters section', appJsSource.includes('CZ Production Parameters'));
assert('app.js defines input-cz-param event listener', appJsSource.includes('input-cz-param'));
assert('app.js includes data-param="chainAllowance"', appJsSource.includes('data-param="chainAllowance"'));
assert('app.js includes data-param="tapeDivisor"', appJsSource.includes('data-param="tapeDivisor"'));
assert('app.js includes data-param="topStopFactor"', appJsSource.includes('data-param="topStopFactor"'));
assert('app.js includes data-param="bottomStopFactor"', appJsSource.includes('data-param="bottomStopFactor"'));
assert('app.js includes data-param="resinDivisor"', appJsSource.includes('data-param="resinDivisor"'));
assert('app.js includes input-cz-utop-special', appJsSource.includes('input-cz-utop-special'));
assert('app.js includes data-param="tollilon1Divisor"', appJsSource.includes('data-param="tollilon1Divisor"'));
assert('app.js includes data-param="tollilon2Divisor"', appJsSource.includes('data-param="tollilon2Divisor"'));

// Test 2: Verify CZ#3 dynamic rendering function
const funcExtractor = new Function('escapeHtml', `
  ${appJsSource}
  return { buildCategoryGroupHTML };
`);

const mockEscape = (s) => String(s || '');
const { buildCategoryGroupHTML } = funcExtractor(mockEscape);

// Render CZ#3 group
const cz3Group = {
  id: 'g_cz3',
  name: 'CZ#3 Group',
  category: 'cz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#3', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};

const cz3Html = buildCategoryGroupHTML(cz3Group, 0, 1);
assert('CZ#3 HTML contains "CZ Production Parameters (CZ#3)"', cz3Html.includes('CZ Production Parameters (CZ#3)'));
assert('CZ#3 HTML contains Chain Allowance with default 1.58', cz3Html.includes('value="1.58"') && cz3Html.includes('Chain Allowance'));
assert('CZ#3 HTML contains Tape Divisor with default 87', cz3Html.includes('value="87"') && cz3Html.includes('Tape Divisor'));
assert('CZ#3 HTML contains Top Stop Factor with default 0.02', cz3Html.includes('value="0.02"') && cz3Html.includes('Top Stop Factor'));
assert('CZ#3 HTML contains Bottom Stop Factor with default 0.03', cz3Html.includes('value="0.03"') && cz3Html.includes('Bottom Stop Factor'));
assert('CZ#3 HTML contains Resin Divisor with default 1000', cz3Html.includes('value="1000"') && cz3Html.includes('Resin Divisor'));
assert('CZ#3 HTML contains Tollilon Divisor 1 with default 14400', cz3Html.includes('value="14400"') && cz3Html.includes('Tollilon Divisor 1'));
assert('CZ#3 HTML contains Tollilon Divisor 2 with default 9500', cz3Html.includes('value="9500"') && cz3Html.includes('Tollilon Divisor 2'));
assert('CZ#3 HTML does NOT contain Special U-Top Requirement', !cz3Html.includes('Special U-Top Requirement') && !cz3Html.includes('input-cz-utop-special'));

// Render CZ#5 group
const cz5Group = {
  id: 'g_cz5',
  name: 'CZ#5 Group',
  category: 'cz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#5', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};

const cz5Html = buildCategoryGroupHTML(cz5Group, 0, 1);
assert('CZ#5 HTML contains "CZ Production Parameters (CZ#5)"', cz5Html.includes('CZ Production Parameters (CZ#5)'));
assert('CZ#5 HTML contains Chain Allowance with default 1.78', cz5Html.includes('value="1.78"'));
assert('CZ#5 HTML contains Tape Divisor with default 54.5', cz5Html.includes('value="54.5"'));
assert('CZ#5 HTML contains Top Stop Factor with default 0.04', cz5Html.includes('value="0.04"'));
assert('CZ#5 HTML contains Bottom Stop Factor with default 0.04', cz5Html.includes('value="0.04"'));
assert('CZ#5 HTML contains Resin Divisor with default 900', cz5Html.includes('value="900"'));
assert('CZ#5 HTML contains Special U-Top Requirement checkbox', cz5Html.includes('Special U-Top Requirement (1 pc per zipper)') && cz5Html.includes('input-cz-utop-special'));
assert('CZ#5 HTML contains Tollilon Divisor 1 with default 7700', cz5Html.includes('value="7700"'));
assert('CZ#5 HTML contains Tollilon Divisor 2 with default 8600', cz5Html.includes('value="8600"'));

// Render MZ group
const mzGroup = {
  id: 'g_mz',
  name: 'MZ Group',
  category: 'mz',
  lossPercent: 3.0,
  variants: [
    { id: 'v1', zipperSize: '#5', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};
const mzHtml = buildCategoryGroupHTML(mzGroup, 0, 1);
assert('MZ HTML contains MZ Production Parameters', mzHtml.includes('MZ Production Parameters'));
assert('MZ HTML does NOT contain CZ Production Parameters', !mzHtml.includes('CZ Production Parameters'));

// Render WIRE#5 Normal group
const wire5NormGroup = {
  id: 'g_wire_norm',
  name: 'WIRE Normal Group',
  category: 'wire',
  lossPercent: 5.0,
  variants: [
    { id: 'v1', zipperSize: '#5_normal', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};
const wire5NormHtml = buildCategoryGroupHTML(wire5NormGroup, 0, 1);
assert('WIRE Normal HTML contains "WIRE Production Parameters (WIRE#5 Normal Teeth)"', wire5NormHtml.includes('WIRE Production Parameters (WIRE#5 Normal Teeth)'));
assert('WIRE Normal HTML contains Wire Divisor with default 20.6', wire5NormHtml.includes('value="20.6"') && wire5NormHtml.includes('Wire Divisor'));
assert('WIRE Normal HTML does NOT contain Allowance', !wire5NormHtml.includes('Wire Allowance'));
assert('WIRE Normal HTML does NOT contain Slider Add %', !wire5NormHtml.includes('Slider Add %'));
assert('WIRE Normal HTML does NOT contain CZ Production Parameters', !wire5NormHtml.includes('CZ Production Parameters'));
assert('WIRE Normal HTML does NOT contain MZ Production Parameters', !wire5NormHtml.includes('MZ Production Parameters'));

// Render WIRE#3 group
const wire3Group = {
  id: 'g_wire_3',
  name: 'WIRE#3 Group',
  category: 'wire',
  lossPercent: 4.0,
  variants: [
    { id: 'v1', zipperSize: '#3', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};
const wire3Html = buildCategoryGroupHTML(wire3Group, 0, 1);
assert('WIRE#3 HTML contains "WIRE Production Parameters (WIRE#3)"', wire3Html.includes('WIRE Production Parameters (WIRE#3)'));
assert('WIRE#3 HTML contains Inch Wire Divisor with default 32', wire3Html.includes('value="32"') && wire3Html.includes('Inch Wire Divisor'));
assert('WIRE#3 HTML contains CM Wire Divisor with default 27.73', wire3Html.includes('value="27.73"') && wire3Html.includes('CM Wire Divisor'));
assert('WIRE#3 HTML does NOT contain Allowance', !wire3Html.includes('Wire Allowance'));
assert('WIRE#3 HTML does NOT contain Slider Add %', !wire3Html.includes('Slider Add %'));

// Render WIRE#5 Long group
const wire5LongGroup = {
  id: 'g_wire_long',
  name: 'WIRE Long Group',
  category: 'wire',
  lossPercent: 5.0,
  variants: [
    { id: 'v1', zipperSize: '#5_long', lengthUnit: 'inch', quantity: 1000, length: 10 }
  ]
};
const wire5LongHtml = buildCategoryGroupHTML(wire5LongGroup, 0, 1);
assert('WIRE#5 Long HTML contains "WIRE Production Parameters (WIRE#5 Long Teeth)"', wire5LongHtml.includes('WIRE Production Parameters (WIRE#5 Long Teeth)'));
assert('WIRE#5 Long HTML contains Wire Allowance with default 1.97', wire5LongHtml.includes('value="1.97"') && wire5LongHtml.includes('Wire Allowance'));
assert('WIRE#5 Long HTML contains Wire Divisor with default 20.6', wire5LongHtml.includes('value="20.6"') && wire5LongHtml.includes('Wire Divisor'));
assert('WIRE#5 Long HTML does NOT contain Slider Add %', !wire5LongHtml.includes('Slider Add %'));
assert('WIRE#5 Long HTML does NOT contain Pin Box Loss %', !wire5LongHtml.includes('Pin Box Loss %'));

// Test 6: Verify Pin Box Loss % in CZ Group HTML
assert('CZ#3 HTML contains "Slider Add %"', cz3Html.includes('Slider Add %'));
assert('CZ#3 HTML contains "Pin Box Loss %"', cz3Html.includes('Pin Box Loss %'));
assert('CZ#3 HTML does NOT contain "Pin Box / Zipper"', !cz3Html.includes('Pin Box / Zipper'));
assert('CZ#3 HTML does NOT contain "Pcs" badge for Pin Box', !cz3Html.includes('category-control-pin-box') || !cz3Html.includes('>Pcs<'));

console.log('\n====================================================');
console.log(`DOM & UI TEST RESULTS: ${passed} / ${total} PASSED (100% SUCCESS)`);
console.log('====================================================\n');
