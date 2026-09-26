/**
 * Factory Formula Engine for MZ (Metal Zipper)
 * 
 * IMPORTANT: This module is the SOURCE OF TRUTH implementation for Factory Excel
 * manufacturing calculations for Metal Zipper (MZ#3 and MZ#5) in both Inch and CM units.
 * 
 * Formulas, constants, and divisor factors must NOT be altered or simplified.
 * Full JavaScript numerical precision is preserved across all intermediate steps.
 */

// ==================== 1. IMMUTABLE FACTORY CONSTANTS FOR MZ ====================
const MZ_CONSTANTS = {
  '#3': {
    sizeName: 'MZ#3 (Metal Zipper Size #3)',
    inchAllowance: 1.78,       // EXACT: 1.78 inch
    cmAllowance: 4.5,          // EXACT: 4.5 cm
    inchDivisor: 39.37,        // EXACT: 39.37 inch per meter conversion
    cmDivisor: 100.0,          // EXACT: 100 cm per meter
    tapeDivisor: 97.0,         // EXACT: 97 divisor for MZ#3 Tape KG
    teethWireDivisor: 32.0,    // EXACT: 32 divisor for MZ#3 Teeth Wire
    teethWireLossPercent: 4.0, // EXACT: 4% loss for teeth wire (1.04 multiplier)
    topStopFactor: 0.22,       // EXACT: 0.22 factor for T/S#3 Wire
    topStopDivisor: 1000.0,    // EXACT: 1000 divisor
    hasHBottom: true,          // EXACT: MZ#3 uses H-Bottom stop
    hBottomLossPercent: 2.5,   // EXACT: 2.5% addition (1.025 multiplier)
    hBottomMultiplier: 1.025,
    hasBottomStopWire: false,  // MZ#3 uses H-Bottom instead of separate B/S wire
    bottomStopFactor: 0,
    bottomStopDivisor: 1000.0,
    sliderAdditionPercent: 1.5,// EXACT: 1.5% addition (1.015)
    sliderMultiplier: 1.015
  },
  '#5': {
    sizeName: 'MZ#5 (Metal Zipper Size #5)',
    inchAllowance: 1.97,       // EXACT: 1.97 inch
    cmAllowance: 5.0,          // EXACT: 5.0 cm
    inchDivisor: 39.37,        // EXACT: 39.37 inch per meter conversion
    cmDivisor: 100.0,          // EXACT: 100 cm per meter
    tapeDivisor: 71.0,         // EXACT: 71 divisor for MZ#5 Tape KG
    topStopFactor: 0.32,       // EXACT: 0.32 factor for Wire for T/S# 4 & 5
    topStopDivisor: 1000.0,    // EXACT: 1000 divisor
    bottomStopFactor: 0.172,   // EXACT: 0.172 factor for Wire for B/S# 4 & 5
    bottomStopDivisor: 1000.0, // EXACT: 1000 divisor
    hasHBottom: false,
    sliderAdditionPercent: 1.5,// EXACT: 1.5% addition (1.015)
    sliderMultiplier: 1.015
  }
};

/**
 * Standard factory reference prices for default BOM cost evaluation in BDT (৳)
 */
const MZ_DEFAULT_PRICES = {
  '#3': {
    tapeKg: 480.00,        // ৳ / KG
    slider: 5.50,          // ৳ / pc
    teethWireKg: 680.00,   // ৳ / KG
    topStopKg: 650.00,     // ৳ / KG
    hBottomPcs: 0.80       // ৳ / pc
  },
  '#5': {
    tapeKg: 450.00,        // ৳ / KG
    slider: 6.50,          // ৳ / pc
    topStopKg: 650.00,     // ৳ / KG
    bottomStopKg: 650.00   // ৳ / KG
  }
};

/**
 * Normalize size string to '#3' or '#5'
 * Defaults to '#5' if not recognized, or '#3' if specified.
 * @param {string} sizeStr 
 * @returns {string} '#3' | '#5'
 */
function normalizeMZSize(sizeStr) {
  const s = String(sizeStr || '').trim();
  if (s.includes('3')) return '#3';
  return '#5';
}

/**
 * Normalize unit string to 'inch' or 'cm'
 * @param {string} unitStr 
 * @returns {'inch'|'cm'}
 */
function normalizeMZUnit(unitStr) {
  const u = String(unitStr || '').toLowerCase().trim();
  if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return 'cm';
  if (u === 'mm' || u === 'millimeter') return 'cm';
  return 'inch';
}

/**
 * Master calculator for a specific size group of MZ variants
 * @param {Array<Object>} variants - Variants belonging to this MZ size
 * @param {string} mzSize - '#3' | '#5'
 * @param {number} [globalLossPercent=3.0] - Default 3%
 * @param {number} [customSliderAdditionPercent=null] - Optional custom slider addition percentage
 * @returns {Object} Full calculation results with intermediate values and formula explanations
 */
/**
 * Calculate single MZ group results for a given size (#3 or #5).
 * 
 * @param {Array<Object>} variants - Variants belonging to this MZ size
 * @param {string} mzSize - '#3' | '#5'
 * @param {number} [globalLossPercent=3.0] - Default 3%
 * @param {number} [customSliderAdditionPercent=null] - Optional custom slider addition percentage
 * @param {Object} [customParams={}] - Optional dynamic production parameter overrides
 * @returns {Object} Full calculation results with intermediate values and formula explanations
 */
function calculateMZGroup(variants, mzSize = '#3', globalLossPercent = 3.0, customSliderAdditionPercent = null, customParams = {}) {
  const sizeKey = normalizeMZSize(mzSize);
  const cfg = MZ_CONSTANTS[sizeKey];
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

  // Dynamic Custom MZ Parameters (Falling back to size defaults)
  const tapeDivisor = (customParams && customParams.tapeDivisor !== undefined && !isNaN(customParams.tapeDivisor) && Number(customParams.tapeDivisor) > 0)
    ? Number(customParams.tapeDivisor)
    : cfg.tapeDivisor;

  const teethWireDivisor = (customParams && customParams.teethWireDivisor !== undefined && !isNaN(customParams.teethWireDivisor) && Number(customParams.teethWireDivisor) > 0)
    ? Number(customParams.teethWireDivisor)
    : (cfg.teethWireDivisor || 32.0);

  const teethWireLossFactor = (customParams && customParams.teethWireLossFactor !== undefined && !isNaN(customParams.teethWireLossFactor) && Number(customParams.teethWireLossFactor) >= 0)
    ? Number(customParams.teethWireLossFactor)
    : (1 + (cfg.teethWireLossPercent || 4.0) / 100);

  const topStopFactor = (customParams && customParams.topStopFactor !== undefined && !isNaN(customParams.topStopFactor) && Number(customParams.topStopFactor) >= 0)
    ? Number(customParams.topStopFactor)
    : cfg.topStopFactor;

  const topStopDivisor = (customParams && customParams.topStopDivisor !== undefined && !isNaN(customParams.topStopDivisor) && Number(customParams.topStopDivisor) > 0)
    ? Number(customParams.topStopDivisor)
    : cfg.topStopDivisor;

  const defaultHBottomPercent = (calcEng && calcEng.getHBottomDynamicLossPercentage)
    ? calcEng.getHBottomDynamicLossPercentage(groupQty)
    : (groupQty <= 500 ? 8.0 : (groupQty <= 2000 ? 4.0 : 2.5));

  const hBottomLossPercent = (customParams && customParams.hBottomLossPercent !== undefined && !isNaN(customParams.hBottomLossPercent) && Number(customParams.hBottomLossPercent) >= 0)
    ? Number(customParams.hBottomLossPercent)
    : defaultHBottomPercent;
  const hBottomMultiplier = 1 + (hBottomLossPercent / 100);

  const activeParams = {
    tapeDivisor,
    teethWireDivisor,
    teethWireLossFactor,
    topStopFactor,
    topStopDivisor,
    hBottomLossPercent,
    hBottomMultiplier
  };

  // 1. Process each variant input and calculate individual chain consumption & teeth wire
  let totalQuantity = 0;
  let totalChainConsumptionMtr = 0;
  let totalTeethLengthMtr = 0;
  let totalTeethWireKg = 0;
  const variantBreakdowns = [];

  variants.forEach((v, idx) => {
    const qty = Math.max(0, Number(v.quantity) || 0);
    const rawLength = Math.max(0, Number(v.length) || 0);
    const unit = normalizeMZUnit(v.lengthUnit || 'inch');

    totalQuantity += qty;

    let allowance = 0;
    let unitDivisor = 1;
    let lengthValue = rawLength;

    if (unit === 'cm') {
      allowance = cfg.cmAllowance;
      unitDivisor = cfg.cmDivisor;
    } else {
      // Inch
      allowance = cfg.inchAllowance;
      unitDivisor = cfg.inchDivisor;
    }

    // Formula per variant for chain: [(Length + Allowance) * Quantity / UnitDivisor]
    const lengthWithAllowance = lengthValue + allowance;
    const variantChainMtr = (lengthWithAllowance * qty) / unitDivisor;
    totalChainConsumptionMtr += variantChainMtr;

    // Teeth Wire calculation (for MZ#3 or if teeth wire configured)
    let variantTeethWireKg = 0;
    const teethLengthMtr = (lengthValue * qty) / unitDivisor;
    totalTeethLengthMtr += teethLengthMtr;

    if (cfg.teethWireDivisor || sizeKey === '#3' || (customParams && customParams.teethWireDivisor)) {
      // Per Excel: Base = TeethLength / teethWireDivisor; Result = Base * teethWireLossFactor
      const baseTeethKg = teethLengthMtr / teethWireDivisor;
      variantTeethWireKg = baseTeethKg * teethWireLossFactor;
      totalTeethWireKg += variantTeethWireKg;
    }

    variantBreakdowns.push({
      variantId: v.id || `var_${idx + 1}`,
      name: v.name || `Variant ${idx + 1}`,
      rawLength: lengthValue,
      unit: unit,
      quantity: qty,
      allowance: allowance,
      lengthWithAllowance: lengthWithAllowance,
      unitDivisor: unitDivisor,
      chainConsumptionMtr: variantChainMtr,
      teethLengthMtr: teethLengthMtr,
      teethWireKg: variantTeethWireKg,
      color: v.color || '',
      remarks: v.remarks || '',
      formulaString: `(Length: ${lengthValue} ${unit} + Allowance: ${allowance} ${unit}) × Quantity: ${qty.toLocaleString('en-US')} pcs ÷ Divisor: ${unitDivisor} = ${variantChainMtr.toFixed(4)} Mtr`
    });
  });

  // 2. Main Chain Tape Loss & Total Tape KG
  // Excel formula: [SUM((N * O)% + N) / TapeDivisor]
  const tapeLossFactor = 1 + (lossPercent / 100);
  const chainMtrWithLoss = totalChainConsumptionMtr * tapeLossFactor;
  const tapeLossMtr = totalChainConsumptionMtr * (lossPercent / 100);
  const totalTapeKg = chainMtrWithLoss / tapeDivisor;

  // 3. Top Stop Material
  // Excel formula: Qty * factor / divisor
  const topStopKg = (totalQuantity * topStopFactor) / topStopDivisor;

  // 4. Bottom Stop / H-Bottom Material
  let bottomStopKg = 0;
  let hBottomPcs = 0;
  let baseHBottomQty = 0;
  let hBottomLossQty = 0;
  if (cfg.hasHBottom) {
    // MZ#3: Base H-Bottom = TotalQty * 1
    baseHBottomQty = totalQuantity * 1;
    hBottomLossQty = baseHBottomQty * (hBottomLossPercent / 100);
    hBottomPcs = baseHBottomQty + hBottomLossQty;
  } else if (cfg.bottomStopFactor) {
    // MZ#5: Wire for B/S# 4 & 5 = TotalQty * 0.172 / 1000
    bottomStopKg = (totalQuantity * cfg.bottomStopFactor) / cfg.bottomStopDivisor;
  }

  // 5. Slider Requirement (+1.5% or Custom addition)
  // Slider Quantity = Total Quantity + Slider Addition
  const sliderAdditionPcs = (totalQuantity * sliderAdditionPercent) / 100;
  const sliderPcs = totalQuantity + sliderAdditionPcs;

  return {
    size: sizeKey,
    sizeName: cfg.sizeName,
    constants: cfg,
    activeParams,
    totalQuantity,
    lossPercent,
    sliderAdditionPercent,
    sliderMultiplier,
    sliderAdditionPcs,
    isSliderCustom,
    variantBreakdowns,
    // Step-by-Step Intermediate Values (Exact Factory Calculations)
    chainConsumptionMtr: totalChainConsumptionMtr,
    tapeLossMtr: tapeLossMtr,
    chainMtrWithLoss: chainMtrWithLoss,
    totalTapeKg: totalTapeKg,
    teethWireKg: totalTeethWireKg,
    topStopKg: topStopKg,
    bottomStopKg: bottomStopKg,
    baseHBottomQty: baseHBottomQty,
    hBottomLossQty: hBottomLossQty,
    hBottomPcs: hBottomPcs,
    sliderPcs: sliderPcs,
    sliderAdditionPcs: sliderAdditionPcs,
    // Display-rounded formatted values
    display: {
      totalQuantity: totalQuantity.toLocaleString('en-US'),
      chainConsumptionMtr: Math.round(totalChainConsumptionMtr).toLocaleString('en-US'),
      chainConsumptionMtrExact: totalChainConsumptionMtr.toFixed(2),
      tapeLossMtr: tapeLossMtr.toFixed(2),
      totalTapeKg: totalTapeKg.toFixed(2),
      teethWireKg: totalTeethWireKg.toFixed(2),
      topStopKg: topStopKg.toFixed(2),
      bottomStopKg: bottomStopKg.toFixed(2),
      hBottomPcs: Math.round(hBottomPcs).toLocaleString('en-US'),
      sliderPcs: Math.round(sliderPcs).toLocaleString('en-US')
    }
  };
}

/**
 * Master calculation coordinator for MZ (Metal Zipper).
 * Groups variants by size (#3, #5) and aggregates results.
 * @param {Array<Object>} rawVariants 
 * @param {Object} [options={}] 
 * @returns {Object} Complete factory calculation result with BOM rows and mathematical breakdown
 */
function calculateMZMaster(rawVariants, options = {}) {
  const lossPercent = options.lossPercent !== undefined ? Number(options.lossPercent) : 3.0;
  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine :
                  (typeof require !== 'undefined' ? (function() { try { return require('../calculations.js'); } catch(e) { return null; } })() : null);

  const totalVariantQty = (Array.isArray(rawVariants) ? rawVariants : []).reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
  let sliderAdditionPercent = options.sliderAdditionPercent !== undefined && options.sliderAdditionPercent !== null
    ? Number(options.sliderAdditionPercent) 
    : (options.sliderAddPercent !== undefined && options.sliderAddPercent !== null ? Number(options.sliderAddPercent) : null);

  if (sliderAdditionPercent === null) {
    const getSliderDefault = calcEng && (calcEng.getSliderDynamicAddPercentage || calcEng.getSliderDynamicLossPercentage);
    if (getSliderDefault) {
      sliderAdditionPercent = getSliderDefault(totalVariantQty);
    } else {
      sliderAdditionPercent = (totalVariantQty <= 500 ? 8.0 : (totalVariantQty <= 2000 ? 4.0 : (totalVariantQty <= 5000 ? 2.5 : 1.5)));
    }
  }
  const mzParams = Object.assign({}, options.mzParams || {});
  if (options.hBottomLossPercent !== undefined && options.hBottomLossPercent !== null) {
    mzParams.hBottomLossPercent = Number(options.hBottomLossPercent);
  }
  const priceOverrides = options.priceOverrides || {};
  const customRows = Array.isArray(options.customRows) ? options.customRows : [];

  const variants = Array.isArray(rawVariants) ? rawVariants : [];
  if (variants.length === 0) {
    return null;
  }

  // Group variants by class (MZC#3, MZC#4, MZC#5, MZO#5, etc.)
  const classGroups = {};
  variants.forEach(v => {
    const size = normalizeMZSize(v.zipperSize || '#5');
    const typeStr = String(v.zipperType || '').trim().toLowerCase();
    const isClosed = typeStr === 'closed_end';
    const isOpen = typeStr === 'open_end';

    let classKey = `MZ${size}`;
    if (isClosed) {
      classKey = `MZC${size}`;
    } else if (isOpen) {
      classKey = `MZO${size}`;
    } else {
      classKey = `MZ${size} (${typeStr || 'Other'})`;
    }

    if (!classGroups[classKey]) {
      classGroups[classKey] = {
        classKey,
        size,
        variants: []
      };
    }
    classGroups[classKey].variants.push(v);
  });

  const groupResults = {};
  let totalOrderQuantity = 0;
  let primarySize = '#5';
  let maxQtyInSize = -1;

  for (const [classKey, cGroup] of Object.entries(classGroups)) {
    const vars = cGroup.variants;
    if (vars.length > 0) {
      let cLoss = 0;
      if (options.classLossPercentages && options.classLossPercentages[classKey] !== undefined && options.classLossPercentages[classKey] !== null) {
        cLoss = Number(options.classLossPercentages[classKey]);
      } else {
        // Try evaluating dynamic loss percentage
        try {
          const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine :
                          (typeof require !== 'undefined' ? require('../calculations.js') : null);
          if (calcEng && calcEng.isClassEligibleForDynamicLoss && calcEng.isClassEligibleForDynamicLoss(classKey)) {
            const baseMtr = vars.reduce((sum, v) => sum + calcEng.calculateVariantBaseChainMtr(v, 'mz', mzParams), 0);
            const dynLoss = calcEng.getDynamicLossPercentage(classKey, baseMtr);
            if (dynLoss !== null && dynLoss !== undefined) cLoss = dynLoss;
          } else if (options.lossPercent !== undefined && !classKey.includes('two_way')) {
            cLoss = Number(options.lossPercent);
          }
        } catch (e) {
          if (options.lossPercent !== undefined && !classKey.includes('two_way')) {
            cLoss = Number(options.lossPercent);
          }
        }
      }

      const res = calculateMZGroup(vars, cGroup.size, cLoss, sliderAdditionPercent, mzParams);
      res.classKey = classKey;
      groupResults[classKey] = res;
      totalOrderQuantity += res.totalQuantity;
      if (res.totalQuantity > maxQtyInSize) {
        maxQtyInSize = res.totalQuantity;
        primarySize = cGroup.size;
      }
    }
  }

  // Construct Factory BOM Rows according to Excel components
  const bomRows = [];
  let rowIndex = 1;

  // Track if there are multiple classes for the same size to ensure unique keys
  const totalClassesCount = Object.keys(groupResults).length;

  for (const [classKey, res] of Object.entries(groupResults)) {
    if (!res || res.totalQuantity === 0) continue;

    const size = res.size;
    const defaultPrices = MZ_DEFAULT_PRICES[size] || MZ_DEFAULT_PRICES['#5'];

    // 1. TAPE KG (Main component)
    const tapePrice = priceOverrides[`mz_tape_${size.replace('#', '')}`] !== undefined 
      ? Number(priceOverrides[`mz_tape_${size.replace('#', '')}`]) 
      : defaultPrices.tapeKg;
    const tapeCost = res.totalTapeKg * tapePrice;

    // Use standard key mat_mz_tape_5 if single class for size, or class-specific if multiple
    const tapeKey = (totalClassesCount === 1 || (totalClassesCount === 2 && Object.values(groupResults).filter(g => g.size === size).length === 1))
      ? `mat_mz_tape_${size.replace('#', '')}`
      : `mat_mz_tape_${classKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const tapeMatName = totalClassesCount <= 2 && Object.values(groupResults).filter(g => g.size === size).length === 1
      ? `MZ${size} Tape`
      : `${classKey} Tape`;

    bomRows.push({
      index: rowIndex++,
      key: tapeKey,
      component: 'TOTL TAPE KG',
      componentCategory: 'tape',
      materialId: tapeKey,
      materialName: tapeMatName,
      specification: `Factory Tape Divisor: ${res.activeParams.tapeDivisor}, Loss: ${res.lossPercent}%`,
      unit: 'KG',
      unitPrice: tapePrice,
      wastagePercent: 0,
      totalQuantity: res.totalTapeKg,
      baseMaterialCost: tapeCost,
      wastageCost: 0,
      totalMaterialCost: tapeCost,
      avgQtyPerZipper: totalOrderQuantity > 0 ? (res.totalTapeKg / totalOrderQuantity) : 0,
      costPerZipper: totalOrderQuantity > 0 ? (tapeCost / totalOrderQuantity) : 0,
      formulaNote: `Formula: (Total Mtr + ${res.lossPercent}% Loss) / ${res.activeParams.tapeDivisor}`,
      calculationDetail: {
        materialName: tapeMatName,
        component: 'TOTL TAPE KG',
        category: 'mz',
        size: size,
        unit: 'KG',
        finalQuantity: res.totalTapeKg,
        displayQuantity: `${res.totalTapeKg.toFixed(2)} KG`,
        baseFormula: `Base Chain (Mtr) = Sum of [ (Length + Allowance) × Quantity ] ÷ Unit Divisor (39.37 for Inch / 100 for CM)\nLoss-Inclusive Chain (Mtr) = Base Chain (Mtr) + (${res.lossPercent}% Factory Loss)\nTotal Tape (KG) = Loss-Inclusive Chain (Mtr) ÷ Tape Divisor (${res.activeParams.tapeDivisor} Mtr/KG)`,
        steps: [
          {
            stepNumber: 1,
            title: 'Variant Lengths & Factory Allowance',
            explanation: `Factory allowance for MZ${size} is ${res.constants.inchAllowance}" (or ${res.constants.cmAllowance} cm). Unit divisor: 39.37 inch/meter.`,
            variants: (res.variantBreakdowns || []).map(v => ({
              label: `${v.name || 'Variant'}: Length ${v.rawLength} ${v.unit} × Quantity ${(v.quantity || 0).toLocaleString()} pcs`,
              formula: v.formulaString || `(Length: ${v.rawLength} ${v.unit} + Allowance: ${res.constants.inchAllowance} ${v.unit}) × Quantity: ${v.quantity} pcs ÷ Divisor: 39.37 = ${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`,
              result: `${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`
            })),
            subtotalLabel: 'Base Chain Consumption',
            subtotalValue: `${(res.chainConsumptionMtr || 0).toFixed(2)} Mtr`
          },
          {
            stepNumber: 2,
            title: `Factory Loss Addition (+${res.lossPercent}%)`,
            explanation: `Production loss of ${res.lossPercent}% is added to base chain meters:`,
            formula: `Base Chain: ${(res.chainConsumptionMtr || 0).toFixed(2)} Mtr × Loss Rate: ${res.lossPercent}% = Loss Amount: ${(res.tapeLossMtr || 0).toFixed(2)} Mtr\nTotal Loss-Inclusive Chain = Base Chain: ${(res.chainConsumptionMtr || 0).toFixed(2)} Mtr + Loss: ${(res.tapeLossMtr || 0).toFixed(2)} Mtr = ${(res.chainMtrWithLoss || 0).toFixed(2)} Mtr`,
            result: `${(res.chainMtrWithLoss || 0).toFixed(2)} Mtr`
          },
          {
            stepNumber: 3,
            title: 'Final Tape Weight Requirement (KG)',
            explanation: `Loss-inclusive chain requirement is divided by MZ${size} tape divisor (${res.activeParams.tapeDivisor} Mtr/KG):`,
            formula: `Loss-Inclusive Chain: ${(res.chainMtrWithLoss || 0).toFixed(2)} Mtr ÷ Tape Divisor: ${res.activeParams.tapeDivisor} Mtr/KG = ${(res.totalTapeKg).toFixed(4)} KG ≈ ${(res.totalTapeKg).toFixed(2)} KG`,
            result: `${(res.totalTapeKg).toFixed(2)} KG`
          }
        ]
      }
    });

    // 2. TEETH WIRE (For MZ#3 or configured)
    if (res.teethWireKg > 0) {
      const teethPrice = priceOverrides[`mz_teeth_wire_${size.replace('#', '')}`] !== undefined
        ? Number(priceOverrides[`mz_teeth_wire_${size.replace('#', '')}`])
        : defaultPrices.teethWireKg;
      const teethCost = res.teethWireKg * teethPrice;

      bomRows.push({
        index: rowIndex++,
        key: `mat_mz_teeth_wire_${size.replace('#', '')}`,
        component: 'WIRE#3',
        componentCategory: 'wire',
        materialId: `mat_mz_teeth_wire_${size.replace('#', '')}`,
        materialName: `Teeth Wire ${size} (Brass / Metal)`,
        specification: `Divisor: ${res.activeParams.teethWireDivisor}, Loss Factor: ${res.activeParams.teethWireLossFactor}`,
        unit: 'KG',
        unitPrice: teethPrice,
        wastagePercent: 0,
        totalQuantity: res.teethWireKg,
        baseMaterialCost: teethCost,
        wastageCost: 0,
        totalMaterialCost: teethCost,
        avgQtyPerZipper: totalOrderQuantity > 0 ? (res.teethWireKg / totalOrderQuantity) : 0,
        costPerZipper: totalOrderQuantity > 0 ? (teethCost / totalOrderQuantity) : 0,
        formulaNote: `Formula: (Length Mtr / ${res.activeParams.teethWireDivisor}) × ${res.activeParams.teethWireLossFactor}`,
        calculationDetail: {
          materialName: `Teeth Wire ${size} (Brass / Metal)`,
          component: 'WIRE#3',
          category: 'mz',
          size: size,
          unit: 'KG',
          finalQuantity: res.teethWireKg,
          displayQuantity: `${res.teethWireKg.toFixed(2)} KG`,
          baseFormula: `Teeth Wire (KG) = (Required Chain Length: Mtr ÷ Teeth Wire Divisor: ${res.activeParams.teethWireDivisor}) × Teeth Wire Loss Factor: ${res.activeParams.teethWireLossFactor}`,
          steps: [
            {
              stepNumber: 1,
              title: 'Required Chain Length',
              explanation: `Total chain length calculated from variants (${(res.chainConsumptionMtr || 0).toFixed(2)} Mtr).`,
              formula: `Total Required Chain Length = ${(res.chainConsumptionMtr || 0).toFixed(2)} Mtr`,
              result: `${(res.chainConsumptionMtr || 0).toFixed(2)} Mtr`
            },
            {
              stepNumber: 2,
              title: 'Teeth Wire Weight & Loss Formula',
              explanation: `Divided by wire divisor ${res.activeParams.teethWireDivisor} and multiplied by teeth wire loss factor ${res.activeParams.teethWireLossFactor}:`,
              formula: `(Chain Length: ${(res.chainConsumptionMtr || 0).toFixed(2)} Mtr ÷ Divisor: ${res.activeParams.teethWireDivisor}) × Loss Factor: ${res.activeParams.teethWireLossFactor} = ${(res.teethWireKg).toFixed(4)} KG ≈ ${res.teethWireKg.toFixed(2)} KG`,
              result: `${res.teethWireKg.toFixed(2)} KG`
            }
          ]
        }
      });
    }

    // 3. TOP STOP WIRE (T/S)
    if (res.topStopKg > 0) {
      const topStopPrice = priceOverrides[`mz_top_stop_${size.replace('#', '')}`] !== undefined
        ? Number(priceOverrides[`mz_top_stop_${size.replace('#', '')}`])
        : defaultPrices.topStopKg;
      const topStopCost = res.topStopKg * topStopPrice;
      const tsComponent = (size === '#3') ? 'T/S#3' : 'Wire for T/S# 4 & 5';
      const tsLabel = (size === '#3') ? 'Top Stop Wire T/S#3' : 'Wire for T/S# 4 & 5';

      bomRows.push({
        index: rowIndex++,
        key: `mat_mz_ts_${size.replace('#', '')}`,
        component: tsComponent,
        componentCategory: 'stop',
        materialId: `mat_mz_ts_${size.replace('#', '')}`,
        materialName: `${tsLabel}`,
        specification: `Factor: ${res.activeParams.topStopFactor} / ${res.activeParams.topStopDivisor}`,
        unit: 'KG',
        unitPrice: topStopPrice,
        wastagePercent: 0,
        totalQuantity: res.topStopKg,
        baseMaterialCost: topStopCost,
        wastageCost: 0,
        totalMaterialCost: topStopCost,
        avgQtyPerZipper: totalOrderQuantity > 0 ? (res.topStopKg / totalOrderQuantity) : 0,
        costPerZipper: totalOrderQuantity > 0 ? (topStopCost / totalOrderQuantity) : 0,
        formulaNote: `Formula: Qty × ${res.activeParams.topStopFactor} / ${res.activeParams.topStopDivisor}`,
        calculationDetail: {
          materialName: tsLabel,
          component: tsComponent,
          category: 'mz',
          size: size,
          unit: 'KG',
          finalQuantity: res.topStopKg,
          displayQuantity: `${res.topStopKg.toFixed(2)} KG`,
          baseFormula: `Top Stop Wire (KG) = (Total Order Quantity × Top Stop Factor: ${res.activeParams.topStopFactor}) ÷ Divisor: ${res.activeParams.topStopDivisor}`,
          steps: [
            {
              stepNumber: 1,
              title: 'Total Order Quantity',
              explanation: 'Sum of all variant quantities across this category group:',
              formula: `Total Order Quantity = ${(res.totalQuantity || 0).toLocaleString()} pcs`,
              result: `${(res.totalQuantity || 0).toLocaleString()} pcs`
            },
            {
              stepNumber: 2,
              title: 'Top Stop Wire Weight Formula',
              explanation: `For MZ${size}, factor is ${res.activeParams.topStopFactor} / ${res.activeParams.topStopDivisor}:`,
              formula: `Order Quantity: ${(res.totalQuantity || 0).toLocaleString()} pcs × Factor: ${res.activeParams.topStopFactor} ÷ Divisor: ${res.activeParams.topStopDivisor} = ${(res.topStopKg).toFixed(4)} KG ≈ ${res.topStopKg.toFixed(2)} KG`,
              result: `${res.topStopKg.toFixed(2)} KG`
            }
          ]
        }
      });
    }

    // 4. BOTTOM STOP / H-BOTTOM
    if (res.constants.hasHBottom && res.hBottomPcs > 0) {
      // H-Bottom for MZ#3
      const hBottomPrice = priceOverrides[`mz_h_bottom_${size.replace('#', '')}`] !== undefined
        ? Number(priceOverrides[`mz_h_bottom_${size.replace('#', '')}`])
        : defaultPrices.hBottomPcs;
      const hBottomCost = res.hBottomPcs * hBottomPrice;

      const mz3ZipperQty = res.totalQuantity || 0;
      const baseHBottomQty = res.baseHBottomQty !== undefined ? res.baseHBottomQty : (mz3ZipperQty * 1);
      const hBottomLossPercent = res.activeParams.hBottomLossPercent;
      const hBottomLossQty = res.hBottomLossQty !== undefined ? res.hBottomLossQty : (baseHBottomQty * (hBottomLossPercent / 100));
      const finalHBottomQty = res.hBottomPcs;

      bomRows.push({
        index: rowIndex++,
        key: `mat_mz_h_bottom_${size.replace('#', '')}`,
        component: 'H-BOTTOM',
        componentCategory: 'stop',
        materialId: `mat_mz_h_bottom_${size.replace('#', '')}`,
        materialName: 'H-Bottom Stop (MZ#3)',
        specification: `Addition: +${hBottomLossPercent}% (${res.activeParams.hBottomMultiplier})`,
        unit: 'Pcs',
        unitPrice: hBottomPrice,
        wastagePercent: 0,
        totalQuantity: finalHBottomQty,
        baseMaterialCost: hBottomCost,
        wastageCost: 0,
        totalMaterialCost: hBottomCost,
        avgQtyPerZipper: totalOrderQuantity > 0 ? (finalHBottomQty / totalOrderQuantity) : 0,
        costPerZipper: totalOrderQuantity > 0 ? (hBottomCost / totalOrderQuantity) : 0,
        formulaNote: `Formula: Qty × ${res.activeParams.hBottomMultiplier} (+${hBottomLossPercent}%)`,
        calculationDetail: {
          materialName: 'H-Bottom Stop (MZ#3)',
          component: 'H-BOTTOM',
          category: 'mz',
          size: '#3',
          unit: 'Pcs',
          zipperQuantity: mz3ZipperQty,
          baseQuantity: baseHBottomQty,
          lossPercent: hBottomLossPercent,
          lossQuantity: hBottomLossQty,
          finalQuantity: finalHBottomQty,
          displayQuantity: `${Math.round(finalHBottomQty).toLocaleString()} Pcs`,
          baseFormula: `Base H-Bottom Quantity = MZ#3 Zipper Quantity × 1\nLoss Quantity = Base H-Bottom Quantity × ${hBottomLossPercent}%\nFinal H-Bottom Quantity = Base H-Bottom Quantity + Loss Quantity\n                        = Base H-Bottom Quantity × (1 + ${hBottomLossPercent}%)`,
          steps: [
            {
              stepNumber: 1,
              title: 'MZ#3 Zipper Quantity & Base H-Bottom',
              explanation: 'Base H-Bottom quantity is derived from MZ#3 zipper quantity multiplied by 1:',
              formula: `MZ#3 Zipper Quantity: ${mz3ZipperQty.toLocaleString('en-US')} pcs\nBase H-Bottom: ${mz3ZipperQty.toLocaleString('en-US')} × 1 = ${baseHBottomQty.toLocaleString('en-US')} Pcs`,
              result: `${baseHBottomQty.toLocaleString('en-US')} Pcs`
            },
            {
              stepNumber: 2,
              title: `Dynamic H-Bottom Loss (+${hBottomLossPercent}%)`,
              explanation: `Loss rate applied dynamically based on MZ#3 zipper quantity (${mz3ZipperQty.toLocaleString('en-US')} pcs):`,
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
    } else if (res.bottomStopKg > 0) {
      // Bottom stop wire for MZ#5
      const bsPrice = priceOverrides[`mz_bottom_stop_${size.replace('#', '')}`] !== undefined
        ? Number(priceOverrides[`mz_bottom_stop_${size.replace('#', '')}`])
        : defaultPrices.bottomStopKg;
      const bsCost = res.bottomStopKg * bsPrice;

      bomRows.push({
        index: rowIndex++,
        key: `mat_mz_bs_${size.replace('#', '')}`,
        component: 'Wire for B/S# 4&5',
        componentCategory: 'stop',
        materialId: `mat_mz_bs_${size.replace('#', '')}`,
        materialName: 'Wire for B/S# 4 & 5',
        specification: `Factor: ${res.constants.bottomStopFactor} / 1000`,
        unit: 'KG',
        unitPrice: bsPrice,
        wastagePercent: 0,
        totalQuantity: res.bottomStopKg,
        baseMaterialCost: bsCost,
        wastageCost: 0,
        totalMaterialCost: bsCost,
        avgQtyPerZipper: totalOrderQuantity > 0 ? (res.bottomStopKg / totalOrderQuantity) : 0,
        costPerZipper: totalOrderQuantity > 0 ? (bsCost / totalOrderQuantity) : 0,
        formulaNote: `Formula: Qty × ${res.constants.bottomStopFactor} / 1000`,
        calculationDetail: {
          materialName: 'Wire for B/S# 4 & 5',
          component: 'Wire for B/S# 4&5',
          category: 'mz',
          size: '#5',
          unit: 'KG',
          finalQuantity: res.bottomStopKg,
          displayQuantity: `${res.bottomStopKg.toFixed(2)} KG`,
          baseFormula: `Bottom Stop Wire (KG) = (Total Order Quantity × Bottom Stop Factor: ${res.constants.bottomStopFactor}) ÷ Divisor: 1000`,
          steps: [
            {
              stepNumber: 1,
              title: 'Total Order Quantity',
              explanation: 'Sum of all variant quantities across this category group:',
              formula: `Total Order Quantity = ${(res.totalQuantity || 0).toLocaleString()} pcs`,
              result: `${(res.totalQuantity || 0).toLocaleString()} pcs`
            },
            {
              stepNumber: 2,
              title: 'Bottom Stop Wire Weight Formula',
              explanation: `For MZ${size}, factor is ${res.constants.bottomStopFactor} / 1000:`,
              formula: `Order Quantity: ${(res.totalQuantity || 0).toLocaleString()} pcs × Factor: ${res.constants.bottomStopFactor} ÷ Divisor: 1000 = ${(res.bottomStopKg).toFixed(4)} KG ≈ ${res.bottomStopKg.toFixed(2)} KG`,
              result: `${res.bottomStopKg.toFixed(2)} KG`
            }
          ]
        }
      });
    }

    // 5. SLIDER (With Customizable Addition)
    const sliderPrice = priceOverrides[`mz_slider_${size.replace('#', '')}`] !== undefined
      ? Number(priceOverrides[`mz_slider_${size.replace('#', '')}`])
      : defaultPrices.slider;
    const sliderCost = res.sliderPcs * sliderPrice;
    const sliderPercent = res.sliderAdditionPercent !== undefined ? res.sliderAdditionPercent : 1.5;
    const isSliderCustom = res.isSliderCustom !== undefined ? Boolean(res.isSliderCustom) : false;
    const sliderMultiplier = res.sliderMultiplier || (1 + sliderPercent / 100);
    const sliderAdditionPcs = res.sliderAdditionPcs !== undefined ? res.sliderAdditionPcs : (totalOrderQuantity * (sliderPercent / 100));
    const customTag = isSliderCustom ? ' (Custom)' : '';
    const sliderComp = `SLIDER (+${sliderPercent}% ADD.)`;

    bomRows.push({
      index: rowIndex++,
      key: `mat_mz_slider_${size.replace('#', '')}`,
      component: sliderComp,
      componentCategory: 'slider',
      materialId: `mat_mz_slider_${size.replace('#', '')}`,
      materialName: `Slider MZ${size} (+${sliderPercent}% Add.)`,
      specification: `Factory Standard +${sliderPercent}% Addition${customTag}`,
      unit: 'Pcs',
      unitPrice: sliderPrice,
      wastagePercent: 0,
      totalQuantity: res.sliderPcs,
      baseMaterialCost: sliderCost,
      wastageCost: 0,
      totalMaterialCost: sliderCost,
      avgQtyPerZipper: totalOrderQuantity > 0 ? (res.sliderPcs / totalOrderQuantity) : 0,
      costPerZipper: totalOrderQuantity > 0 ? (sliderCost / totalOrderQuantity) : 0,
      formulaNote: `Formula: Total Qty × ${Number(sliderMultiplier.toFixed(4))} (+${sliderPercent}%)`,
      calculationDetail: {
        materialName: `Slider MZ${size} (+${sliderPercent}% Add.)`,
        component: sliderComp,
        category: 'mz',
        size: size,
        unit: 'Pcs',
        sliderAdditionPercent: sliderPercent,
        isCustom: isSliderCustom,
        finalQuantity: res.sliderPcs,
        displayQuantity: `${res.sliderPcs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`,
        baseFormula: `Total Required Sliders (Pcs) = Total Order Quantity × (1 + ${sliderPercent}% Factory Addition${customTag})\n                             = Total Order Quantity × ${Number(sliderMultiplier.toFixed(4))}`,
        steps: [
          {
            stepNumber: 1,
            title: 'Total Order Quantity',
            explanation: 'Sum of all variant quantities across this category group:',
            formula: `Total Order Quantity = ${(res.totalQuantity || 0).toLocaleString()} pcs`,
            result: `${(res.totalQuantity || 0).toLocaleString()} pcs`
          },
          {
            stepNumber: 2,
            title: `Slider Requirement with +${sliderPercent}% Addition${customTag}`,
            explanation: `Applies the ${sliderPercent}% factory slider allowance multiplier (${Number(sliderMultiplier.toFixed(4))}):`,
            formula: `Order Quantity: ${(res.totalQuantity || 0).toLocaleString()} pcs × Slider Addition Factor: ${Number(sliderMultiplier.toFixed(4))} (+${sliderPercent}%${customTag}) = ${res.sliderPcs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs\n[Slider Addition: ${(res.totalQuantity || 0).toLocaleString()} pcs × ${sliderPercent}% = ${sliderAdditionPcs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pcs]`,
            result: `${res.sliderPcs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`
          }
        ]
      }
    });
  }

  // Pin Box calculation for Open-End / Two-Way variants
  const pinBoxPerZipper = options.pinBoxPerZipper !== undefined ? Number(options.pinBoxPerZipper) : 1;
  const relevantPinBoxQty = options.relevantPinBoxQuantity !== undefined 
    ? Number(options.relevantPinBoxQuantity) 
    : (calcEng && calcEng.getRelevantPinBoxQuantity ? calcEng.getRelevantPinBoxQuantity(variants) : 0);

  if (relevantPinBoxQty > 0 && pinBoxPerZipper > 0) {
    const basePinBox = relevantPinBoxQty * pinBoxPerZipper;
    const pinBoxLossPercent = (options.pinBoxLossPercent !== undefined && options.pinBoxLossPercent !== null)
      ? Number(options.pinBoxLossPercent)
      : ((calcEng && calcEng.getPinBoxDynamicLossPercentage)
        ? calcEng.getPinBoxDynamicLossPercentage(relevantPinBoxQty)
        : (relevantPinBoxQty <= 500 ? 8.0 : (relevantPinBoxQty <= 2000 ? 4.0 : 2.5)));
    const pinBoxLossQty = basePinBox * (pinBoxLossPercent / 100);
    const finalPinBoxQty = basePinBox + pinBoxLossQty;
    const pinBoxPrice = priceOverrides['pinBox'] !== undefined 
      ? Number(priceOverrides['pinBox']) 
      : (priceOverrides['pin_box'] !== undefined ? Number(priceOverrides['pin_box']) : 0);
    const pinBoxCost = finalPinBoxQty * pinBoxPrice;

    bomRows.push({
      index: rowIndex++,
      id: 'mz_bom_pin_box',
      key: 'mat_mz_pin_box',
      component: 'PIN BOX',
      componentCategory: 'stop',
      materialId: 'mat_mz_pin_box',
      materialName: 'Pin Box',
      specification: `Pin Box (${pinBoxPerZipper}/zipper, Loss ${pinBoxLossPercent}%)`,
      unit: 'Pcs',
      totalQuantity: finalPinBoxQty,
      avgQtyPerZipper: totalOrderQuantity > 0 ? (finalPinBoxQty / totalOrderQuantity) : 0,
      unitPrice: pinBoxPrice,
      baseMaterialCost: pinBoxCost,
      wastageCost: 0,
      totalMaterialCost: pinBoxCost,
      wastagePercent: 0,
      isLengthDependent: false,
      isFactoryStandard: true,
      allowDelete: false,
      subtypeKey: (variants && variants.length > 0 && variants[0].zipperSize && variants[0].zipperSize.includes('5')) ? '#5' : '#3',
      subtypeName: `MZ${(variants && variants.length > 0 && variants[0].zipperSize && variants[0].zipperSize.includes('5')) ? '#5' : '#3'}`,
      subtypeLabel: `MZ ${(variants && variants.length > 0 && variants[0].zipperSize && variants[0].zipperSize.includes('5')) ? '#5' : '#3'}`,
      calculationDetail: {
        materialName: 'Pin Box',
        component: 'PIN BOX',
        category: 'mz',
        size: (variants && variants.length > 0 && variants[0].zipperSize && variants[0].zipperSize.includes('5')) ? '#5' : '#3',
        unit: 'Pcs',
        relevantZipperQuantity: relevantPinBoxQty,
        pinBoxPerZipper: pinBoxPerZipper,
        baseQuantity: basePinBox,
        lossPercent: pinBoxLossPercent,
        lossQuantity: pinBoxLossQty,
        finalQuantity: finalPinBoxQty,
        displayQuantity: `${finalPinBoxQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`,
        baseFormula: `Final Pin Box (Pcs) = Base Pin Box × (1 + Loss %)\n                   = (Relevant Zipper Quantity × Pin Box / Zipper) × (1 + ${pinBoxLossPercent}% Loss)`,
        steps: [
          {
            stepNumber: 1,
            title: 'Relevant Zipper Quantity & Base Pin Box',
            explanation: 'Base Pin Box is derived from Relevant Zipper Quantity (Open-End & Two-Way zippers) multiplied by Pin Box per Zipper:',
            formula: `Relevant Zipper Quantity: ${relevantPinBoxQty.toLocaleString('en-US')} pcs × Pin Box / Zipper: ${pinBoxPerZipper} = Base Pin Box: ${basePinBox.toLocaleString('en-US')} Pcs`,
            result: `${basePinBox.toLocaleString('en-US')} Pcs`
          },
          {
            stepNumber: 2,
            title: `Applied Factory Loss (+${pinBoxLossPercent}%)`,
            explanation: `Factory loss rate of ${pinBoxLossPercent}% applied based on relevant order volume (${relevantPinBoxQty.toLocaleString('en-US')} pcs):`,
            formula: `Base Pin Box: ${basePinBox.toLocaleString('en-US')} Pcs × Loss Rate: ${pinBoxLossPercent}% = Loss Quantity: ${pinBoxLossQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`,
            result: `${pinBoxLossQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`
          },
          {
            stepNumber: 3,
            title: 'Final Pin Box Requirement (Pcs)',
            explanation: 'Final Pin Box quantity equals Base Pin Box plus Loss Quantity:',
            formula: `Base Pin Box: ${basePinBox.toLocaleString('en-US')} Pcs + Loss Quantity: ${pinBoxLossQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs = ${finalPinBoxQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`,
            result: `${finalPinBoxQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`
          }
        ]
      }
    });
  }

  // Include any custom material rows
  customRows.forEach(cr => {
    const customQty = Math.max(0, Number(cr.totalQuantity) || 0);
    const customPrice = Math.max(0, Number(cr.unitPrice) || 0);
    const customCost = customQty * customPrice;

    bomRows.push({
      index: rowIndex++,
      key: `custom_${cr.id || Math.random()}`,
      component: cr.component || 'Custom Item',
      componentCategory: 'other',
      materialId: cr.materialId || 'custom',
      materialName: cr.materialName || 'Custom Material',
      specification: cr.specification || 'User Defined',
      unit: cr.unit || 'pc',
      unitPrice: customPrice,
      wastagePercent: 0,
      totalQuantity: customQty,
      baseMaterialCost: customCost,
      wastageCost: 0,
      totalMaterialCost: customCost,
      avgQtyPerZipper: totalOrderQuantity > 0 ? (customQty / totalOrderQuantity) : 0,
      costPerZipper: totalOrderQuantity > 0 ? (customCost / totalOrderQuantity) : 0,
      formulaNote: 'Custom Added Row'
    });
  });

  // Calculate Aggregated BOM Totals
  let totalBaseMaterialCost = 0;
  let totalWastageCost = 0;
  bomRows.forEach(r => {
    totalBaseMaterialCost += r.baseMaterialCost;
    totalWastageCost += r.wastageCost;
  });
  const totalMaterialCost = totalBaseMaterialCost + totalWastageCost;
  const materialCostPerZipper = totalOrderQuantity > 0 ? (totalMaterialCost / totalOrderQuantity) : 0;

  // Build Formula Explanation Text for Transparent Calculation Breakdown
  const primaryResult = groupResults[primarySize] || Object.values(groupResults)[0];
  const formulaDetails = {
    category: 'mz',
    primarySize: primarySize,
    totalQuantity: totalOrderQuantity,
    groupResults: groupResults,
    steps: buildMZFormulaSteps(groupResults, lossPercent)
  };

  return {
    category: 'mz',
    totalQuantity: totalOrderQuantity,
    primaryResult: primaryResult,
    groupResults: groupResults,
    formulaDetails: formulaDetails,
    materials: {
      processedRows: bomRows.map(r => {
        const rowSize = (r.calculationDetail && r.calculationDetail.size) ? r.calculationDetail.size : primarySize;
        const matchingGroup = groupResults[rowSize] || Object.values(groupResults)[0] || {};
        return {
          ...r,
          subtypeKey: r.subtypeKey || rowSize,
          subtypeName: r.subtypeName || `MZ${rowSize}`,
          subtypeLabel: r.subtypeLabel || (rowSize === '#8' ? 'MZ#8 (Metal Zipper Size #8)' : (rowSize === '#3' ? 'MZ#3 (Metal Zipper Size #3)' : 'MZ#5 (Metal Zipper Size #5)')),
          sourceVariants: r.sourceVariants || (matchingGroup.variantBreakdowns || []).map(v => ({
            id: v.variantId || v.id,
            name: v.name || v.variantName || 'Variant',
            length: v.rawLength,
            unit: v.unit,
            quantity: v.quantity
          })),
          totalSubtypeQuantity: r.totalSubtypeQuantity || (matchingGroup.totalQuantity || totalOrderQuantity)
        };
      }),
      totalBaseMaterialCost,
      totalWastageCost,
      totalMaterialCost,
      materialCostPerZipper
    }
  };
}

/**
 * Generate human-readable mathematical steps explaining the MZ calculation
 * @param {Object} groupResults 
 * @param {number} lossPercent 
 * @returns {Array<Object>}
 */
function buildMZFormulaSteps(groupResults, lossPercent) {
  const steps = [];

  for (const [size, res] of Object.entries(groupResults)) {
    if (!res || res.totalQuantity === 0) continue;

    steps.push({
      title: `Step 1: Size ${size} Chain Consumption Calculation`,
      explanation: `For ${size} metal zippers, length allowance is ${res.constants.inchAllowance}" (Inch) / ${res.constants.cmAllowance} cm (CM).`,
      variants: res.variantBreakdowns.map(vb => ({
        label: `${vb.name} (${vb.rawLength} ${vb.unit} | ${vb.quantity.toLocaleString()} pcs)`,
        formula: vb.formulaString,
        result: `${vb.chainConsumptionMtr.toFixed(2)} Mtr`
      })),
      subtotalLabel: `Subtotal Chain Consumption (${size})`,
      subtotalValue: `${res.chainConsumptionMtr.toFixed(2)} Mtr (Display: ${res.display.chainConsumptionMtr} Mtr)`
    });

    const effectiveLoss = res.lossPercent !== undefined ? res.lossPercent : lossPercent;
    steps.push({
      title: `Step 2: Total Tape Requirement (${size})`,
      explanation: `Apply ${effectiveLoss}% tape loss and divide by the factory tape factor (${res.constants.tapeDivisor}).`,
      formula: `[${res.chainConsumptionMtr.toFixed(2)} Mtr × (1 + ${effectiveLoss}/100)] / ${res.constants.tapeDivisor} = ${res.totalTapeKg.toFixed(4)} KG`,
      result: `${res.display.totalTapeKg} KG Tape`
    });

    if (res.constants.teethWireDivisor && res.teethWireKg > 0) {
      steps.push({
        title: `Step 3: Teeth Wire Requirement (${size})`,
        explanation: `Calculate wire required for teeth forming (Divisor: ${res.constants.teethWireDivisor}, Loss: ${res.constants.teethWireLossPercent}%).`,
        formula: `[${res.chainConsumptionMtr.toFixed(2)} Mtr / ${res.constants.teethWireDivisor}] × 1.04 = ${res.teethWireKg.toFixed(4)} KG`,
        result: `${res.display.teethWireKg} KG Teeth Wire`
      });
    }

    if (res.topStopKg > 0) {
      steps.push({
        title: `Step 4: Top Stop Wire (${size})`,
        explanation: `Top stop wire calculated at ${res.constants.topStopFactor} kg per 1,000 zippers.`,
        formula: `(${res.totalQuantity.toLocaleString()} pcs × ${res.constants.topStopFactor}) / 1000 = ${res.topStopKg.toFixed(4)} KG`,
        result: `${res.display.topStopKg} KG`
      });
    }

    if (res.constants.hasHBottom && res.hBottomPcs > 0) {
      steps.push({
        title: `Step 5: H-Bottom Stop (${size})`,
        explanation: `H-Bottom stop calculated with dynamic +${res.activeParams.hBottomLossPercent}% loss factor.`,
        formula: `${res.totalQuantity.toLocaleString()} pcs × ${res.activeParams.hBottomMultiplier} (+${res.activeParams.hBottomLossPercent}%) = ${res.hBottomPcs.toFixed(2)} pcs`,
        result: `${res.display.hBottomPcs} Pcs`
      });
    } else if (res.bottomStopKg > 0) {
      steps.push({
        title: `Step 5: Bottom Stop Wire (${size})`,
        explanation: `Bottom stop wire calculated at ${res.constants.bottomStopFactor} kg per 1,000 zippers.`,
        formula: `(${res.totalQuantity.toLocaleString()} pcs × ${res.constants.bottomStopFactor}) / 1000 = ${res.bottomStopKg.toFixed(4)} KG`,
        result: `${res.display.bottomStopKg} KG`
      });
    }

    steps.push({
      title: `Step 6: Slider Requirement (${size})`,
      explanation: `Sliders calculated with standard +1.5% factory addition.`,
      formula: `${res.totalQuantity.toLocaleString()} pcs × 1.015 = ${res.sliderPcs.toFixed(2)} pcs`,
      result: `${res.display.sliderPcs} Pcs`
    });
  }

  return steps;
}

// Export for Vanilla JS & Node.js
if (typeof window !== 'undefined') {
  window.MZFormulaEngine = {
    MZ_CONSTANTS,
    MZ_DEFAULT_PRICES,
    normalizeMZSize,
    normalizeMZUnit,
    calculateMZGroup,
    calculateMZMaster
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MZ_CONSTANTS,
    MZ_DEFAULT_PRICES,
    normalizeMZSize,
    normalizeMZUnit,
    calculateMZGroup,
    calculateMZMaster
  };
}
