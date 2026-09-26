/**
 * Storage Manager for Zipper BOM Calculator
 * Handles localStorage persistence, snapshot history, multi-variant normalization,
 * duplicate, delete, and JSON export/import.
 */

const STORAGE_KEY = 'zipper_bom_estimates_v2';

/**
 * Determine dynamic Slider Add % default from updated factory chart based on zipper pcs
 * @param {number} qty
 * @returns {number}
 */
function getStorageSliderDefault(qty) {
  if (typeof window !== 'undefined' && window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage)) {
    return (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage)(qty);
  }
  const q = Math.max(0, Number(qty) || 0);
  if (q <= 500) return 8.0;
  if (q <= 2000) return 4.0;
  if (q <= 5000) return 2.5;
  return 1.5;
}

/**
 * Generate sample multi-variant default preset estimates to showcase the application
 * @returns {Array<Object>}
 */
function getDefaultPresetEstimates() {
  const czVariant1BOM = window.BOMRules ? window.BOMRules.generateSuggestedBOM({
    zipperType: 'closed_end',
    zipperSize: '#5',
    length: 20,
    lengthUnit: 'inch',
    allowance: 0.75,
    quantity: 1000
  }, 'cz') : [];

  const czVariant2BOM = window.BOMRules ? window.BOMRules.generateSuggestedBOM({
    zipperType: 'open_end',
    zipperSize: '#5',
    length: 26,
    lengthUnit: 'inch',
    allowance: 1.0,
    quantity: 2500
  }, 'cz') : [];

  const mzVariant1BOM = window.BOMRules ? window.BOMRules.generateSuggestedBOM({
    zipperType: 'closed_end',
    zipperSize: '#5',
    length: 7,
    lengthUnit: 'inch',
    allowance: 0.75,
    quantity: 3000
  }, 'mz') : [];

  const mzVariant2BOM = window.BOMRules ? window.BOMRules.generateSuggestedBOM({
    zipperType: 'closed_end',
    zipperSize: '#5',
    length: 9,
    lengthUnit: 'inch',
    allowance: 0.75,
    quantity: 2000
  }, 'mz') : [];

  return [
    {
      id: 'est_preset_jacket_nylon_cz',
      name: 'Men Winter Jacket - Nylon Zipper (CZ)',
      reference: 'ORD-2026-0812',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      category: 'cz',
      styleName: 'Arctic Puffer Jacket',
      color: 'Navy Blue #019',
      remarks: 'Export quality jacket zipper with anti-freeze slider & smooth glide monofilament coil',
      variants: [
        {
          id: 'var_cz_1',
          name: 'Variant 1 (Pocket)',
          zipperSize: '#5',
          zipperType: 'closed_end',
          length: 20,
          lengthUnit: 'inch',
          allowance: 0.75,
          quantity: 1000,
          color: 'Navy Blue #019',
          remarks: 'Pocket closure',
          bomRows: czVariant1BOM
        },
        {
          id: 'var_cz_2',
          name: 'Variant 2 (Front Center)',
          zipperSize: '#5',
          zipperType: 'open_end',
          length: 26,
          lengthUnit: 'inch',
          allowance: 1.0,
          quantity: 2500,
          color: 'Navy Blue #019',
          remarks: 'Front main zipper',
          bomRows: czVariant2BOM
        }
      ],
      labor: {
        method: 'per_zipper',
        ratePerZipper: 2.00,
        workers: 8,
        hours: 10,
        hourlyRate: 80
      },
      overhead: {
        percentage: 10.0,
        basis: 'material_and_labor'
      },
      otherCosts: [
        { id: 'cost_p1', name: 'Inspection & QC Testing', type: 'per_zipper', amount: 0.30 },
        { id: 'cost_p2', name: 'Factory Export Carton Packaging', type: 'total_order', amount: 800 }
      ]
    },
    {
      id: 'est_preset_denim_metal_mz',
      name: 'Denim Jeans Fly - Metal Zipper (MZ)',
      reference: 'ORD-2026-0794',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      category: 'mz',
      styleName: 'Slim Fit Denim Jeans 5-Pocket',
      color: 'Antique Brass / Gold Teeth',
      remarks: 'Washed denim fly zipper, acid-resistant coating, solid brass U-Top stop',
      variants: [
        {
          id: 'var_mz_1',
          name: 'Variant 1 (Regular)',
          zipperSize: '#5',
          zipperType: 'closed_end',
          length: 7,
          lengthUnit: 'inch',
          allowance: 0.75,
          quantity: 3000,
          color: 'Antique Brass',
          remarks: 'Sizes 28-34',
          bomRows: mzVariant1BOM
        },
        {
          id: 'var_mz_2',
          name: 'Variant 2 (Long Rise)',
          zipperSize: '#5',
          zipperType: 'closed_end',
          length: 9,
          lengthUnit: 'inch',
          allowance: 0.75,
          quantity: 2000,
          color: 'Antique Brass',
          remarks: 'Sizes 36-44',
          bomRows: mzVariant2BOM
        }
      ],
      labor: {
        method: 'per_zipper',
        ratePerZipper: 1.50,
        workers: 6,
        hours: 8,
        hourlyRate: 75
      },
      overhead: {
        percentage: 8.0,
        basis: 'material_and_labor'
      },
      otherCosts: [
        { id: 'cost_d1', name: 'Anti-Rust Dipping Coating', type: 'per_zipper', amount: 0.45 }
      ]
    }
  ];
}

/**
 * Normalize an estimate object to ensure full multi-variant structure and factory terminology
 * @param {Object} est 
 * @returns {Object} Normalized estimate
 */
function normalizeEstimate(est) {
  if (!est || typeof est !== 'object') return null;

  const normalized = { ...est };

  // Category Groups Normalization
  if (!Array.isArray(normalized.categoryGroups) || normalized.categoryGroups.length === 0) {
    let legacyCat = normalized.category || 'cz';
    if (!normalized.category && normalized.product && normalized.product.zipperCategory) {
      legacyCat = (normalized.product.zipperCategory === 'metal') ? 'mz' : (normalized.product.zipperCategory === 'plastic') ? 'pz' : 'cz';
    }

    let legacyVariants = [];
    if (Array.isArray(normalized.variants) && normalized.variants.length > 0) {
      legacyVariants = normalized.variants;
    } else {
      const p = normalized.product || {};
      legacyVariants = [{
        id: 'var_1',
        name: 'Variant 1',
        zipperSize: p.zipperSize || '#5',
        zipperType: p.zipperType || 'closed_end',
        length: p.length !== undefined ? p.length : '',
        lengthUnit: p.lengthUnit || 'inch',
        quantity: p.quantity !== undefined ? p.quantity : '',
        color: p.color || '',
        remarks: p.remarks || '',
        bomRows: Array.isArray(normalized.bomRows) ? normalized.bomRows : []
      }];
    }

    const legacyZipperQty = legacyVariants.reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
    const legacySliderOverridden = Boolean(normalized.isSliderOverridden);
    const currentLegacySlider = (normalized.sliderAdditionPercent !== undefined && normalized.sliderAdditionPercent !== null)
      ? normalized.sliderAdditionPercent
      : normalized.sliderAddPercent;
    const legacySliderAddVal = legacySliderOverridden && currentLegacySlider !== undefined && currentLegacySlider !== null
      ? Number(currentLegacySlider)
      : getStorageSliderDefault(legacyZipperQty);

    normalized.categoryGroups = [{
      id: 'categoryGroup_1',
      name: 'Category Group 1',
      category: legacyCat,
      styleName: normalized.styleName || (normalized.product ? normalized.product.styleName : ''),
      color: normalized.color || '',
      remarks: normalized.remarks || '',
      lossPercent: normalized.lossPercent !== undefined ? Number(normalized.lossPercent) : 3.0,
      sliderAdditionPercent: legacySliderAddVal,
      sliderAddPercent: legacySliderAddVal,
      isSliderOverridden: legacySliderOverridden,
      pinBoxPerZipper: normalized.pinBoxPerZipper !== undefined ? Number(normalized.pinBoxPerZipper) : 1,
      isSpecialUTopOrder: Boolean(normalized.isSpecialUTopOrder || (normalized.czParams && normalized.czParams.isSpecialUTopOrder)),
      variants: legacyVariants
    }];
  } else {
    // Validate each group in categoryGroups
    normalized.categoryGroups = normalized.categoryGroups.map((g, idx) => {
      const groupVariants = Array.isArray(g.variants) && g.variants.length > 0 ? g.variants : [{
        id: `var_${Date.now()}_1`,
        name: 'Variant 1',
        zipperSize: '#5',
        zipperType: 'closed_end',
        length: '',
        lengthUnit: 'inch',
        quantity: '',
        color: '',
        remarks: '',
        bomRows: []
      }];

      const groupZipperQty = groupVariants.reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
      const isSliderOverridden = Boolean(g.isSliderOverridden);
      const currentSliderVal = (g.sliderAdditionPercent !== undefined && g.sliderAdditionPercent !== null)
        ? g.sliderAdditionPercent
        : g.sliderAddPercent;
      const sliderAddVal = isSliderOverridden && currentSliderVal !== undefined && currentSliderVal !== null
        ? Number(currentSliderVal)
        : getStorageSliderDefault(groupZipperQty);

      return {
        id: g.id || `categoryGroup_${idx + 1}`,
        name: g.name || `Category Group ${idx + 1}`,
        category: g.category || '',
        styleName: g.styleName || '',
        color: g.color || '',
        remarks: g.remarks || '',
        lossPercent: g.lossPercent !== undefined ? Number(g.lossPercent) : (g.category === 'wire' ? 4.0 : 3.0),
        sliderAdditionPercent: sliderAddVal,
        sliderAddPercent: sliderAddVal,
        isSliderOverridden: isSliderOverridden,
        pinBoxLossPercent: g.pinBoxLossPercent !== undefined ? Number(g.pinBoxLossPercent) : 4.0,
        isPinBoxLossOverridden: Boolean(g.isPinBoxLossOverridden),
        pinBoxPerZipper: 1,
        hBottomLossPercent: g.hBottomLossPercent !== undefined ? Number(g.hBottomLossPercent) : undefined,
        isHBottomLossOverridden: Boolean(g.isHBottomLossOverridden),
        isSpecialUTopOrder: Boolean(g.isSpecialUTopOrder || (g.czParams && g.czParams.isSpecialUTopOrder)),
        czParams: (g.czParams && typeof g.czParams === 'object') ? g.czParams : {},
        mzParams: (g.mzParams && typeof g.mzParams === 'object') ? g.mzParams : {},
        wireParams: (g.wireParams && typeof g.wireParams === 'object') ? g.wireParams : {},
        pzParams: (g.pzParams && typeof g.pzParams === 'object') ? g.pzParams : {},
        variants: groupVariants
      };
    });
  }

  if (!normalized.priceOverrides || typeof normalized.priceOverrides !== 'object') {
    normalized.priceOverrides = {};
  }

  if (!normalized.labor) {
    normalized.labor = { method: 'per_zipper', ratePerZipper: '', workers: '', hours: '', hourlyRate: '' };
  }

  if (!normalized.overhead) {
    normalized.overhead = { percentage: '', basis: 'material_and_labor' };
  }

  if (!Array.isArray(normalized.otherCosts)) {
    normalized.otherCosts = [];
  }

  return normalized;
}


/**
 * Retrieve all saved estimates from localStorage
 * @returns {Array<Object>}
 */
function getAllSavedEstimates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initialization with demo presets
      const defaults = getDefaultPresetEstimates();
      saveAllEstimates(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeEstimate).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.error('Error reading saved estimates from localStorage:', err);
    return [];
  }
}

/**
 * Save all estimates array to localStorage
 * @param {Array<Object>} estimates 
 */
function saveAllEstimates(estimates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates));
    return true;
  } catch (err) {
    console.error('Error saving estimates to localStorage:', err);
    return false;
  }
}

/**
 * Save or update a single estimate snapshot
 * @param {Object} estimate - Full snapshot object
 * @returns {Object} Saved estimate with ID
 */
function saveEstimate(estimate) {
  const estimates = getAllSavedEstimates();
  const now = new Date().toISOString();
  
  let target = normalizeEstimate(JSON.parse(JSON.stringify(estimate)));

  if (!target.id) {
    target.id = 'est_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    target.createdAt = now;
  }
  target.updatedAt = now;

  // Re-calculate full snapshot to guarantee historical accuracy
  if (window.CalculatorEngine) {
    const fullCalculation = window.CalculatorEngine.calculateFullEstimate(target);
    target.calculationSnapshot = {
      totalOrderQuantity: fullCalculation.totals.quantity,
      variantCount: fullCalculation.totals.variantCount,
      totalBaseMaterialCost: fullCalculation.totals.totalBaseMaterialCost,
      totalWastageCost: fullCalculation.totals.totalWastageCost,
      totalMaterialCost: fullCalculation.totals.totalMaterialCost,
      totalLaborCost: fullCalculation.totals.totalLaborCost,
      totalOverheadCost: fullCalculation.totals.totalOverheadCost,
      totalOtherCosts: fullCalculation.totals.totalOtherCosts,
      totalEstimatedCost: fullCalculation.totals.totalEstimatedCost,
      costPerZipper: fullCalculation.totals.costPerZipper
    };
  }

  const existingIdx = estimates.findIndex(e => e.id === target.id);
  if (existingIdx >= 0) {
    estimates[existingIdx] = target;
  } else {
    estimates.unshift(target); // Add new to top
  }

  saveAllEstimates(estimates);
  return target;
}

/**
 * Retrieve a single estimate by ID
 * @param {string} id 
 * @returns {Object|null}
 */
function getEstimateById(id) {
  const estimates = getAllSavedEstimates();
  return estimates.find(e => e.id === id) || null;
}

/**
 * Duplicate an existing saved estimate
 * @param {string} id 
 * @returns {Object|null}
 */
function duplicateEstimate(id) {
  const original = getEstimateById(id);
  if (!original) return null;

  const copy = JSON.parse(JSON.stringify(original));
  copy.id = 'est_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  copy.name = `${copy.name || 'Estimate'} (Copy)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;

  return saveEstimate(copy);
}

/**
 * Delete a saved estimate by ID
 * @param {string} id 
 * @returns {boolean}
 */
function deleteEstimate(id) {
  const estimates = getAllSavedEstimates();
  const filtered = estimates.filter(e => e.id !== id);
  return saveAllEstimates(filtered);
}

/**
 * Export all saved estimates as a downloadable JSON backup file
 */
function exportEstimatesToJSON() {
  const data = getAllSavedEstimates();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `zipper_bom_estimates_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import estimates from a JSON string or file content
 * @param {string} jsonString 
 * @param {boolean} [merge=true] - If true, merges with existing; if false, replaces
 * @returns {number} Count of imported items
 */
function importEstimatesFromJSON(jsonString, merge = true) {
  try {
    const imported = JSON.parse(jsonString);
    if (!Array.isArray(imported)) {
      throw new Error('Invalid backup file format. Expected an array of estimates.');
    }

    let current = merge ? getAllSavedEstimates() : [];
    
    imported.forEach(item => {
      const norm = normalizeEstimate(item);
      if (norm) {
        if (!norm.id || current.some(c => c.id === norm.id)) {
          norm.id = 'est_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        }
        current.unshift(norm);
      }
    });

    saveAllEstimates(current);
    return imported.length;
  } catch (err) {
    console.error('Import failed:', err);
    throw err;
  }
}

// Export for global access in Vanilla JS & Node.js
if (typeof window !== 'undefined') {
  window.StorageManager = {
    getAllSavedEstimates,
    getEstimateById,
    saveEstimate,
    duplicateEstimate,
    deleteEstimate,
    exportEstimatesToJSON,
    importEstimatesFromJSON,
    normalizeEstimate
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAllSavedEstimates,
    getEstimateById,
    saveEstimate,
    duplicateEstimate,
    deleteEstimate,
    exportEstimatesToJSON,
    importEstimatesFromJSON,
    normalizeEstimate
  };
}


