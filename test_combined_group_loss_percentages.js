const assert = require('assert');
const calcEngine = require('./js/calculations.js');

console.log('====================================================');
console.log('TEST SUITE: COMBINED GROUP DYNAMIC LOSS PERCENTAGES');
console.log('====================================================\n');

let passed = 0;
let total = 0;
function testAssert(desc, condition) {
  total++;
  try {
    assert(condition);
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(err);
  }
}

// --------------------------------------------------------------------------
// 1. Bracket Lookups Verification
// --------------------------------------------------------------------------
console.log('--- 1. Testing Dynamic Percentage Brackets ---');
// U-Top bracket: 0-500: 8%, 501-2000: 4%, 2001+: 2.5%
testAssert('UTop bracket <= 500 is 8%', calcEngine.getUTopDynamicLossPercentage(500) === 8.0);
testAssert('UTop bracket 1000 is 4%', calcEngine.getUTopDynamicLossPercentage(1000) === 4.0);
testAssert('UTop bracket 3000 is 2.5%', calcEngine.getUTopDynamicLossPercentage(3000) === 2.5);

// Pin-Box bracket: 0-500: 8%, 501-2000: 4%, 2001+: 2.5%
testAssert('Pin-Box bracket <= 500 is 8%', calcEngine.getPinBoxDynamicLossPercentage(400) === 8.0);
testAssert('Pin-Box bracket 1500 is 4%', calcEngine.getPinBoxDynamicLossPercentage(1500) === 4.0);
testAssert('Pin-Box bracket 2500 is 2.5%', calcEngine.getPinBoxDynamicLossPercentage(2500) === 2.5);

// H-Bottom bracket: 0-500: 8%, 501-2000: 4%, 2001+: 2.5%
testAssert('H-Bottom bracket <= 500 is 8%', calcEngine.getHBottomDynamicLossPercentage(300) === 8.0);
testAssert('H-Bottom bracket 1200 is 4%', calcEngine.getHBottomDynamicLossPercentage(1200) === 4.0);
testAssert('H-Bottom bracket 5000 is 2.5%', calcEngine.getHBottomDynamicLossPercentage(5000) === 2.5);

// MZC#3 & MZC#5 Tape Loss beyond 2000 MTR: 0%
testAssert('MZC#3 Tape loss at 1500 MTR is 1.5%', calcEngine.getDynamicLossPercentage('MZC#3', 1500) === 1.5);
testAssert('MZC#3 Tape loss at 2500 MTR is 0.0%', calcEngine.getDynamicLossPercentage('MZC#3', 2500) === 0.0);
testAssert('MZC#5 Tape loss at 1800 MTR is 1.5%', calcEngine.getDynamicLossPercentage('MZC#5', 1800) === 1.5);
testAssert('MZC#5 Tape loss at 3000 MTR is 0.0%', calcEngine.getDynamicLossPercentage('MZC#5', 3000) === 0.0);

// --------------------------------------------------------------------------
// 2. Mixed Open and Closed-End Group Verification (MZ Category)
// --------------------------------------------------------------------------
console.log('\n--- 2. Mixed Open-End and Closed-End Group in MZ#5 ---');
// Variant 1: Open-End, 400 pcs
// Variant 2: Closed-End, 1,800 pcs
// Group Total Qty = 400 + 1,800 = 2,200 pcs (Bracket: > 2000 pcs => 2.5% loss for pin-box, h-bottom, u-top; 1.5% for slider)
const mixedGroupEstimate = {
  id: 'est_mixed',
  categoryGroups: [
    {
      id: 'mz_group_mixed',
      name: 'MZ#5 Mixed Group',
      category: 'mz',
      lengthUnit: 'inch',
      variants: [
        { id: 'v1_open', zipperSize: '#5', zipperType: 'open_end', length: 24, lengthUnit: 'inch', quantity: 400 },
        { id: 'v2_closed', zipperSize: '#5', zipperType: 'closed_end', length: 12, lengthUnit: 'inch', quantity: 1800 }
      ]
    }
  ]
};

const mixedResult = calcEngine.calculateFullEstimate(mixedGroupEstimate);
testAssert('Mixed estimate calculation succeeded', Boolean(mixedResult));

const mixedGroupCalc = mixedResult.categoryGroups[0];
const mixedRows = mixedGroupCalc.calculation.materials.processedRows;

// Check Slider:
// Group total = 2,200 pcs. Dynamic slider add bracket for 2200 pcs (2001-5000 bracket) = 2.5%
// Required slider = 2,200 * (1 + 0.025) = 2,255 pcs
const sliderRow = mixedRows.find(r => r.component === 'SLIDER' || r.componentCategory === 'slider');
testAssert('Slider row exists', Boolean(sliderRow));
testAssert('Slider uses 2.5% bracket based on 2,200 group volume (2,255 Pcs)', Math.round(sliderRow.totalQuantity) === 2255);

// Check Pin-Box:
// Only 400 pcs are open-end. Bracket evaluated on 2,200 group volume is 2.5% (instead of 8% for 400 pcs!).
// Required pin-box = 400 * (1 + 0.025) = 410 pcs.
const pinBoxRow = mixedRows.find(r => r.component === 'PIN BOX' || (r.materialName && r.materialName.includes('PIN BOX')));
testAssert('Pin-Box row exists', Boolean(pinBoxRow));
testAssert('Pin-Box uses 2.5% bracket evaluated on 2,200 total group volume, applied to 400 open-end pcs = 410 pcs', Math.round(pinBoxRow.totalQuantity) === 410);

// Check H-Bottom:
// Only 1,800 pcs are closed-end. Bracket evaluated on 2,200 group volume is 2.5% (instead of 4% for 1,800 pcs!).
// Required h-bottom = 1,800 * (1 + 0.025) = 1,845 pcs.
const hBottomRow = mixedRows.find(r => r.component === 'H-BOTTOM');
testAssert('H-Bottom row exists', Boolean(hBottomRow));
testAssert('H-Bottom uses 2.5% bracket evaluated on 2,200 total group volume, applied to 1,800 closed-end pcs = 1,845 pcs', Math.round(hBottomRow.totalQuantity) === 1845);

// Check U-Top:
// All 2,200 pcs require U-Top. Base = 2,200 * 2 = 4,400 pcs.
// Loss bracket evaluated on 2,200 group volume is 2.5%.
// Required u-top = 4,400 * (1 + 0.025) = 4,510 pcs.
const uTopRow = mixedRows.find(r => r.component === 'U-TOP');
testAssert('U-Top row exists', Boolean(uTopRow));
testAssert('U-Top uses 2.5% bracket evaluated on 2,200 total group volume, applied to base 4,400 pcs = 4,510 pcs', Math.round(uTopRow.totalQuantity) === 4510);
testAssert('U-Top has 3-step calculation breakdown', uTopRow.calculationDetail && uTopRow.calculationDetail.steps.length === 3);

// --------------------------------------------------------------------------
// 3. User Manual Overrides for Each Component
// --------------------------------------------------------------------------
console.log('\n--- 3. Testing Manual Overrides for All Components ---');
const overrideEstimate = {
  id: 'est_overrides',
  categoryGroups: [
    {
      id: 'cz_override_group',
      name: 'CZ#5 Overridden Group',
      category: 'cz',
      lengthUnit: 'inch',
      isSliderOverridden: true,
      sliderAdditionPercent: 12.0,
      isHBottomLossOverridden: true,
      hBottomLossPercent: 7.0,
      isUTopLossOverridden: true,
      uTopLossPercent: 6.0,
      variants: [
        { id: 'v_cz', zipperSize: '#5', zipperType: 'closed_end', length: 14, lengthUnit: 'inch', quantity: 1000 }
      ]
    }
  ]
};

const overrideResult = calcEngine.calculateFullEstimate(overrideEstimate);
const czOverrideRows = overrideResult.categoryGroups[0].calculation.materials.processedRows;

// Overridden Slider: 1000 * 1.12 = 1120 pcs
const ovSlider = czOverrideRows.find(r => r.component === 'SLIDER' || r.componentCategory === 'slider');
testAssert('Slider manual override of 12% applied (1,120 pcs)', Math.round(ovSlider.totalQuantity) === 1120);

// Overridden H-Bottom: 1000 * 1.07 = 1070 pcs
const ovHBottom = czOverrideRows.find(r => r.component === 'H-BOTTOM');
testAssert('H-Bottom manual override of 7% applied (1,070 pcs)', Math.round(ovHBottom.totalQuantity) === 1070);

// Overridden U-Top: 1000 * 2 = 2000 * 1.06 = 2120 pcs
const ovUTop = czOverrideRows.find(r => r.component === 'U-TOP');
testAssert('U-Top manual override of 6% applied (2,120 pcs)', Math.round(ovUTop.totalQuantity) === 2120);

// --------------------------------------------------------------------------
// 4. Separation by Unit (inch vs cm within same category)
// --------------------------------------------------------------------------
console.log('\n--- 4. Testing Unit Separation into Distinct BOM Groups ---');
const rawItemsWithMixedUnits = [
  { id: 'item_inch_1', category: 'cz', zipperSize: '#5', zipperType: 'closed_end', length: 10, lengthUnit: 'inch', quantity: 500 },
  { id: 'item_inch_2', category: 'cz', zipperSize: '#5', zipperType: 'closed_end', length: 12, lengthUnit: 'inch', quantity: 500 },
  { id: 'item_cm_1', category: 'cz', zipperSize: '#5', zipperType: 'closed_end', length: 25, lengthUnit: 'cm', quantity: 300 }
];

const unitSeparatedEstimate = {
  id: 'est_units',
  items: rawItemsWithMixedUnits
};

const unitResult = calcEngine.calculateFullEstimate(unitSeparatedEstimate);
testAssert('calculateFullEstimate separates into 2 category groups', unitResult.categoryGroups.length === 2);

const inchGroup = unitResult.categoryGroups.find(g => g.lengthUnit === 'inch');
const cmGroup = unitResult.categoryGroups.find(g => g.lengthUnit === 'cm');

testAssert('Inch group found with totalQuantity = 1000', inchGroup && inchGroup.totalQuantity === 1000);
testAssert('CM group found with totalQuantity = 300', cmGroup && cmGroup.totalQuantity === 300);

// Inch group (total qty 1000) has U-Top loss 4% (bracket 501-2000)
// CM group (total qty 300) has U-Top loss 8% (bracket <= 500)
const inchUTop = inchGroup.calculation.materials.processedRows.find(r => r.component === 'U-TOP');
const cmUTop = cmGroup.calculation.materials.processedRows.find(r => r.component === 'U-TOP');

testAssert('Inch group U-Top evaluates on its own 1000 group volume (4% loss = 2,080 pcs)', Math.round(inchUTop.totalQuantity) === 2080);
testAssert('CM group U-Top evaluates on its own 300 group volume (8% loss = 648 pcs)', Math.round(cmUTop.totalQuantity) === 648);

console.log('\n====================================================');
console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log('====================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
