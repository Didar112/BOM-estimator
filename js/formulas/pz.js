/**
 * Factory Formula Engine for PZ (Plastic / Molded Zipper)
 * 
 * IMPORTANT: This module is the SOURCE OF TRUTH implementation for Factory Excel
 * manufacturing calculations for Plastic Zipper (PZ#3, PZ#5, and PZ#8) in both Inch and CM units.
 * 
 * Formulas, constants, divisors, allowances, and factor percentages are preserved exactly
 * from the verified factory Excel workbook:
 *   - PZ#3: Tape Divisor 101, Tape Add 2.5%, Tape Factor 8.15, PZO Add 3%, PZO Factor 2.3, PZC Add 3%, PZC Factor 1.5, Resin for Color Wise (0.5 kg/color)
 *   - PZ#5: Tape Divisor 81, Tape Add 2.5%, Tape Factor 13.07, PZO Add 3%, PZO Factor 3.0, PZC Add 3%, PZC Factor 1.7
 *   - PZ#8: Tape Divisor 57, Tape Add 2.5%, Tape Factor 26.23, PZO Add 3%, PZO Factor 3.7, PZC Add 3%, PZC Factor 1.9
 */

// ==================== 1. FACTORY PRODUCTION CONSTANTS FOR PZ ====================
const PZ_CONSTANTS = {
  '#3': {
    sizeKey: '#3',
    sizeName: 'PZ#3 (Plastic / Molded Zipper Size #3)',
    inchAllowance: 1.97,            // EXACT Excel: 1.97 inch
    cmAllowance: 5.0,               // EXACT Excel: 5.0 cm
    inchDivisor: 39.37,             // Fixed unit conversion: 39.37 inch per meter
    cmDivisor: 100.0,               // Fixed unit conversion: 100 cm per meter
    tapeDivisor: 101.0,             // EXACT Excel: 101 Mtr/KG for PZ#3
    tapeAdditionalPercent: 2.5,     // EXACT Excel: 102.5% (2.5% addition)
    tapeFactor: 8.15,               // EXACT Excel: 8.15 factor for PZ#3 Tape Resin
    pzoAdditionalPercent: 3.0,      // EXACT Excel: 103% (3.0% addition)
    pzoFactor: 2.3,                 // EXACT Excel: 2.3 factor for PZO#3
    pzcAdditionalPercent: 3.0,      // EXACT Excel: 103% (3.0% addition)
    pzcFactor: 1.5,                 // EXACT Excel: 1.5 factor for PZC#3
    hasColorWiseResin: true,        // EXACT Excel: PZ#3 has "Resin for Color Wise" section
    defaultColorFactor: 0.5,        // EXACT Excel: 0.5 KG per color
    hasUTop: true,                  // Universal U-Top across all zipper categories
    sliderAdditionPercent: 1.5,     // Standard zipper slider addition (1.015)
    sliderMultiplier: 1.015
  },
  '#5': {
    sizeKey: '#5',
    sizeName: 'PZ#5 (Plastic / Molded Zipper Size #5)',
    inchAllowance: 1.97,            // EXACT Excel: 1.97 inch
    cmAllowance: 5.0,               // EXACT Excel: 5.0 cm
    inchDivisor: 39.37,             // Fixed unit conversion: 39.37 inch per meter
    cmDivisor: 100.0,               // Fixed unit conversion: 100 cm per meter
    tapeDivisor: 81.0,              // EXACT Excel: 81 Mtr/KG for PZ#5
    tapeAdditionalPercent: 2.5,     // EXACT Excel: 102.5% (2.5% addition)
    tapeFactor: 13.07,              // EXACT Excel: 13.07 factor for PZ#5 Tape Resin
    pzoAdditionalPercent: 3.0,      // EXACT Excel: 103% (3.0% addition)
    pzoFactor: 3.0,                 // EXACT Excel: 3.0 factor for PZO#5
    pzcAdditionalPercent: 3.0,      // EXACT Excel: 103% (3.0% addition)
    pzcFactor: 1.7,                 // EXACT Excel: 1.7 factor for PZC#5
    hasColorWiseResin: false,
    defaultColorFactor: 0.5,
    hasUTop: true,                  // Universal U-Top across all zipper categories
    sliderAdditionPercent: 1.5,
    sliderMultiplier: 1.015
  },
  '#8': {
    sizeKey: '#8',
    sizeName: 'PZ#8 (Plastic / Molded Zipper Size #8)',
    inchAllowance: 2.4,             // EXACT Excel: 2.4 inch
    cmAllowance: 6.3,               // EXACT Excel: 6.3 cm
    inchDivisor: 39.37,             // Fixed unit conversion: 39.37 inch per meter
    cmDivisor: 100.0,               // Fixed unit conversion: 100 cm per meter
    tapeDivisor: 57.0,              // EXACT Excel: 57 Mtr/KG for PZ#8
    tapeAdditionalPercent: 2.5,     // EXACT Excel: 102.5% (2.5% addition)
    tapeFactor: 26.23,              // EXACT Excel: 26.23 factor for PZ#8 Tape Resin
    pzoAdditionalPercent: 3.0,      // EXACT Excel: 103% (3.0% addition)
    pzoFactor: 3.7,                 // EXACT Excel: 3.7 factor for PZO#8
    pzcAdditionalPercent: 3.0,      // EXACT Excel: 103% (3.0% addition)
    pzcFactor: 1.9,                 // EXACT Excel: 1.9 factor for PZC#8
    hasColorWiseResin: false,
    defaultColorFactor: 0.5,
    hasUTop: true,                  // Universal U-Top across all zipper categories
    sliderAdditionPercent: 1.5,
    sliderMultiplier: 1.015
  }
};

/**
 * Standard factory reference prices for default PZ BOM cost evaluation in BDT (৳)
 */
const PZ_DEFAULT_PRICES = {
  '#3': {
    tapeKg: 460.00,
    pzoKg: 350.00,
    pzcKg: 350.00,
    tapeResinKg: 340.00,
    colorWiseResinKg: 340.00,
    slider: 3.80,
    uTop: 350.00
  },
  '#5': {
    tapeKg: 430.00,
    pzoKg: 350.00,
    pzcKg: 350.00,
    tapeResinKg: 340.00,
    slider: 5.00,
    uTop: 350.00
  },
  '#8': {
    tapeKg: 400.00,
    pzoKg: 350.00,
    pzcKg: 350.00,
    tapeResinKg: 340.00,
    slider: 7.50,
    uTop: 350.00
  }
};

/**
 * Normalize PZ size string to '#3' | '#5' | '#8'
 * @param {string} sizeStr 
 * @returns {'#3'|'#5'|'#8'}
 */
function normalizePZSize(sizeStr) {
  const s = String(sizeStr || '').trim();
  if (s.includes('8')) return '#8';
  if (s.includes('3')) return '#3';
  return '#5';
}

/**
 * Normalize unit string to 'inch' or 'cm'
 * @param {string} unitStr 
 * @returns {'inch'|'cm'}
 */
function normalizePZUnit(unitStr) {
  const u = String(unitStr || '').toLowerCase().trim();
  if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return 'cm';
  if (u === 'mm' || u === 'millimeter') return 'cm';
  return 'inch';
}

/**
 * Calculate PZ factory calculations for a specific size group of variants
 * @param {Array<Object>} variants - Variants belonging to this PZ size
 * @param {string} pzSize - '#3' | '#5' | '#8'
 * @param {number} [globalLossPercent=3.0] - Default 3%
 * @param {number} [customSliderAdditionPercent=null] - Optional custom slider addition percentage
 * @param {Object} [customParams={}] - Optional dynamic production parameter overrides
 * @returns {Object} Full calculation results with intermediate values and formula explanations
 */
function calculatePZGroup(variants, pzSize = '#5', globalLossPercent = 3.0, customSliderAdditionPercent = null, customParams = {}) {
  const sizeKey = normalizePZSize(pzSize);
  const cfg = PZ_CONSTANTS[sizeKey];
  const lossPercent = Math.max(0, Number(globalLossPercent) || 0);

  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine :
                  (typeof require !== 'undefined' ? (function() { try { return require('../calculations.js'); } catch(e) { return null; } })() : null);

  const groupQty = (Array.isArray(variants) ? variants : []).reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
  const getSliderDefault = calcEng && (calcEng.getSliderDynamicAddPercentage || calcEng.getSliderDynamicLossPercentage);
  const defaultSliderPercent = getSliderDefault
    ? getSliderDefault(groupQty)
    : (groupQty <= 500 ? 8.0 : (groupQty <= 2000 ? 4.0 : (groupQty <= 5000 ? 2.5 : 1.5)));

  const sliderAdditionPercent = (customSliderAdditionPercent !== null && customSliderAdditionPercent !== undefined && !isNaN(customSliderAdditionPercent))
    ? Math.max(0, Number(customSliderAdditionPercent))
    : defaultSliderPercent;
  const sliderMultiplier = 1 + (sliderAdditionPercent / 100);
  const isSliderCustom = Math.abs(sliderAdditionPercent - defaultSliderPercent) > 0.0001;

  // Resolve dynamic custom factory constants with fallback to verified Excel defaults
  const inchAllowance = (customParams && customParams.inchAllowance !== undefined && !isNaN(customParams.inchAllowance) && Number(customParams.inchAllowance) >= 0)
    ? Number(customParams.inchAllowance)
    : ((customParams && customParams.chainAllowance !== undefined && !isNaN(customParams.chainAllowance) && Number(customParams.chainAllowance) >= 0)
        ? Number(customParams.chainAllowance)
        : cfg.inchAllowance);

  const cmAllowance = (customParams && customParams.cmAllowance !== undefined && !isNaN(customParams.cmAllowance) && Number(customParams.cmAllowance) >= 0)
    ? Number(customParams.cmAllowance)
    : cfg.cmAllowance;

  const tapeDivisor = (customParams && customParams.tapeDivisor !== undefined && !isNaN(customParams.tapeDivisor) && Number(customParams.tapeDivisor) > 0)
    ? Number(customParams.tapeDivisor)
    : cfg.tapeDivisor;

  const tapeAdditionalPercent = (customParams && customParams.tapeAdditionalPercent !== undefined && !isNaN(customParams.tapeAdditionalPercent) && Number(customParams.tapeAdditionalPercent) >= 0)
    ? Number(customParams.tapeAdditionalPercent)
    : cfg.tapeAdditionalPercent;

  const tapeFactor = (customParams && customParams.tapeFactor !== undefined && !isNaN(customParams.tapeFactor) && Number(customParams.tapeFactor) >= 0)
    ? Number(customParams.tapeFactor)
    : cfg.tapeFactor;

  const pzoAdditionalPercent = (customParams && customParams.pzoAdditionalPercent !== undefined && !isNaN(customParams.pzoAdditionalPercent) && Number(customParams.pzoAdditionalPercent) >= 0)
    ? Number(customParams.pzoAdditionalPercent)
    : cfg.pzoAdditionalPercent;

  const pzoFactor = (customParams && customParams.pzoFactor !== undefined && !isNaN(customParams.pzoFactor) && Number(customParams.pzoFactor) >= 0)
    ? Number(customParams.pzoFactor)
    : cfg.pzoFactor;

  const pzcAdditionalPercent = (customParams && customParams.pzcAdditionalPercent !== undefined && !isNaN(customParams.pzcAdditionalPercent) && Number(customParams.pzcAdditionalPercent) >= 0)
    ? Number(customParams.pzcAdditionalPercent)
    : cfg.pzcAdditionalPercent;

  const pzcFactor = (customParams && customParams.pzcFactor !== undefined && !isNaN(customParams.pzcFactor) && Number(customParams.pzcFactor) >= 0)
    ? Number(customParams.pzcFactor)
    : cfg.pzcFactor;

  const colorFactor = (customParams && customParams.colorFactor !== undefined && !isNaN(customParams.colorFactor) && Number(customParams.colorFactor) >= 0)
    ? Number(customParams.colorFactor)
    : cfg.defaultColorFactor;

  const noOfColors = (customParams && customParams.noOfColors !== undefined && !isNaN(customParams.noOfColors) && Number(customParams.noOfColors) >= 0)
    ? Number(customParams.noOfColors)
    : 0;

  const isSpecialUTopOrder = Boolean(
    customParams && (customParams.isSpecialUTopOrder === true || customParams.isSpecialUTopOrder === 'true' || customParams.isSpecialUTopOrder === 1)
  );
  const uTopMultiplier = isSpecialUTopOrder ? 1 : 2;
  const hasUTop = cfg.hasUTop !== false;

  const activeParams = {
    inchAllowance,
    cmAllowance,
    tapeDivisor,
    tapeAdditionalPercent,
    tapeFactor,
    pzoAdditionalPercent,
    pzoFactor,
    pzcAdditionalPercent,
    pzcFactor,
    colorFactor,
    noOfColors,
    sliderAdditionPercent,
    sliderMultiplier,
    hasUTop,
    isSpecialUTopOrder,
    uTopMultiplier
  };

  // 1. Process Product Variants & calculate Base Chain Consumption (Mtr)
  let totalQuantity = 0;
  let baseChainConsumptionMtr = 0;
  const variantBreakdowns = [];

  (variants || []).forEach((v, idx) => {
    const rawLen = Math.max(0, Number(v.length) || 0);
    const qty = Math.max(0, Number(v.quantity) || 0);
    const unit = normalizePZUnit(v.lengthUnit);

    const allowance = (unit === 'cm') ? cmAllowance : inchAllowance;
    const unitDivisor = (unit === 'cm') ? cfg.cmDivisor : cfg.inchDivisor;

    // Excel Chain Consumption Formula: (Length + Allowance) * Quantity / UnitDivisor
    const chainMtr = (rawLen + allowance) * qty / unitDivisor;

    totalQuantity += qty;
    baseChainConsumptionMtr += chainMtr;

    variantBreakdowns.push({
      variantId: v.id || `var_pz_${idx + 1}`,
      variantName: v.name || `Variant ${idx + 1}`,
      rawLength: rawLen,
      unit: unit,
      quantity: qty,
      allowance: allowance,
      unitDivisor: unitDivisor,
      chainConsumptionMtr: chainMtr,
      formulaString: `(${rawLen} ${unit} + ${allowance} ${unit}) × ${qty.toLocaleString()} pcs ÷ ${unitDivisor}`
    });
  });

  // 2. Loss Calculations
  // Loss Multiplier = 1 + (Loss% / 100)
  const lossFactor = 1 + (lossPercent / 100);
  const lossMtr = baseChainConsumptionMtr * (lossPercent / 100);
  const lossInclusiveChainMtr = baseChainConsumptionMtr * lossFactor;

  // 3. Total Tape Requirement (KG)
  // Formula: Chain Consumption × (1 + Loss% / 100) ÷ Tape Divisor
  const totalTapeKg = tapeDivisor > 0 ? (lossInclusiveChainMtr / tapeDivisor) : 0;

  // 4. PZ Tape-Based Resin Calculation (KG)
  // Formula: Chain Consumption × (1 + Tape Additional% / 100) × Tape Factor ÷ 1000
  const tapeAddMultiplier = 1 + (tapeAdditionalPercent / 100);
  const tapeBasedResinKg = (baseChainConsumptionMtr * tapeAddMultiplier * tapeFactor) / 1000.0;

  // 4. Slider Requirement with addition (Pcs)
  const sliderQuantity = totalQuantity * sliderMultiplier;
  const sliderAdditionPcs = totalQuantity * (sliderAdditionPercent / 100);

  // 5. U-Top Requirement (Universal across zipper categories)
  const baseUTopQty = hasUTop ? (totalQuantity * uTopMultiplier) : 0;
  const uTopLossPercent = (customParams && customParams.uTopLossPercent !== undefined && customParams.uTopLossPercent !== null)
    ? Number(customParams.uTopLossPercent)
    : 0;
  const uTopLossQty = baseUTopQty * (uTopLossPercent / 100);
  const uTopQty = baseUTopQty + uTopLossQty;

  return {
    pzSize: sizeKey,
    sizeName: cfg.sizeName,
    constants: cfg,
    activeParams: activeParams,
    lossPercent: lossPercent,
    lossFactor: lossFactor,
    sliderAdditionPercent: sliderAdditionPercent,
    sliderMultiplier: sliderMultiplier,
    isSliderCustom: isSliderCustom,
    hasUTop,
    isSpecialUTopOrder,
    uTopMultiplier,
    uTopQty,
    uTopPcs: uTopQty,
    baseUTopQty,
    uTopLossPercent,
    uTopLossQty,
    totalQuantity: totalQuantity,
    baseChainConsumptionMtr: baseChainConsumptionMtr,
    lossMtr: lossMtr,
    lossInclusiveChainMtr: lossInclusiveChainMtr,
    totalTapeKg: totalTapeKg,
    tapeBasedResinKg: tapeBasedResinKg,
    sliderQuantity: sliderQuantity,
    sliderAdditionPcs: sliderAdditionPcs,
    variantBreakdowns: variantBreakdowns
  };
}

/**
 * Master multi-size calculator for PZ category
 * Groups variants by size (#3, #5, #8), runs group calculations, builds merged BOM rows,
 * and formats step-by-step formula details.
 * 
 * @param {Array<Object>} variants 
 * @param {Object} [options={}]
 * @returns {Object} Master calculation result compatible with CalculatorEngine
 */
function calculatePZMaster(variants = [], options = {}) {
  const lossPercent = (options.lossPercent !== null && options.lossPercent !== undefined)
    ? Math.max(0, Number(options.lossPercent) || 0)
    : 3.0;

  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine :
                  (typeof require !== 'undefined' ? (function() { try { return require('../calculations.js'); } catch(e) { return null; } })() : null);

  const totalVariantQty = (Array.isArray(variants) ? variants : []).reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
  let customSliderAdditionPercent = options.sliderAdditionPercent !== undefined && options.sliderAdditionPercent !== null
    ? Number(options.sliderAdditionPercent) 
    : (options.sliderAddPercent !== undefined && options.sliderAddPercent !== null ? Number(options.sliderAddPercent) : null);

  if (customSliderAdditionPercent === null) {
    const getSliderDefault = calcEng && (calcEng.getSliderDynamicAddPercentage || calcEng.getSliderDynamicLossPercentage);
    if (getSliderDefault) {
      customSliderAdditionPercent = getSliderDefault(totalVariantQty);
    } else {
      customSliderAdditionPercent = (totalVariantQty <= 500 ? 8.0 : (totalVariantQty <= 2000 ? 4.0 : (totalVariantQty <= 5000 ? 2.5 : 1.5)));
    }
  }

  const pzParams = Object.assign({}, options.pzParams || {});
  if (options.isSpecialUTopOrder !== undefined) {
    pzParams.isSpecialUTopOrder = Boolean(options.isSpecialUTopOrder);
  }
  const uTopLossPercent = options.uTopLossPercent !== undefined && options.uTopLossPercent !== null
    ? Number(options.uTopLossPercent)
    : (pzParams.uTopLossPercent !== undefined && pzParams.uTopLossPercent !== null ? Number(pzParams.uTopLossPercent) : 0);
  pzParams.uTopLossPercent = uTopLossPercent;
  const priceOverrides = options.priceOverrides || {};

  // Group variants by PZ size
  const sizeGroups = {
    '#3': [],
    '#5': [],
    '#8': []
  };

  (variants || []).forEach(v => {
    const s = normalizePZSize(v.zipperSize);
    if (sizeGroups[s]) {
      sizeGroups[s].push(v);
    } else {
      sizeGroups['#5'].push(v);
    }
  });

  const groupResults = [];
  let masterTotalQty = 0;
  let masterBaseChainMtr = 0;
  let masterLossMtr = 0;
  let masterLossInclusiveMtr = 0;
  let masterTotalTapeKg = 0;
  let masterTapeResinKg = 0;
  let masterSliderQty = 0;

  Object.keys(sizeGroups).forEach(sizeKey => {
    const groupVars = sizeGroups[sizeKey];
    if (groupVars.length > 0) {
      let groupLoss = 0;

      // PZ#8 must NOT receive dynamic loss and must remain 0 unless manually overridden
      if (sizeKey === '#8') {
        if (options.classLossPercentages) {
          const overrideVal = options.classLossPercentages['PZC#8'] !== undefined ? options.classLossPercentages['PZC#8'] :
                              (options.classLossPercentages['PZO#8'] !== undefined ? options.classLossPercentages['PZO#8'] :
                              (options.classLossPercentages['PZ#8'] !== undefined ? options.classLossPercentages['PZ#8'] : null));
          if (overrideVal !== null && !isNaN(Number(overrideVal))) {
            groupLoss = Number(overrideVal);
          }
        }
      } else {
        // Size #3 or #5: identify if closed or open
        const firstVar = groupVars[0];
        const typeStr = String((firstVar && firstVar.zipperType) || '').trim().toLowerCase();
        const isClosed = typeStr === 'closed_end';
        const isOpen = typeStr === 'open_end';
        const classKey = isClosed ? `PZC${sizeKey}` : (isOpen ? `PZO${sizeKey}` : `PZ${sizeKey}`);

        if (options.classLossPercentages && options.classLossPercentages[classKey] !== undefined && options.classLossPercentages[classKey] !== null) {
          groupLoss = Number(options.classLossPercentages[classKey]);
        } else if (typeStr !== 'two_way' && (isClosed || isOpen)) {
          // Dynamic calculation if engine available
          try {
            const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine :
                            (typeof require !== 'undefined' ? require('../calculations.js') : null);
            if (calcEng && calcEng.isClassEligibleForDynamicLoss && calcEng.isClassEligibleForDynamicLoss(classKey)) {
              const baseMtr = groupVars.reduce((sum, v) => sum + calcEng.calculateVariantBaseChainMtr(v, 'pz', pzParams), 0);
              const dynLoss = calcEng.getDynamicLossPercentage(classKey, baseMtr);
              if (dynLoss !== null && dynLoss !== undefined) groupLoss = dynLoss;
            } else if (options.lossPercent !== undefined) {
              groupLoss = Number(options.lossPercent);
            }
          } catch (e) {
            if (options.lossPercent !== undefined) groupLoss = Number(options.lossPercent);
          }
        } else if (options.lossPercent !== undefined && typeStr !== 'two_way') {
          groupLoss = Number(options.lossPercent);
        }
      }

      const res = calculatePZGroup(groupVars, sizeKey, groupLoss, customSliderAdditionPercent, pzParams);
      groupResults.push(res);

      masterTotalQty += res.totalQuantity;
      masterBaseChainMtr += res.baseChainConsumptionMtr;
      masterLossMtr += res.lossMtr;
      masterLossInclusiveMtr += res.lossInclusiveChainMtr;
      masterTotalTapeKg += res.totalTapeKg;
      masterTapeResinKg += res.tapeBasedResinKg;
      masterSliderQty += res.sliderQuantity;
    }
  });

  // If no variants exist, calculate empty group for default primary size
  if (groupResults.length === 0) {
    const primarySize = (variants.length > 0 && variants[0].zipperSize) ? normalizePZSize(variants[0].zipperSize) : '#5';
    groupResults.push(calculatePZGroup([], primarySize, lossPercent, customSliderAdditionPercent, pzParams));
  }

  // Build master consolidated BOM rows with detailed calculation steps
  const allBOMRows = [];
  groupResults.forEach(res => {
    if (res.totalQuantity > 0 || variants.length === 0) {
      const rows = buildPZConsolidatedBOMRows(res, [], priceOverrides);
      rows.forEach(r => allBOMRows.push(r));
    }
  });

  // Universal H-Bottom calculation for Closed-End variants
  const primarySize = (variants.length > 0 && variants[0].zipperSize) 
    ? normalizePZSize(variants[0].zipperSize) 
    : ((groupResults[0] && groupResults[0].pzSize) ? groupResults[0].pzSize : '#5');
  const relevantHBottomQty = options.relevantHBottomQuantity !== undefined
    ? Number(options.relevantHBottomQuantity)
    : (calcEng && calcEng.getRelevantHBottomQuantity 
        ? calcEng.getRelevantHBottomQuantity(variants, 'pz')
        : (Array.isArray(variants) ? variants.reduce((sum, v) => {
            const typeStr = String((v && (v.zipperType || v.endType || v.type)) || '').toLowerCase().trim();
            const isOpen = (typeStr === 'open_end' || typeStr === 'open-end' || typeStr === 'open ended' || typeStr === 'two_way');
            return sum + (!isOpen ? Math.max(0, Number(v.quantity) || 0) : 0);
          }, 0) : 0));

  let finalHBottomQty = 0;
  if (relevantHBottomQty > 0) {
    const baseHBottomQty = relevantHBottomQty * 1;
    const hBottomLossPercent = (options.hBottomLossPercent !== undefined && options.hBottomLossPercent !== null)
      ? Number(options.hBottomLossPercent)
      : ((calcEng && calcEng.getHBottomDynamicLossPercentage)
        ? calcEng.getHBottomDynamicLossPercentage(totalVariantQty || relevantHBottomQty)
        : ((totalVariantQty || relevantHBottomQty) <= 500 ? 8.0 : ((totalVariantQty || relevantHBottomQty) <= 2000 ? 4.0 : 2.5)));
    const hBottomLossQty = baseHBottomQty * (hBottomLossPercent / 100);
    finalHBottomQty = baseHBottomQty + hBottomLossQty;
    const hBottomPrice = priceOverrides['hBottom'] !== undefined 
      ? Number(priceOverrides['hBottom']) 
      : (priceOverrides['h_bottom'] !== undefined ? Number(priceOverrides['h_bottom']) : (priceOverrides['pz_h_bottom'] !== undefined ? Number(priceOverrides['pz_h_bottom']) : 0.65));
    const hBottomCost = finalHBottomQty * hBottomPrice;

    allBOMRows.push({
      id: 'pz_bom_h_bottom',
      key: `mat_pz_h_bottom_${primarySize.replace('#', '')}`,
      component: 'H-BOTTOM',
      componentCategory: 'stop',
      materialId: `mat_pz_h_bottom_${primarySize.replace('#', '')}`,
      materialName: `H-Bottom Stop (PZ${primarySize})`,
      specification: `Addition: +${hBottomLossPercent}%`,
      unit: 'Pcs',
      totalQuantity: finalHBottomQty,
      avgQtyPerZipper: masterTotalQty > 0 ? (finalHBottomQty / masterTotalQty) : 0,
      unitPrice: hBottomPrice,
      baseMaterialCost: hBottomCost,
      wastageCost: 0,
      totalMaterialCost: hBottomCost,
      wastagePercent: 0,
      isLengthDependent: false,
      isFactoryStandard: true,
      allowDelete: false,
      subtypeKey: primarySize,
      subtypeName: `PZ${primarySize}`,
      subtypeLabel: `PZ ${primarySize}`,
      calculationDetail: {
        materialName: `H-Bottom Stop (PZ${primarySize})`,
        component: 'H-BOTTOM',
        category: 'pz',
        size: primarySize,
        unit: 'Pcs',
        zipperQuantity: relevantHBottomQty,
        baseQuantity: baseHBottomQty,
        lossPercent: hBottomLossPercent,
        lossQuantity: hBottomLossQty,
        finalQuantity: finalHBottomQty,
        displayQuantity: `${Math.round(finalHBottomQty).toLocaleString('en-US')} Pcs`,
        baseFormula: `Base H-Bottom Quantity = Closed-End Zipper Quantity × 1\nLoss Quantity = Base H-Bottom Quantity × ${hBottomLossPercent}%\nFinal H-Bottom Quantity = Base H-Bottom Quantity + Loss Quantity\n                        = Base H-Bottom Quantity × (1 + ${hBottomLossPercent}%)`,
        steps: [
          {
            stepNumber: 1,
            title: 'Closed-End Zipper Quantity & Base H-Bottom',
            explanation: 'Base H-Bottom quantity is derived from closed-end zipper quantity multiplied by 1:',
            formula: `Closed-End Zipper Quantity: ${relevantHBottomQty.toLocaleString('en-US')} pcs\nBase H-Bottom: ${relevantHBottomQty.toLocaleString('en-US')} × 1 = ${baseHBottomQty.toLocaleString('en-US')} Pcs`,
            result: `${baseHBottomQty.toLocaleString('en-US')} Pcs`
          },
          {
            stepNumber: 2,
            title: `Dynamic H-Bottom Loss (+${hBottomLossPercent}%)`,
            explanation: `Loss rate applied dynamically based on closed-end order volume (${relevantHBottomQty.toLocaleString('en-US')} pcs):`,
            formula: `Base H-Bottom: ${baseHBottomQty.toLocaleString('en-US')} Pcs × Loss Rate: ${hBottomLossPercent}% = Loss Quantity: ${hBottomLossQty.toFixed(2)} Pcs`,
            result: `${hBottomLossQty.toFixed(2)} Pcs`
          },
          {
            stepNumber: 3,
            title: 'Final H-Bottom Quantity (Pcs)',
            explanation: 'Final H-Bottom quantity equals Base H-Bottom quantity plus Loss Quantity:',
            formula: `Final H-Bottom: ${baseHBottomQty.toLocaleString('en-US')} + ${hBottomLossQty.toFixed(2)} = ${finalHBottomQty.toFixed(2)} Pcs\nBOM Rounded Requirement: ${Math.round(finalHBottomQty).toLocaleString('en-US')} Pcs`,
            result: `${Math.round(finalHBottomQty).toLocaleString('en-US')} Pcs`
          }
        ]
      }
    });
  }

  // Note: Pin Box is exclusive to Metal Zipper (MZ) Open-End; not applicable to Plastic Zipper (PZ)

  const totalBaseMaterialCost = allBOMRows.reduce((sum, r) => sum + (r.baseMaterialCost || 0), 0);
  const totalWastageCost = allBOMRows.reduce((sum, r) => sum + (r.wastageCost || 0), 0);
  const totalMaterialCost = totalBaseMaterialCost + totalWastageCost;
  const materialCostPerZipper = masterTotalQty > 0 ? (totalMaterialCost / masterTotalQty) : 0;

  const primaryGroup = groupResults[0] || {};
  const formulaDetails = {
    category: 'pz',
    totalQuantity: masterTotalQty,
    steps: buildPZFormulaSteps(groupResults, lossPercent)
  };

  return {
    category: 'pz',
    totalQuantity: masterTotalQty,
    baseChainConsumptionMtr: masterBaseChainMtr,
    lossMtr: masterLossMtr,
    lossInclusiveChainMtr: masterLossInclusiveMtr,
    totalTapeKg: masterTotalTapeKg,
    tapeBasedResinKg: masterTapeResinKg,
    sliderQuantity: masterSliderQty,
    hBottomPcs: finalHBottomQty,
    primaryResult: primaryGroup,
    groupResults: groupResults,
    formulaDetails: formulaDetails,
    materials: {
      processedRows: allBOMRows,
      totalBaseMaterialCost,
      totalWastageCost,
      totalMaterialCost,
      materialCostPerZipper
    }
  };
}

/**
 * Generate Factory-Standard BOM Table Rows for PZ Category
 * Constructs exact factory rows for the Consolidated BOM table with full calculation details.
 * 
 * @param {Object} pzCalcResult - Result from calculatePZGroup
 * @param {Array<Object>} existingCustomRows - Any user-added custom materials
 * @param {Object} [priceOverrides={}] - User-edited unit prices
 * @returns {Array<Object>} Consolidated BOM material rows
 */
function buildPZConsolidatedBOMRows(pzCalcResult, existingCustomRows = [], priceOverrides = {}) {
  const sizeKey = pzCalcResult.pzSize || '#5';
  const sizeNum = sizeKey.replace('#', '');
  const defaultPrices = PZ_DEFAULT_PRICES[sizeKey] || PZ_DEFAULT_PRICES['#5'];
  const activeParams = pzCalcResult.activeParams || pzCalcResult.constants || PZ_CONSTANTS[sizeKey] || PZ_CONSTANTS['#5'];
  const totalQty = pzCalcResult.totalQuantity || 1;
  const rows = [];

  const getPrice = (key, defaultVal) => {
    if (priceOverrides[key] !== undefined && priceOverrides[key] !== null && priceOverrides[key] !== '') {
      return Number(priceOverrides[key]);
    }
    return defaultVal;
  };

  // 1. CHAIN CONSUMPTION (Mtr) (Base pre-loss chain requirement)
  const chainMtr = pzCalcResult.baseChainConsumptionMtr || 0;
  rows.push({
    id: `pz_bom_chain_consumption_${sizeNum}`,
    key: `mat_pz_chain_consumption_${sizeNum}`,
    component: 'Chain Consumption',
    componentCategory: 'chain',
    materialId: `mat_pz_chain_consumption_${sizeNum}`,
    materialName: 'Chain Consumption',
    specification: `Base Chain Consumption for PZ#${sizeNum} (pre-loss)`,
    unit: 'Mtr',
    totalQuantity: chainMtr,
    avgQtyPerZipper: totalQty > 0 ? (chainMtr / totalQty) : 0,
    unitPrice: 0,
    baseMaterialCost: 0,
    wastageCost: 0,
    totalMaterialCost: 0,
    wastagePercent: 0,
    isLengthDependent: true,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: 'Chain Consumption',
      component: 'Chain Consumption',
      category: 'pz',
      size: sizeKey,
      unit: 'Mtr',
      finalQuantity: chainMtr,
      displayQuantity: `${Math.round(chainMtr).toLocaleString('en-US')} Mtr`,
      baseFormula: `Chain Consumption = Σ [ (Variant Length + Inch Allowance) × Variant Quantity ÷ 39.37 ] (for Inch)\n                  or Σ [ (Variant Length + CM Allowance) × Variant Quantity ÷ 100 ] (for CM)`,
      steps: [
        {
          stepNumber: 1,
          title: `Variant Chain Consumption & Factory Allowance (${sizeKey})`,
          explanation: `Factory allowance for PZ#${sizeNum} is ${activeParams.inchAllowance}" (or ${activeParams.cmAllowance} cm). Unit divisor: 39.37 inch/meter (or 100 cm/meter).`,
          variants: (pzCalcResult.variantBreakdowns || []).map(v => ({
            label: `${v.variantName}: Length ${v.rawLength} ${v.unit} × Quantity ${(v.quantity || 0).toLocaleString()} pcs`,
            formula: `(${v.rawLength} ${v.unit} + ${v.allowance} ${v.unit}) × ${(v.quantity || 0).toLocaleString()} pcs ÷ ${v.unitDivisor} = ${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`,
            result: `${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`
          })),
          subtotalLabel: 'Total Chain Consumption',
          subtotalValue: `${(chainMtr || 0).toFixed(2)} Mtr`
        }
      ]
    }
  });

  // 2. TOTAL TAPE KG (KG)
  const tapeKg = pzCalcResult.totalTapeKg || 0;
  const tapePrice = getPrice(`pzTapeKg_${sizeNum}`, defaultPrices.tapeKg);
  const tapeComponent = `PZ#${sizeNum} Tape`;

  rows.push({
    id: `pz_bom_tape_kg_${sizeNum}`,
    key: `mat_pz_tape_kg_${sizeNum}`,
    component: 'TOTL TAPE KG',
    componentCategory: 'tape',
    materialId: `mat_pz_tape_kg_${sizeNum}`,
    materialName: tapeComponent,
    specification: `Factory Tape for PZ#${sizeNum} (Divisor ${activeParams.tapeDivisor}, Loss ${pzCalcResult.lossPercent}%)`,
    unit: 'KG',
    totalQuantity: tapeKg,
    avgQtyPerZipper: totalQty > 0 ? (tapeKg / totalQty) : 0,
    unitPrice: tapePrice,
    baseMaterialCost: tapeKg * tapePrice,
    wastageCost: 0,
    totalMaterialCost: tapeKg * tapePrice,
    wastagePercent: 0,
    isLengthDependent: true,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: tapeComponent,
      component: 'TOTL TAPE KG',
      category: 'pz',
      size: sizeKey,
      unit: 'KG',
      finalQuantity: tapeKg,
      displayQuantity: `${tapeKg.toFixed(2)} KG`,
      baseFormula: `Chain Consumption (Mtr) = Sum of [ (Length + Allowance) × Quantity ] ÷ Unit Divisor (39.37 for Inch / 100 for CM)\nLoss Factor = 1 + (Loss Percentage ÷ 100) = 1 + (${pzCalcResult.lossPercent} ÷ 100) = ${pzCalcResult.lossFactor.toFixed(4)}\nTotal Tape (KG) = Chain Consumption × Loss Factor ÷ Tape Divisor (${activeParams.tapeDivisor} Mtr/KG)`,
      steps: [
        {
          stepNumber: 1,
          title: `Variant Chain Consumption & Factory Allowance (${sizeKey})`,
          explanation: `Factory allowance for PZ#${sizeNum} is ${activeParams.inchAllowance}" (or ${activeParams.cmAllowance} cm). Unit divisor: 39.37 inch/meter (or 100 cm/meter).`,
          variants: (pzCalcResult.variantBreakdowns || []).map(v => ({
            label: `${v.variantName}: Length ${v.rawLength} ${v.unit} × Quantity ${(v.quantity || 0).toLocaleString()} pcs`,
            formula: `(${v.rawLength} ${v.unit} + ${v.allowance} ${v.unit}) × ${(v.quantity || 0).toLocaleString()} pcs ÷ ${v.unitDivisor} = ${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`,
            result: `${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`
          })),
          subtotalLabel: 'Base Chain Consumption',
          subtotalValue: `${(pzCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr`
        },
        {
          stepNumber: 2,
          title: `Dynamic Loss Factor (+${pzCalcResult.lossPercent}%)`,
          explanation: `Factory loss rate of ${pzCalcResult.lossPercent}% yields a dynamic multiplier of ${pzCalcResult.lossFactor.toFixed(4)}:`,
          formula: `Loss Factor = 1 + (${pzCalcResult.lossPercent} ÷ 100) = ${pzCalcResult.lossFactor.toFixed(4)}\nLoss-Inclusive Chain Requirement = ${(pzCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr × ${pzCalcResult.lossFactor.toFixed(4)} = ${(pzCalcResult.lossInclusiveChainMtr || 0).toFixed(2)} Mtr`,
          result: `${(pzCalcResult.lossInclusiveChainMtr || 0).toFixed(2)} Mtr`
        },
        {
          stepNumber: 3,
          title: `Total Tape Weight Calculation (Divisor ${activeParams.tapeDivisor})`,
          explanation: `Loss-inclusive chain is divided by the editable tape divisor (${activeParams.tapeDivisor} Mtr/KG):`,
          formula: `${(pzCalcResult.lossInclusiveChainMtr || 0).toFixed(2)} Mtr ÷ ${activeParams.tapeDivisor} Mtr/KG = ${tapeKg.toFixed(4)} KG ≈ ${tapeKg.toFixed(2)} KG`,
          result: `${tapeKg.toFixed(2)} KG`
        }
      ]
    }
  });

  // 3. PZ TAPE-BASED CALCULATION (PZO#3 & PZC#3 Tape Wise for #3 / Resin for PZ Chain for #5 and #8)
  const tapeResinKg = pzCalcResult.tapeBasedResinKg || 0;
  const isPz3 = (sizeNum === '3');
  const tapeResinPrice = getPrice(isPz3 ? 'tapeWiseKg_3' : `tapeResinKg_${sizeNum}`, defaultPrices.tapeResinKg);
  const tapeResinComponent = isPz3 ? 'PZO#3 & PZC#3 Tape Wise' : `Resin for PZ#${sizeNum} Chain`;
  const tapeResinCategory = isPz3 ? 'PZO#3 & PZC#3 Tape Wise' : 'Resin for PZ Chain';
  const tapeAddMultiplier = 1 + (activeParams.tapeAdditionalPercent / 100);

  rows.push({
    id: isPz3 ? `pz_bom_tape_wise_${sizeNum}` : `pz_bom_tape_resin_${sizeNum}`,
    key: isPz3 ? `mat_pz_tape_wise_${sizeNum}` : `mat_pz_tape_resin_${sizeNum}`,
    component: tapeResinCategory,
    componentCategory: 'resin',
    materialId: isPz3 ? `mat_pz_tape_wise_${sizeNum}` : `mat_pz_tape_resin_${sizeNum}`,
    materialName: tapeResinComponent,
    specification: isPz3
      ? `PZO#3 & PZC#3 Tape Wise (+${activeParams.tapeAdditionalPercent}% Add., Factor ${activeParams.tapeFactor} / 1000)`
      : `Tape-Based Resin for PZ#${sizeNum} (+${activeParams.tapeAdditionalPercent}% Add., Factor ${activeParams.tapeFactor} / 1000)`,
    unit: 'KG',
    totalQuantity: tapeResinKg,
    avgQtyPerZipper: totalQty > 0 ? (tapeResinKg / totalQty) : 0,
    unitPrice: tapeResinPrice,
    baseMaterialCost: tapeResinKg * tapeResinPrice,
    wastageCost: 0,
    totalMaterialCost: tapeResinKg * tapeResinPrice,
    wastagePercent: 0,
    isLengthDependent: true,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: tapeResinComponent,
      component: tapeResinCategory,
      category: 'pz',
      size: sizeKey,
      unit: 'KG',
      finalQuantity: tapeResinKg,
      displayQuantity: `${tapeResinKg.toFixed(4)} KG`,
      baseFormula: isPz3
        ? `Tape Wise KG = Total Chain Consumption × (1 + Tape Additional % ÷ 100) × Tape Factor ÷ 1000\n             = ${(pzCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr × ${tapeAddMultiplier.toFixed(4)} × ${activeParams.tapeFactor} ÷ 1000`
        : `Tape-Based Resin = Chain Consumption (Mtr) × (1 + Tape Additional % ÷ 100) × Tape Factor ÷ 1000\n                 = Chain Consumption (Mtr) × ${tapeAddMultiplier.toFixed(4)} × ${activeParams.tapeFactor} ÷ 1000`,
      steps: [
        {
          stepNumber: 1,
          title: 'Base Chain Consumption',
          explanation: 'Sum of all variant chain lengths before loss adjustment:',
          formula: `Chain Consumption = ${(pzCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr`,
          result: `${(pzCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr`
        },
        {
          stepNumber: 2,
          title: isPz3 ? 'Tape Wise Weight Formula' : 'Tape-Based Resin Weight Formula',
          explanation: isPz3
            ? `Calculates PZO#3 & PZC#3 Tape Wise weight with +${activeParams.tapeAdditionalPercent}% addition (${tapeAddMultiplier.toFixed(4)}) and factor ${activeParams.tapeFactor} / 1000:`
            : `Chain consumption multiplied by +${activeParams.tapeAdditionalPercent}% allowance (${tapeAddMultiplier.toFixed(4)}) and factor ${activeParams.tapeFactor} / 1000:`,
          formula: `${(pzCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr × ${tapeAddMultiplier.toFixed(4)} × ${activeParams.tapeFactor} ÷ 1000 = ${tapeResinKg.toFixed(5)} KG ≈ ${tapeResinKg.toFixed(4)} KG`,
          result: `${tapeResinKg.toFixed(4)} KG`
        }
      ]
    }
  });

  // 4. SLIDER (+1.5% ADD.) (Pcs)
  const sliderQty = pzCalcResult.sliderQuantity || 0;
  const sliderPrice = getPrice(`slider_${sizeNum}`, defaultPrices.slider);
  const sliderPercent = pzCalcResult.sliderAdditionPercent !== undefined ? pzCalcResult.sliderAdditionPercent : 1.5;
  const isSliderCustom = pzCalcResult.isSliderCustom !== undefined ? Boolean(pzCalcResult.isSliderCustom) : false;
  const customTag = isSliderCustom ? ' (Custom)' : '';
  const sliderComp = `SLIDER (+${sliderPercent}% ADD.)`;

  rows.push({
    id: `pz_bom_slider_${sizeNum}`,
    key: `mat_pz_slider_${sizeNum}`,
    component: sliderComp,
    componentCategory: 'slider',
    materialId: `mat_pz_slider_${sizeNum}`,
    materialName: `Slider PZ#${sizeNum} (+${sliderPercent}% Add.)`,
    specification: `Slider with +${sliderPercent}% Factory Addition${customTag}`,
    unit: 'Pcs',
    totalQuantity: sliderQty,
    avgQtyPerZipper: totalQty > 0 ? (sliderQty / totalQty) : 0,
    unitPrice: sliderPrice,
    baseMaterialCost: sliderQty * sliderPrice,
    wastageCost: 0,
    totalMaterialCost: sliderQty * sliderPrice,
    wastagePercent: 0,
    isLengthDependent: false,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: `Slider PZ#${sizeNum} (+${sliderPercent}% Add.)`,
      component: sliderComp,
      category: 'pz',
      size: sizeKey,
      unit: 'Pcs',
      finalQuantity: sliderQty,
      displayQuantity: `${sliderQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`,
      baseFormula: `Total Required Sliders (Pcs) = Total Order Quantity × (1 + ${sliderPercent}% Factory Addition${customTag})\n                             = Total Order Quantity × ${pzCalcResult.sliderMultiplier.toFixed(4)}`,
      steps: [
        {
          stepNumber: 1,
          title: 'Total Order Quantity',
          explanation: 'Sum of all variant quantities across this category group:',
          formula: `Total Order Quantity = ${(pzCalcResult.totalQuantity || 0).toLocaleString()} pcs`,
          result: `${(pzCalcResult.totalQuantity || 0).toLocaleString()} pcs`
        },
        {
          stepNumber: 2,
          title: `Slider Requirement with +${sliderPercent}% Addition`,
          explanation: `Applies the ${sliderPercent}% factory slider allowance multiplier (${pzCalcResult.sliderMultiplier.toFixed(4)}):`,
          formula: `${(pzCalcResult.totalQuantity || 0).toLocaleString()} pcs × ${pzCalcResult.sliderMultiplier.toFixed(4)} = ${sliderQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`,
          result: `${sliderQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`
        }
      ]
    }
  });

  // 5. U-TOP (Universal across zipper categories)
  if (pzCalcResult.hasUTop !== false && (pzCalcResult.uTopQty > 0 || pzCalcResult.totalQuantity > 0)) {
    const uTopMultiplier = pzCalcResult.uTopMultiplier !== undefined ? pzCalcResult.uTopMultiplier : (pzCalcResult.isSpecialUTopOrder ? 1 : 2);
    const isSpecial = Boolean(pzCalcResult.isSpecialUTopOrder);
    const uTopPrice = getPrice(`pz_utop_${sizeNum}`, getPrice('uTop', defaultPrices.uTop || 350.00));
    const orderQty = pzCalcResult.totalQuantity || 0;
    const baseUTopQty = pzCalcResult.baseUTopQty !== undefined ? pzCalcResult.baseUTopQty : (orderQty * uTopMultiplier);
    const uTopLossPercent = pzCalcResult.uTopLossPercent !== undefined ? pzCalcResult.uTopLossPercent : 0;
    const uTopLossQty = pzCalcResult.uTopLossQty !== undefined ? pzCalcResult.uTopLossQty : (baseUTopQty * (uTopLossPercent / 100));
    const uTopQty = pzCalcResult.uTopQty !== undefined ? pzCalcResult.uTopQty : (baseUTopQty + uTopLossQty);
    const uTopCost = uTopQty * uTopPrice;

    const specText = uTopLossPercent > 0
      ? (isSpecial ? `U-Top Stop (Special Order: 1 pc/zipper, +${uTopLossPercent}% Loss)` : `U-Top Stop (2 pcs/zipper, +${uTopLossPercent}% Loss)`)
      : (isSpecial ? 'U-Top Stop (Special Order: 1 pc/zipper)' : 'U-Top Stop (2 pcs/zipper)');

    const steps = uTopLossPercent > 0 ? [
      {
        stepNumber: 1,
        title: `Base U-Top Requirement`,
        explanation: isSpecial ? `Special order requirement: 1 pc per zipper` : `Standard factory requirement: 2 pcs per zipper`,
        formula: `Order Quantity: ${orderQty.toLocaleString('en-US')} pcs × ${uTopMultiplier} pc/zipper = ${baseUTopQty.toLocaleString('en-US')} pcs`,
        result: `${baseUTopQty.toLocaleString('en-US')} Pcs`
      },
      {
        stepNumber: 2,
        title: `Dynamic U-Top Loss Quantity (+${uTopLossPercent}%)`,
        explanation: `Loss rate applied to base U-Top quantity:`,
        formula: `Base U-Top: ${baseUTopQty.toLocaleString('en-US')} pcs × Loss Rate: ${uTopLossPercent}% = ${uTopLossQty.toFixed(2)} pcs`,
        result: `${uTopLossQty.toFixed(2)} Pcs`
      },
      {
        stepNumber: 3,
        title: `Total Required U-Top Quantity`,
        explanation: `Sum of base requirement and loss quantity:`,
        formula: `Base: ${baseUTopQty.toLocaleString('en-US')} pcs + Loss: ${uTopLossQty.toFixed(2)} pcs = ${uTopQty.toFixed(2)} pcs ≈ ${Math.round(uTopQty).toLocaleString('en-US')} Pcs`,
        result: `${Math.round(uTopQty).toLocaleString('en-US')} Pcs`
      }
    ] : [
      {
        stepNumber: 1,
        title: `PZ${sizeKey} Order Quantity`,
        explanation: 'Sum of all variant quantities across this category group:',
        formula: `Total Order Quantity = ${(orderQty).toLocaleString()} pcs`,
        result: `${(orderQty).toLocaleString()} pcs`
      },
      {
        stepNumber: 2,
        title: isSpecial ? 'Special U-Top Requirement (1 pc per zipper)' : 'Required U-Top Quantity (2 pcs per zipper)',
        explanation: isSpecial
          ? 'Customer requested special requirement of 1 U-Top per zipper.'
          : 'Standard factory requirement of 2 U-Tops per zipper.',
        formula: isSpecial
          ? `Order Quantity: ${(orderQty).toLocaleString()} pcs × 1 pc/zipper = ${uTopQty.toLocaleString('en-US')} pcs`
          : `Order Quantity: ${(orderQty).toLocaleString()} pcs × 2 pcs/zipper = ${uTopQty.toLocaleString('en-US')} pcs`,
        result: `${uTopQty.toLocaleString('en-US')} Pcs`
      }
    ];

    rows.push({
      id: `pz_bom_utop_${sizeNum}`,
      key: `mat_pz_utop_${sizeNum}`,
      component: 'U-TOP',
      componentCategory: 'stop',
      materialId: `mat_pz_utop_${sizeNum}`,
      materialName: `U-Top (PZ${sizeKey})`,
      specification: specText,
      unit: 'Pcs',
      totalQuantity: uTopQty,
      avgQtyPerZipper: totalQty > 0 ? (uTopQty / totalQty) : 0,
      unitPrice: uTopPrice,
      baseMaterialCost: uTopCost,
      wastageCost: 0,
      totalMaterialCost: uTopCost,
      wastagePercent: 0,
      isLengthDependent: false,
      isFactoryStandard: true,
      allowDelete: false,
      calculationDetail: {
        materialName: `U-Top (PZ${sizeKey})`,
        component: 'U-TOP',
        category: 'pz',
        size: sizeKey,
        unit: 'Pcs',
        displayUnit: 'Pcs',
        orderQuantity: pzCalcResult.totalQuantity,
        uTopPerZipper: uTopMultiplier,
        isSpecialOrder: isSpecial,
        baseQuantity: baseUTopQty,
        lossPercent: uTopLossPercent,
        lossQuantity: uTopLossQty,
        finalQuantity: uTopQty,
        displayQuantity: `${Math.round(uTopQty).toLocaleString('en-US')} Pcs`,
        baseFormula: isSpecial
          ? `PZ${sizeKey} Order Quantity: ${(pzCalcResult.totalQuantity || 0).toLocaleString('en-US')} pcs\nSpecial U-Top Requirement: Yes\nU-Top per Zipper: 1 pc\nRequired U-Top Quantity: ${(pzCalcResult.totalQuantity || 0).toLocaleString('en-US')} × 1 = ${uTopQty.toLocaleString('en-US')} pcs`
          : `PZ${sizeKey} Order Quantity: ${(pzCalcResult.totalQuantity || 0).toLocaleString('en-US')} pcs\nU-Top per Zipper: 2 pcs\nRequired U-Top Quantity: ${(pzCalcResult.totalQuantity || 0).toLocaleString('en-US')} × 2 = ${uTopQty.toLocaleString('en-US')} pcs`,
        steps: steps
      }
    });
  }

  return rows.map(r => ({
    ...r,
    subtypeKey: sizeKey,
    subtypeName: (sizeNum === '8') ? 'PZ#8' : ((sizeNum === '3') ? 'PZ#3' : 'PZ#5'),
    subtypeLabel: pzCalcResult.sizeName || (`PZ#${sizeNum} (Plastic / Molded Size #${sizeNum})`),
    sourceVariants: (pzCalcResult.variantBreakdowns || []).map(v => ({
      id: v.variantId,
      name: v.variantName || 'Variant',
      length: v.rawLength,
      unit: v.unit,
      quantity: v.quantity
    })),
    totalSubtypeQuantity: pzCalcResult.totalQuantity || 0
  }));
}

/**
 * Format calculation steps for Formula Details display
 * @param {Array<Object>} groupResults 
 * @param {number} lossPercent 
 * @returns {Array<Object>}
 */
function buildPZFormulaSteps(groupResults = [], lossPercent = 3.0) {
  const steps = [];
  let stepCounter = 1;

  groupResults.forEach(res => {
    const sizeName = res.sizeName || res.pzSize;
    const activeParams = res.activeParams || {};

    // Step 1: Base Chain Consumption
    steps.push({
      stepNumber: stepCounter++,
      title: `Step 1 — Base Chain Consumption (${sizeName})`,
      explanation: `Calculates total zipper chain length based on finished lengths and allowances (${activeParams.inchAllowance}" for Inch, ${activeParams.cmAllowance} cm for CM):`,
      variants: (res.variantBreakdowns || []).map(v => ({
        label: `${v.variantName} (${v.rawLength} ${v.unit})`,
        formula: `(${v.rawLength} + ${v.allowance}) × ${(v.quantity || 0).toLocaleString()} pcs ÷ ${v.unitDivisor} = ${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`,
        result: `${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`
      })),
      subtotalLabel: 'Total Base Chain Consumption',
      subtotalValue: `${(res.baseChainConsumptionMtr || 0).toFixed(2)} Mtr`
    });

    // Step 2: Loss Adjustment & Total Tape KG
    steps.push({
      stepNumber: stepCounter++,
      title: `Step 2 — Factory Loss (+${res.lossPercent}%) & Total Tape (KG)`,
      explanation: `Applies ${res.lossPercent}% loss factor and divides by tape divisor (${activeParams.tapeDivisor} Mtr/KG):`,
      formula: `Loss-Inclusive Chain = ${(res.baseChainConsumptionMtr || 0).toFixed(2)} Mtr × ${res.lossFactor.toFixed(4)} = ${(res.lossInclusiveChainMtr || 0).toFixed(2)} Mtr\nTotal Tape = ${(res.lossInclusiveChainMtr || 0).toFixed(2)} Mtr ÷ ${activeParams.tapeDivisor} Mtr/KG = ${(res.totalTapeKg || 0).toFixed(2)} KG`,
      result: `${(res.totalTapeKg || 0).toFixed(2)} KG`
    });

    // Step 3: Tape-Based Resin / Tape Wise
    const tapeAddMult = 1 + (activeParams.tapeAdditionalPercent / 100);
    const isStepPz3 = (res.pzSize === '#3');
    steps.push({
      stepNumber: stepCounter++,
      title: isStepPz3 ? `Step 3 — PZO#3 & PZC#3 Tape Wise Calculation (PZ#3)` : `Step 3 — Tape-Based Resin Calculation (${res.pzSize})`,
      explanation: isStepPz3
        ? `Calculates PZO#3 & PZC#3 Tape Wise requirement (+${activeParams.tapeAdditionalPercent}% Add., Factor ${activeParams.tapeFactor}):`
        : `Calculates tape-based resin requirement (+${activeParams.tapeAdditionalPercent}% Add., Factor ${activeParams.tapeFactor}):`,
      formula: `${(res.baseChainConsumptionMtr || 0).toFixed(2)} Mtr × ${tapeAddMult.toFixed(4)} × ${activeParams.tapeFactor} ÷ 1000 = ${(res.tapeBasedResinKg || 0).toFixed(4)} KG`,
      result: `${(res.tapeBasedResinKg || 0).toFixed(4)} KG`
    });

    // Step 4: U-Top Requirement
    if (res.hasUTop !== false && (res.uTopQty > 0 || res.totalQuantity > 0)) {
      const uTopMultiplier = res.uTopMultiplier !== undefined ? res.uTopMultiplier : (res.isSpecialUTopOrder ? 1 : 2);
      const uTopQty = res.uTopQty !== undefined ? res.uTopQty : (res.totalQuantity * uTopMultiplier);
      const isSpec = Boolean(res.isSpecialUTopOrder);
      steps.push({
        stepNumber: stepCounter++,
        title: `Step 4 — U-Top Requirement (${res.pzSize})`,
        explanation: isSpec
          ? 'Special order requirement: 1 U-Top per zipper.'
          : 'Standard order requirement: 2 U-Tops per zipper.',
        formula: isSpec
          ? `PZ${res.pzSize} Order Quantity: ${(res.totalQuantity || 0).toLocaleString('en-US')} pcs × 1 pc/zipper = ${uTopQty.toLocaleString('en-US')} pcs`
          : `PZ${res.pzSize} Order Quantity: ${(res.totalQuantity || 0).toLocaleString('en-US')} pcs × 2 pcs/zipper = ${uTopQty.toLocaleString('en-US')} pcs`,
        result: `${uTopQty.toLocaleString('en-US')} Pcs`
      });
    }

  });

  return steps;
}

// Export for global access in Vanilla JS and Node.js
if (typeof window !== 'undefined') {
  window.PZFormulaEngine = {
    PZ_CONSTANTS,
    PZ_DEFAULT_PRICES,
    normalizePZSize,
    normalizePZUnit,
    calculatePZGroup,
    calculatePZMaster,
    buildPZConsolidatedBOMRows,
    buildPZFormulaSteps
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PZ_CONSTANTS,
    PZ_DEFAULT_PRICES,
    normalizePZSize,
    normalizePZUnit,
    calculatePZGroup,
    calculatePZMaster,
    buildPZConsolidatedBOMRows,
    buildPZFormulaSteps
  };
}
