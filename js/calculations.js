/**
 * Calculation Engine for Zipper BOM Calculator
 * Pure functional mathematical calculation engine with robust numerical handling.
 * Operates independently from the DOM.
 * Supports independent multi-variant calculations, material requirement aggregations,
 * and comprehensive production cost estimation.
 */

/**
 * Format a number as Bangladeshi Taka (৳ BDT)
 * @param {number} amount 
 * @param {boolean} [showSymbol=true] 
 * @param {number} [decimals=2] 
 * @returns {string}
 */
function formatBDT(amount, showSymbol = true, decimals = 2) {
  const num = Number(amount);
  if (isNaN(num)) return showSymbol ? '৳ 0.00' : '0.00';
  
  const formatted = num.toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return showSymbol ? `৳ ${formatted}` : formatted;
}

/**
 * Format a quantity or decimal with flexible precision
 * @param {number} value 
 * @param {number} [maxDecimals=4] 
 * @returns {string}
 */
function formatQuantity(value, maxDecimals = 4) {
  const num = Number(value);
  if (isNaN(num)) return '0';
  
  // Format without trailing zeros if integer, or up to maxDecimals
  return parseFloat(num.toFixed(maxDecimals)).toLocaleString('en-US', {
    maximumFractionDigits: maxDecimals
  });
}

/**
 * Helper to identify if a row or material or unit corresponds to Slider
 * @param {Object|string} rowOrUnit 
 * @returns {boolean}
 */
function isSliderRow(rowOrUnit) {
  if (!rowOrUnit) return false;
  if (typeof rowOrUnit === 'string') {
    return rowOrUnit.toLowerCase().includes('slider');
  }
  if (typeof rowOrUnit !== 'object') return false;

  const comp = String(rowOrUnit.component || '').toLowerCase();
  const name = String(rowOrUnit.materialName || rowOrUnit.name || '').toLowerCase();
  const matId = String(rowOrUnit.materialId || rowOrUnit.key || rowOrUnit.id || '').toLowerCase();
  const cat = String(rowOrUnit.componentCategory || rowOrUnit.category || '').toLowerCase();
  const calcDetailName = String((rowOrUnit.calculationDetail && rowOrUnit.calculationDetail.materialName) || '').toLowerCase();
  const calcDetailComp = String((rowOrUnit.calculationDetail && rowOrUnit.calculationDetail.component) || '').toLowerCase();

  return cat === 'slider' ||
         comp.includes('slider') ||
         name.includes('slider') ||
         matId.includes('slider') ||
         calcDetailName.includes('slider') ||
         calcDetailComp.includes('slider');
}

/**
 * Determine the exact display decimal precision for a BOM material based on Excel rules
 * @param {Object|string} rowOrUnit - BOM row object or unit string
 * @returns {number}
 */
function getMaterialDisplayDecimals(rowOrUnit) {
  if (!rowOrUnit) return 2;

  let unit = '';
  let matId = '';
  let comp = '';
  let name = '';
  let val = 0;

  if (typeof rowOrUnit === 'object') {
    unit = String(rowOrUnit.unit || '').trim().toLowerCase();
    matId = String(rowOrUnit.materialId || rowOrUnit.key || rowOrUnit.id || '').toLowerCase();
    comp = String(rowOrUnit.component || '').toLowerCase();
    name = String(rowOrUnit.materialName || '').toLowerCase();
    val = Number(rowOrUnit.totalQuantity !== undefined ? rowOrUnit.totalQuantity : rowOrUnit.quantity) || 0;
  } else {
    unit = String(rowOrUnit || '').trim().toLowerCase();
  }

  // 1. Tollilon Flat Wire (unit: Unit) -> Always integer in Excel (e.g. 164)
  if (unit === 'unit' || comp.includes('tollilon') || name.includes('tollilon')) {
    return 0;
  }

  // 2. H-Bottom Stop (unit: Pcs) -> Always integer in Excel (e.g. 2,060)
  if (comp.includes('h-bottom') || name.includes('h-bottom')) {
    return 0;
  }

  // 3. Slider count (unit: Pcs) -> Always whole pieces (0 decimals; rounded up to next integer if fraction)
  if (isSliderRow(rowOrUnit)) {
    return 0;
  }

  // 4. Piece/Pcs count (e.g. Pin Box)
  if (unit === 'pcs' || unit === 'pc' || comp.includes('pin box') || name.includes('pin box') || matId.includes('pin_box')) {
    if (Number.isInteger(val)) return 0;
    return 2; // Keep 2 decimal places for fractional pin box additions
  }

  // 5. PZ Tape-Wise resin (Excel uses 4 decimals, e.g. 20.7727 KG)
  if (matId.includes('tape_wise') || matId.includes('tape_resin') || comp.includes('tape wise') || name.includes('tape wise')) {
    return 4;
  }

  // 6. PZO and PZC molded element resin (Excel uses 3 decimals, e.g. 5.923 KG, 3.863 KG)
  if (
    matId.includes('pzo') || matId.includes('pzc') ||
    comp.startsWith('pzo') || comp.startsWith('pzc') ||
    name.startsWith('pzo') || name.startsWith('pzc')
  ) {
    return 3;
  }

  // 7. Chain Consumption / Required Chain Length (unit: Mtr) -> nearest whole number in BOM display (0 decimals)
  if (
    matId.includes('chain_consumption') ||
    comp.includes('chain consumption') ||
    name.includes('chain consumption') ||
    matId.includes('req_chain') ||
    comp.includes('required chain') ||
    name.includes('required chain') ||
    comp.includes('chain length') ||
    name.includes('chain length')
  ) {
    return 0;
  }

  // 8. Standard Tape KG, Stop Wire KG, Teeth Wire KG, Element Resin KG -> 2 decimals in Excel
  return 2;
}

/**
 * Helper to round a floating point number to exact decimal places without binary float inaccuracies
 * @param {number} val 
 * @param {number} decimals 
 * @returns {number}
 */
function roundToPrecision(val, decimals) {
  const num = Number(val);
  if (isNaN(num)) return 0;
  if (decimals === 0) return Math.round(num);
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Format final BOM output quantity according to Excel-derived rounding rules
 * @param {Object|number} rowOrQty - BOM row object or numeric quantity
 * @param {string} [unit=''] - Optional unit string if number passed
 * @param {Object} [contextRow=null] - Optional row context
 * @returns {string} Formatted quantity string with proper thousand separators and decimals
 */
function formatBOMQuantity(rowOrQty, unit = '', contextRow = null) {
  let val = 0;
  let row = null;

  if (typeof rowOrQty === 'object' && rowOrQty !== null) {
    row = rowOrQty;
    val = Number(row.totalQuantity !== undefined ? row.totalQuantity : row.quantity) || 0;
  } else {
    val = Number(rowOrQty) || 0;
    row = contextRow || { totalQuantity: val, unit: unit };
  }

  // Sliders are physical whole pieces -> display as the next integer if value comes as fraction
  if (isSliderRow(row) || isSliderRow(unit) || (contextRow && isSliderRow(contextRow))) {
    return Math.ceil(val).toLocaleString('en-US');
  }

  const decimals = getMaterialDisplayDecimals(row);

  if (decimals === 0) {
    return Math.round(val).toLocaleString('en-US');
  }

  const rounded = roundToPrecision(val, decimals);

  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ==================== DYNAMIC CLASS LOSS PERCENTAGE ENGINE ====================

/**
 * Identify the canonical zipper class for a variant based on category, size, and type.
 * Only 'closed_end' and 'open_end' are recognized for MZ/PZ dynamic loss.
 * Dummy/generated types such as 'two_way' are explicitly distinguished and do not qualify as open/closed.
 * 
 * @param {Object} variant - Variant object with zipperSize, zipperType, etc.
 * @param {string} category - Category identifier ('cz', 'mz', 'pz', 'wire')
 * @returns {string} Canonical class name (e.g. 'CZ#3', 'CZ#5', 'MZC#3', 'MZO#5', 'PZC#3', 'PZO#5', etc.)
 */
function getVariantZipperClass(variantOrCategory, categoryOrType, maybeSize) {
  let cat = '';
  let sizeStr = '';
  let typeStr = '';

  if (typeof variantOrCategory === 'object' && variantOrCategory !== null) {
    cat = String(categoryOrType || variantOrCategory.category || '').toLowerCase().trim();
    sizeStr = String(variantOrCategory.zipperSize || '').trim();
    typeStr = String(variantOrCategory.zipperType || '').trim().toLowerCase();
  } else {
    // Called as (category, zipperType, zipperSize)
    cat = String(variantOrCategory || '').toLowerCase().trim();
    typeStr = String(categoryOrType || '').trim().toLowerCase();
    sizeStr = String(maybeSize || '').trim();
  }

  if (cat === 'cz' || cat === 'nylon') {
    const isClosed = typeStr === 'closed_end';
    const isOpen = typeStr === 'open_end';
    const sizeNum = sizeStr.includes('3') ? '#3' : '#5';

    if (isClosed) {
      return `CZC${sizeNum}`; // CZC#3, CZC#5
    } else if (isOpen) {
      return `CZO${sizeNum}`; // CZO#3, CZO#5
    } else {
      return `CZ${sizeNum}`;
    }
  }

  if (cat === 'mz' || cat === 'metal') {
    const isClosed = typeStr === 'closed_end';
    const isOpen = typeStr === 'open_end';
    const sizeNum = sizeStr.includes('3') ? '#3' : (sizeStr.includes('4') ? '#4' : '#5');

    if (isClosed) {
      return `MZC${sizeNum}`; // MZC#3, MZC#4, MZC#5
    } else if (isOpen) {
      return `MZO${sizeNum}`; // MZO#5, MZO#3, MZO#4
    } else {
      // Dummy or other zipper types like 'two_way', 'continuous', etc.
      return `MZ${sizeNum} (${typeStr || 'Other'})`;
    }
  }

  if (cat === 'pz' || cat === 'plastic') {
    const isClosed = typeStr === 'closed_end';
    const isOpen = typeStr === 'open_end';
    const sizeNum = sizeStr.includes('3') ? '#3' : (sizeStr.includes('8') ? '#8' : '#5');

    if (isClosed) {
      return `PZC${sizeNum}`; // PZC#3, PZC#5, PZC#8
    } else if (isOpen) {
      return `PZO${sizeNum}`; // PZO#3, PZO#5, PZO#8
    } else {
      // Dummy or other zipper types like 'two_way', 'continuous', etc.
      return `PZ${sizeNum} (${typeStr || 'Other'})`;
    }
  }

  if (cat === 'wire') {
    if (sizeStr.includes('3')) return 'WIRE#3';
    if (sizeStr.includes('long')) return 'WIRE#5_long';
    return 'WIRE#5_normal';
  }

  return 'OTHER';
}

/**
 * Strict eligibility check for dynamic loss percentage.
 * Only exact classes explicitly covered by the official factory loss chart qualify:
 * - CZC#3, CZO#3, CZ#3, CZC#5, CZO#5, CZ#5
 * - MZC#3, MZC#4, MZC#5, MZO#5
 * - PZC#3, PZO#3, PZC#5, PZO#5
 * All others (PZ#8, two_way, etc.) return false.
 * 
 * @param {string} zipperClass 
 * @returns {boolean}
 */
function isClassEligibleForDynamicLoss(zipperClass) {
  const eligibleClasses = [
    'CZC#3', 'CZO#3', 'CZ#3',
    'CZC#5', 'CZO#5', 'CZ#5',
    'MZC#3', 'MZC#4', 'MZC#5', 'MZO#5',
    'PZC#3', 'PZO#3', 'PZC#5', 'PZO#5'
  ];
  return eligibleClasses.includes(zipperClass);
}

/**
 * Determine dynamic loss percentage from the official factory bracket chart.
 * Uses exact chart ranges evaluated against displayed rounded Base Chain MTR:
 * 
 * CZC#3, CZO#3 & CZC#5, CZO#5:
 *   0-200 MTR = 8% (< 200)
 *   200-5000 MTR = 3% (200..5000)
 *   ABOVE 5000 MTR = 2% (> 5000)
 * 
 * MZC#3:
 *   0-200 MTR = 8% (< 200)
 *   200-500 MTR = 7% (200..500)
 *   500-1000 MTR = 3% (501..1000)
 *   1000-2000 MTR = 1.5% (1001..2000)
 *   ABOVE 2000 MTR = 0% (> 2000)
 * 
 * MZC#4 & MZC#5:
 *   0-200 MTR = 8% (< 200)
 *   200-1000 MTR = 2% (200..1000)
 *   1000-2000 MTR = 1.5% (1001..2000)
 *   ABOVE 2000 MTR = 0% (> 2000)
 * 
 * MZO#5:
 *   0-200 MTR = 8% (< 200)
 *   200-500 MTR = 6% (200..500)
 *   500-2000 MTR = 3% (501..2000)
 *   2000-5000 MTR = 1.5% (2001..5000)
 *   ABOVE 5000 MTR = 1% (> 5000)
 * 
 * PZC#3, PZO#3 & PZC#5, PZO#5:
 *   0-200 MTR = 8% (< 200)
 *   200-500 MTR = 6% (200..500)
 *   500-5000 MTR = 3% (501..5000)
 *   5000-50000 MTR = 2% (5001..50000)
 *   ABOVE 50000 MTR = 1.5% (> 50000)
 * 
 * @param {string} zipperClass 
 * @param {number} combinedBaseChainMtr 
 * @returns {number|null} Loss percentage (e.g. 3.0, 8.0, 1.5) or null if unsupported
 */
function getDynamicLossPercentage(zipperClass, combinedBaseChainMtr) {
  if (!isClassEligibleForDynamicLoss(zipperClass)) {
    return null; // Blank for unsupported classes (e.g. PZ#8, two_way)
  }

  // Base Chain MTR rounded to integer matching the displayed whole-number MTR in the UI
  const mtr = Math.round(Math.max(0, Number(combinedBaseChainMtr) || 0));

  // CZC#3, CZO#3, CZ#3, CZC#5, CZO#5, CZ#5:
  if (
    zipperClass === 'CZC#3' || zipperClass === 'CZO#3' || zipperClass === 'CZ#3' ||
    zipperClass === 'CZC#5' || zipperClass === 'CZO#5' || zipperClass === 'CZ#5'
  ) {
    if (mtr < 200) return 8.0;
    if (mtr <= 5000) return 3.0;
    return 2.0;
  }

  // MZC#3:
  if (zipperClass === 'MZC#3') {
    if (mtr < 200) return 8.0;
    if (mtr <= 500) return 7.0;
    if (mtr <= 1000) return 3.0;
    if (mtr <= 2000) return 1.5;
    return 0.0;
  }

  // MZC#4 & MZC#5:
  if (zipperClass === 'MZC#4' || zipperClass === 'MZC#5') {
    if (mtr < 200) return 8.0;
    if (mtr <= 1000) return 2.0;
    if (mtr <= 2000) return 1.5;
    return 0.0;
  }

  // MZO#5:
  if (zipperClass === 'MZO#5') {
    if (mtr < 200) return 8.0;
    if (mtr <= 500) return 6.0;
    if (mtr <= 2000) return 3.0;
    if (mtr <= 5000) return 1.5;
    return 1.0;
  }

  // PZC#3 / PZO#3:
  if (zipperClass === 'PZC#3' || zipperClass === 'PZO#3') {
    if (mtr < 200) return 8.0;
    if (mtr <= 500) return 6.0;
    if (mtr <= 5000) return 3.0;
    if (mtr <= 50000) return 2.0;
    return 1.5;
  }

  // PZC#5 / PZO#5:
  if (zipperClass === 'PZC#5' || zipperClass === 'PZO#5') {
    if (mtr < 200) return 8.0;
    if (mtr <= 500) return 6.0;
    if (mtr <= 5000) return 3.0;
    if (mtr <= 50000) return 2.0;
    return 1.5;
  }

  return null;
}

/**
 * Determine dynamic Slider loss percentage based on total zipper quantity (in PCS).
 * Factory table:
 *   0–500 pcs: 8%
 *   501–2000 pcs: 4%
 *   2001–5000 pcs: 2.5%
 *   Above 5000 pcs: 1.5%
 * 
 * @param {number} quantityPcs - Total zipper pieces
 * @returns {number} Loss percentage
 */
function getSliderDynamicLossPercentage(quantityPcs) {
  const qty = Math.max(0, Number(quantityPcs) || 0);
  if (qty <= 500) return 8.0;
  if (qty <= 2000) return 4.0;
  if (qty <= 5000) return 2.5;
  return 1.5;
}

/**
 * Determine dynamic Pin Box loss percentage based on relevant zipper quantity (in PCS).
 * Factory table:
 *   0–500 pcs: 8%
 *   501–2000 pcs: 4%
 *   2001+ pcs: 2.5%
 * 
 * @param {number} quantityPcs - Relevant zipper pieces (Open-End / Two-Way)
 * @returns {number} Loss percentage
 */
function getPinBoxDynamicLossPercentage(quantityPcs) {
  const qty = Math.max(0, Number(quantityPcs) || 0);
  if (qty <= 500) return 8.0;
  if (qty <= 2000) return 4.0;
  return 2.5;
}

/**
 * Determine dynamic H-Bottom loss percentage based on MZ#3 zipper quantity (in PCS).
 * Factory table (MZ#3 only):
 *   0–500 pcs: 8%
 *   501–2000 pcs: 4%
 *   2001+ pcs: 2.5%
 * 
 * @param {number} quantityPcs - MZ#3 zipper pieces
 * @returns {number} Loss percentage
 */
function getHBottomDynamicLossPercentage(quantityPcs) {
  const qty = Math.max(0, Number(quantityPcs) || 0);
  if (qty <= 500) return 8.0;
  if (qty <= 2000) return 4.0;
  return 2.5;
}

/**
 * Determine dynamic U-Top loss percentage based on total zipper quantity (in PCS).
 * Factory table (matches pin-box & h-bottom):
 *   0–500 pcs: 8%
 *   501–2000 pcs: 4%
 *   2001+ pcs: 2.5%
 * 
 * @param {number} quantityPcs - Total zipper pieces
 * @returns {number} Loss percentage
 */
function getUTopDynamicLossPercentage(quantityPcs) {
  const qty = Math.max(0, Number(quantityPcs) || 0);
  if (qty <= 500) return 8.0;
  if (qty <= 2000) return 4.0;
  return 2.5;
}

/**
 * Calculate the total MZ#3 zipper quantity (in PCS) from category variants.
 * H-Bottom is applicable to MZ#3 only.
 * 
 * @param {Array<Object>} variants - Category variants
 * @returns {number} MZ#3 quantity in PCS
 */
function getRelevantMZ3Quantity(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return 0;
  return variants.reduce((sum, v) => {
    const sz = String((v && v.zipperSize) || '').trim();
    if (sz.includes('3')) {
      return sum + Math.max(0, Number(v.quantity) || 0);
    }
    return sum;
  }, 0);
}

/**
 * Calculate the Relevant Zipper Quantity for H-Bottom from category variants.
 * Universal rule: H-Bottom is applicable to ALL zipper categories (CZ, MZ, PZ)
 * when the type is closed-end. Open-ended variants do not receive H-Bottom (0 pcs).
 * 
 * @param {Array<Object>} variants - Group variants
 * @param {string} [category=null] - Category
 * @returns {number} Relevant closed-end quantity in PCS
 */
function getRelevantHBottomQuantity(variants, category = null) {
  if (category) {
    const cat = String(category).toLowerCase().trim();
    if (cat === 'wire') return 0;
  }
  if (!Array.isArray(variants) || variants.length === 0) return 0;
  return variants.reduce((sum, v) => {
    if (!v) return sum;
    const vCat = String(v.zipperCategory || v.category || '').toLowerCase().trim();
    if (vCat === 'wire') return sum;
    const typeStr = String(v.zipperType || v.endType || v.type || v.zipperEndType || '').toLowerCase().trim();
    const isOpen = (typeStr === 'open_end' || typeStr === 'open-end' || typeStr === 'open ended' || typeStr === 'two_way');
    return sum + (!isOpen ? Math.max(0, Number(v.quantity) || 0) : 0);
  }, 0);
}

/**
 * Calculate the Relevant Zipper Quantity for Pin Box from category variants.
 * Exclusive rule: Pin Box is ONLY applicable to Metal Zippers (MZ) and Open-Ended variants.
 * Other categories (CZ, PZ, WIRE) or closed-end variants will not have Pin Box (return 0).
 * 
 * @param {Array<Object>} variants - Group variants
 * @param {string} [category] - Zipper category ('mz', 'cz', 'pz', 'wire', etc.)
 * @returns {number} Relevant quantity in PCS (0 for non-MZ or closed-end)
 */
function getRelevantPinBoxQuantity(variants, category = null) {
  if (category) {
    const cat = String(category).toLowerCase().trim();
    if (cat !== 'mz' && cat !== 'metal') {
      return 0;
    }
  }
  if (!Array.isArray(variants) || variants.length === 0) return 0;
  return variants.reduce((sum, v) => {
    if (!v) return sum;
    const vCat = String(v.zipperCategory || v.category || '').toLowerCase().trim();
    if (vCat && vCat !== 'mz' && vCat !== 'metal') return sum;
    const typeStr = String(v.zipperType || v.endType || v.type || v.zipperEndType || '').toLowerCase().trim();
    const isOpen = (typeStr === 'open_end' || typeStr === 'open-end' || typeStr === 'open ended' || typeStr === 'two_way');
    return sum + (isOpen ? Math.max(0, Number(v.quantity) || 0) : 0);
  }, 0);
}

/**
 * Calculate the existing base (pre-loss) chain consumption for a single variant
 * using exact factory allowances and conversion divisors.
 * 
 * @param {Object} variant 
 * @param {string} category 
 * @param {Object} [groupParams={}] 
 * @returns {number} Base chain meters
 */
function calculateVariantBaseChainMtr(variant, category, groupParams = {}) {
  const cat = String(category || '').toLowerCase().trim();
  const qty = Math.max(0, Number(variant && variant.quantity) || 0);
  const rawLen = Math.max(0, Number(variant && variant.length) || 0);
  const unit = String((variant && variant.lengthUnit) || 'inch').toLowerCase().trim();
  const isCm = (unit === 'cm' || unit === 'centimeter');
  const sizeStr = String((variant && variant.zipperSize) || '').trim();

  let allowance = 0;
  let unitDivisor = isCm ? 100.0 : 39.37;

  if (cat === 'cz' || cat === 'nylon') {
    const is3 = sizeStr.includes('3');
    if (isCm) {
      allowance = (groupParams.cmAllowance !== undefined && groupParams.cmAllowance !== null && !isNaN(groupParams.cmAllowance))
        ? Number(groupParams.cmAllowance)
        : (is3 ? 4.0 : 4.5);
    } else {
      allowance = (groupParams.inchAllowance !== undefined && groupParams.inchAllowance !== null && !isNaN(groupParams.inchAllowance))
        ? Number(groupParams.inchAllowance)
        : ((groupParams.chainAllowance !== undefined && groupParams.chainAllowance !== null && !isNaN(groupParams.chainAllowance))
            ? Number(groupParams.chainAllowance)
            : (is3 ? 1.58 : 1.78));
    }
  } else if (cat === 'mz' || cat === 'metal') {
    const is3 = sizeStr.includes('3');
    if (isCm) {
      allowance = (groupParams.cmAllowance !== undefined && groupParams.cmAllowance !== null && !isNaN(groupParams.cmAllowance))
        ? Number(groupParams.cmAllowance)
        : ((groupParams.chainAllowance !== undefined && groupParams.chainAllowance !== null && !isNaN(groupParams.chainAllowance))
            ? Number(groupParams.chainAllowance)
            : (is3 ? 4.5 : 5.0));
    } else {
      allowance = (groupParams.inchAllowance !== undefined && groupParams.inchAllowance !== null && !isNaN(groupParams.inchAllowance))
        ? Number(groupParams.inchAllowance)
        : ((groupParams.chainAllowance !== undefined && groupParams.chainAllowance !== null && !isNaN(groupParams.chainAllowance))
            ? Number(groupParams.chainAllowance)
            : (is3 ? 1.78 : 1.97));
    }
  } else if (cat === 'pz' || cat === 'plastic') {
    const is8 = sizeStr.includes('8');
    const is3 = sizeStr.includes('3');
    if (isCm) {
      allowance = (groupParams.cmAllowance !== undefined && groupParams.cmAllowance !== null && !isNaN(groupParams.cmAllowance))
        ? Number(groupParams.cmAllowance)
        : (is8 ? 6.3 : (is3 ? 5.0 : 5.0));
    } else {
      allowance = (groupParams.inchAllowance !== undefined && groupParams.inchAllowance !== null && !isNaN(groupParams.inchAllowance))
        ? Number(groupParams.inchAllowance)
        : ((groupParams.chainAllowance !== undefined && groupParams.chainAllowance !== null && !isNaN(groupParams.chainAllowance))
            ? Number(groupParams.chainAllowance)
            : (is8 ? 2.4 : (is3 ? 1.97 : 1.97)));
    }
  } else if (cat === 'wire') {
    const isLong = sizeStr.includes('long');
    if (isLong) {
      allowance = isCm ? 5.0 : 1.97;
    } else {
      allowance = 0;
    }
  }

  return ((rawLen + allowance) * qty) / unitDivisor;
}

/**
 * Consolidate variants belonging to the same class within a category group.
 * Sums base chain meters per class, evaluates dynamic loss brackets, and applies user overrides.
 * 
 * @param {Array<Object>} variants 
 * @param {string} category 
 * @param {Object} [groupParams={}] 
 * @param {Object} [userOverrides={}] 
 * @returns {Object} Map of classKey -> class consolidation summary
 */
function consolidateGroupClasses(variants, category, groupParams = {}, userOverrides = {}) {
  const vars = Array.isArray(variants) ? variants : [];
  const classMap = {};

  vars.forEach(v => {
    const classKey = getVariantZipperClass(v, category);
    if (!classMap[classKey]) {
      classMap[classKey] = {
        classKey: classKey,
        category: category,
        variants: [],
        totalQuantity: 0,
        baseChainMtr: 0,
        isEligible: isClassEligibleForDynamicLoss(classKey)
      };
    }
    const baseMtr = calculateVariantBaseChainMtr(v, category, groupParams);
    classMap[classKey].variants.push({
      ...v,
      baseChainMtr: baseMtr
    });
    classMap[classKey].totalQuantity += Math.max(0, Number(v.quantity) || 0);
    classMap[classKey].baseChainMtr += baseMtr;
  });

  const result = {};
  for (const [classKey, cData] of Object.entries(classMap)) {
    const defaultLoss = cData.isEligible ? getDynamicLossPercentage(classKey, cData.baseChainMtr) : null;
    const czFallbackKey = (classKey.startsWith('CZC') || classKey.startsWith('CZO')) ? ('CZ' + classKey.slice(3)) : (classKey.startsWith('CZ#') ? ('CZC' + classKey.slice(2)) : null);
    const rawOverride = (userOverrides && userOverrides[classKey] !== undefined && userOverrides[classKey] !== null && userOverrides[classKey] !== '')
      ? userOverrides[classKey]
      : ((userOverrides && czFallbackKey && userOverrides[czFallbackKey] !== undefined && userOverrides[czFallbackKey] !== null && userOverrides[czFallbackKey] !== '')
          ? userOverrides[czFallbackKey]
          : undefined);
    const hasOverride = rawOverride !== undefined;
    const overrideVal = hasOverride ? Number(rawOverride) : null;

    let effectiveLoss = null;
    if (hasOverride && !isNaN(overrideVal)) {
      effectiveLoss = overrideVal;
    } else if (defaultLoss !== null && defaultLoss !== undefined) {
      effectiveLoss = defaultLoss;
    }

    result[classKey] = {
      classKey: classKey,
      category: category,
      variantCount: cData.variants.length,
      variants: cData.variants,
      totalQuantity: cData.totalQuantity,
      baseChainMtr: cData.baseChainMtr,
      isEligible: cData.isEligible,
      defaultLossPercent: defaultLoss,
      effectiveLossPercent: effectiveLoss,
      isOverridden: hasOverride && !isNaN(overrideVal),
      overrideVal: hasOverride ? overrideVal : null
    };
  }

  return result;
}

/**
 * Calculate consumption and costs for a single BOM row item of a variant
 * @param {Object} row 
 * @param {Object} variantConfig
 * @returns {Object} Calculated row details
 */
function calculateMaterialRow(row, variantConfig) {
  const qty = Math.max(0, Number(variantConfig.quantity) || 0);
  const zipperLength = Math.max(0, Number(variantConfig.length) || 0);
  const lengthUnit = variantConfig.lengthUnit || 'inch';
  const allowance = Math.max(0, Number(variantConfig.allowance) || 0);
  
  let qtyPerZipper = Math.max(0, Number(row.qtyPerZipper) || 0);

  // If item is length-dependent (e.g. Chain or Tape), compute required length in the material's unit
  if (row.isLengthDependent) {
    const totalLengthPerZipper = Math.max(0, zipperLength + allowance);
    const rowUnit = row.unit || 'yd';
    
    // Check if unit conversion is needed between variant lengthUnit and row material unit
    if (window.UnitConversion && window.UnitConversion.areUnitsCompatible(lengthUnit, rowUnit)) {
      qtyPerZipper = window.UnitConversion.convertLength(totalLengthPerZipper, lengthUnit, rowUnit);
    } else {
      qtyPerZipper = totalLengthPerZipper;
    }
  }

  // Total required quantity for entire variant production volume
  const totalQuantity = qtyPerZipper * qty;
  
  // Unit price and wastage
  const unitPrice = Math.max(0, Number(row.unitPrice) || 0);
  const wastagePercent = Math.max(0, Number(row.wastagePercent) || 0);

  // Cost calculations
  const baseMaterialCost = totalQuantity * unitPrice;
  const wastageCost = baseMaterialCost * (wastagePercent / 100);
  const totalMaterialCost = baseMaterialCost + wastageCost;
  const unitCostPerZipper = qty > 0 ? (totalMaterialCost / qty) : 0;

  return {
    ...row,
    calculatedQtyPerZipper: qtyPerZipper,
    totalQuantity: totalQuantity,
    unitPrice: unitPrice,
    wastagePercent: wastagePercent,
    baseMaterialCost: baseMaterialCost,
    wastageCost: wastageCost,
    totalMaterialCost: totalMaterialCost,
    unitCostPerZipper: unitCostPerZipper
  };
}

/**
 * Calculate totals for the entire BOM material list of a variant
 * @param {Array<Object>} rows 
 * @param {Object} variantConfig 
 * @returns {Object}
 */
function calculateTotalMaterials(rows, variantConfig) {
  const qty = Math.max(0, Number(variantConfig.quantity) || 0);

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      processedRows: [],
      totalBaseMaterialCost: 0,
      totalWastageCost: 0,
      totalMaterialCost: 0,
      materialCostPerZipper: 0
    };
  }

  let totalBaseMaterialCost = 0;
  let totalWastageCost = 0;

  const processedRows = rows.map(row => {
    const calculatedRow = calculateMaterialRow(row, variantConfig);
    totalBaseMaterialCost += calculatedRow.baseMaterialCost;
    totalWastageCost += calculatedRow.wastageCost;
    return calculatedRow;
  });

  const totalMaterialCost = totalBaseMaterialCost + totalWastageCost;
  const materialCostPerZipper = qty > 0 ? (totalMaterialCost / qty) : 0;

  return {
    processedRows,
    totalBaseMaterialCost,
    totalWastageCost,
    totalMaterialCost,
    materialCostPerZipper
  };
}

/**
 * Calculate an individual variant independently
 * @param {Object} variant 
 * @param {string} [category]
 * @returns {Object} Calculated variant result
 */
function calculateVariant(variant, category = 'cz') {
  const variantConfig = {
    id: variant.id,
    name: variant.name || 'Variant',
    zipperCategory: category,
    zipperSize: variant.zipperSize || '#5',
    zipperType: variant.zipperType || 'closed_end',
    length: Math.max(0, Number(variant.length) || 0),
    lengthUnit: variant.lengthUnit || 'inch',
    allowance: Math.max(0, Number(variant.allowance) || 0),
    quantity: Math.max(0, Number(variant.quantity) || 0),
    color: variant.color || '',
    remarks: variant.remarks || ''
  };

  const bomRows = Array.isArray(variant.bomRows) ? variant.bomRows : [];
  const materialsResult = calculateTotalMaterials(bomRows, variantConfig);

  return {
    ...variant,
    config: variantConfig,
    materials: materialsResult,
    quantity: variantConfig.quantity,
    totalMaterialCost: materialsResult.totalMaterialCost,
    materialCostPerZipper: materialsResult.materialCostPerZipper
  };
}

/**
 * Aggregate material requirements across multiple variants
 * Merges identical materials by catalog materialId or component + specification + unit.
 * Sums quantities and costs without double counting.
 * @param {Array<Object>} calculatedVariants 
 * @param {number} totalOrderQuantity 
 * @returns {Object}
 */
function calculateAggregateMaterials(calculatedVariants, totalOrderQuantity) {
  const totalQty = Math.max(0, Number(totalOrderQuantity) || 0);
  const materialMap = new Map();

  let totalBaseMaterialCost = 0;
  let totalWastageCost = 0;

  calculatedVariants.forEach(v => {
    const rows = (v.materials && v.materials.processedRows) ? v.materials.processedRows : [];
    rows.forEach(r => {
      // Identity Key based on true material specification and unit
      const matId = (r.materialId && r.materialId !== 'custom') ? r.materialId.trim().toLowerCase() : null;
      const compKey = (r.component || '').trim().toLowerCase();
      const specKey = (r.materialName || r.specification || '').trim().toLowerCase();
      const unitKey = (r.unit || '').trim().toLowerCase();

      const key = matId 
        ? `mat_${matId}_${unitKey}`
        : `custom_${compKey}_${specKey}_${unitKey}`;

      if (!materialMap.has(key)) {
        materialMap.set(key, {
          key: key,
          component: r.component,
          componentCategory: r.componentCategory || 'other',
          materialId: r.materialId,
          materialName: r.materialName,
          specification: r.specification,
          unit: r.unit,
          unitPrice: r.unitPrice,
          wastagePercent: r.wastagePercent,
          isLengthDependent: Boolean(r.isLengthDependent),
          totalQuantity: 0,
          baseMaterialCost: 0,
          wastageCost: 0,
          totalMaterialCost: 0,
          usedInVariants: [],
          variantIds: [],
          rowIds: [],
          _prices: [],
          _wastages: []
        });
      }

      const entry = materialMap.get(key);
      entry.totalQuantity += (Number(r.totalQuantity) || 0);
      entry.baseMaterialCost += (Number(r.baseMaterialCost) || 0);
      entry.wastageCost += (Number(r.wastageCost) || 0);
      entry.totalMaterialCost += (Number(r.totalMaterialCost) || 0);

      entry._prices.push(Number(r.unitPrice) || 0);
      entry._wastages.push(Number(r.wastagePercent) || 0);

      const varName = v.name || `Variant ${v.id}`;
      if (!entry.usedInVariants.includes(varName)) {
        entry.usedInVariants.push(varName);
      }
      if (v.id && !entry.variantIds.includes(v.id)) {
        entry.variantIds.push(v.id);
      }
      if (r.id && !entry.rowIds.includes(r.id)) {
        entry.rowIds.push(r.id);
      }
    });
  });

  const aggregateRows = Array.from(materialMap.values()).map((item, idx) => {
    totalBaseMaterialCost += item.baseMaterialCost;
    totalWastageCost += item.wastageCost;

    const avgQtyPerZipper = totalQty > 0 ? (item.totalQuantity / totalQty) : 0;
    const costPerZipper = totalQty > 0 ? (item.totalMaterialCost / totalQty) : 0;

    // Determine representative or weighted Unit Price
    const allPricesSame = item._prices.length > 0 && item._prices.every(p => Math.abs(p - item._prices[0]) < 0.0001);
    const finalUnitPrice = allPricesSame 
      ? item._prices[0]
      : (item.totalQuantity > 0 ? (item.baseMaterialCost / item.totalQuantity) : (item._prices[0] || 0));

    // Determine representative or effective Wastage Percentage
    const allWastagesSame = item._wastages.length > 0 && item._wastages.every(w => Math.abs(w - item._wastages[0]) < 0.0001);
    const finalWastagePercent = allWastagesSame
      ? item._wastages[0]
      : (item.baseMaterialCost > 0 ? ((item.wastageCost / item.baseMaterialCost) * 100) : (item._wastages[0] || 0));

    return {
      index: idx + 1,
      key: item.key,
      component: item.component,
      componentCategory: item.componentCategory,
      materialId: item.materialId,
      materialName: item.materialName,
      specification: item.specification,
      unit: item.unit,
      unitPrice: finalUnitPrice,
      wastagePercent: finalWastagePercent,
      isLengthDependent: item.isLengthDependent,
      totalQuantity: item.totalQuantity,
      baseMaterialCost: item.baseMaterialCost,
      wastageCost: item.wastageCost,
      totalMaterialCost: item.totalMaterialCost,
      usedInVariants: item.usedInVariants,
      variantIds: item.variantIds,
      rowIds: item.rowIds,
      avgQtyPerZipper,
      costPerZipper
    };
  });

  const totalMaterialCost = totalBaseMaterialCost + totalWastageCost;
  const materialCostPerZipper = totalQty > 0 ? (totalMaterialCost / totalQty) : 0;

  return {
    processedRows: aggregateRows,
    totalBaseMaterialCost,
    totalWastageCost,
    totalMaterialCost,
    materialCostPerZipper
  };
}

/**
 * Calculate direct labor cost based on selected method
 * @param {Object} laborConfig 
 * @param {number} productionQuantity 
 * @returns {Object}
 */
function calculateLaborCost(laborConfig, productionQuantity) {
  const qty = Math.max(0, Number(productionQuantity) || 0);
  const method = laborConfig ? (laborConfig.method || 'per_zipper') : 'per_zipper';
  
  let totalLaborCost = 0;

  if (method === 'per_zipper') {
    const ratePerZipper = Math.max(0, Number(laborConfig ? laborConfig.ratePerZipper : 0) || 0);
    totalLaborCost = ratePerZipper * qty;
  } else if (method === 'hourly') {
    const workers = Math.max(0, Number(laborConfig ? laborConfig.workers : 0) || 0);
    const hours = Math.max(0, Number(laborConfig ? laborConfig.hours : 0) || 0);
    const hourlyRate = Math.max(0, Number(laborConfig ? laborConfig.hourlyRate : 0) || 0);
    totalLaborCost = workers * hours * hourlyRate;
  }

  const laborCostPerZipper = qty > 0 ? (totalLaborCost / qty) : 0;

  return {
    method,
    totalLaborCost,
    laborCostPerZipper
  };
}

/**
 * Calculate factory overhead cost
 * @param {Object} overheadConfig 
 * @param {number} totalMaterialCost (including wastage)
 * @param {number} totalLaborCost 
 * @param {number} productionQuantity 
 * @returns {Object}
 */
function calculateOverheadCost(overheadConfig, totalMaterialCost, totalLaborCost, productionQuantity) {
  const qty = Math.max(0, Number(productionQuantity) || 0);
  const percentage = Math.max(0, Number(overheadConfig ? overheadConfig.percentage : 0) || 0);
  const basis = overheadConfig ? (overheadConfig.basis || 'material_and_labor') : 'material_and_labor';

  let baseAmount = 0;
  if (basis === 'material_only') {
    baseAmount = totalMaterialCost;
  } else {
    baseAmount = totalMaterialCost + totalLaborCost;
  }

  const totalOverheadCost = baseAmount * (percentage / 100);
  const overheadCostPerZipper = qty > 0 ? (totalOverheadCost / qty) : 0;

  return {
    percentage,
    basis,
    baseAmount,
    totalOverheadCost,
    overheadCostPerZipper
  };
}

/**
 * Calculate additional / other costs
 * @param {Array<Object>} otherCostItems 
 * @param {number} productionQuantity 
 * @returns {Object}
 */
function calculateOtherCosts(otherCostItems, productionQuantity) {
  const qty = Math.max(0, Number(productionQuantity) || 0);
  
  if (!Array.isArray(otherCostItems) || otherCostItems.length === 0) {
    return {
      processedItems: [],
      totalOtherCosts: 0,
      otherCostPerZipper: 0
    };
  }

  let totalOtherCosts = 0;
  const processedItems = otherCostItems.map(item => {
    const amount = Math.max(0, Number(item.amount) || 0);
    const type = item.type || 'total_order'; // 'per_zipper' | 'total_order'
    
    let itemTotal = 0;
    if (type === 'per_zipper') {
      itemTotal = amount * qty;
    } else {
      itemTotal = amount;
    }

    totalOtherCosts += itemTotal;

    return {
      ...item,
      amount,
      type,
      totalAmount: itemTotal,
      perZipperAmount: qty > 0 ? (itemTotal / qty) : 0
    };
  });

  const otherCostPerZipper = qty > 0 ? (totalOtherCosts / qty) : 0;

  return {
    processedItems,
    totalOtherCosts,
    otherCostPerZipper
  };
}

/**
 * Master calculation function - calculates entire multi-variant estimate and all breakdowns
 * Supports both multi-variant arrays and legacy single-product estimate objects seamlessly.
 * @param {Object} estimateState
 * @returns {Object} Complete calculated estimate
 */
/**
 * Generate a unique grouping key for identical item types and units.
 * Items of the same category, size/variantKey, and lengthUnit are grouped together.
 * Different length units (e.g. inch vs cm) produce separate keys.
 * 
 * @param {Object} item 
 * @returns {string} Group key e.g. "cz_5__inch", "mz_3__cm"
 */
function getItemTypeGroupKey(item) {
  if (!item) return 'default__inch';
  const cat = String(item.category || 'cz').toLowerCase().trim();
  const sz = String(item.zipperSize || (cat === 'wire' ? '#5_normal' : '#5')).toLowerCase().trim();
  const unit = String(item.lengthUnit || 'inch').toLowerCase().trim();
  
  let baseKey = '';
  if (item.variantKey) {
    baseKey = String(item.variantKey).toLowerCase().trim();
  } else if (cat === 'wire') {
    if (sz.includes('3')) baseKey = 'wire_3';
    else if (sz.includes('long')) baseKey = 'wire_5_long';
    else baseKey = 'wire_5_normal';
  } else {
    const cleanSz = sz.replace(/[^0-9]/g, '') || '5';
    baseKey = `${cat}_${cleanSz}`;
  }

  return `${baseKey}__${unit}`;
}

/**
 * Generate a descriptive display title for an item type group including its unit.
 * e.g. "CZ#5 (Inch)", "MZ#3 (cm)"
 * 
 * @param {string} cat 
 * @param {string} sz 
 * @param {string} unit 
 * @param {string} [variantKey] 
 * @returns {string}
 */
function getGroupDisplayName(cat, sz, unit, variantKey) {
  let displayName = '';
  if (variantKey && typeof getVariantDef === 'function') {
    const vDef = getVariantDef(variantKey);
    if (vDef) displayName = vDef.displayName;
  }
  if (!displayName) {
    if (cat === 'wire') {
      if (sz.includes('3')) displayName = 'WIRE#3';
      else if (sz.includes('long')) displayName = 'WIRE#5 Long Teeth';
      else displayName = 'WIRE#5 Normal Teeth';
    } else {
      const cleanSz = sz.startsWith('#') ? sz : ('#' + sz);
      displayName = `${cat.toUpperCase()}${cleanSz}`;
    }
  }
  const unitLabel = (unit === 'cm' || unit === 'centimeter') ? 'cm' : 'Inch';
  return `${displayName} (${unitLabel})`;
}

/**
 * Master calculation function - calculates independent Category Groups and Merged BOM
 * Supports:
 * 1. Multiple independent category groups (ESTIMATE -> Category Groups -> Variants)
 * 2. Multiple instances of the same category (with unique internal IDs e.g. categoryGroup_1, categoryGroup_2)
 * 3. Factory engines for CZ, MZ, and WIRE
 * 4. Merged BOM combining genuinely compatible materials
 * 5. Category-specific calculation details
 * 
 * @param {Object} estimateState
 * @returns {Object} Complete calculated estimate
 */
function calculateFullEstimate(estimateState) {
  const laborConfig = estimateState.labor || {};
  const overheadConfig = estimateState.overhead || {};
  const otherCosts = estimateState.otherCosts || [];

  // Normalize category groups / items from state
  // Groups same type of items together into a single BoM calculation group.
  // Items with different length units (inch vs cm) are grouped separately.
  let rawGroups = [];
  if (Array.isArray(estimateState.items) && estimateState.items.length > 0) {
    const groupMap = new Map();

    estimateState.items.forEach((item, idx) => {
      const cat = String(item.category || 'cz').toLowerCase().trim();
      const sz = String(item.zipperSize || (cat === 'wire' ? '#5_normal' : '#5')).toLowerCase().trim();
      const unit = String(item.lengthUnit || 'inch').toLowerCase().trim();
      const groupKey = getItemTypeGroupKey(item);

      if (!groupMap.has(groupKey)) {
        const groupName = getGroupDisplayName(cat, sz, unit, item.variantKey);
        groupMap.set(groupKey, {
          id: `group_${groupKey}`,
          key: groupKey,
          name: groupName,
          category: cat,
          zipperSize: item.zipperSize || (cat === 'wire' ? '#5_normal' : '#5'),
          lengthUnit: unit,
          styleName: item.styleName || '',
          color: item.color || '',
          remarks: item.remarks || '',
          lossPercent: item.lossPercent !== undefined ? Number(item.lossPercent) : (cat === 'wire' ? (sz === '#3' ? 4.0 : 5.0) : 3.0),
          classLossOverrides: {},
          sliderAdditionPercent: item.sliderAdditionPercent,
          sliderAddPercent: item.sliderAddPercent,
          isSliderOverridden: false,
          pinBoxLossPercent: item.pinBoxLossPercent,
          isPinBoxLossOverridden: false,
          pinBoxPerZipper: item.pinBoxPerZipper !== undefined ? Number(item.pinBoxPerZipper) : 1,
          hBottomLossPercent: item.hBottomLossPercent,
          isHBottomLossOverridden: false,
          isSpecialUTopOrder: false,
          czParams: {},
          mzParams: {},
          wireParams: {},
          pzParams: {},
          items: [],
          variants: []
        });
      }

      const grp = groupMap.get(groupKey);
      grp.items.push(item);

      // Merge overrides and parameters
      if (item.classLossOverrides) {
        Object.assign(grp.classLossOverrides, item.classLossOverrides);
      }
      if (item.isSliderOverridden) {
        grp.isSliderOverridden = true;
        if (item.sliderAdditionPercent !== undefined && item.sliderAdditionPercent !== null) {
          grp.sliderAdditionPercent = item.sliderAdditionPercent;
          grp.sliderAddPercent = item.sliderAdditionPercent;
        }
      }
      if (item.isPinBoxLossOverridden) {
        grp.isPinBoxLossOverridden = true;
        if (item.pinBoxLossPercent !== undefined && item.pinBoxLossPercent !== null) {
          grp.pinBoxLossPercent = item.pinBoxLossPercent;
        }
      }
      if (item.isHBottomLossOverridden) {
        grp.isHBottomLossOverridden = true;
        if (item.hBottomLossPercent !== undefined && item.hBottomLossPercent !== null) {
          grp.hBottomLossPercent = item.hBottomLossPercent;
        }
      }
      if (item.isUTopLossOverridden) {
        grp.isUTopLossOverridden = true;
        if (item.uTopLossPercent !== undefined && item.uTopLossPercent !== null) {
          grp.uTopLossPercent = item.uTopLossPercent;
        }
      }
      if (item.isSpecialUTopOrder || (item.czParams && item.czParams.isSpecialUTopOrder) || (item.mzParams && item.mzParams.isSpecialUTopOrder) || (item.pzParams && item.pzParams.isSpecialUTopOrder)) {
        grp.isSpecialUTopOrder = true;
      }
      if (item.czParams) Object.assign(grp.czParams, item.czParams);
      if (item.mzParams) Object.assign(grp.mzParams, item.mzParams);
      if (item.wireParams) Object.assign(grp.wireParams, item.wireParams);
      if (item.pzParams) Object.assign(grp.pzParams, item.pzParams);

      grp.variants.push({
        id: item.id || `item_${idx + 1}`,
        itemId: item.id,
        name: item.displayName || item.name || `Item ${idx + 1}`,
        zipperSize: item.zipperSize || grp.zipperSize,
        zipperType: item.zipperType || 'closed_end',
        length: item.length !== undefined && item.length !== null ? item.length : 0,
        lengthUnit: item.lengthUnit || grp.lengthUnit,
        allowance: item.allowance !== undefined ? item.allowance : 0,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : 0,
        color: item.color || '',
        remarks: item.remarks || '',
        bomRows: item.bomRows || []
      });
    });

    rawGroups = Array.from(groupMap.values());
  } else if (Array.isArray(estimateState.categoryGroups) && estimateState.categoryGroups.length > 0) {
    rawGroups = estimateState.categoryGroups;
  } else {
    // Backward compatibility with single-category estimate
    let legacyVariants = [];
    if (Array.isArray(estimateState.variants) && estimateState.variants.length > 0) {
      legacyVariants = estimateState.variants;
    } else if (estimateState.product) {
      legacyVariants = [{
        id: 'var_1',
        name: 'Variant 1',
        zipperSize: estimateState.product.zipperSize || '#5',
        zipperType: estimateState.product.zipperType || 'closed_end',
        length: estimateState.product.length || 20,
        lengthUnit: estimateState.product.lengthUnit || 'inch',
        allowance: estimateState.product.allowance || 0.75,
        quantity: estimateState.product.quantity || 1000,
        color: estimateState.product.color || '',
        remarks: estimateState.product.remarks || '',
        bomRows: estimateState.bomRows || []
      }];
    }

    rawGroups = [{
      id: 'categoryGroup_1',
      name: 'Category Group 1',
      category: estimateState.category || 'cz',
      styleName: estimateState.styleName || '',
      color: estimateState.color || '',
      remarks: estimateState.remarks || '',
      lossPercent: estimateState.lossPercent !== undefined ? Number(estimateState.lossPercent) : 3.0,
      variants: legacyVariants
    }];
  }

  // Load available formula engines
  const czEngine = (typeof window !== 'undefined' && window.CZFormulaEngine) ? window.CZFormulaEngine : 
                   (typeof require !== 'undefined' ? (function() { try { return require('./formulas/cz.js'); } catch(e) { return null; } })() : null);

  const mzEngine = (typeof window !== 'undefined' && window.MZFormulaEngine) ? window.MZFormulaEngine : 
                   (typeof require !== 'undefined' ? (function() { try { return require('./formulas/mz.js'); } catch(e) { return null; } })() : null);

  const wireEngine = (typeof window !== 'undefined' && window.WireFormulaEngine) ? window.WireFormulaEngine : 
                     (typeof require !== 'undefined' ? (function() { try { return require('./formulas/wire.js'); } catch(e) { return null; } })() : null);

  const pzEngine = (typeof window !== 'undefined' && window.PZFormulaEngine) ? window.PZFormulaEngine : 
                   (typeof require !== 'undefined' ? (function() { try { return require('./formulas/pz.js'); } catch(e) { return null; } })() : null);

  // 1. Calculate each Category Group completely independently
  const calculatedGroups = [];
  let totalOrderQty = 0;
  const allGroupBOMRows = [];

  rawGroups.forEach((group, gIdx) => {
    const groupId = group.id || `categoryGroup_${gIdx + 1}`;
    const groupCategory = String(group.category || '').toLowerCase().trim();
    const groupLossPercent = group.lossPercent !== undefined ? Number(group.lossPercent) : 3.0;
    const variants = Array.isArray(group.variants) ? group.variants : [];

    // Class-based consolidation & dynamic loss percentage evaluation
    const groupParams = group.czParams || group.mzParams || group.pzParams || group.wireParams || {};
    const classConsolidation = consolidateGroupClasses(variants, groupCategory, groupParams, group.classLossOverrides);
    const classLossPercentages = {};
    for (const [cKey, cInfo] of Object.entries(classConsolidation)) {
      if (cInfo.effectiveLossPercent !== null && cInfo.effectiveLossPercent !== undefined) {
        classLossPercentages[cKey] = cInfo.effectiveLossPercent;
      }
    }

    // Evaluate group zipper quantity, Pin Box multiplier, and dynamic Slider/Pin Box loss
    const groupTotalZipperQty = variants.reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
    const pinBoxPerZipper = group.pinBoxPerZipper !== undefined ? Number(group.pinBoxPerZipper) : 1;
    const isSliderOverridden = Boolean(group.isSliderOverridden);
    let effectiveSliderPercent = null;
    const currentSliderVal = (group.sliderAdditionPercent !== undefined && group.sliderAdditionPercent !== null)
      ? group.sliderAdditionPercent
      : (group.sliderAddPercent !== undefined && group.sliderAddPercent !== null ? group.sliderAddPercent : null);

    if (isSliderOverridden && currentSliderVal !== null) {
      effectiveSliderPercent = Number(currentSliderVal);
    } else {
      effectiveSliderPercent = getSliderDynamicLossPercentage(groupTotalZipperQty);
      group.sliderAdditionPercent = effectiveSliderPercent;
      group.sliderAddPercent = effectiveSliderPercent;
    }

    const isMz = (groupCategory === 'mz' || groupCategory === 'metal');
    const relevantPinBoxQty = isMz ? getRelevantPinBoxQuantity(variants, groupCategory) : 0;
    const isPinBoxLossOverridden = Boolean(group.isPinBoxLossOverridden);
    let effectivePinBoxLossPercent = null;
    if (isMz && relevantPinBoxQty > 0) {
      if (isPinBoxLossOverridden && group.pinBoxLossPercent !== undefined && group.pinBoxLossPercent !== null) {
        effectivePinBoxLossPercent = Number(group.pinBoxLossPercent);
      } else if (group.pinBoxLossPercent !== undefined && group.pinBoxLossPercent !== null && group.isPinBoxLossOverridden) {
        effectivePinBoxLossPercent = Number(group.pinBoxLossPercent);
      } else {
        effectivePinBoxLossPercent = getPinBoxDynamicLossPercentage(groupTotalZipperQty);
        group.pinBoxLossPercent = effectivePinBoxLossPercent;
      }
    }

    const isZipperCategory = (groupCategory === 'cz' || groupCategory === 'mz' || groupCategory === 'pz' || groupCategory === 'nylon' || groupCategory === 'metal' || groupCategory === 'plastic');
    const relevantClosedEndQty = isZipperCategory ? getRelevantHBottomQuantity(variants, groupCategory) : 0;
    const isHBottomLossOverridden = Boolean(group.isHBottomLossOverridden);
    let effectiveHBottomLossPercent = null;
    const currentHBottomLoss = (group.czParams && group.czParams.hBottomLossPercent !== undefined && group.czParams.hBottomLossPercent !== null)
      ? Number(group.czParams.hBottomLossPercent)
      : ((group.mzParams && group.mzParams.hBottomLossPercent !== undefined && group.mzParams.hBottomLossPercent !== null)
        ? Number(group.mzParams.hBottomLossPercent)
        : ((group.pzParams && group.pzParams.hBottomLossPercent !== undefined && group.pzParams.hBottomLossPercent !== null)
          ? Number(group.pzParams.hBottomLossPercent)
          : (group.hBottomLossPercent !== undefined && group.hBottomLossPercent !== null ? Number(group.hBottomLossPercent) : null)));

    if (isZipperCategory && relevantClosedEndQty > 0) {
      if (isHBottomLossOverridden && currentHBottomLoss !== null) {
        effectiveHBottomLossPercent = currentHBottomLoss;
      } else if (currentHBottomLoss !== null && group.isHBottomLossOverridden) {
        effectiveHBottomLossPercent = currentHBottomLoss;
      } else {
        effectiveHBottomLossPercent = getHBottomDynamicLossPercentage(groupTotalZipperQty);
        group.hBottomLossPercent = effectiveHBottomLossPercent;
      }
    }

    const isUTopLossOverridden = Boolean(group.isUTopLossOverridden);
    let effectiveUTopLossPercent = null;
    const currentUTopLoss = (group.czParams && group.czParams.uTopLossPercent !== undefined && group.czParams.uTopLossPercent !== null)
      ? Number(group.czParams.uTopLossPercent)
      : ((group.mzParams && group.mzParams.uTopLossPercent !== undefined && group.mzParams.uTopLossPercent !== null)
        ? Number(group.mzParams.uTopLossPercent)
        : ((group.pzParams && group.pzParams.uTopLossPercent !== undefined && group.pzParams.uTopLossPercent !== null)
          ? Number(group.pzParams.uTopLossPercent)
          : (group.uTopLossPercent !== undefined && group.uTopLossPercent !== null ? Number(group.uTopLossPercent) : null)));

    if (isZipperCategory && groupTotalZipperQty > 0) {
      if (isUTopLossOverridden && currentUTopLoss !== null) {
        effectiveUTopLossPercent = currentUTopLoss;
      } else if (currentUTopLoss !== null && group.isUTopLossOverridden) {
        effectiveUTopLossPercent = currentUTopLoss;
      } else if (group.uTopLossPercent !== undefined && group.uTopLossPercent !== null) {
        effectiveUTopLossPercent = Number(group.uTopLossPercent);
      } else {
        effectiveUTopLossPercent = getUTopDynamicLossPercentage(groupTotalZipperQty);
      }
      group.uTopLossPercent = effectiveUTopLossPercent;
    }

    let groupResult = null;

    const isSpecialUTopOrder = Boolean(group.isSpecialUTopOrder || (group.czParams && group.czParams.isSpecialUTopOrder) || (group.mzParams && group.mzParams.isSpecialUTopOrder) || (group.pzParams && group.pzParams.isSpecialUTopOrder));

    if (groupCategory === 'cz' || groupCategory === 'nylon') {
      if (czEngine) {
        groupResult = czEngine.calculateCZMaster(variants, {
          lossPercent: groupLossPercent,
          classLossPercentages: classLossPercentages,
          sliderAdditionPercent: effectiveSliderPercent,
          pinBoxLossPercent: effectivePinBoxLossPercent,
          hBottomLossPercent: effectiveHBottomLossPercent,
          relevantHBottomQuantity: relevantClosedEndQty,
          isSpecialUTopOrder: isSpecialUTopOrder,
          uTopLossPercent: effectiveUTopLossPercent,
          overallTotalQuantity: groupTotalZipperQty,
          czParams: {
            ...(group.czParams || {}),
            hBottomLossPercent: effectiveHBottomLossPercent,
            uTopLossPercent: effectiveUTopLossPercent,
            isSpecialUTopOrder: isSpecialUTopOrder
          },
          priceOverrides: estimateState.priceOverrides || {}
        });
      }
    } else if (groupCategory === 'mz' || groupCategory === 'metal') {
      if (mzEngine) {
        groupResult = mzEngine.calculateMZMaster(variants, {
          lossPercent: groupLossPercent,
          classLossPercentages: classLossPercentages,
          sliderAdditionPercent: effectiveSliderPercent,
          pinBoxLossPercent: effectivePinBoxLossPercent,
          pinBoxPerZipper: relevantPinBoxQty > 0 ? pinBoxPerZipper : 0,
          relevantPinBoxQuantity: relevantPinBoxQty,
          hBottomLossPercent: effectiveHBottomLossPercent,
          relevantHBottomQuantity: relevantClosedEndQty,
          isSpecialUTopOrder: isSpecialUTopOrder,
          uTopLossPercent: effectiveUTopLossPercent,
          overallTotalQuantity: groupTotalZipperQty,
          mzParams: {
            ...(group.mzParams || {}),
            hBottomLossPercent: effectiveHBottomLossPercent,
            uTopLossPercent: effectiveUTopLossPercent,
            isSpecialUTopOrder: isSpecialUTopOrder
          },
          priceOverrides: estimateState.priceOverrides || {}
        });
      }
    } else if (groupCategory === 'wire') {
      if (wireEngine) {
        groupResult = wireEngine.calculateWireMaster(variants, {
          lossPercent: groupLossPercent,
          classLossPercentages: classLossPercentages,
          wireParams: group.wireParams || {},
          priceOverrides: estimateState.priceOverrides || {}
        });
      }
    } else if (groupCategory === 'pz' || groupCategory === 'plastic') {
      if (pzEngine) {
        groupResult = pzEngine.calculatePZMaster(variants, {
          lossPercent: groupLossPercent,
          classLossPercentages: classLossPercentages,
          sliderAdditionPercent: effectiveSliderPercent,
          hBottomLossPercent: effectiveHBottomLossPercent,
          relevantHBottomQuantity: relevantClosedEndQty,
          isSpecialUTopOrder: isSpecialUTopOrder,
          uTopLossPercent: effectiveUTopLossPercent,
          overallTotalQuantity: groupTotalZipperQty,
          pzParams: {
            ...(group.pzParams || {}),
            hBottomLossPercent: effectiveHBottomLossPercent,
            uTopLossPercent: effectiveUTopLossPercent,
            isSpecialUTopOrder: isSpecialUTopOrder
          },
          priceOverrides: estimateState.priceOverrides || {}
        });
      }
    }

    // Generic fallback if no specific engine matched or group had no specific category selected
    if (!groupResult && variants.length > 0) {
      const calcVariants = variants.map(v => calculateVariant(v, groupCategory));
      const groupQty = calcVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
      const aggMats = calculateAggregateMaterials(calcVariants, groupQty);

      groupResult = {
        category: groupCategory || 'other',
        totalQuantity: groupQty,
        primaryResult: {
          variantBreakdowns: calcVariants.map(v => ({
            variantId: v.id,
            name: v.name,
            rawLength: v.length,
            unit: v.lengthUnit,
            quantity: v.quantity,
            chainConsumptionMtr: 0,
            formulaString: `${v.length} ${v.lengthUnit} × ${v.quantity} pcs`
          }))
        },
        formulaDetails: {
          category: groupCategory,
          totalQuantity: groupQty,
          steps: [
            {
              title: `Step 1 — Variant Volumes & Quantities`,
              explanation: `Configured variant quantities and length matrix:`,
              variants: calcVariants.map(v => ({
                label: `${v.name} (${v.length} ${v.lengthUnit})`,
                formula: `${(v.quantity || 0).toLocaleString()} pcs`,
                result: `${(v.quantity || 0).toLocaleString()} pcs`
              })),
              subtotalLabel: 'Total Quantity',
              subtotalValue: `${groupQty.toLocaleString()} pcs`
            }
          ]
        },
        materials: aggMats
      };
    }


    if (groupResult) {
      totalOrderQty += (groupResult.totalQuantity || 0);

      // Attach group context to BOM rows for merged BOM tagging
      const groupRows = (groupResult.materials && Array.isArray(groupResult.materials.processedRows)) 
        ? groupResult.materials.processedRows 
        : [];

      groupRows.forEach(row => {
        allGroupBOMRows.push({
          ...row,
          groupId: groupId,
          groupName: group.name || `Category Group ${gIdx + 1}`,
          groupCategory: groupCategory,
          groupStyleName: group.styleName || '',
          sourceGroupId: groupId,
          sourceGroupName: group.name || `Category Group ${gIdx + 1}`,
          sourceCategory: groupCategory
        });
      });

      calculatedGroups.push({
        id: groupId,
        key: group.key || null,
        name: group.name || `Category Group ${gIdx + 1}`,
        category: groupCategory,
        zipperSize: group.zipperSize || (variants[0] && variants[0].zipperSize) || '#5',
        lengthUnit: group.lengthUnit || (variants[0] && variants[0].lengthUnit) || 'inch',
        styleName: group.styleName || '',
        color: group.color || '',
        remarks: group.remarks || '',
        lossPercent: groupLossPercent,
        classLossOverrides: group.classLossOverrides || {},
        classConsolidation: classConsolidation,
        classLossPercentages: classLossPercentages,
        sliderAdditionPercent: effectiveSliderPercent,
        sliderAddPercent: effectiveSliderPercent,
        isSliderOverridden: isSliderOverridden,
        pinBoxLossPercent: (isMz && relevantPinBoxQty > 0) ? effectivePinBoxLossPercent : null,
        isPinBoxLossOverridden: (isMz && relevantPinBoxQty > 0) ? isPinBoxLossOverridden : false,
        pinBoxPerZipper: (isMz && relevantPinBoxQty > 0) ? pinBoxPerZipper : 0,
        hBottomLossPercent: (isZipperCategory && relevantClosedEndQty > 0) ? effectiveHBottomLossPercent : null,
        isHBottomLossOverridden: (isZipperCategory && relevantClosedEndQty > 0) ? isHBottomLossOverridden : false,
        relevantHBottomQuantity: relevantClosedEndQty,
        isSpecialUTopOrder: isSpecialUTopOrder,
        czParams: group.czParams || {},
        mzParams: group.mzParams || {},
        wireParams: group.wireParams || {},
        pzParams: group.pzParams || {},
        variants: variants,
        calculation: groupResult,
        totalQuantity: groupResult.totalQuantity || 0,
        materials: groupResult.materials,
        formulaDetails: groupResult.formulaDetails
      });
    } else {
      // Empty group without calculated output
      calculatedGroups.push({
        id: groupId,
        key: group.key || null,
        name: group.name || `Category Group ${gIdx + 1}`,
        category: groupCategory,
        zipperSize: group.zipperSize || (variants[0] && variants[0].zipperSize) || '#5',
        lengthUnit: group.lengthUnit || (variants[0] && variants[0].lengthUnit) || 'inch',
        styleName: group.styleName || '',
        color: group.color || '',
        remarks: group.remarks || '',
        lossPercent: groupLossPercent,
        classLossOverrides: group.classLossOverrides || {},
        classConsolidation: classConsolidation,
        classLossPercentages: classLossPercentages,
        sliderAdditionPercent: effectiveSliderPercent,
        sliderAddPercent: effectiveSliderPercent,
        isSliderOverridden: isSliderOverridden,
        pinBoxLossPercent: (isMz && relevantPinBoxQty > 0) ? effectivePinBoxLossPercent : null,
        isPinBoxLossOverridden: (isMz && relevantPinBoxQty > 0) ? isPinBoxLossOverridden : false,
        pinBoxPerZipper: (isMz && relevantPinBoxQty > 0) ? pinBoxPerZipper : 0,
        hBottomLossPercent: (isZipperCategory && relevantClosedEndQty > 0) ? effectiveHBottomLossPercent : null,
        isHBottomLossOverridden: (isZipperCategory && relevantClosedEndQty > 0) ? isHBottomLossOverridden : false,
        relevantHBottomQuantity: relevantClosedEndQty,
        isSpecialUTopOrder: isSpecialUTopOrder,
        czParams: group.czParams || {},
        mzParams: group.mzParams || {},
        wireParams: group.wireParams || {},
        pzParams: group.pzParams || {},
        variants: variants,
        calculation: null,
        totalQuantity: 0,
        materials: { processedRows: [], totalBaseMaterialCost: 0, totalWastageCost: 0, totalMaterialCost: 0 },
        formulaDetails: { category: groupCategory, totalQuantity: 0, steps: [] }
      });
    }
  });

  // 2. MERGED BOM ENGINE: Combine genuinely compatible materials across groups
  const mergedBOM = buildMergedBOM(allGroupBOMRows, totalOrderQty);

  // 3. Calculate Labor Cost on total order quantity
  const laborResult = calculateLaborCost(laborConfig, totalOrderQty);

  // 4. Calculate Overhead Cost on total materials + labor
  const overheadResult = calculateOverheadCost(
    overheadConfig,
    mergedBOM.totalMaterialCost,
    laborResult.totalLaborCost,
    totalOrderQty
  );

  // 5. Calculate Other Additional Costs
  const otherCostsResult = calculateOtherCosts(otherCosts, totalOrderQty);

  // 6. Grand Totals
  const totalBaseMaterialCost = mergedBOM.totalBaseMaterialCost;
  const totalWastageCost = mergedBOM.totalWastageCost;
  const totalMaterialCost = mergedBOM.totalMaterialCost;
  const totalLaborCost = laborResult.totalLaborCost;
  const totalOverheadCost = overheadResult.totalOverheadCost;
  const totalOtherCosts = otherCostsResult.totalOtherCosts;

  const totalEstimatedCost = totalMaterialCost + totalLaborCost + totalOverheadCost + totalOtherCosts;
  const costPerZipper = totalOrderQty > 0 ? (totalEstimatedCost / totalOrderQty) : 0;

  // Percentage Breakdown
  const materialSharePct = totalEstimatedCost > 0 ? (totalBaseMaterialCost / totalEstimatedCost) * 100 : 0;
  const wastageSharePct = totalEstimatedCost > 0 ? (totalWastageCost / totalEstimatedCost) * 100 : 0;
  const laborSharePct = totalEstimatedCost > 0 ? (totalLaborCost / totalEstimatedCost) * 100 : 0;
  const overheadSharePct = totalEstimatedCost > 0 ? (totalOverheadCost / totalEstimatedCost) * 100 : 0;
  const otherSharePct = totalEstimatedCost > 0 ? (totalOtherCosts / totalEstimatedCost) * 100 : 0;

  // Set default active calculation details group (first calculated group with data, or first group)
  const defaultActiveGroup = calculatedGroups.find(g => g.calculation && g.totalQuantity > 0) || calculatedGroups[0];

  return {
    items: estimateState.items ? estimateState.items.map(it => {
      const g = calculatedGroups.find(grp => grp.variants && grp.variants.some(v => v.id === it.id || v.itemId === it.id)) || calculatedGroups[0];
      return {
        ...it,
        groupId: g ? g.id : null,
        calculation: g ? g.calculation : null,
        materials: g ? g.materials : null
      };
    }) : calculatedGroups,
    categoryGroups: calculatedGroups,
    activeItemId: defaultActiveGroup ? defaultActiveGroup.id : null,
    activeGroupId: defaultActiveGroup ? defaultActiveGroup.id : null,
    // Group-specific aliases for backwards compatibility with single group views
    formulaDetails: defaultActiveGroup ? defaultActiveGroup.formulaDetails : null,
    czCalculationDetails: (defaultActiveGroup && defaultActiveGroup.calculation) ? defaultActiveGroup.calculation.primaryResult : null,
    variants: defaultActiveGroup ? defaultActiveGroup.variants : [],
    // Master Merged BOM
    aggregatedMaterials: mergedBOM,
    materials: mergedBOM,
    labor: laborResult,
    overhead: overheadResult,
    otherCosts: otherCostsResult,
    totals: {
      quantity: totalOrderQty,
      groupCount: calculatedGroups.length,
      totalBaseMaterialCost,
      totalWastageCost,
      totalMaterialCost,
      totalLaborCost,
      totalOverheadCost,
      totalOtherCosts,
      totalEstimatedCost,
      costPerZipper,
      perZipper: {
        baseMaterial: totalOrderQty > 0 ? (totalBaseMaterialCost / totalOrderQty) : 0,
        wastage: totalOrderQty > 0 ? (totalWastageCost / totalOrderQty) : 0,
        materialTotal: totalOrderQty > 0 ? (totalMaterialCost / totalOrderQty) : 0,
        labor: laborResult.laborCostPerZipper,
        overhead: overheadResult.overheadCostPerZipper,
        other: otherCostsResult.otherCostPerZipper,
        total: costPerZipper
      },
      shares: {
        material: materialSharePct,
        wastage: wastageSharePct,
        labor: laborSharePct,
        overhead: overheadSharePct,
        other: otherSharePct
      }
    }
  };
}

/**
 * Build true merged BOM across all Category Groups.
 * Combines quantities only when materials are genuinely identical (materialId or component+spec+unit).
 * Preserves distinct materials across different categories.
 * 
 * @param {Array<Object>} allRows 
 * @param {number} totalOrderQuantity 
 * @returns {Object}
 */
function buildMergedBOM(allRows, totalOrderQuantity) {
  const totalQty = Math.max(0, Number(totalOrderQuantity) || 0);
  const materialMap = new Map();

  let totalBaseMaterialCost = 0;
  let totalWastageCost = 0;

  allRows.forEach(r => {
    // Identity key ensures genuine compatibility
    const matId = (r.materialId && r.materialId !== 'custom') ? r.materialId.trim().toLowerCase() : null;
    const compKey = (r.component || '').trim().toLowerCase();
    const specKey = (r.materialName || r.specification || '').trim().toLowerCase();
    const unitKey = (r.unit || '').trim().toLowerCase();
    const catKey = (r.groupCategory || '').trim().toLowerCase();

    const isCustom = Boolean(r.materialId === 'custom' || r.isCustom);

    // Common / Universal items across all zipper categories
    // 1. U-Top stop
    const isUTop = compKey === 'u-top' || compKey === 'utop' || 
                   (matId && matId.includes('utop')) || 
                   specKey.includes('u-top');

    // 2. H-Bottom stop
    const isHBottom = compKey === 'h-bottom' || compKey === 'hbottom' || 
                      (matId && matId.includes('h_bottom')) || 
                      specKey.includes('h-bottom');

    let key;
    if (isUTop) {
      key = `common_utop_${unitKey || 'pcs'}`;
    } else if (isHBottom) {
      key = `common_h_bottom_${unitKey || 'pcs'}`;
    } else if (isCustom) {
      key = `custom_${compKey}_${unitKey}`;
    } else {
      // Category-specific materials (Tapes, Sliders, Forming Wires, Resins, Tollilon, Chains, Pin & Box, Stop Wires in KG)
      const isCategorySpecific = (
        compKey.includes('tape') || (matId && matId.includes('tape')) ||
        compKey.includes('slider') || (matId && matId.includes('slider')) ||
        compKey.includes('wire') || (matId && matId.includes('wire')) ||
        compKey.includes('teeth') || (matId && matId.includes('teeth')) ||
        compKey.includes('resin') || (matId && matId.includes('resin')) ||
        compKey.includes('pom') ||
        compKey.includes('tollilon') || (matId && matId.includes('tollilon')) ||
        compKey.includes('chain') || (matId && matId.includes('chain')) ||
        compKey.includes('pin') || (matId && matId.includes('pin')) ||
        compKey.includes('t/s') || (matId && matId.includes('_ts_')) ||
        compKey.includes('b/s') || (matId && matId.includes('_bs_'))
      );

      if (isCategorySpecific) {
        key = matId 
          ? `mat_${matId}_${unitKey}`
          : `cat_${catKey}_comp_${compKey}_spec_${specKey}_${unitKey}`;
      } else {
        // Generic / common item across categories
        key = `common_comp_${compKey}_spec_${specKey}_${unitKey}`;
      }
    }

    if (!materialMap.has(key)) {
      materialMap.set(key, {
        key: key,
        component: r.component,
        componentCategory: r.componentCategory || (isUTop || isHBottom ? 'stop' : 'other'),
        materialId: r.materialId,
        materialName: r.materialName,
        specification: r.specification,
        unit: r.unit,
        unitPrice: r.unitPrice,
        wastagePercent: r.wastagePercent,
        totalQuantity: 0,
        baseMaterialCost: 0,
        wastageCost: 0,
        totalMaterialCost: 0,
        usedInGroups: [],
        usedInCategories: [],
        groupNames: [],
        _prices: [],
        _wastages: [],
        _materialIds: [],
        _materialNames: [],
        _specifications: [],
        _sizes: [],
        formulaNotes: [],
        contributingSources: [],
        isUTop,
        isHBottom
      });
    }

    const entry = materialMap.get(key);
    entry.totalQuantity += (Number(r.totalQuantity) || 0);
    entry.baseMaterialCost += (Number(r.baseMaterialCost) || 0);
    entry.wastageCost += (Number(r.wastageCost) || 0);
    entry.totalMaterialCost += (Number(r.totalMaterialCost) || 0);

    entry._prices.push(Number(r.unitPrice) || 0);
    entry._wastages.push(Number(r.wastagePercent) || 0);

    if (r.materialId && !entry._materialIds.includes(r.materialId)) {
      entry._materialIds.push(r.materialId);
    }
    if (r.materialName && !entry._materialNames.includes(r.materialName)) {
      entry._materialNames.push(r.materialName);
    }
    if (r.specification && !entry._specifications.includes(r.specification)) {
      entry._specifications.push(r.specification);
    }

    // Extract size from materialName, specification, materialId, or calculationDetail
    const rawSearchStr = `${r.materialName || ''} ${r.specification || ''} ${r.materialId || ''} ${(r.calculationDetail && r.calculationDetail.size) || ''}`;
    const sizeMatch = rawSearchStr.match(/#[0-9]+/);
    if (sizeMatch && !entry._sizes.includes(sizeMatch[0])) {
      entry._sizes.push(sizeMatch[0]);
    }

    const groupLabel = r.groupName || r.groupId || 'Group';
    if (!entry.groupNames.includes(groupLabel)) {
      entry.groupNames.push(groupLabel);
    }
    if (r.groupId && !entry.usedInGroups.includes(r.groupId)) {
      entry.usedInGroups.push(r.groupId);
    }
    if (r.groupCategory && !entry.usedInCategories.includes(r.groupCategory.toUpperCase())) {
      entry.usedInCategories.push(r.groupCategory.toUpperCase());
    }
    if (r.formulaNote && !entry.formulaNotes.includes(r.formulaNote)) {
      entry.formulaNotes.push(r.formulaNote);
    }

    entry.contributingSources.push({
      groupId: r.groupId,
      groupName: r.groupName || r.groupId || 'Category Group',
      groupCategory: r.groupCategory || 'cz',
      groupStyleName: r.groupStyleName || '',
      quantity: Number(r.totalQuantity) || 0,
      unit: r.unit,
      calculationDetail: r.calculationDetail || null
    });
  });

  const mergedRows = Array.from(materialMap.values()).map((item, idx) => {
    totalBaseMaterialCost += item.baseMaterialCost;
    totalWastageCost += item.wastageCost;

    const avgQtyPerZipper = totalQty > 0 ? (item.totalQuantity / totalQty) : 0;
    const costPerZipper = totalQty > 0 ? (item.totalMaterialCost / totalQty) : 0;

    // Weighted unit price
    const allPricesSame = item._prices.length > 0 && item._prices.every(p => Math.abs(p - item._prices[0]) < 0.0001);
    const finalUnitPrice = allPricesSame
      ? item._prices[0]
      : (item.totalQuantity > 0 ? (item.baseMaterialCost / item.totalQuantity) : (item._prices[0] || 0));

    // Weighted wastage percent
    const allWastagesSame = item._wastages.length > 0 && item._wastages.every(w => Math.abs(w - item._wastages[0]) < 0.0001);
    const finalWastagePercent = allWastagesSame
      ? (item._wastages[0] || 0)
      : (item.baseMaterialCost > 0 ? (item.wastageCost / item.baseMaterialCost) * 100 : (item._wastages[0] || 0));

    let finalComponent = item.component;
    let finalMaterialName = item.materialName;
    let finalSpecification = item.specification;
    let finalMaterialId = item.materialId;

    const isMultiCategory = item.usedInCategories.length > 1;
    const isMultiSource = item.contributingSources.length > 1;

    if (item.isUTop) {
      finalComponent = 'U-TOP';
      if (isMultiCategory) {
        finalMaterialId = 'mat_common_utop';
        if (item._sizes.length === 1) {
          finalMaterialName = `U-Top Stop (${item._sizes[0]})`;
        } else if (item._sizes.length > 1) {
          finalMaterialName = `U-Top Stop (${item._sizes.join(', ')})`;
        } else {
          finalMaterialName = 'U-Top Stop';
        }

        const allSpecial = item.contributingSources.every(s => s.calculationDetail && s.calculationDetail.isSpecialOrder);
        const allNormal = item.contributingSources.every(s => s.calculationDetail && s.calculationDetail.isSpecialOrder === false);
        if (allSpecial) {
          finalSpecification = 'U-Top Stop (Special Order: 1 pc/zipper)';
        } else if (allNormal) {
          finalSpecification = 'U-Top Stop (2 pcs/zipper)';
        } else {
          finalSpecification = 'Universal U-Top Stop across zipper categories';
        }
      } else {
        // Single category
        finalMaterialId = item._materialIds[0] || item.materialId;
        if (isMultiSource) {
          if (item._sizes.length === 1) {
            finalMaterialName = `U-Top (${item.usedInCategories[0]}${item._sizes[0]})`;
          } else {
            finalMaterialName = `U-Top (${item.usedInCategories[0]})`;
          }
        }
      }
    } else if (item.isHBottom) {
      finalComponent = 'H-BOTTOM';
      if (isMultiCategory) {
        finalMaterialId = 'mat_common_h_bottom';
        if (item._sizes.length === 1) {
          finalMaterialName = `H-Bottom Stop (${item._sizes[0]})`;
        } else if (item._sizes.length > 1) {
          finalMaterialName = `H-Bottom Stop (${item._sizes.join(', ')})`;
        } else {
          finalMaterialName = 'H-Bottom Stop';
        }
        finalSpecification = 'Universal H-Bottom Stop (Closed-End)';
      } else {
        // Single category
        finalMaterialId = item._materialIds[0] || item.materialId;
        if (isMultiSource) {
          if (item._sizes.length === 1) {
            finalMaterialName = `H-Bottom Stop (${item.usedInCategories[0]}${item._sizes[0]})`;
          } else {
            finalMaterialName = `H-Bottom Stop (${item.usedInCategories[0]})`;
          }
        }
      }
    } else if (isMultiCategory && isMultiSource) {
      finalMaterialId = item._materialIds.length === 1 ? item._materialIds[0] : (item.materialId || `mat_common_${idx + 1}`);
      if (item._materialNames.length === 1) {
        finalMaterialName = item._materialNames[0];
      }
    }

    // Consolidated calculation detail
    let consolidatedCalcDetail = null;
    if (item.contributingSources.length === 1 && item.contributingSources[0].calculationDetail) {
      consolidatedCalcDetail = item.contributingSources[0].calculationDetail;
    } else if (item.contributingSources.length > 1) {
      const allSteps = item.contributingSources.flatMap(s => (s.calculationDetail && s.calculationDetail.steps) || []);
      const sourcesFormula = item.contributingSources.map((s, i) => 
        `Source ${i + 1} [${s.groupName || 'Group'} (${(s.groupCategory || '').toUpperCase()})]: ${(Number(s.quantity) || 0).toLocaleString('en-US')} ${item.unit}`
      ).join(' +\n');

      consolidatedCalcDetail = {
        materialName: finalMaterialName,
        component: finalComponent,
        unit: item.unit,
        displayUnit: item.unit,
        isMerged: true,
        sourcesCount: item.contributingSources.length,
        baseFormula: `Consolidated Requirement across ${item.contributingSources.length} Category Groups:\n${sourcesFormula}\n= ${(Number(item.totalQuantity) || 0).toLocaleString('en-US')} ${item.unit} Total Merged BOM Requirement`,
        steps: allSteps
      };
    }

    return {
      index: idx + 1,
      id: item.key,
      key: item.key,
      component: finalComponent,
      componentCategory: item.componentCategory,
      materialId: finalMaterialId,
      materialIds: item._materialIds,
      materialName: finalMaterialName,
      specification: finalSpecification,
      unit: item.unit,
      unitPrice: finalUnitPrice,
      wastagePercent: finalWastagePercent,
      totalQuantity: item.totalQuantity,
      baseMaterialCost: item.baseMaterialCost,
      wastageCost: item.wastageCost,
      totalMaterialCost: item.totalMaterialCost,
      usedInGroups: item.usedInGroups,
      groupNames: item.groupNames,
      usedInCategories: item.usedInCategories,
      contributingSources: item.contributingSources,
      calculationDetail: consolidatedCalcDetail,
      avgQtyPerZipper,
      costPerZipper,
      formulaNote: item.formulaNotes.join('; ')
    };
  });


  const totalMaterialCost = totalBaseMaterialCost + totalWastageCost;
  const materialCostPerZipper = totalQty > 0 ? (totalMaterialCost / totalQty) : 0;

  return {
    processedRows: mergedRows,
    totalBaseMaterialCost,
    totalWastageCost,
    totalMaterialCost,
    materialCostPerZipper
  };
}

/**
 * Factory standard static parameters for each item variant and unit
 * @param {string} variantKey e.g. 'cz_5', 'cz_3', 'mz_3', 'mz_5', 'wire_3', 'wire_5_normal', 'wire_5_long', 'pz_3', 'pz_5', 'pz_8'
 * @param {string} [lengthUnit='inch'] 'inch' | 'cm'
 * @returns {Object}
 */
function getStandardStaticParameters(variantKey, lengthUnit = 'inch') {
  const vKey = String(variantKey || 'cz_5').toLowerCase().trim();
  const unit = (String(lengthUnit || 'inch').toLowerCase().trim() === 'cm') ? 'cm' : 'inch';
  const isCm = unit === 'cm';

  // 1. Nylon Zipper CZ
  if (vKey === 'cz_3') {
    return {
      chainAllowance: isCm ? 4.0 : 1.58,
      tapeDivisor: 87.0,
      topStopFactor: 0.02,
      bottomStopFactor: 0.03,
      resinDivisor: 1000,
      tollilon1Divisor: 14400,
      tollilon2Divisor: 9500,
      isSpecialUTopOrder: false
    };
  }
  if (vKey === 'cz_5' || vKey === 'cz') {
    return {
      chainAllowance: isCm ? 4.5 : 1.78,
      tapeDivisor: 54.5,
      topStopFactor: 0.04,
      bottomStopFactor: 0.04,
      resinDivisor: 900,
      tollilon1Divisor: 7700,
      tollilon2Divisor: 8600,
      isSpecialUTopOrder: false
    };
  }

  // 2. Metal Zipper MZ
  if (vKey === 'mz_3') {
    return {
      chainAllowance: isCm ? 4.5 : 1.78,
      tapeDivisor: 97.0,
      teethWireDivisor: 32.0,
      teethWireLossFactor: 1.04,
      topStopFactor: 0.22,
      topStopDivisor: 1000,
      isSpecialUTopOrder: false
    };
  }
  if (vKey === 'mz_5' || vKey === 'mz') {
    return {
      chainAllowance: isCm ? 5.0 : 1.97,
      tapeDivisor: 71.0,
      topStopFactor: 0.32,
      topStopDivisor: 1000,
      bottomStopFactor: 0.172,
      bottomStopDivisor: 1000,
      isSpecialUTopOrder: false
    };
  }

  // 3. Brass / Metal Wire
  if (vKey === 'wire_3') {
    return {
      inchWireDivisor: 32.0,
      cmWireDivisor: 27.73
    };
  }
  if (vKey === 'wire_5_long') {
    return {
      wireAllowance: isCm ? 5.0 : 1.97,
      wireDivisor: 20.6
    };
  }
  if (vKey === 'wire_5_normal' || vKey === 'wire') {
    return {
      wireDivisor: 20.6
    };
  }

  // 4. Plastic Zipper PZ
  if (vKey === 'pz_3') {
    return {
      chainAllowance: isCm ? 5.0 : 1.97,
      tapeDivisor: 101.0,
      tapeAdditionalPercent: 2.5,
      tapeFactor: 8.15,
      isSpecialUTopOrder: false
    };
  }
  if (vKey === 'pz_5' || vKey === 'pz') {
    return {
      chainAllowance: isCm ? 5.0 : 1.97,
      tapeDivisor: 81.0,
      tapeAdditionalPercent: 2.5,
      tapeFactor: 13.07,
      isSpecialUTopOrder: false
    };
  }
  if (vKey === 'pz_8') {
    return {
      chainAllowance: isCm ? 6.3 : 2.4,
      tapeDivisor: 57.0,
      tapeAdditionalPercent: 2.5,
      tapeFactor: 26.23,
      isSpecialUTopOrder: false
    };
  }

  return {};
}

/**
 * Extract active static parameters from an item or group based on its variant and unit
 * @param {Object} item 
 * @returns {Object}
 */
function getItemStaticParameters(item) {
  if (!item) return {};
  const cat = String(item.category || '').toLowerCase().trim();
  const vKey = item.variantKey || ((cat === 'wire') ? ((item.zipperSize && item.zipperSize.includes('3')) ? 'wire_3' : ((item.zipperSize && item.zipperSize.includes('long')) ? 'wire_5_long' : 'wire_5_normal')) : (item.zipperSize ? `${cat}_${String(item.zipperSize).replace(/[^0-9]/g, '')}` : cat));
  const unit = (String(item.lengthUnit || 'inch').toLowerCase().trim() === 'cm') ? 'cm' : 'inch';
  const std = getStandardStaticParameters(vKey, unit);
  const result = {};

  const paramBag = (cat === 'cz') ? (item.czParams || {})
                 : (cat === 'mz') ? (item.mzParams || {})
                 : (cat === 'wire') ? (item.wireParams || {})
                 : (cat === 'pz') ? (item.pzParams || {})
                 : {};

  Object.keys(std).forEach(key => {
    if (key === 'isSpecialUTopOrder') {
      result[key] = Boolean(item.isSpecialUTopOrder || paramBag.isSpecialUTopOrder);
    } else if (paramBag[key] !== undefined && paramBag[key] !== null && paramBag[key] !== '') {
      result[key] = Number(paramBag[key]);
    } else if ((key === 'chainAllowance' || key === 'wireAllowance') && item.allowance !== undefined && item.allowance !== null && item.allowance !== '') {
      result[key] = Number(item.allowance);
    } else {
      result[key] = std[key];
    }
  });

  return result;
}

/**
 * Compare current static parameters against standard baseline.
 * Returns true if ANY static parameter has been modified.
 * @param {string} variantKey 
 * @param {string} lengthUnit 
 * @param {Object} currentParams 
 * @returns {boolean}
 */
function isStaticParametersModified(variantKey, lengthUnit = 'inch', currentParams = {}) {
  const std = getStandardStaticParameters(variantKey, lengthUnit);
  for (const key of Object.keys(std)) {
    if (currentParams[key] === undefined || currentParams[key] === null) continue;
    if (typeof std[key] === 'boolean') {
      if (Boolean(currentParams[key]) !== Boolean(std[key])) return true;
    } else {
      const curNum = Number(currentParams[key]);
      const stdNum = Number(std[key]);
      if (isNaN(curNum) || isNaN(stdNum)) continue;
      if (Math.abs(curNum - stdNum) > 0.0001) return true;
    }
  }
  return false;
}

// Export for global access in Vanilla JS and Node.js
if (typeof window !== 'undefined') {
  window.CalculatorEngine = {
    formatBDT,
    formatQuantity,
    getMaterialDisplayDecimals,
    formatBOMQuantity,
    isSliderRow,
    calculateMaterialRow,
    calculateTotalMaterials,
    calculateVariant,
    calculateAggregateMaterials,
    calculateLaborCost,
    calculateOverheadCost,
    calculateOtherCosts,
    calculateFullEstimate,
    buildMergedBOM,
    getVariantZipperClass,
    isClassEligibleForDynamicLoss,
    getDynamicLossPercentage,
    getSliderDynamicLossPercentage,
    getSliderDynamicAddPercentage: getSliderDynamicLossPercentage,
    getPinBoxDynamicLossPercentage,
    getHBottomDynamicLossPercentage,
    getUTopDynamicLossPercentage,
    getRelevantPinBoxQuantity,
    getRelevantHBottomQuantity,
    getRelevantMZ3Quantity,
    calculateVariantBaseChainMtr,
    consolidateGroupClasses,
    getItemTypeGroupKey,
    getGroupDisplayName,
    getStandardStaticParameters,
    getItemStaticParameters,
    isStaticParametersModified
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatBDT,
    formatQuantity,
    getMaterialDisplayDecimals,
    formatBOMQuantity,
    isSliderRow,
    calculateMaterialRow,
    calculateTotalMaterials,
    calculateVariant,
    calculateAggregateMaterials,
    calculateLaborCost,
    calculateOverheadCost,
    calculateOtherCosts,
    calculateFullEstimate,
    buildMergedBOM,
    getVariantZipperClass,
    isClassEligibleForDynamicLoss,
    getDynamicLossPercentage,
    getSliderDynamicLossPercentage,
    getSliderDynamicAddPercentage: getSliderDynamicLossPercentage,
    getPinBoxDynamicLossPercentage,
    getHBottomDynamicLossPercentage,
    getUTopDynamicLossPercentage,
    getRelevantPinBoxQuantity,
    getRelevantHBottomQuantity,
    getRelevantMZ3Quantity,
    calculateVariantBaseChainMtr,
    consolidateGroupClasses,
    getItemTypeGroupKey,
    getGroupDisplayName,
    getStandardStaticParameters,
    getItemStaticParameters,
    isStaticParametersModified
  };
}


