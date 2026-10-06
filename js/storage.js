/**
 * Storage Manager for Zipper BOM Calculator
 * Handles localStorage persistence, snapshot history, multi-variant normalization,
 * duplicate, delete, and JSON export/import.
 */

const STORAGE_KEY = 'zipper_bom_estimates_v2';
const ONGOING_DRAFT_KEY = 'zipper_bom_ongoing_draft_v2';
const CUSTOM_PRESETS_STORAGE_KEY = 'zipper_bom_custom_parameter_presets_v1';
const API_BASE_URL_DEFAULT = './api';
let currentApiBaseUrl = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : API_BASE_URL_DEFAULT;

/**
 * Get the current API base URL
 * @returns {string}
 */
function getApiBaseUrl() {
  return currentApiBaseUrl;
}

/**
 * Set the API base URL (useful for Docker or external endpoints)
 * @param {string} url
 */
function setApiBaseUrl(url) {
  currentApiBaseUrl = url;
}

/**
 * Check if running in a real browser environment with fetch capability
 * @returns {boolean}
 */
function isBrowserFetch() {
  return typeof window !== 'undefined' && typeof fetch !== 'undefined' && typeof window.document !== 'undefined';
}

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
      isSpecialUTopOrder: Boolean(normalized.isSpecialUTopOrder || (normalized.czParams && normalized.czParams.isSpecialUTopOrder) || (normalized.mzParams && normalized.mzParams.isSpecialUTopOrder) || (normalized.pzParams && normalized.pzParams.isSpecialUTopOrder)),
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
        isSpecialUTopOrder: Boolean(g.isSpecialUTopOrder || (g.czParams && g.czParams.isSpecialUTopOrder) || (g.mzParams && g.mzParams.isSpecialUTopOrder) || (g.pzParams && g.pzParams.isSpecialUTopOrder)),
        czParams: (g.czParams && typeof g.czParams === 'object') ? g.czParams : {},
        mzParams: (g.mzParams && typeof g.mzParams === 'object') ? g.mzParams : {},
        wireParams: (g.wireParams && typeof g.wireParams === 'object') ? g.wireParams : {},
        pzParams: (g.pzParams && typeof g.pzParams === 'object') ? g.pzParams : {},
        variants: groupVariants
      };
    });
  }

  // Items Normalization (Independent Items Architecture)
  if (Array.isArray(normalized.items) && normalized.items.length > 0) {
    normalized.items = normalized.items.map((item, idx) => {
      const cat = item.category || 'cz';
      const sz = item.zipperSize || (cat === 'wire' ? '#5_normal' : '#5');
      const dName = item.displayName || `${cat.toUpperCase()}${sz}`;
      return {
        id: item.id || `item_${idx + 1}`,
        variantKey: item.variantKey || `${cat}_${sz.replace('#', '')}`,
        displayName: dName,
        name: item.name || dName,
        category: cat,
        zipperSize: sz,
        zipperType: item.zipperType || 'closed_end',
        length: item.length !== undefined && item.length !== null ? item.length : 0,
        lengthUnit: item.lengthUnit || 'inch',
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : 0,
        color: item.color || '',
        styleName: item.styleName || '',
        remarks: item.remarks || '',
        allowance: item.allowance !== undefined && item.allowance !== null ? Number(item.allowance) : 0,
        lossPercent: item.lossPercent !== undefined ? Number(item.lossPercent) : (cat === 'wire' ? 4.0 : 3.0),
        classLossOverrides: item.classLossOverrides || {},
        sliderAdditionPercent: item.sliderAdditionPercent !== undefined ? Number(item.sliderAdditionPercent) : 8.0,
        sliderAddPercent: item.sliderAddPercent !== undefined ? Number(item.sliderAddPercent) : 8.0,
        isSliderOverridden: Boolean(item.isSliderOverridden),
        pinBoxLossPercent: item.pinBoxLossPercent !== undefined ? Number(item.pinBoxLossPercent) : 4.0,
        isPinBoxLossOverridden: Boolean(item.isPinBoxLossOverridden),
        pinBoxPerZipper: 1,
        hBottomLossPercent: item.hBottomLossPercent !== undefined ? Number(item.hBottomLossPercent) : undefined,
        isHBottomLossOverridden: Boolean(item.isHBottomLossOverridden),
        isSpecialUTopOrder: Boolean(item.isSpecialUTopOrder || (item.czParams && item.czParams.isSpecialUTopOrder) || (item.mzParams && item.mzParams.isSpecialUTopOrder) || (item.pzParams && item.pzParams.isSpecialUTopOrder)),
        czParams: item.czParams || {},
        mzParams: item.mzParams || {},
        wireParams: item.wireParams || {},
        pzParams: item.pzParams || {},
        bomRows: Array.isArray(item.bomRows) ? item.bomRows : [],
        variants: Array.isArray(item.variants) && item.variants.length > 0 ? item.variants : undefined
      };
    });
  } else if (Array.isArray(normalized.categoryGroups) && normalized.categoryGroups.length > 0) {
    normalized.items = [];
    normalized.categoryGroups.forEach((g, gIdx) => {
      const cat = g.category || 'cz';
      (g.variants || []).forEach((v, vIdx) => {
        const sz = v.zipperSize || '#5';
        const dName = `${cat.toUpperCase()}${sz}`;
        normalized.items.push({
          id: v.id || `item_${gIdx + 1}_${vIdx + 1}`,
          variantKey: `${cat}_${sz.replace('#', '')}`,
          displayName: dName,
          name: v.name || dName,
          category: cat,
          zipperSize: sz,
          zipperType: v.zipperType || 'closed_end',
          length: v.length !== undefined && v.length !== null ? v.length : 0,
          lengthUnit: v.lengthUnit || 'inch',
          quantity: v.quantity !== undefined && v.quantity !== null ? v.quantity : 0,
          color: v.color || g.color || '',
          styleName: g.styleName || '',
          remarks: v.remarks || g.remarks || '',
          lossPercent: g.lossPercent !== undefined ? Number(g.lossPercent) : (cat === 'wire' ? 4.0 : 3.0),
          classLossOverrides: g.classLossOverrides || {},
          sliderAdditionPercent: g.sliderAdditionPercent,
          sliderAddPercent: g.sliderAddPercent,
          isSliderOverridden: g.isSliderOverridden,
          pinBoxLossPercent: g.pinBoxLossPercent,
          isPinBoxLossOverridden: g.isPinBoxLossOverridden,
          pinBoxPerZipper: 1,
          hBottomLossPercent: g.hBottomLossPercent,
          isHBottomLossOverridden: g.isHBottomLossOverridden,
          isSpecialUTopOrder: g.isSpecialUTopOrder,
          czParams: g.czParams || {},
          mzParams: g.mzParams || {},
          wireParams: g.wireParams || {},
          pzParams: g.pzParams || {},
          bomRows: v.bomRows || []
        });
      });
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
 * Generate a collision-proof unique ID for a calculation
 * @returns {string} Unique ID, e.g. calc_1774691234567_a8b9c2
 */
function generateUniqueCalculationId() {
  return 'calc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

/**
 * Save or update a single calculation snapshot
 * @param {Object} estimate - Full calculation page snapshot object
 * @returns {Object} Saved calculation with unique ID
 */
function saveEstimate(estimate) {
  const estimates = getAllSavedEstimates();
  const now = new Date().toISOString();
  
  let target = normalizeEstimate(JSON.parse(JSON.stringify(estimate)));

  if (!target.id) {
    target.id = generateUniqueCalculationId();
    target.createdAt = now;
  }
  target.updatedAt = now;
  target.savedAt = target.savedAt || now;

  // Re-calculate full snapshot to guarantee historical accuracy
  if (window.CalculatorEngine && typeof window.CalculatorEngine.calculateFullEstimate === 'function') {
    try {
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
    } catch (e) {
      console.warn('Calculation snapshot generation warning:', e);
    }
  }

  const existingIdx = estimates.findIndex(e => e.id === target.id);
  if (existingIdx >= 0) {
    estimates[existingIdx] = target;
  } else {
    estimates.unshift(target); // Add new to top
  }

  saveAllEstimates(estimates);

  // Background persist to MySQL backend when running in a browser environment
  if (isBrowserFetch()) {
    fetch(`${currentApiBaseUrl}/estimates.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target)
    }).catch(err => {
      // Graceful local fallback if backend is temporarily unreachable
      console.warn('[StorageManager] Background MySQL estimate save deferred to local cache:', err.message);
    });
  }

  return target;
}

/**
 * Save estimate asynchronously to MySQL backend and update local cache
 * @param {Object} estimate
 * @returns {Promise<Object>}
 */
async function saveEstimateAsync(estimate) {
  const target = normalizeEstimate(JSON.parse(JSON.stringify(estimate)));
  const now = new Date().toISOString();
  if (!target.id) {
    target.id = generateUniqueCalculationId();
    target.createdAt = now;
  }
  target.updatedAt = now;
  target.savedAt = target.savedAt || now;

  // Update local storage immediately
  saveEstimate(target);

  if (isBrowserFetch()) {
    try {
      const res = await fetch(`${currentApiBaseUrl}/estimates.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) return json.data;
      }
    } catch (err) {
      console.warn('[StorageManager] saveEstimateAsync network warning:', err.message);
    }
  }

  return target;
}

/**
 * Retrieve a single calculation by ID
 * @param {string} id 
 * @returns {Object|null}
 */
function getEstimateById(id) {
  const estimates = getAllSavedEstimates();
  return estimates.find(e => e.id === id) || null;
}

/**
 * Duplicate an existing saved calculation
 * @param {string} id 
 * @returns {Object|null}
 */
function duplicateEstimate(id) {
  const original = getEstimateById(id);
  if (!original) return null;

  const copy = JSON.parse(JSON.stringify(original));
  copy.id = generateUniqueCalculationId();
  copy.name = `${copy.name || 'Calculation'} (Copy)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  copy.savedAt = copy.createdAt;

  return saveEstimate(copy);
}

/**
 * Delete a saved calculation by ID
 * @param {string} id 
 * @returns {boolean}
 */
function deleteEstimate(id) {
  const estimates = getAllSavedEstimates();
  const filtered = estimates.filter(e => e.id !== id);
  const result = saveAllEstimates(filtered);

  // Background delete from MySQL backend when running in a browser environment
  if (isBrowserFetch()) {
    fetch(`${currentApiBaseUrl}/estimates.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(err => {
      console.warn('[StorageManager] Background MySQL estimate delete deferred:', err.message);
    });
  }

  return result;
}

/**
 * Delete an estimate asynchronously from MySQL backend and local cache
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteEstimateAsync(id) {
  deleteEstimate(id);
  if (isBrowserFetch()) {
    try {
      const res = await fetch(`${currentApiBaseUrl}/estimates.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('[StorageManager] deleteEstimateAsync network warning:', err.message);
    }
  }
  return true;
}

/**
 * Export all saved calculations as a downloadable JSON backup file
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
 * Import calculations from a JSON string or File object
 * @param {string|File} input - JSON string or File object from input[type=file]
 * @param {boolean|Function} [mergeOrCallback=true] - Merge flag, or callback function
 * @param {Function} [callback] - Callback function (err, count)
 * @returns {number|void} Count of imported items
 */
function importEstimatesFromJSON(input, mergeOrCallback = true, callback) {
  let merge = true;
  let cb = null;

  if (typeof mergeOrCallback === 'function') {
    cb = mergeOrCallback;
    merge = true;
  } else {
    merge = mergeOrCallback !== false;
    cb = typeof callback === 'function' ? callback : null;
  }

  // Handle File object (as passed from file input in app.js)
  if (typeof File !== 'undefined' && input instanceof File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const count = importEstimatesFromJSON(e.target.result, merge);
        if (cb) cb(null, count);
      } catch (err) {
        if (cb) cb(err);
      }
    };
    reader.onerror = () => {
      if (cb) cb(new Error('Failed to read backup file'));
    };
    reader.readAsText(input);
    return;
  }

  // Handle raw JSON string
  try {
    const imported = JSON.parse(input);
    if (!Array.isArray(imported)) {
      throw new Error('Invalid backup file format. Expected an array of calculations.');
    }

    let current = merge ? getAllSavedEstimates() : [];
    
    imported.forEach(item => {
      const norm = normalizeEstimate(item);
      if (norm) {
        if (!norm.id || current.some(c => c.id === norm.id)) {
          norm.id = generateUniqueCalculationId();
        }
        current.unshift(norm);
      }
    });

    saveAllEstimates(current);
    if (cb) cb(null, imported.length);
    return imported.length;
  } catch (err) {
    console.error('Import failed:', err);
    if (cb) {
      cb(err);
      return;
    }
    throw err;
  }
}

/**
 * Save ongoing calculation draft to localStorage
 * @param {Object} estimate - Full ongoing calculation page snapshot object
 * @returns {Object|null}
 */
function saveOngoingDraft(estimate) {
  if (!estimate || typeof estimate !== 'object') return null;
  if (typeof localStorage === 'undefined') return null;
  try {
    const clone = JSON.parse(JSON.stringify(estimate));
    const normalized = normalizeEstimate(clone);
    if (!normalized) return null;

    if (estimate.activeItemId) normalized.activeItemId = estimate.activeItemId;
    if (estimate.bomViewMode) normalized.bomViewMode = estimate.bomViewMode;
    normalized.draftSavedAt = new Date().toISOString();
    normalized.isOngoingDraft = true;

    localStorage.setItem(ONGOING_DRAFT_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (err) {
    console.error('Error saving ongoing draft to localStorage:', err);
    return null;
  }
}

/**
 * Retrieve ongoing calculation draft from localStorage
 * @returns {Object|null}
 */
function getOngoingDraft() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ONGOING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const normalized = normalizeEstimate(parsed);
    if (!normalized) return null;

    if (parsed.activeItemId) normalized.activeItemId = parsed.activeItemId;
    if (parsed.bomViewMode) normalized.bomViewMode = parsed.bomViewMode;
    if (parsed.draftSavedAt) normalized.draftSavedAt = parsed.draftSavedAt;
    normalized.isOngoingDraft = true;

    return normalized;
  } catch (err) {
    console.error('Error reading ongoing draft from localStorage:', err);
    return null;
  }
}

/**
 * Check if a non-empty ongoing calculation draft exists in localStorage
 * @returns {boolean}
 */
function hasOngoingDraft() {
  const draft = getOngoingDraft();
  if (!draft) return false;
  const hasItems = Array.isArray(draft.items) && draft.items.length > 0;
  const hasGroups = Array.isArray(draft.categoryGroups) && draft.categoryGroups.length > 0;
  return hasItems || hasGroups;
}

/**
 * Clear the ongoing calculation draft from localStorage
 * @returns {boolean}
 */
function clearOngoingDraft() {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.removeItem(ONGOING_DRAFT_KEY);
    return true;
  } catch (err) {
    console.error('Error clearing ongoing draft from localStorage:', err);
    return false;
  }
}

// ==================== CUSTOM PARAMETER PRESETS STORAGE ====================

/**
 * Retrieve all custom parameter presets from localStorage
 * @returns {Array<Object>}
 */
function getAllCustomPresets() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading custom presets from localStorage:', err);
    return [];
  }
}

/**
 * Save full list of custom presets to localStorage
 * @param {Array<Object>} presets
 * @returns {boolean}
 */
function saveAllCustomPresets(presets) {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    return true;
  } catch (err) {
    console.error('Error writing custom presets to localStorage:', err);
    return false;
  }
}

/**
 * Normalize variant key for consistent scoping
 * e.g. 'mz_3', 'cz_5', 'wire_5_long', 'pz_8'
 */
function normalizePresetVariantKey(variantKey) {
  const v = String(variantKey || 'cz_5').toLowerCase().trim();
  if (v === 'mz3' || v === 'mz#3') return 'mz_3';
  if (v === 'mz5' || v === 'mz#5') return 'mz_5';
  if (v === 'cz3' || v === 'cz#3') return 'cz_3';
  if (v === 'cz5' || v === 'cz#5') return 'cz_5';
  if (v === 'pz3' || v === 'pz#3') return 'pz_3';
  if (v === 'pz5' || v === 'pz#5') return 'pz_5';
  if (v === 'pz8' || v === 'pz#8') return 'pz_8';
  return v;
}

/**
 * Normalize unit for consistent scoping
 * e.g. 'inch' or 'cm'
 */
function normalizePresetUnit(unit) {
  const u = String(unit || 'inch').toLowerCase().trim();
  return (u === 'cm' || u === 'centimeter' || u === 'centimeters' || u === 'mm') ? 'cm' : 'inch';
}

/**
 * Format category and size display tag for preset name, e.g. "mz#3" or "cz#5"
 */
function formatCategorySizeTag(variantKey) {
  const v = normalizePresetVariantKey(variantKey);
  if (v.startsWith('wire')) {
    if (v.includes('3')) return 'wire#3';
    if (v.includes('long')) return 'wire#5 long';
    return 'wire#5';
  }
  const parts = v.split('_');
  if (parts.length >= 2) {
    return `${parts[0]}#${parts[1]}`;
  }
  return v;
}

/**
 * Get custom presets matching a specific variantKey and lengthUnit
 * @param {string} variantKey e.g. 'mz_3'
 * @param {string} lengthUnit e.g. 'inch' or 'cm'
 * @returns {Array<Object>}
 */
function getCustomPresets(variantKey, lengthUnit = 'inch') {
  const targetKey = normalizePresetVariantKey(variantKey);
  const targetUnit = normalizePresetUnit(lengthUnit);
  const all = getAllCustomPresets();

  return all.filter(p => {
    const pKey = normalizePresetVariantKey(p.variantKey);
    const pUnit = normalizePresetUnit(p.unit || p.lengthUnit);
    return pKey === targetKey && pUnit === targetUnit;
  });
}

/**
 * Save a custom parameter preset
 * @param {Object} options
 * @param {string} options.name - User-provided name, e.g. "custom-1"
 * @param {string} options.variantKey - e.g. "mz_3"
 * @param {string} options.lengthUnit - e.g. "inch"
 * @param {Object} options.parameters - Object containing altered static parameters
 * @param {string} [options.id] - Optional ID if updating existing
 * @returns {Object} Saved preset object
 */
function saveCustomPreset(options = {}) {
  const name = String(options.name || 'custom-1').trim();
  const variantKey = normalizePresetVariantKey(options.variantKey || 'mz_3');
  const unit = normalizePresetUnit(options.lengthUnit || options.unit || 'inch');
  const catTag = formatCategorySizeTag(variantKey);
  const displayName = `${name} (${catTag}, ${unit})`;
  const id = options.id || ('preset_' + variantKey + '_' + unit + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));

  const newPreset = {
    id,
    name,
    displayName,
    variantKey,
    unit,
    lengthUnit: unit,
    parameters: Object.assign({}, options.parameters || {}),
    createdAt: options.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const all = getAllCustomPresets();
  const existingIdx = all.findIndex(p => p.id === id);
  if (existingIdx >= 0) {
    all[existingIdx] = newPreset;
  } else {
    all.push(newPreset);
  }

  saveAllCustomPresets(all);

  // Background persist to MySQL backend when running in a browser environment
  if (isBrowserFetch()) {
    fetch(`${currentApiBaseUrl}/custom_presets.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPreset)
    }).catch(err => {
      console.warn('[StorageManager] Background MySQL preset save deferred to local cache:', err.message);
    });
  }

  return newPreset;
}

/**
 * Save custom preset asynchronously to MySQL backend and update local cache
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function saveCustomPresetAsync(options = {}) {
  const saved = saveCustomPreset(options);
  if (isBrowserFetch()) {
    try {
      const res = await fetch(`${currentApiBaseUrl}/custom_presets.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved)
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) return json.data;
      }
    } catch (err) {
      console.warn('[StorageManager] saveCustomPresetAsync network warning:', err.message);
    }
  }
  return saved;
}

/**
 * Delete a custom preset by ID
 * @param {string} presetId
 * @returns {boolean}
 */
function deleteCustomPreset(presetId) {
  const all = getAllCustomPresets();
  const filtered = all.filter(p => p.id !== presetId);
  if (filtered.length !== all.length) {
    saveAllCustomPresets(filtered);

    // Background delete from MySQL backend when running in a browser environment
    if (isBrowserFetch()) {
      fetch(`${currentApiBaseUrl}/custom_presets.php?id=${encodeURIComponent(presetId)}`, {
        method: 'DELETE'
      }).catch(err => {
        console.warn('[StorageManager] Background MySQL preset delete deferred:', err.message);
      });
    }

    return true;
  }
  return false;
}

/**
 * Delete a custom preset asynchronously from MySQL backend and local cache
 * @param {string} presetId
 * @returns {Promise<boolean>}
 */
async function deleteCustomPresetAsync(presetId) {
  deleteCustomPreset(presetId);
  if (isBrowserFetch()) {
    try {
      const res = await fetch(`${currentApiBaseUrl}/custom_presets.php?id=${encodeURIComponent(presetId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.warn('[StorageManager] deleteCustomPresetAsync network warning:', err.message);
    }
  }
  return true;
}

/**
 * Check MySQL backend database health
 * @returns {Promise<Object>}
 */
async function checkBackendHealth() {
  if (!isBrowserFetch()) {
    return { status: 'offline', database: 'unavailable', error: 'Fetch API not available in this environment' };
  }
  try {
    const res = await fetch(`${currentApiBaseUrl}/health.php`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    return { status: 'unhealthy', database: 'disconnected', error: err.message };
  }
}

/**
 * Synchronize local storage cache with MySQL backend.
 * Reads estimates and custom presets from MySQL and updates local cache seamlessly.
 * @returns {Promise<boolean>}
 */
async function syncWithBackend() {
  if (!isBrowserFetch()) return false;

  try {
    const [estRes, presetsRes] = await Promise.all([
      fetch(`${currentApiBaseUrl}/estimates.php`).catch(() => null),
      fetch(`${currentApiBaseUrl}/custom_presets.php`).catch(() => null)
    ]);

    let updated = false;

    if (estRes && estRes.ok) {
      const estJson = await estRes.json();
      if (estJson && estJson.success && Array.isArray(estJson.data) && estJson.data.length > 0) {
        saveAllEstimates(estJson.data.map(normalizeEstimate).filter(Boolean));
        updated = true;
      }
    }

    if (presetsRes && presetsRes.ok) {
      const pJson = await presetsRes.json();
      if (pJson && pJson.success && Array.isArray(pJson.data) && pJson.data.length > 0) {
        saveAllCustomPresets(pJson.data);
        updated = true;
      }
    }

    if (updated && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('bom:storage-synced', { detail: { timestamp: new Date().toISOString() } }));
    }

    return true;
  } catch (err) {
    console.warn('[StorageManager] Background backend sync skipped:', err.message);
    return false;
  }
}

// Export for global access in Vanilla JS & Node.js
if (typeof window !== 'undefined') {
  window.StorageManager = {
    getAllSavedEstimates,
    getAllEstimates: getAllSavedEstimates,
    getEstimateById,
    saveEstimate,
    saveEstimateAsync,
    duplicateEstimate,
    deleteEstimate,
    deleteEstimateAsync,
    exportEstimatesToJSON,
    importEstimatesFromJSON,
    normalizeEstimate,
    generateUniqueCalculationId,
    saveOngoingDraft,
    getOngoingDraft,
    hasOngoingDraft,
    clearOngoingDraft,
    getAllCustomPresets,
    getCustomPresets,
    saveCustomPreset,
    saveCustomPresetAsync,
    deleteCustomPreset,
    deleteCustomPresetAsync,
    checkBackendHealth,
    syncWithBackend,
    getApiBaseUrl,
    setApiBaseUrl
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAllSavedEstimates,
    getAllEstimates: getAllSavedEstimates,
    getEstimateById,
    saveEstimate,
    saveEstimateAsync,
    duplicateEstimate,
    deleteEstimate,
    deleteEstimateAsync,
    exportEstimatesToJSON,
    importEstimatesFromJSON,
    normalizeEstimate,
    generateUniqueCalculationId,
    saveOngoingDraft,
    getOngoingDraft,
    hasOngoingDraft,
    clearOngoingDraft,
    getAllCustomPresets,
    getCustomPresets,
    saveCustomPreset,
    saveCustomPresetAsync,
    deleteCustomPreset,
    deleteCustomPresetAsync,
    checkBackendHealth,
    syncWithBackend,
    getApiBaseUrl,
    setApiBaseUrl
  };
}



