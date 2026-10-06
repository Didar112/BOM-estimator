/**
 * Verification Test Suite for Custom Parameter Presets Feature
 * Tests standard baseline extraction, dirty check detection, scoped localStorage persistence,
 * dropdown population, preset application, and standard parameter restoration.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock localStorage for Node environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Load modules
const calculations = require('./js/calculations.js');
const storage = require('./js/storage.js');
const bomRules = require('./js/bomRules.js');

console.log('====================================================');
console.log('TESTING CUSTOM PARAMETER PRESETS SYSTEM');
console.log('====================================================\n');

// --- 1. Standard Static Parameters Baseline Verification ---
console.log('--- 1. Standard Static Parameters Baseline Verification ---');

const mz3InchStd = calculations.getStandardStaticParameters('mz_3', 'inch');
assert.strictEqual(mz3InchStd.tapeDivisor, 97.0, 'MZ#3 inch tapeDivisor should be 97');
assert.strictEqual(mz3InchStd.teethWireDivisor, 32.0, 'MZ#3 teethWireDivisor should be 32');
assert.strictEqual(mz3InchStd.teethWireLossFactor, 1.04, 'MZ#3 teethWireLossFactor should be 1.04');
assert.strictEqual(mz3InchStd.chainAllowance, 1.78, 'MZ#3 inch allowance should be 1.78');
console.log('  ✓ PASS: MZ#3 inch standard static parameters correct');

const mz3CmStd = calculations.getStandardStaticParameters('mz_3', 'cm');
assert.strictEqual(mz3CmStd.chainAllowance, 4.5, 'MZ#3 cm allowance should be 4.5');
assert.strictEqual(mz3CmStd.tapeDivisor, 97.0, 'MZ#3 cm tapeDivisor should be 97');
console.log('  ✓ PASS: MZ#3 cm standard static parameters correct');

const cz5InchStd = calculations.getStandardStaticParameters('cz_5', 'inch');
assert.strictEqual(cz5InchStd.tapeDivisor, 54.5, 'CZ#5 inch tapeDivisor should be 54.5');
assert.strictEqual(cz5InchStd.chainAllowance, 1.78, 'CZ#5 inch allowance should be 1.78');
assert.strictEqual(cz5InchStd.resinDivisor, 900, 'CZ#5 resinDivisor should be 900');
assert.strictEqual(cz5InchStd.tollilon1Divisor, 7700, 'CZ#5 tollilon1Divisor should be 7700');
assert.strictEqual(cz5InchStd.tollilon2Divisor, 8600, 'CZ#5 tollilon2Divisor should be 8600');
console.log('  ✓ PASS: CZ#5 inch standard static parameters correct');

const wireLongStd = calculations.getStandardStaticParameters('wire_5_long', 'inch');
assert.strictEqual(wireLongStd.wireAllowance, 1.97, 'Wire#5 long allowance should be 1.97');
assert.strictEqual(wireLongStd.wireDivisor, 20.6, 'Wire#5 long wireDivisor should be 20.6');
console.log('  ✓ PASS: Wire#5 long teeth standard static parameters correct');

const pz8Std = calculations.getStandardStaticParameters('pz_8', 'inch');
assert.strictEqual(pz8Std.tapeDivisor, 57.0, 'PZ#8 tapeDivisor should be 57');
assert.strictEqual(pz8Std.tapeFactor, 26.23, 'PZ#8 tapeFactor should be 26.23');
assert.strictEqual(pz8Std.chainAllowance, 2.4, 'PZ#8 allowance should be 2.4');
console.log('  ✓ PASS: PZ#8 standard static parameters correct');

// --- 2. Dirty Check & Modification Detection ---
console.log('\n--- 2. Dirty Check & Modification Detection ---');

// Unmodified MZ#3 inch params should not be modified
const unmodifiedCheck = calculations.isStaticParametersModified('mz_3', 'inch', mz3InchStd);
assert.strictEqual(unmodifiedCheck, false, 'Default static parameters must NOT be marked modified');
console.log('  ✓ PASS: Standard parameters are NOT marked modified');

// Modifying tapeDivisor 97 -> 95
const modifiedTapeDiv = { ...mz3InchStd, tapeDivisor: 95 };
assert.strictEqual(calculations.isStaticParametersModified('mz_3', 'inch', modifiedTapeDiv), true, 'Modified tapeDivisor must be marked modified');
console.log('  ✓ PASS: Modified tapeDivisor triggers modified = true');

// Modifying special U-Top requirement false -> true
const modifiedUTop = { ...mz3InchStd, isSpecialUTopOrder: true };
assert.strictEqual(calculations.isStaticParametersModified('mz_3', 'inch', modifiedUTop), true, 'Modified isSpecialUTopOrder must be marked modified');
console.log('  ✓ PASS: Modified isSpecialUTopOrder triggers modified = true');

// Dynamic parameters ONLY change (should NOT trigger static modification)
const dynamicOnlyParams = { ...mz3InchStd, sliderAdditionPercent: 5.0, lossPercent: 4.5, pinBoxLossPercent: 6.0 };
assert.strictEqual(calculations.isStaticParametersModified('mz_3', 'inch', dynamicOnlyParams), false, 'Altering dynamic loss % only must NOT mark static parameters modified');
console.log('  ✓ PASS: Changing only dynamic loss percentages does NOT trigger static modification');

// --- 3. Scoped Storage CRUD Operations ---
console.log('\n--- 3. Scoped Storage CRUD Operations ---');

localStorage.clear();

// Save preset "custom-1" for MZ#3 (inch)
const savedPreset1 = storage.saveCustomPreset({
  name: 'custom-1',
  variantKey: 'mz_3',
  lengthUnit: 'inch',
  parameters: {
    tapeDivisor: 95,
    teethWireDivisor: 30,
    chainAllowance: 1.80
  }
});

assert(savedPreset1.id.startsWith('preset_mz_3_inch_'), 'Generated ID must include variantKey and unit');
assert.strictEqual(savedPreset1.displayName, 'custom-1 (mz#3, inch)', 'Display name must match "custom-1 (mz#3, inch)"');
assert.strictEqual(savedPreset1.parameters.tapeDivisor, 95, 'Saved tapeDivisor should be 95');
console.log('  ✓ PASS: Preset saved with formatted display name "custom-1 (mz#3, inch)"');

// Verify scoping: query MZ#3 inch
const mz3InchPresets = storage.getCustomPresets('mz_3', 'inch');
assert.strictEqual(mz3InchPresets.length, 1, 'Should find exactly 1 preset for MZ#3 inch');
assert.strictEqual(mz3InchPresets[0].name, 'custom-1', 'Found preset should be custom-1');
console.log('  ✓ PASS: Preset correctly retrieved for (mz#3, inch)');

// Verify scoping: query MZ#3 cm -> should be 0
const mz3CmPresets = storage.getCustomPresets('mz_3', 'cm');
assert.strictEqual(mz3CmPresets.length, 0, 'Presets for inch must NOT leak into cm');
console.log('  ✓ PASS: Presets for (mz#3, inch) do not leak into (mz#3, cm)');

// Verify scoping: query CZ#5 inch -> should be 0
const cz5Presets = storage.getCustomPresets('cz_5', 'inch');
assert.strictEqual(cz5Presets.length, 0, 'Presets for mz#3 must NOT leak into cz#5');
console.log('  ✓ PASS: Presets for (mz#3, inch) do not leak into (cz#5, inch)');

// Save a second preset for CZ#5 (cm)
const savedPreset2 = storage.saveCustomPreset({
  name: 'nylon-fast',
  variantKey: 'cz_5',
  lengthUnit: 'cm',
  parameters: {
    tapeDivisor: 52.0
  }
});
assert.strictEqual(savedPreset2.displayName, 'nylon-fast (cz#5, cm)', 'Display name for CZ#5 cm is correct');
assert.strictEqual(storage.getCustomPresets('cz_5', 'cm').length, 1, 'Found preset for CZ#5 cm');
assert.strictEqual(storage.getCustomPresets('mz_3', 'inch').length, 1, 'MZ#3 inch still has exactly 1 preset');
assert.strictEqual(storage.getAllCustomPresets().length, 2, 'Total custom presets stored is 2');
console.log('  ✓ PASS: Multi-category multi-unit isolation verified');

// Delete preset
const deleted = storage.deleteCustomPreset(savedPreset1.id);
assert.strictEqual(deleted, true, 'Delete operation should succeed');
assert.strictEqual(storage.getCustomPresets('mz_3', 'inch').length, 0, 'MZ#3 inch presets should now be 0');
assert.strictEqual(storage.getCustomPresets('cz_5', 'cm').length, 1, 'CZ#5 cm preset remains intact');
console.log('  ✓ PASS: Preset deletion operates accurately without affecting other categories');

// --- 4. DOM and HTML Markup Verification ---
console.log('\n--- 4. DOM and HTML Markup Verification ---');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert(indexHtml.includes('id="select-param-preset"'), 'index.html contains preset dropdown #select-param-preset');
assert(indexHtml.includes('id="btn-save-custom-params"'), 'index.html contains #btn-save-custom-params');
assert(indexHtml.includes('id="btn-load-standard-params"'), 'index.html contains #btn-load-standard-params');
assert(indexHtml.includes('Save custom Parameters'), 'index.html contains exact button label "Save custom Parameters"');
assert(indexHtml.includes('Load Standard Parameters'), 'index.html contains exact button label "Load Standard Parameters"');
assert(indexHtml.includes('id="modal-save-custom-preset"'), 'index.html contains #modal-save-custom-preset');
assert(indexHtml.includes('id="input-preset-name"'), 'index.html contains #input-preset-name');
assert(indexHtml.includes('id="heading-select-item">Select Item</h3>'), 'Preserves original heading-select-item');
console.log('  ✓ PASS: index.html has all required UI elements, IDs, and button labels');

const styleCss = fs.readFileSync(path.join(__dirname, 'css', 'style.css'), 'utf8');
assert(styleCss.includes('#select-item-header-toolbar'), 'style.css contains #select-item-header-toolbar');
assert(styleCss.includes('#btn-save-custom-params'), 'style.css contains #btn-save-custom-params');
assert(styleCss.includes('#btn-load-standard-params'), 'style.css contains #btn-load-standard-params');
assert(styleCss.includes('pulseParamSave'), 'style.css contains pulseParamSave animation');
console.log('  ✓ PASS: style.css contains styling and animations for toolbar and buttons');

const appJs = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
assert(appJs.includes('function updatePresetDropdown'), 'app.js defines updatePresetDropdown');
assert(appJs.includes('function checkStaticParametersDirty'), 'app.js defines checkStaticParametersDirty');
assert(appJs.includes('function handlePresetDropdownChange'), 'app.js defines handlePresetDropdownChange');
assert(appJs.includes('function loadStandardParametersForActiveItem'), 'app.js defines loadStandardParametersForActiveItem');
assert(appJs.includes('function openSavePresetModal'), 'app.js defines openSavePresetModal');
assert(appJs.includes('data-param="chainAllowance"'), 'app.js includes chainAllowance for MZ parameters');
console.log('  ✓ PASS: app.js contains all required controller methods and MZ chain allowance');

console.log('\n====================================================');
console.log('ALL CUSTOM PARAMETER PRESETS TESTS PASSED (100% SUCCESS)');
console.log('====================================================\n');
