/**
 * BOM Rules Engine for Zipper BOM Calculator
 * Automatically defines BOM structure based on Zipper Category (CZ, MZ, PZ), Type, and Size (#3, #5, #8, etc.).
 * Keeps rules decoupled from UI and sample data.
 */

// Default manufacturing allowance in inches per zipper type
const DEFAULT_ALLOWANCES = {
  closed_end: 0.75, // 0.75 in (top/bottom tape margin)
  open_end: 1.0,    // 1.0 in (pin/box + top extension)
  two_way: 1.25,    // 1.25 in
  invisible: 0.75,  // 0.75 in
  continuous: 0.0   // continuous chain
};

/**
 * Get factory standard allowance for a zipper variant
 * @param {string} category 
 * @param {string} size 
 * @param {string} unit 
 * @param {string} [type='closed_end'] 
 * @returns {number}
 */
function getSuggestedAllowance(category = 'cz', size = '#3', unit = 'inch', type = 'closed_end') {
  const cat = String(category || '').toLowerCase().trim();
  const u = String(unit || '').toLowerCase().trim();
  const s = String(size || '').trim();

  // Nylon Zipper (CZ)
  if (cat === 'cz' || cat === 'nylon') {
    const isSize3 = s.includes('3');
    if (u === 'cm' || u === 'centimeter' || u === 'mm') {
      return isSize3 ? 4.0 : 4.5;
    }
    // Inch
    return isSize3 ? 1.58 : 1.78;
  }

  // Metal Zipper (MZ)
  if (cat === 'mz' || cat === 'metal') {
    const isSize3 = s.includes('3');
    if (u === 'cm' || u === 'centimeter' || u === 'mm') {
      return isSize3 ? 4.5 : 5.0;
    }
    // Inch
    return isSize3 ? 1.78 : 1.97;
  }

  // Wire Category (WIRE)
  if (cat === 'wire') {
    if (s.toLowerCase().includes('long')) {
      return (u === 'cm' || u === 'centimeter' || u === 'mm') ? 5.0 : 1.97;
    }
    return 0.0; // Normal teeth wire has 0 allowance
  }

  // Plastic / Molded Zipper (PZ)
  if (cat === 'pz' || cat === 'plastic') {
    if (s.includes('8')) {
      return (u === 'cm' || u === 'centimeter' || u === 'mm') ? 6.3 : 2.4;
    }
    // PZ#3 and PZ#5
    return (u === 'cm' || u === 'centimeter' || u === 'mm') ? 5.0 : 1.97;
  }

  return DEFAULT_ALLOWANCES[type] !== undefined ? DEFAULT_ALLOWANCES[type] : 0.75;
}


/**
 * Generate a complete suggested BOM component list based on product/variant configuration
 * @param {Object} config - Variant configuration
 * @param {string} [config.zipperType] - 'closed_end' | 'open_end' | 'two_way' | 'invisible' | 'continuous'
 * @param {string} [config.zipperCategory] - 'cz' | 'mz' | 'pz' | 'nylon' | 'metal' | 'plastic' | 'invisible'
 * @param {string} [config.zipperSize] - '#3' | '#4' | '#5' | '#8' | '#10'
 * @param {number} [config.length] - Finished zipper length
 * @param {string} [config.lengthUnit] - Length unit ('inch', 'cm', 'mm', 'm', 'yd')
 * @param {number} [config.allowance] - Cutting allowance in lengthUnit
 * @param {string} [categoryOverride] - Optional category override ('cz', 'mz', 'pz')
 * @returns {Array<Object>} Generated BOM rows
 */
/**
 * Generate a complete suggested BOM component list based on product/variant configuration
 * @param {Object} config - Variant configuration
 * @param {string} [config.zipperType] - 'closed_end' | 'open_end' | 'two_way' | 'invisible' | 'continuous'
 * @param {string} [config.zipperCategory] - 'cz' | 'mz' | 'wire' | 'nylon' | 'metal'
 * @param {string} [config.zipperSize] - '#3' | '#4' | '#5' | '#8' | '#10'
 * @param {number} [config.length] - Finished zipper length
 * @param {string} [config.lengthUnit] - Length unit ('inch', 'cm', 'mm', 'm', 'yd')
 * @param {number} [config.allowance] - Cutting allowance in lengthUnit
 * @param {string} [categoryOverride] - Optional category override ('cz', 'mz', 'wire')
 * @returns {Array<Object>} Generated BOM rows
 */
function generateSuggestedBOM(config = {}, categoryOverride = null) {
  const cat = String(categoryOverride || config.zipperCategory || 'cz').toLowerCase().trim();
  const zipperSize = String(config.zipperSize || '#5').trim();
  const isSize3 = zipperSize.includes('3');
  const sizeKey = isSize3 ? '#3' : '#5';
  const sizeSuffix = isSize3 ? '3' : '5';

  const bomRows = [];
  let rowCounter = 1;

  // 1. NYLON / COIL ZIPPER (CZ) FACTORY MATERIALS
  if (cat === 'cz' || cat === 'nylon') {
    // 1. Total Tape KG
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'TOTL TAPE KG',
      componentCategory: 'tape',
      materialId: `mat_cz_tape_kg_${sizeSuffix}`,
      materialName: `CZ${sizeKey} Tape`,
      specification: isSize3 ? 'Factory Tape (Divisor 87)' : 'Factory Tape (Divisor 54.5)',
      unit: 'KG',
      isLengthDependent: true,
      unitPrice: isSize3 ? 450.00 : 420.00,
      wastagePercent: 0,
      allowDelete: false
    });

    // 2. Slider (+1.5% Add.)
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'SLIDER (+1.5% ADD.)',
      componentCategory: 'slider',
      materialId: `mat_cz_slider_${sizeSuffix}`,
      materialName: `Slider CZ${sizeKey} (+1.5% Add.)`,
      specification: 'Slider with +1.5% Factory Addition',
      unit: 'Pcs',
      isLengthDependent: false,
      unitPrice: isSize3 ? 3.50 : 4.80,
      wastagePercent: 0,
      allowDelete: false
    });

    // 3. Top Stop
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: isSize3 ? 'CZ#3 T/S' : 'T/S#5',
      componentCategory: 'stop',
      materialId: `mat_cz_ts_${sizeSuffix}`,
      materialName: `CZ${sizeKey} Top Stop Wire`,
      specification: isSize3 ? 'Top Stop Factor 0.02 / 1000' : 'Top Stop Factor 0.04 / 1000',
      unit: 'KG',
      isLengthDependent: false,
      unitPrice: 280.00,
      wastagePercent: 0,
      allowDelete: false
    });

    // 4. Bottom Stop
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: isSize3 ? 'CZ#3 B/S' : 'B/S#5',
      componentCategory: 'stop',
      materialId: `mat_cz_bs_${sizeSuffix}`,
      materialName: `CZ${sizeKey} Bottom Stop Wire`,
      specification: isSize3 ? 'Bottom Stop Factor 0.03 / 1000' : 'Bottom Stop Factor 0.04 / 1000',
      unit: 'KG',
      isLengthDependent: false,
      unitPrice: 280.00,
      wastagePercent: 0,
      allowDelete: false
    });

    // 5. Resin
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: isSize3 ? 'RESIN FOR CZ#3' : 'CZ#5 RESIN',
      componentCategory: 'resin',
      materialId: `mat_cz_resin_${sizeSuffix}`,
      materialName: isSize3 ? 'Resin for CZ#3' : 'CZ#5 Resin',
      specification: isSize3 ? 'POM / Element Resin (Divisor 1000)' : 'POM / Element Resin (Divisor 900)',
      unit: 'KG',
      isLengthDependent: false,
      unitPrice: 320.00,
      wastagePercent: 0,
      allowDelete: false
    });

    // 6. Tollilon Flat Wire
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'TOLLILON FLAT WIRE',
      componentCategory: 'wire',
      materialId: `mat_cz_tollilon_${sizeSuffix}`,
      materialName: `Tollilon Flat Wire (CZ${sizeKey})`,
      specification: isSize3 ? 'Tollilon (#1 / 14400 + #2 / 9500)' : 'Tollilon (#1 / 7700 + #2 / 8600)',
      unit: 'Unit',
      isLengthDependent: false,
      unitPrice: 1.50,
      wastagePercent: 0,
      allowDelete: false
    });

    // 7. Ultrasonic U-Top (only for CZ#5)
    if (!isSize3) {
      bomRows.push({
        id: `bom_row_${rowCounter++}`,
        component: 'ULTRASONIC U-TOP',
        componentCategory: 'stop',
        materialId: 'mat_cz_utop_5',
        materialName: 'Ultrasonic U-Top (CZ#5)',
        specification: 'Ultrasonic U-Top Factor 0.074 / 1000',
        unit: 'KG',
        isLengthDependent: false,
        unitPrice: 350.00,
        wastagePercent: 0,
        allowDelete: false
      });
    }

    return bomRows;
  }

  // 2. METAL ZIPPER (MZ) FACTORY MATERIALS
  if (cat === 'mz' || cat === 'metal') {
    // 1. Total Tape KG
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'TOTL TAPE KG',
      componentCategory: 'tape',
      materialId: `mat_mz_tape_${sizeSuffix}`,
      materialName: `MZ${sizeKey} Tape`,
      specification: isSize3 ? 'Factory Tape (Divisor 97)' : 'Factory Tape (Divisor 71)',
      unit: 'KG',
      isLengthDependent: true,
      unitPrice: isSize3 ? 480.00 : 450.00,
      wastagePercent: 0,
      allowDelete: false
    });

    // 2. Teeth Wire (for MZ#3)
    if (isSize3) {
      bomRows.push({
        id: `bom_row_${rowCounter++}`,
        component: 'WIRE#3',
        componentCategory: 'wire',
        materialId: 'mat_mz_teeth_wire_3',
        materialName: 'Teeth Wire #3 (Brass / Metal)',
        specification: 'Divisor 32, Loss 4%',
        unit: 'KG',
        isLengthDependent: true,
        unitPrice: 850.00,
        wastagePercent: 0,
        allowDelete: false
      });
    }

    // 3. Top Stop Wire
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: isSize3 ? 'T/S#3' : 'Wire for T/S# 4 & 5',
      componentCategory: 'stop',
      materialId: `mat_mz_ts_${sizeSuffix}`,
      materialName: isSize3 ? 'Top Stop Wire T/S#3' : 'Wire for T/S# 4 & 5',
      specification: isSize3 ? 'Factor 0.22 / 1000' : 'Factor 0.32 / 1000',
      unit: 'KG',
      isLengthDependent: false,
      unitPrice: 550.00,
      wastagePercent: 0,
      allowDelete: false
    });

    // 4. Bottom Stop (H-Bottom for MZ#3, Wire for B/S for MZ#5)
    if (isSize3) {
      bomRows.push({
        id: `bom_row_${rowCounter++}`,
        component: 'H-BOTTOM',
        componentCategory: 'stop',
        materialId: 'mat_mz_h_bottom_3',
        materialName: 'H-Bottom Stop (MZ#3)',
        specification: '+2.5% Loss Factor (1.025)',
        unit: 'Pcs',
        isLengthDependent: false,
        unitPrice: 0.65,
        wastagePercent: 0,
        allowDelete: false
      });
    } else {
      bomRows.push({
        id: `bom_row_${rowCounter++}`,
        component: 'Wire for B/S# 4&5',
        componentCategory: 'stop',
        materialId: 'mat_mz_bs_5',
        materialName: 'Wire for B/S# 4 & 5',
        specification: 'Factor 0.172 / 1000',
        unit: 'KG',
        isLengthDependent: false,
        unitPrice: 550.00,
        wastagePercent: 0,
        allowDelete: false
      });
    }

    // 5. Slider (+1.5% Add.)
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'SLIDER (+1.5% ADD.)',
      componentCategory: 'slider',
      materialId: `mat_mz_slider_${sizeSuffix}`,
      materialName: `Slider MZ${sizeKey} (+1.5% Add.)`,
      specification: 'Slider with +1.5% Factory Addition',
      unit: 'Pcs',
      isLengthDependent: false,
      unitPrice: isSize3 ? 5.20 : 6.80,
      wastagePercent: 0,
      allowDelete: false
    });

    return bomRows;
  }

  // 3. WIRE FACTORY MATERIALS
  if (cat === 'wire') {
    const isLong = zipperSize.toLowerCase().includes('long') || String(config.wireType || '').includes('long');
    const compName = isSize3 ? 'WIRE#3' : (isLong ? 'Teeth for Long Chain#5' : 'WIRE#5');
    const matId = isSize3 ? 'mat_wire_3' : (isLong ? 'mat_wire_5_long' : 'mat_wire_5_normal');
    const matName = isSize3 ? 'Teeth Wire #3' : (isLong ? 'Teeth Wire #5 (Long Teeth)' : 'Teeth Wire #5 (Normal Teeth)');
    const matSpec = isSize3 ? 'Divisor 32 (Inch) / 27.73 (CM), Loss 4%' : (isLong ? 'Divisor 20.6, Loss 5%, Allowance 1.97" / 5.0cm' : 'Divisor 20.6, Loss 5%');

    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: compName,
      componentCategory: 'wire',
      materialId: matId,
      materialName: matName,
      specification: matSpec,
      unit: 'KG',
      isLengthDependent: true,
      unitPrice: isSize3 ? 820.00 : 780.00,
      wastagePercent: 0,
      allowDelete: false
    });

    return bomRows;
  }

  // 4. PLASTIC / MOLDED ZIPPER (PZ) FACTORY MATERIALS
  if (cat === 'pz' || cat === 'plastic') {
    const isPz8 = zipperSize.includes('8');
    const isPz3 = zipperSize.includes('3');
    const sizeSuffix = isPz8 ? '8' : (isPz3 ? '3' : '5');
    const sizeKey = `#${sizeSuffix}`;

    const defaultTapeDiv = isPz8 ? 57 : (isPz3 ? 101 : 81);
    const tapeFactor = isPz8 ? 26.23 : (isPz3 ? 8.15 : 13.07);

    // 0. Chain Consumption
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'Chain Consumption',
      componentCategory: 'chain',
      materialId: `mat_pz_chain_consumption_${sizeSuffix}`,
      materialName: 'Chain Consumption',
      specification: `Base Chain Consumption for PZ#${sizeSuffix} (pre-loss)`,
      unit: 'Mtr',
      isLengthDependent: true,
      unitPrice: 0,
      wastagePercent: 0,
      allowDelete: false
    });

    // 1. Total Tape KG
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'TOTL TAPE KG',
      componentCategory: 'tape',
      materialId: `mat_pz_tape_kg_${sizeSuffix}`,
      materialName: `PZ${sizeKey} Tape`,
      specification: `Factory Tape for PZ${sizeKey} (Divisor ${defaultTapeDiv})`,
      unit: 'KG',
      isLengthDependent: true,
      unitPrice: isPz8 ? 400.00 : (isPz3 ? 460.00 : 430.00),
      wastagePercent: 0,
      allowDelete: false
    });

    // 2. Slider (+1.5% Add.)
    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: 'SLIDER (+1.5% ADD.)',
      componentCategory: 'slider',
      materialId: `mat_pz_slider_${sizeSuffix}`,
      materialName: `Slider PZ${sizeKey} (+1.5% Add.)`,
      specification: 'Slider with +1.5% Factory Addition',
      unit: 'Pcs',
      isLengthDependent: false,
      unitPrice: isPz8 ? 7.50 : (isPz3 ? 3.80 : 5.00),
      wastagePercent: 0,
      allowDelete: false
    });

    // 3. Tape Wise (PZ#3) / Resin for PZ Chain (PZ#5 / PZ#8)
    const tapeResinName = isPz3 ? 'PZO#3 & PZC#3 Tape Wise' : `Resin for PZ#${sizeSuffix} Chain`;
    const tapeResinComp = isPz3 ? 'PZO#3 & PZC#3 Tape Wise' : 'Resin for PZ Chain';
    const tapeResinSpec = isPz3
      ? `PZO#3 & PZC#3 Tape Wise (+2.5% Add., Factor ${tapeFactor} / 1000)`
      : `Tape-Based Resin for PZ${sizeKey} (+2.5% Add., Factor ${tapeFactor} / 1000)`;

    bomRows.push({
      id: `bom_row_${rowCounter++}`,
      component: tapeResinComp,
      componentCategory: 'resin',
      materialId: isPz3 ? `mat_pz_tape_wise_${sizeSuffix}` : `mat_pz_tape_resin_${sizeSuffix}`,
      materialName: tapeResinName,
      specification: tapeResinSpec,
      unit: 'KG',
      isLengthDependent: true,
      unitPrice: 340.00,
      wastagePercent: 0,
      allowDelete: false
    });

    return bomRows;
  }

  // Generic fallback
  return [];
}


/**
 * Helper to capitalize a string
 * @param {string} s 
 * @returns {string}
 */
function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Export for global access in Vanilla JS and Node.js
if (typeof window !== 'undefined') {
  window.BOMRules = {
    DEFAULT_ALLOWANCES,
    getSuggestedAllowance,
    generateSuggestedBOM
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_ALLOWANCES,
    getSuggestedAllowance,
    generateSuggestedBOM
  };
}


