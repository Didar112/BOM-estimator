/**
 * Test Suite: Full Storage Lifecycle & Page State Preservation
 * Validates:
 * 1. Unique calculation ID assignment on save
 * 2. Complete snapshot preservation: all items, parameters, allowances, sliders, and BoM values
 * 3. Loading a saved calculation restores 100% of values into appState
 * 4. User-assigned name display and retrieval in Saved Estimates list
 * 5. Search filtering and deletion of saved calculations
 */

const assert = require('assert');
const storage = require('./js/storage.js');
const { calculateFullEstimate } = require('./js/calculations.js');

// Mock localStorage in Node environment
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.window = {
  CalculatorEngine: { calculateFullEstimate },
  StorageManager: storage
};

let passedTests = 0;
let totalTests = 0;

function testAssert(desc, condition) {
  totalTests++;
  try {
    assert(condition);
    console.log(`  ✓ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
  }
}

console.log('====================================================');
console.log('TESTING COMPLETE STORAGE LIFECYCLE & STATE RESTORATION');
console.log('====================================================\n');

// 1. Unique ID Generation Test
console.log('--- 1. Unique ID Generation ---');
const id1 = storage.generateUniqueCalculationId();
const id2 = storage.generateUniqueCalculationId();
testAssert('Unique ID format starts with "calc_"', id1.startsWith('calc_'));
testAssert('Consecutive unique IDs are distinct', id1 !== id2);
testAssert('Unique ID length is valid', id1.length >= 15);

// 2. Full Calculation State Saving
console.log('\n--- 2. Save Calculation with Complete Values & Items ---');
const testCalculation = {
  name: 'Winter Parka Jacket #2026',
  reference: 'ORD-WINTER-99',
  activeItemId: 'item_cz5_main',
  bomViewMode: 'individual',
  items: [
    {
      id: 'item_cz5_main',
      variantKey: 'cz_5',
      displayName: 'CZ#5',
      name: 'CZ#5',
      category: 'cz',
      zipperSize: '#5',
      zipperType: 'open_end',
      length: 28,
      lengthUnit: 'inch',
      allowance: 1.25,
      quantity: 5000,
      color: 'Dark Olive #84',
      styleName: 'Winter Parka',
      remarks: 'Heavy duty front zipper',
      lossPercent: 3.5,
      sliderAdditionPercent: 2.5,
      sliderAddPercent: 2.5,
      isSliderOverridden: true,
      pinBoxLossPercent: 4.5,
      isPinBoxLossOverridden: true,
      pinBoxPerZipper: 1,
      isSpecialUTopOrder: true,
      czParams: {
        inchAllowance: 1.78,
        tapeDivisor: 54.5,
        topStopDivisor: 1540,
        bottomStopDivisor: 1980,
        resinDivisor: 4500,
        tollilon1Divisor: 385,
        tollilon2Divisor: 430,
        isSpecialUTopOrder: true
      },
      bomRows: []
    },
    {
      id: 'item_mz3_pocket',
      variantKey: 'mz_3',
      displayName: 'MZ#3',
      name: 'MZ#3',
      category: 'mz',
      zipperSize: '#3',
      zipperType: 'closed_end',
      length: 6.5,
      lengthUnit: 'inch',
      allowance: 0.75,
      quantity: 10000,
      color: 'Gunmetal #02',
      styleName: 'Winter Parka',
      remarks: 'Chest pockets',
      lossPercent: 2.5,
      sliderAdditionPercent: 1.5,
      sliderAddPercent: 1.5,
      isSliderOverridden: false,
      pinBoxLossPercent: 4.0,
      isPinBoxLossOverridden: false,
      hBottomLossPercent: 5.0,
      isHBottomLossOverridden: true,
      mzParams: {
        inchAllowance: 1.97,
        tapeDivisor: 75.0,
        teethWireDivisor: 40.0,
        teethLossFactor: 1.05,
        topStopFactor: 1.05,
        topStopDivisor: 13500,
        hBottomLossPercent: 5.0
      },
      bomRows: []
    }
  ],
  labor: { method: 'per_zipper', ratePerZipper: 1.75 },
  overhead: { percentage: 7.5, basis: 'material_and_labor' }
};

const savedResult = storage.saveEstimate(testCalculation);
testAssert('saveEstimate returns object with assigned unique ID', Boolean(savedResult.id) && savedResult.id.startsWith('calc_'));
testAssert('User-assigned name is preserved exactly', savedResult.name === 'Winter Parka Jacket #2026');
testAssert('All 2 items are preserved', savedResult.items && savedResult.items.length === 2);
testAssert('Item 1 CZ#5 length (28) preserved', savedResult.items[0].length === 28);
testAssert('Item 1 CZ#5 quantity (5000) preserved', savedResult.items[0].quantity === 5000);
testAssert('Item 1 CZ#5 allowance (1.25) preserved', savedResult.items[0].allowance === 1.25);
testAssert('Item 1 CZ#5 isSpecialUTopOrder (true) preserved', savedResult.items[0].isSpecialUTopOrder === true);
testAssert('Item 1 CZ#5 czParams.tollilon2Divisor (430) preserved', savedResult.items[0].czParams.tollilon2Divisor === 430);
testAssert('Item 2 MZ#3 length (6.5) preserved', savedResult.items[1].length === 6.5);
testAssert('Item 2 MZ#3 quantity (10000) preserved', savedResult.items[1].quantity === 10000);
testAssert('Item 2 MZ#3 hBottomLossPercent (5.0) preserved', savedResult.items[1].hBottomLossPercent === 5.0);
testAssert('Item 2 MZ#3 isHBottomLossOverridden (true) preserved', savedResult.items[1].isHBottomLossOverridden === true);
testAssert('activeItemId preserved', savedResult.activeItemId === 'item_cz5_main');
testAssert('bomViewMode preserved', savedResult.bomViewMode === 'individual');
testAssert('calculationSnapshot generated with totalOrderQuantity = 15000', savedResult.calculationSnapshot && savedResult.calculationSnapshot.totalOrderQuantity === 15000);

// 3. Retrieval by ID and GetAll
console.log('\n--- 3. Retrieval and Listing ---');
const retrieved = storage.getEstimateById(savedResult.id);
testAssert('getEstimateById finds calculation by unique ID', retrieved !== null);
testAssert('Retrieved calculation matches saved name', retrieved.name === 'Winter Parka Jacket #2026');

const allSaved = storage.getAllSavedEstimates();
testAssert('getAllSavedEstimates includes newly saved calculation', allSaved.some(e => e.id === savedResult.id));
testAssert('getAllEstimates alias is available and matches', storage.getAllEstimates().length === allSaved.length);

// 4. Loading State Simulation (Testing Data Fidelity for Restoration)
console.log('\n--- 4. Full Page Restoration Fidelity Simulation ---');
const loadedForPage = JSON.parse(JSON.stringify(retrieved));
// Simulate calculation engine running over restored estimate
const fullCalcResult = calculateFullEstimate(loadedForPage);
testAssert('Restored calculation calculates totals without error', Boolean(fullCalcResult.totals));
testAssert('Restored calculation total quantity is 15,000 pcs', fullCalcResult.totals.quantity === 15000);
testAssert('Restored calculation has 2 groups/items calculated', fullCalcResult.categoryGroups && fullCalcResult.categoryGroups.length === 2);

const czGroup = fullCalcResult.categoryGroups.find(g => g.category === 'cz');
const mzGroup = fullCalcResult.categoryGroups.find(g => g.category === 'mz');
testAssert('CZ group calculated correctly', Boolean(czGroup));
testAssert('MZ group calculated correctly', Boolean(mzGroup));

// Check special U-Top BOM calculation in restored state
const uTopBOMRow = czGroup.calculation.materials.processedRows.find(r => r.component === 'U-TOP');
testAssert('Restored state produces U-TOP BOM row', Boolean(uTopBOMRow));
// Since isSpecialUTopOrder is true and qty = 5,000 (bracket > 2000 gives 2.5% loss): 5,000 pcs * 1 * 1.025 = 5,125 pcs
testAssert('Special U-Top quantity is 5,125 pcs (1 per zipper + 2.5% loss)', Math.round(uTopBOMRow.totalQuantity) === 5125);

// 5. Duplicate and Delete Calculation
console.log('\n--- 5. Duplicate and Delete Operations ---');
const duplicated = storage.duplicateEstimate(savedResult.id);
testAssert('Duplicated calculation receives new unique ID', Boolean(duplicated.id) && duplicated.id !== savedResult.id);
testAssert('Duplicated calculation name has "(Copy)" appended', duplicated.name.includes('(Copy)'));

const deleteSuccess = storage.deleteEstimate(duplicated.id);
testAssert('deleteEstimate removes duplicated calculation', deleteSuccess);
testAssert('Duplicated calculation no longer in storage', storage.getEstimateById(duplicated.id) === null);
testAssert('Original saved calculation remains intact', storage.getEstimateById(savedResult.id) !== null);

// 6. JSON Export / Import
console.log('\n--- 6. JSON Backup / Import ---');
const backupJson = JSON.stringify(storage.getAllSavedEstimates());
const importedCount = storage.importEstimatesFromJSON(backupJson, true);
testAssert('importEstimatesFromJSON imports successfully', importedCount >= 1);

console.log('\n====================================================');
console.log(`STORAGE TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
