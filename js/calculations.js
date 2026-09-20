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

  // 3. Piece/Pcs count (e.g. Sliders)
  if (unit === 'pcs' || unit === 'pc') {
    if (Number.isInteger(val)) return 0;
    return 2; // Keep 2 decimal places for fractional slider additions
  }

  // 4. PZ Tape-Wise resin (Excel uses 4 decimals, e.g. 20.7727 KG)
  if (matId.includes('tape_wise') || matId.includes('tape_resin') || comp.includes('tape wise') || name.includes('tape wise')) {
    return 4;
  }

  // 5. PZO and PZC molded element resin (Excel uses 3 decimals, e.g. 5.923 KG, 3.863 KG)
  if (
    matId.includes('pzo') || matId.includes('pzc') ||
    comp.startsWith('pzo') || comp.startsWith('pzc') ||
    name.startsWith('pzo') || name.startsWith('pzc')
  ) {
    return 3;
  }

  // 6. Chain Consumption / Required Chain Length (unit: Mtr) -> nearest whole number in BOM display (0 decimals)
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

  // 7. Standard Tape KG, Stop Wire KG, Teeth Wire KG, Element Resin KG -> 2 decimals in Excel
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

  // Normalize category groups from state
  let rawGroups = [];
  if (Array.isArray(estimateState.categoryGroups) && estimateState.categoryGroups.length > 0) {
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

    let groupResult = null;

    if (groupCategory === 'cz' || groupCategory === 'nylon') {
      if (czEngine) {
        groupResult = czEngine.calculateCZMaster(variants, {
          lossPercent: groupLossPercent,
          sliderAdditionPercent: group.sliderAdditionPercent,
          czParams: group.czParams || {},
          priceOverrides: estimateState.priceOverrides || {}
        });
      }
    } else if (groupCategory === 'mz' || groupCategory === 'metal') {
      if (mzEngine) {
        groupResult = mzEngine.calculateMZMaster(variants, {
          lossPercent: groupLossPercent,
          sliderAdditionPercent: group.sliderAdditionPercent,
          mzParams: group.mzParams || {},
          priceOverrides: estimateState.priceOverrides || {}
        });
      }
    } else if (groupCategory === 'wire') {
      if (wireEngine) {
        groupResult = wireEngine.calculateWireMaster(variants, {
          lossPercent: groupLossPercent,
          wireParams: group.wireParams || {},
          priceOverrides: estimateState.priceOverrides || {}
        });
      }
    } else if (groupCategory === 'pz' || groupCategory === 'plastic') {
      if (pzEngine) {
        groupResult = pzEngine.calculatePZMaster(variants, {
          lossPercent: groupLossPercent,
          sliderAdditionPercent: group.sliderAdditionPercent,
          pzParams: group.pzParams || {},
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
        name: group.name || `Category Group ${gIdx + 1}`,
        category: groupCategory,
        styleName: group.styleName || '',
        color: group.color || '',
        remarks: group.remarks || '',
        lossPercent: groupLossPercent,
        sliderAdditionPercent: group.sliderAdditionPercent,
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
        name: group.name || `Category Group ${gIdx + 1}`,
        category: groupCategory,
        styleName: group.styleName || '',
        color: group.color || '',
        remarks: group.remarks || '',
        lossPercent: groupLossPercent,
        sliderAdditionPercent: group.sliderAdditionPercent,
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
    categoryGroups: calculatedGroups,
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
    // Identity key ensures genuine compatibility: materialId or component + specification + unit
    const matId = (r.materialId && r.materialId !== 'custom') ? r.materialId.trim().toLowerCase() : null;
    const compKey = (r.component || '').trim().toLowerCase();
    const specKey = (r.materialName || r.specification || '').trim().toLowerCase();
    const unitKey = (r.unit || '').trim().toLowerCase();
    const catKey = (r.groupCategory || '').trim().toLowerCase();

    // Key preserves category distinction unless material is truly generic/universal
    const key = matId 
      ? `mat_${matId}_${unitKey}`
      : `cat_${catKey}_comp_${compKey}_spec_${specKey}_${unitKey}`;

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
        totalQuantity: 0,
        baseMaterialCost: 0,
        wastageCost: 0,
        totalMaterialCost: 0,
        usedInGroups: [],
        usedInCategories: [],
        groupNames: [],
        _prices: [],
        _wastages: [],
        formulaNotes: [],
        contributingSources: []
      });
    }

    const entry = materialMap.get(key);
    entry.totalQuantity += (Number(r.totalQuantity) || 0);
    entry.baseMaterialCost += (Number(r.baseMaterialCost) || 0);
    entry.wastageCost += (Number(r.wastageCost) || 0);
    entry.totalMaterialCost += (Number(r.totalMaterialCost) || 0);

    entry._prices.push(Number(r.unitPrice) || 0);
    entry._wastages.push(Number(r.wastagePercent) || 0);

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
      wastagePercent: item._wastages[0] || 0,
      totalQuantity: item.totalQuantity,
      baseMaterialCost: item.baseMaterialCost,
      wastageCost: item.wastageCost,
      totalMaterialCost: item.totalMaterialCost,
      usedInGroups: item.usedInGroups,
      groupNames: item.groupNames,
      usedInCategories: item.usedInCategories,
      contributingSources: item.contributingSources,
      calculationDetail: (item.contributingSources.length === 1 && item.contributingSources[0].calculationDetail)
        ? item.contributingSources[0].calculationDetail
        : null,
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

// Export for global access in Vanilla JS and Node.js
if (typeof window !== 'undefined') {
  window.CalculatorEngine = {
    formatBDT,
    formatQuantity,
    getMaterialDisplayDecimals,
    formatBOMQuantity,
    calculateMaterialRow,
    calculateTotalMaterials,
    calculateVariant,
    calculateAggregateMaterials,
    calculateLaborCost,
    calculateOverheadCost,
    calculateOtherCosts,
    calculateFullEstimate,
    buildMergedBOM
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatBDT,
    formatQuantity,
    getMaterialDisplayDecimals,
    formatBOMQuantity,
    calculateMaterialRow,
    calculateTotalMaterials,
    calculateVariant,
    calculateAggregateMaterials,
    calculateLaborCost,
    calculateOverheadCost,
    calculateOtherCosts,
    calculateFullEstimate,
    buildMergedBOM
  };
}


