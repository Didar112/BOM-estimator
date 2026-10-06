/**
 * Test Suite: Merged BOM Common Items Across Zipper Categories
 * Verifies that common items across different zipper categories (such as U-Top, H-Bottom)
 * are calculated and displayed together in a single row with multi-source tracking,
 * while preserving category-specific distinction for tape, sliders, and wire.
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

console.log('===============================================================');
console.log('TEST SUITE: MERGED BOM COMMON ITEMS CONSOLIDATION');
console.log('===============================================================');

// Create a multi-category estimate with CZ, MZ, and PZ
const multiEstimate = {
  id: 'est_multi_category_common',
  categoryGroups: [
    {
      id: 'group_cz',
      name: 'Nylon Zipper (CZ)',
      category: 'cz',
      isSpecialUTopOrder: false, // 2 pcs per zipper
      variants: [
        {
          id: 'v_cz_1',
          zipperSize: '#5',
          zipperType: 'closed_end',
          length: 12,
          lengthUnit: 'inch',
          quantity: 1000
        }
      ]
    },
    {
      id: 'group_mz',
      name: 'Metal Zipper (MZ)',
      category: 'mz',
      isSpecialUTopOrder: true, // 1 pc per zipper (Special)
      variants: [
        {
          id: 'v_mz_1',
          zipperSize: '#5',
          zipperType: 'closed_end',
          length: 10,
          lengthUnit: 'inch',
          quantity: 2000
        }
      ]
    },
    {
      id: 'group_pz',
      name: 'Plastic Zipper (PZ)',
      category: 'pz',
      isSpecialUTopOrder: false, // 2 pcs per zipper
      variants: [
        {
          id: 'v_pz_1',
          zipperSize: '#5',
          zipperType: 'closed_end',
          length: 18,
          lengthUnit: 'inch',
          quantity: 1500
        }
      ]
    }
  ]
};

const result = calcEngine.calculateFullEstimate(multiEstimate);
assert(result !== null, 'calculateFullEstimate succeeded');

const mergedRows = result.aggregatedMaterials.processedRows;
assert(Array.isArray(mergedRows) && mergedRows.length > 0, 'Merged BOM rows exist');

// 1. Verify U-TOP Consolidation
console.log('\n--- 1. Testing U-Top Consolidation in Merged BOM ---');
const uTopRows = mergedRows.filter(r => r.component === 'U-TOP');
assert.strictEqual(uTopRows.length, 1, 'Exactly ONE row for U-TOP exists in Merged BOM across all 3 zipper categories');

const uTopRow = uTopRows[0];
// Dynamic loss: CZ: 1,000 * 2 = 2,000 @ 4% = 2,080 pcs; MZ: 2,000 * 1 = 2,000 @ 4% = 2,080 pcs; PZ: 1,500 * 2 = 3,000 @ 4% = 3,120 pcs -> Total = 7,280 pcs
assert.strictEqual(Math.round(uTopRow.totalQuantity), 7280, 'Total U-Top quantity is exactly 7,280 pcs (2,080 + 2,080 + 3,120)');
assert.strictEqual(uTopRow.unit, 'Pcs', 'U-Top unit is Pcs');
assert.strictEqual(uTopRow.usedInCategories.length, 3, 'U-Top is tagged with all 3 categories (CZ, MZ, PZ)');
assert.strictEqual(uTopRow.groupNames.length, 3, 'U-Top lists all 3 contributing category groups');
assert.strictEqual(uTopRow.contributingSources.length, 3, 'U-Top contains 3 detailed contributing source objects');

const czUTopSrc = uTopRow.contributingSources.find(s => s.groupCategory === 'cz');
assert(czUTopSrc, 'U-Top contains CZ source');
assert.strictEqual(Math.round(czUTopSrc.quantity), 2080, 'CZ U-Top source qty = 2,080');

const mzUTopSrc = uTopRow.contributingSources.find(s => s.groupCategory === 'mz');
assert(mzUTopSrc, 'U-Top contains MZ source');
assert.strictEqual(Math.round(mzUTopSrc.quantity), 2080, 'MZ U-Top source qty = 2,080');

const pzUTopSrc = uTopRow.contributingSources.find(s => s.groupCategory === 'pz');
assert(pzUTopSrc, 'U-Top contains PZ source');
assert.strictEqual(Math.round(pzUTopSrc.quantity), 3120, 'PZ U-Top source qty = 3,120');

console.log('  ✓ PASS: U-Top from CZ, MZ, and PZ are calculated and displayed together in a single row (7,280 Pcs)');

// 2. Verify H-BOTTOM Consolidation
console.log('\n--- 2. Testing H-Bottom Consolidation in Merged BOM ---');
const hBottomRows = mergedRows.filter(r => r.component === 'H-BOTTOM');
assert.strictEqual(hBottomRows.length, 1, 'Exactly ONE row for H-BOTTOM exists in Merged BOM across closed-end categories');

const hBottomRow = hBottomRows[0];
assert.strictEqual(hBottomRow.unit, 'Pcs', 'H-Bottom unit is Pcs');
assert.strictEqual(hBottomRow.usedInCategories.length, 3, 'H-Bottom is tagged with CZ, MZ, PZ');
assert.strictEqual(hBottomRow.groupNames.length, 3, 'H-Bottom lists all 3 contributing category groups');
assert.strictEqual(hBottomRow.contributingSources.length, 3, 'H-Bottom contains 3 detailed contributing source objects');
// Dynamic loss: CZ 1000 closed @ 4% = 1040; MZ 2000 closed @ 4% = 2080; PZ 1500 closed @ 4% = 1560; total = 4680
assert.strictEqual(Math.round(hBottomRow.totalQuantity), 4680, 'H-Bottom total quantity correctly sums dynamic losses across groups');

console.log('  ✓ PASS: H-Bottom from CZ, MZ, and PZ are calculated and displayed together in a single row');

// 3. Verify Category-Specific Materials Remain Isolated
console.log('\n--- 3. Testing Category-Specific Materials Remain Isolated ---');
const tapeRows = mergedRows.filter(r => r.component === 'TOTL TAPE KG');
assert.strictEqual(tapeRows.length, 3, 'Tapes for CZ, MZ, and PZ remain in 3 separate rows');

const sliderRows = mergedRows.filter(r => r.componentCategory === 'slider' || (r.component && r.component.includes('SLIDER')));
assert.strictEqual(sliderRows.length, 3, 'Sliders for CZ, MZ, and PZ remain in 3 separate rows');

console.log('  ✓ PASS: Tapes and Sliders remain properly separated by zipper category');

// 4. Verify Consolidated Calculation Detail Structure
console.log('\n--- 4. Testing Consolidated Calculation Detail ---');
assert(uTopRow.calculationDetail !== null, 'U-Top has consolidated calculation detail');
assert.strictEqual(uTopRow.calculationDetail.isMerged, true, 'U-Top calculation detail is marked isMerged = true');
assert.strictEqual(uTopRow.calculationDetail.sourcesCount, 3, 'U-Top calculation detail reflects 3 sources');
assert(uTopRow.calculationDetail.baseFormula.includes('Consolidated Requirement across 3 Category Groups:'), 'Base formula summarizes multi-source requirement');
assert(uTopRow.calculationDetail.baseFormula.includes('7,280 Pcs Total Merged BOM Requirement'), 'Base formula ends with exact total merged requirement');

console.log('  ✓ PASS: Consolidated calculation detail is structured with multi-source formula and steps');

console.log('\n===============================================================');
console.log('ALL MERGED BOM COMMON ITEMS VERIFICATION TESTS PASSED (100%)!');
console.log('===============================================================');
