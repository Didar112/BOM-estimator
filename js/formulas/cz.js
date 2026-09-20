/**
 * Factory Formula Engine for CZ (Nylon Zipper)
 * 
 * IMPORTANT: This module is the SOURCE OF TRUTH implementation for Factory Excel
 * manufacturing calculations for Nylon Zipper (CZ#3 and CZ#5) in both Inch and CM units.
 * 
 * Formulas, constants, and divisor factors must NOT be altered or simplified.
 * Full JavaScript numerical precision is preserved across all intermediate steps.
 */

// ==================== 1. IMMUTABLE FACTORY CONSTANTS ====================
const CZ_CONSTANTS = {
  '#3': {
    sizeName: 'CZ#3 (Nylon Zipper Size #3)',
    inchAllowance: 1.58,       // EXACT: 1.58 inch
    cmAllowance: 4.0,          // EXACT: 4.0 cm
    inchDivisor: 39.37,        // EXACT: 39.37 inch per meter conversion
    cmDivisor: 100.0,          // EXACT: 100 cm per meter
    tapeDivisor: 87.0,         // EXACT: 87 divisor for CZ#3 Tape KG
    topStopFactor: 0.02,       // EXACT: 0.02 factor
    topStopDivisor: 1000.0,
    bottomStopFactor: 0.03,    // EXACT: 0.03 factor
    bottomStopDivisor: 1000.0,
    resinDivisor: 1000.0,      // EXACT: 1000 divisor
    hasUTop: false,            // CZ#3 does not use ultrasonic U-Top
    uTopFactor: 0,
    uTopDivisor: 1000.0,
    tollilon1Divisor: 14400.0, // EXACT: 14400
    tollilon1Multiplier: 100.0,
    tollilon2Divisor: 9500.0,  // EXACT: 9500
    tollilon2Multiplier: 100.0,
    sliderAdditionPercent: 1.5,// EXACT: 1.5% addition (1.015)
    sliderMultiplier: 1.015
  },
  '#5': {
    sizeName: 'CZ#5 (Nylon Zipper Size #5)',
    inchAllowance: 1.78,       // EXACT: 1.78 inch
    cmAllowance: 4.5,          // EXACT: 4.5 cm
    inchDivisor: 39.37,        // EXACT: 39.37 inch per meter conversion
    cmDivisor: 100.0,          // EXACT: 100 cm per meter
    tapeDivisor: 54.5,         // EXACT: 54.5 divisor for CZ#5 Tape KG
    topStopFactor: 0.04,       // EXACT: 0.04 factor
    topStopDivisor: 1000.0,
    bottomStopFactor: 0.04,    // EXACT: 0.04 factor
    bottomStopDivisor: 1000.0,
    resinDivisor: 900.0,       // EXACT: 900 divisor
    hasUTop: true,             // EXACT: CZ#5 has Ultrasonic U-Top
    uTopFactor: 0.074,         // EXACT: 0.074 factor
    uTopDivisor: 1000.0,
    tollilon1Divisor: 7700.0,  // EXACT: 7700
    tollilon1Multiplier: 100.0,
    tollilon2Divisor: 8600.0,  // EXACT: 8600
    tollilon2Multiplier: 100.0,
    sliderAdditionPercent: 1.5,// EXACT: 1.5% addition (1.015)
    sliderMultiplier: 1.015
  }
};

/**
 * Standard factory reference prices for default BOM cost evaluation in BDT (৳)
 */
const CZ_DEFAULT_PRICES = {
  '#3': {
    tapeKg: 450.00,       // ৳ / KG
    slider: 3.50,         // ৳ / pc
    topStopKg: 280.00,    // ৳ / KG
    bottomStopKg: 280.00, // ৳ / KG
    resinKg: 320.00,      // ৳ / KG
    tollilonWire: 1.50,   // ৳ / unit
    uTopKg: 350.00        // ৳ / KG
  },
  '#5': {
    tapeKg: 420.00,       // ৳ / KG
    slider: 4.80,         // ৳ / pc
    topStopKg: 280.00,    // ৳ / KG
    bottomStopKg: 280.00, // ৳ / KG
    resinKg: 320.00,      // ৳ / KG
    tollilonWire: 1.50,   // ৳ / unit
    uTopKg: 350.00        // ৳ / KG
  }
};

/**
 * Normalize size string to '#3' or '#5'
 * Defaults to '#5' if not recognized, or '#3' if specified.
 * @param {string} sizeStr 
 * @returns {string} '#3' | '#5'
 */
function normalizeCZSize(sizeStr) {
  const s = String(sizeStr || '').trim();
  if (s.includes('3')) return '#3';
  return '#5';
}

/**
 * Normalize unit string to 'inch' or 'cm'
 * @param {string} unitStr 
 * @returns {'inch'|'cm'}
 */
function normalizeCZUnit(unitStr) {
  const u = String(unitStr || '').toLowerCase().trim();
  if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return 'cm';
  if (u === 'mm' || u === 'millimeter') return 'cm'; // convert mm to cm internally if used
  return 'inch';
}

/**
 * Calculate CZ factory calculations for a specific size group of variants
 * @param {Array<Object>} variants - Variants belonging to this CZ size
 * @param {string} czSize - '#3' | '#5'
 * @param {number} [globalLossPercent=3.0] - Default 3%
 * @returns {Object} Full calculation results with intermediate values and formula explanations
 */
/**
 * Calculate CZ factory calculations for a specific size group of variants
 * @param {Array<Object>} variants - Variants belonging to this CZ size
 * @param {string} czSize - '#3' | '#5'
 * @param {number} [globalLossPercent=3.0] - Default 3%
 * @param {number} [customSliderAdditionPercent=null] - Optional custom slider addition percentage
 * @param {Object} [customParams={}] - Optional dynamic production parameter overrides
 * @returns {Object} Full calculation results with intermediate values and formula explanations
 */
function calculateCZGroup(variants, czSize = '#3', globalLossPercent = 3.0, customSliderAdditionPercent = null, customParams = {}) {
  const sizeKey = normalizeCZSize(czSize);
  const cfg = CZ_CONSTANTS[sizeKey];
  const lossPercent = Math.max(0, Number(globalLossPercent) || 0);

  const defaultSliderPercent = cfg.sliderAdditionPercent || 1.5;
  const sliderAdditionPercent = (customSliderAdditionPercent !== null && customSliderAdditionPercent !== undefined && !isNaN(customSliderAdditionPercent))
    ? Math.max(0, Number(customSliderAdditionPercent))
    : defaultSliderPercent;
  const sliderMultiplier = 1 + (sliderAdditionPercent / 100);
  const isSliderCustom = Math.abs(sliderAdditionPercent - defaultSliderPercent) > 0.0001;

  // Dynamic Custom CZ Parameters (Falling back to size defaults)
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

  const topStopFactor = (customParams && customParams.topStopFactor !== undefined && !isNaN(customParams.topStopFactor) && Number(customParams.topStopFactor) >= 0)
    ? Number(customParams.topStopFactor)
    : cfg.topStopFactor;

  const topStopDivisor = (customParams && customParams.topStopDivisor !== undefined && !isNaN(customParams.topStopDivisor) && Number(customParams.topStopDivisor) > 0)
    ? Number(customParams.topStopDivisor)
    : (cfg.topStopDivisor || 1000.0);

  const bottomStopFactor = (customParams && customParams.bottomStopFactor !== undefined && !isNaN(customParams.bottomStopFactor) && Number(customParams.bottomStopFactor) >= 0)
    ? Number(customParams.bottomStopFactor)
    : cfg.bottomStopFactor;

  const bottomStopDivisor = (customParams && customParams.bottomStopDivisor !== undefined && !isNaN(customParams.bottomStopDivisor) && Number(customParams.bottomStopDivisor) > 0)
    ? Number(customParams.bottomStopDivisor)
    : (cfg.bottomStopDivisor || 1000.0);

  const resinDivisor = (customParams && customParams.resinDivisor !== undefined && !isNaN(customParams.resinDivisor) && Number(customParams.resinDivisor) > 0)
    ? Number(customParams.resinDivisor)
    : cfg.resinDivisor;

  const tollilon1Divisor = (customParams && customParams.tollilon1Divisor !== undefined && !isNaN(customParams.tollilon1Divisor) && Number(customParams.tollilon1Divisor) > 0)
    ? Number(customParams.tollilon1Divisor)
    : cfg.tollilon1Divisor;
  const tollilon1Multiplier = cfg.tollilon1Multiplier || 100.0;

  const tollilon2Divisor = (customParams && customParams.tollilon2Divisor !== undefined && !isNaN(customParams.tollilon2Divisor) && Number(customParams.tollilon2Divisor) > 0)
    ? Number(customParams.tollilon2Divisor)
    : cfg.tollilon2Divisor;
  const tollilon2Multiplier = cfg.tollilon2Multiplier || 100.0;

  const uTopFactor = (customParams && customParams.uTopFactor !== undefined && !isNaN(customParams.uTopFactor) && Number(customParams.uTopFactor) >= 0)
    ? Number(customParams.uTopFactor)
    : (cfg.uTopFactor !== undefined ? cfg.uTopFactor : 0.074);
  const uTopDivisor = (customParams && customParams.uTopDivisor !== undefined && !isNaN(customParams.uTopDivisor) && Number(customParams.uTopDivisor) > 0)
    ? Number(customParams.uTopDivisor)
    : (cfg.uTopDivisor || 1000.0);

  const activeParams = {
    chainAllowance: inchAllowance,
    inchAllowance,
    cmAllowance,
    tapeDivisor,
    topStopFactor,
    topStopDivisor,
    bottomStopFactor,
    bottomStopDivisor,
    resinDivisor,
    tollilon1Divisor,
    tollilon1Multiplier,
    tollilon2Divisor,
    tollilon2Multiplier,
    hasUTop: cfg.hasUTop,
    uTopFactor,
    uTopDivisor
  };

  // 1. Process each variant input and calculate individual base chain consumption
  let totalQuantity = 0;
  let totalBaseChainConsumptionMtr = 0;
  let totalAdjustedLength = 0;
  const variantBreakdowns = [];

  variants.forEach((v, idx) => {
    const qty = Math.max(0, Number(v.quantity) || 0);
    const rawLength = Math.max(0, Number(v.length) || 0);
    const unit = normalizeCZUnit(v.lengthUnit || 'inch');

    totalQuantity += qty;

    let allowance = 0;
    let unitDivisor = 1;
    let lengthValue = rawLength;

    if (unit === 'cm') {
      allowance = cmAllowance;
      unitDivisor = cfg.cmDivisor;
    } else {
      // Inch (default)
      allowance = inchAllowance;
      unitDivisor = cfg.inchDivisor;
    }

    // Exact Factory Formula per variant: [(Length + Allowance) * Quantity / UnitDivisor]
    const lengthWithAllowance = lengthValue + allowance;
    const adjustedVariantLength = lengthWithAllowance * qty;
    const variantChainMtr = adjustedVariantLength / unitDivisor;
    
    totalBaseChainConsumptionMtr += variantChainMtr;
    totalAdjustedLength += adjustedVariantLength;

    variantBreakdowns.push({
      variantId: v.id || `var_${idx + 1}`,
      variantName: v.name || `Variant ${idx + 1}`,
      rawLength,
      unit,
      quantity: qty,
      allowance,
      unitDivisor,
      lengthWithAllowance,
      adjustedTotalLength: adjustedVariantLength,
      chainConsumptionMtr: variantChainMtr,
      formulaString: `(Length: ${rawLength} ${unit} + Allowance: ${allowance} ${unit}) × Quantity: ${qty.toLocaleString('en-US')} pcs ÷ Divisor: ${unitDivisor} = ${variantChainMtr.toFixed(2)} Mtr`
    });
  });

  // 2. Separate Loss Calculation & Loss-Inclusive Chain Requirement
  // Loss Amount (Mtr) = Base Chain Consumption * 3%
  const lossMtr = totalBaseChainConsumptionMtr * (lossPercent / 100);
  
  // Loss-Inclusive Chain Requirement = Base Chain Consumption + Loss
  const lossInclusiveChainMtr = totalBaseChainConsumptionMtr + lossMtr;
  
  // Final Tape KG = Loss-Inclusive Chain Requirement ÷ Tape Divisor
  const totalTapeKg = lossInclusiveChainMtr / tapeDivisor;

  // 3. Top Stop (T/S)
  // T/S (KG) = Total Quantity * topStopFactor / 1000
  const topStopKg = (totalQuantity * topStopFactor) / topStopDivisor;

  // 4. Bottom Stop (B/S)
  // B/S (KG) = Total Quantity * bottomStopFactor / 1000
  const bottomStopKg = (totalQuantity * bottomStopFactor) / bottomStopDivisor;

  // 5. Resin
  // Resin (KG) = Total Quantity / resinDivisor
  const resinKg = totalQuantity / resinDivisor;

  // 6. Tollilon Flat Wire
  // Tollilon #1 = Total Quantity / tollilon1Divisor * 100
  const tollilonOne = (totalQuantity / tollilon1Divisor) * tollilon1Multiplier;

  // Tollilon #2 = Total Quantity / tollilon2Divisor * 100
  const tollilonTwo = (totalQuantity / tollilon2Divisor) * tollilon2Multiplier;

  // Total Tollilon = Tollilon #1 + Tollilon #2
  const totalTollilon = tollilonOne + tollilonTwo;

  // 7. Ultrasonic U-Top (only for CZ#5)
  let uTopKg = 0;
  if (cfg.hasUTop) {
    uTopKg = (totalQuantity * uTopFactor) / uTopDivisor;
  }

  // 8. Slider (+1.5% or Custom Addition)
  // Slider Quantity = Total Quantity + Slider Addition
  const sliderAdditionPcs = (totalQuantity * sliderAdditionPercent) / 100;
  const sliderQuantity = totalQuantity + sliderAdditionPcs;

  // 9. Structured Step-by-Step Formula Strings for UI Display
  const formulaDetails = {
    category: 'cz',
    size: sizeKey,
    sizeName: cfg.sizeName,
    lossPercent,
    sliderAdditionPercent,
    sliderMultiplier,
    sliderAdditionPcs,
    isSliderCustom,
    activeParams,
    totalQuantity,
    variants: variantBreakdowns,
    
    // Total Quantity Step
    totalQtyFormula: variantBreakdowns.map(v => `${v.quantity.toLocaleString('en-US')}`).join(' + ') + ` = ${totalQuantity.toLocaleString('en-US')} pcs`,
    
    // Base Chain Consumption Step (Pre-Loss)
    baseChainConsumptionRaw: totalBaseChainConsumptionMtr,
    baseChainConsumptionDisplay: `${totalBaseChainConsumptionMtr.toFixed(2)} Mtr (Display: ${Math.round(totalBaseChainConsumptionMtr).toLocaleString('en-US')} Mtr)`,
    chainConsumptionFormula: variantBreakdowns.map(v => v.formulaString).join('\n+ ') + `\n= ${totalBaseChainConsumptionMtr.toFixed(2)} Mtr (Display: ${Math.round(totalBaseChainConsumptionMtr).toLocaleString('en-US')} Mtr)`,
    chainConsumptionRaw: totalBaseChainConsumptionMtr,
    chainConsumptionDisplay: totalBaseChainConsumptionMtr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    
    // Loss Step (Calculated Separately)
    lossFormula: `${totalBaseChainConsumptionMtr.toFixed(2)} Mtr × ${lossPercent}% = ${lossMtr.toFixed(2)} Mtr`,
    lossMtrRaw: lossMtr,
    lossMtrDisplay: `${lossMtr.toFixed(2)} Mtr`,
    lossInclusiveRequirementFormula: `${totalBaseChainConsumptionMtr.toFixed(2)} Mtr + ${lossMtr.toFixed(2)} Mtr = ${lossInclusiveChainMtr.toFixed(2)} Mtr`,
    lossInclusiveChainMtrRaw: lossInclusiveChainMtr,
    lossInclusiveChainMtrDisplay: `${lossInclusiveChainMtr.toFixed(2)} Mtr`,

    // Tape KG Step
    tapeKgFormula: `${lossInclusiveChainMtr.toFixed(2)} Mtr ÷ ${tapeDivisor} = ${totalTapeKg.toFixed(4)} KG`,
    tapeKgRaw: totalTapeKg,
    tapeKgDisplay: `${totalTapeKg.toFixed(2)} KG`,

    // Top Stop (T/S) Step
    topStopFormula: `${totalQuantity.toLocaleString('en-US')} × ${topStopFactor} / ${topStopDivisor} = ${(topStopKg).toFixed(5)} ≈ ${topStopKg.toFixed(2)} KG`,
    topStopKgRaw: topStopKg,
    topStopKgDisplay: topStopKg.toFixed(2),

    // Bottom Stop (B/S) Step
    bottomStopFormula: `${totalQuantity.toLocaleString('en-US')} × ${bottomStopFactor} / ${bottomStopDivisor} = ${(bottomStopKg).toFixed(5)} ≈ ${bottomStopKg.toFixed(2)} KG`,
    bottomStopKgRaw: bottomStopKg,
    bottomStopKgDisplay: bottomStopKg.toFixed(2),

    // Resin Step
    resinFormula: `${totalQuantity.toLocaleString('en-US')} / ${resinDivisor} = ${resinKg.toFixed(3)} KG ≈ ${resinKg.toFixed(2)} KG`,
    resinKgRaw: resinKg,
    resinKgDisplay: resinKg.toFixed(2),

    // Tollilon Step
    tollilon1Formula: `${totalQuantity.toLocaleString('en-US')} / ${tollilon1Divisor.toLocaleString('en-US')} × 100 ≈ ${tollilonOne.toFixed(2)} (Display: ${Math.round(tollilonOne)})`,
    tollilon2Formula: `${totalQuantity.toLocaleString('en-US')} / ${tollilon2Divisor.toLocaleString('en-US')} × 100 ≈ ${tollilonTwo.toFixed(2)} (Display: ${Math.round(tollilonTwo)})`,
    totalTollilonFormula: `${tollilonOne.toFixed(2)} + ${tollilonTwo.toFixed(2)} ≈ ${totalTollilon.toFixed(2)} (Display: ${Math.round(totalTollilon)})`,
    tollilonOneRaw: tollilonOne,
    tollilonTwoRaw: tollilonTwo,
    totalTollilonRaw: totalTollilon,
    totalTollilonDisplay: Math.round(totalTollilon),

    // Ultrasonic U-Top Step (CZ#5)
    hasUTop: cfg.hasUTop,
    uTopFormula: cfg.hasUTop ? `${totalQuantity.toLocaleString('en-US')} × ${uTopFactor} / ${uTopDivisor} = ${uTopKg.toFixed(4)} ≈ ${uTopKg.toFixed(2)} KG` : null,
    uTopKgRaw: uTopKg,
    uTopKgDisplay: uTopKg.toFixed(2),

    // Slider Step
    sliderFormula: `${totalQuantity.toLocaleString('en-US')} × ${Number(sliderMultiplier.toFixed(4))} = ${sliderQuantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PCS`,
    sliderQuantityRaw: sliderQuantity,
    sliderQuantityDisplay: sliderQuantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    steps: []
  };

  const groupResult = {
    czSize: sizeKey,
    constants: { ...cfg, ...activeParams },
    activeParams,
    totalQuantity,
    baseChainConsumptionMtr: totalBaseChainConsumptionMtr,
    chainConsumptionMtr: totalBaseChainConsumptionMtr, // Pre-loss Base Chain Consumption
    totalAdjustedLength,
    lossPercent,
    sliderAdditionPercent,
    sliderMultiplier,
    sliderAdditionPcs,
    isSliderCustom,
    lossMtr,
    lossInclusiveChainMtr,
    totalChainWithLossMtr: lossInclusiveChainMtr,
    totalTapeKg,
    topStopKg,
    bottomStopKg,
    resinKg,
    tollilonOne,
    tollilonTwo,
    totalTollilon,
    uTopKg,
    sliderQuantity,
    variantBreakdowns,
    formulaDetails
  };

  formulaDetails.steps = buildCZFormulaSteps([groupResult], lossPercent);
  return groupResult;
}

/**
 * Generate Factory-Standard BOM Table Rows for CZ Category
 * Constructs exact factory rows for the Consolidated BOM table.
 * @param {Object} czCalcResult - Result from calculateCZGroup or multi-size aggregator
 * @param {Array<Object>} existingCustomRows - Any user-added custom materials
 * @param {Object} [priceOverrides={}] - User-edited unit prices or custom pricing
 * @returns {Array<Object>} Consolidated BOM material rows
 */
function buildCZConsolidatedBOMRows(czCalcResult, existingCustomRows = [], priceOverrides = {}) {
  const sizeKey = czCalcResult.czSize || '#3';
  const defaultPrices = CZ_DEFAULT_PRICES[sizeKey] || CZ_DEFAULT_PRICES['#3'];
  const activeParams = czCalcResult.activeParams || czCalcResult.constants || CZ_CONSTANTS[sizeKey] || CZ_CONSTANTS['#3'];
  const totalQty = czCalcResult.totalQuantity || 1;
  const rows = [];

  // Helper to extract or fallback price
  const getPrice = (key, defaultVal) => {
    if (priceOverrides[key] !== undefined && priceOverrides[key] !== null && priceOverrides[key] !== '') {
      return Number(priceOverrides[key]);
    }
    return defaultVal;
  };

  const sizeNum = sizeKey.replace('#', '');

  // 1. TOTAL TAPE KG (KG) - Primary physical tape material
  const tapeKg = czCalcResult.totalTapeKg || 0;
  const tapePrice = getPrice(`tapeKg_${sizeNum}`, getPrice('tapeKg', defaultPrices.tapeKg));
  rows.push({
    id: `cz_bom_tape_kg_${sizeNum}`,
    key: `mat_cz_tape_kg_${sizeNum}`,
    component: 'TOTL TAPE KG',
    componentCategory: 'tape',
    materialId: `mat_cz_tape_kg_${sizeNum}`,
    materialName: `CZ${sizeKey} Tape`,
    specification: `Factory Tape (Divisor ${activeParams.tapeDivisor}, Loss ${czCalcResult.lossPercent}%)`,
    unit: 'KG',
    totalQuantity: tapeKg,
    avgQtyPerZipper: totalQty > 0 ? (tapeKg / totalQty) : 0,
    unitPrice: tapePrice,
    wastagePercent: 0, // Loss is already factored into Total Tape KG by factory formula
    isLengthDependent: true,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: `CZ${sizeKey} Tape`,
      component: 'TOTL TAPE KG',
      category: 'cz',
      size: sizeKey,
      unit: 'KG',
      finalQuantity: tapeKg,
      displayQuantity: `${tapeKg.toFixed(2)} KG`,
      baseFormula: `Base Chain (Mtr) = Sum of [ (Length + Allowance) × Quantity ] ÷ Unit Divisor (39.37 for Inch / 100 for CM)\nLoss-Inclusive Chain (Mtr) = Base Chain (Mtr) + (${czCalcResult.lossPercent}% Factory Loss)\nTotal Tape (KG) = Loss-Inclusive Chain (Mtr) ÷ Tape Divisor (${activeParams.tapeDivisor} Mtr/KG)`,
      steps: [
        {
          stepNumber: 1,
          title: 'Variant Lengths & Factory Allowance',
          explanation: `Factory allowance for CZ${sizeKey} is ${activeParams.inchAllowance}" (or ${activeParams.cmAllowance} cm). Unit divisor: 39.37 inch/meter (or 100 cm/meter).`,
          variants: (czCalcResult.variantBreakdowns || []).map(v => ({
            label: `${v.variantName || 'Variant'}: Length ${v.rawLength} ${v.unit} × Quantity ${(v.quantity || 0).toLocaleString()} pcs`,
            formula: v.formulaString || `(Length: ${v.rawLength} ${v.unit} + Allowance: ${v.allowance} ${v.unit}) × Quantity: ${v.quantity} pcs ÷ Divisor: ${v.unitDivisor} = ${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`,
            result: `${(v.chainConsumptionMtr || 0).toFixed(2)} Mtr`
          })),
          subtotalLabel: 'Base Chain Consumption',
          subtotalValue: `${(czCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr`
        },
        {
          stepNumber: 2,
          title: `Factory Loss Addition (+${czCalcResult.lossPercent}%)`,
          explanation: `Production loss of ${czCalcResult.lossPercent}% is calculated separately and added to base chain meters:`,
          formula: `Base Chain: ${(czCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr × Loss Rate: ${czCalcResult.lossPercent}% = Loss Amount: ${(czCalcResult.lossMtr || 0).toFixed(2)} Mtr\nTotal Loss-Inclusive Chain = Base Chain: ${(czCalcResult.baseChainConsumptionMtr || 0).toFixed(2)} Mtr + Loss: ${(czCalcResult.lossMtr || 0).toFixed(2)} Mtr = ${(czCalcResult.lossInclusiveChainMtr || 0).toFixed(2)} Mtr`,
          result: `${(czCalcResult.lossInclusiveChainMtr || 0).toFixed(2)} Mtr`
        },
        {
          stepNumber: 3,
          title: 'Final Tape Weight Requirement (KG)',
          explanation: `Loss-inclusive chain requirement is divided by the CZ${sizeKey} tape divisor (${activeParams.tapeDivisor} Mtr/KG):`,
          formula: `Loss-Inclusive Chain: ${(czCalcResult.lossInclusiveChainMtr || 0).toFixed(2)} Mtr ÷ Tape Divisor: ${activeParams.tapeDivisor} Mtr/KG = ${(tapeKg).toFixed(4)} KG ≈ ${(tapeKg).toFixed(2)} KG`,
          result: `${(tapeKg).toFixed(2)} KG`
        }
      ]
    }
  });

  // 2. SLIDER WITH ADDITION (Pcs)
  const sliderQty = czCalcResult.sliderQuantity || 0;
  const sliderPrice = getPrice(`slider_${sizeNum}`, getPrice('slider', defaultPrices.slider));
  const sliderPercent = czCalcResult.sliderAdditionPercent !== undefined ? czCalcResult.sliderAdditionPercent : 1.5;
  const isSliderCustom = czCalcResult.isSliderCustom || (Math.abs(sliderPercent - 1.5) > 0.0001);
  const sliderMultiplier = czCalcResult.sliderMultiplier || (1 + sliderPercent / 100);
  const sliderAdditionPcs = czCalcResult.sliderAdditionPcs !== undefined ? czCalcResult.sliderAdditionPcs : ((czCalcResult.totalQuantity || 0) * (sliderPercent / 100));
  const customTag = isSliderCustom ? ' (Custom)' : '';
  const sliderComp = `SLIDER (+${sliderPercent}% ADD.)`;

  rows.push({
    id: `cz_bom_slider_${sizeNum}`,
    key: `mat_cz_slider_${sizeNum}`,
    component: sliderComp,
    componentCategory: 'slider',
    materialId: `mat_cz_slider_${sizeNum}`,
    materialName: `Slider CZ${sizeKey} (+${sliderPercent}% Add.)`,
    specification: `Slider with +${sliderPercent}% Factory Addition${customTag}`,
    unit: 'Pcs',
    totalQuantity: sliderQty,
    avgQtyPerZipper: totalQty > 0 ? (sliderQty / totalQty) : 0,
    unitPrice: sliderPrice,
    wastagePercent: 0, // slider addition is mathematically included in quantity
    isLengthDependent: false,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: `Slider CZ${sizeKey} (+${sliderPercent}% Add.)`,
      component: sliderComp,
      category: 'cz',
      size: sizeKey,
      unit: 'Pcs',
      sliderAdditionPercent: sliderPercent,
      isCustom: isSliderCustom,
      finalQuantity: sliderQty,
      displayQuantity: `${sliderQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`,
      baseFormula: `Total Required Sliders (Pcs) = Total Order Quantity × (1 + ${sliderPercent}% Factory Addition${customTag})\n                             = Total Order Quantity × ${Number(sliderMultiplier.toFixed(4))}`,
      steps: [
        {
          stepNumber: 1,
          title: 'Total Order Quantity',
          explanation: 'Sum of all variant quantities across this category group:',
          formula: `Sum of Variant Quantities: ` + (czCalcResult.variantBreakdowns || []).map(v => `${(v.quantity || 0).toLocaleString()} pcs`).join(' + ') + ` = Total Order Quantity: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`,
          result: `${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`
        },
        {
          stepNumber: 2,
          title: `Slider Requirement with +${sliderPercent}% Addition${customTag}`,
          explanation: `Applies the ${sliderPercent}% factory slider allowance multiplier (${Number(sliderMultiplier.toFixed(4))}):`,
          formula: `Order Quantity: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs × Slider Addition Factor: ${Number(sliderMultiplier.toFixed(4))} (+${sliderPercent}%${customTag}) = ${sliderQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs\n[Slider Addition: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs × ${sliderPercent}% = ${sliderAdditionPcs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pcs]`,
          result: `${sliderQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Pcs`
        }
      ]
    }
  });

  // 3. TOP STOP (T/S) (KG)
  const topStopKg = czCalcResult.topStopKg || 0;
  const tsPrice = getPrice(`topStopKg_${sizeNum}`, getPrice('topStopKg', defaultPrices.topStopKg));
  const tsComponent = sizeKey === '#3' ? 'CZ#3 T/S' : 'T/S#5';
  rows.push({
    id: `cz_bom_top_stop_${sizeNum}`,
    key: `mat_cz_ts_${sizeNum}`,
    component: tsComponent,
    componentCategory: 'stop',
    materialId: `mat_cz_ts_${sizeNum}`,
    materialName: `CZ${sizeKey} Top Stop Wire`,
    specification: `Top Stop Factor ${activeParams.topStopFactor} / ${activeParams.topStopDivisor || 1000}`,
    unit: 'KG',
    totalQuantity: topStopKg,
    avgQtyPerZipper: totalQty > 0 ? (topStopKg / totalQty) : 0,
    unitPrice: tsPrice,
    wastagePercent: 0,
    isLengthDependent: false,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: `CZ${sizeKey} Top Stop Wire`,
      component: tsComponent,
      category: 'cz',
      size: sizeKey,
      unit: 'KG',
      finalQuantity: topStopKg,
      displayQuantity: `${topStopKg.toFixed(2)} KG`,
      baseFormula: `Top Stop Wire (KG) = (Total Order Quantity × Top Stop Factor: ${activeParams.topStopFactor}) ÷ Divisor: ${activeParams.topStopDivisor || 1000}`,
      steps: [
        {
          stepNumber: 1,
          title: 'Total Order Quantity',
          explanation: 'Sum of all variant quantities across this category group:',
          formula: `Total Order Quantity = ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`,
          result: `${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`
        },
        {
          stepNumber: 2,
          title: 'Top Stop Wire Weight Formula',
          explanation: `For CZ${sizeKey}, top stop factor is ${activeParams.topStopFactor} / ${activeParams.topStopDivisor || 1000}:`,
          formula: `Order Quantity: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs × Factor: ${activeParams.topStopFactor} ÷ Divisor: ${activeParams.topStopDivisor || 1000} = ${(topStopKg).toFixed(5)} KG ≈ ${topStopKg.toFixed(2)} KG`,
          result: `${topStopKg.toFixed(2)} KG`
        }
      ]
    }
  });

  // 4. BOTTOM STOP (B/S) (KG)
  const bottomStopKg = czCalcResult.bottomStopKg || 0;
  const bsPrice = getPrice(`bottomStopKg_${sizeNum}`, getPrice('bottomStopKg', defaultPrices.bottomStopKg));
  const bsComponent = sizeKey === '#3' ? 'CZ#3 B/S' : 'B/S#5';
  rows.push({
    id: `cz_bom_bottom_stop_${sizeNum}`,
    key: `mat_cz_bs_${sizeNum}`,
    component: bsComponent,
    componentCategory: 'stop',
    materialId: `mat_cz_bs_${sizeNum}`,
    materialName: `CZ${sizeKey} Bottom Stop Wire`,
    specification: `Bottom Stop Factor ${activeParams.bottomStopFactor} / ${activeParams.bottomStopDivisor || 1000}`,
    unit: 'KG',
    totalQuantity: bottomStopKg,
    avgQtyPerZipper: totalQty > 0 ? (bottomStopKg / totalQty) : 0,
    unitPrice: bsPrice,
    wastagePercent: 0,
    isLengthDependent: false,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: `CZ${sizeKey} Bottom Stop Wire`,
      component: bsComponent,
      category: 'cz',
      size: sizeKey,
      unit: 'KG',
      finalQuantity: bottomStopKg,
      displayQuantity: `${bottomStopKg.toFixed(2)} KG`,
      baseFormula: `Bottom Stop Wire (KG) = (Total Order Quantity × Bottom Stop Factor: ${activeParams.bottomStopFactor}) ÷ Divisor: ${activeParams.bottomStopDivisor || 1000}`,
      steps: [
        {
          stepNumber: 1,
          title: 'Total Order Quantity',
          explanation: 'Sum of all variant quantities across this category group:',
          formula: `Total Order Quantity = ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`,
          result: `${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`
        },
        {
          stepNumber: 2,
          title: 'Bottom Stop Wire Weight Formula',
          explanation: `For CZ${sizeKey}, bottom stop factor is ${activeParams.bottomStopFactor} / ${activeParams.bottomStopDivisor || 1000}:`,
          formula: `Order Quantity: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs × Factor: ${activeParams.bottomStopFactor} ÷ Divisor: ${activeParams.bottomStopDivisor || 1000} = ${(bottomStopKg).toFixed(5)} KG ≈ ${bottomStopKg.toFixed(2)} KG`,
          result: `${bottomStopKg.toFixed(2)} KG`
        }
      ]
    }
  });

  // 5. RESIN (KG)
  const resinKg = czCalcResult.resinKg || 0;
  const resinPrice = getPrice(`resinKg_${sizeNum}`, getPrice('resinKg', defaultPrices.resinKg));
  const resinComponent = sizeKey === '#3' ? 'RESIN FOR CZ#3' : 'CZ#5 RESIN';
  rows.push({
    id: `cz_bom_resin_${sizeNum}`,
    key: `mat_cz_resin_${sizeNum}`,
    component: resinComponent,
    componentCategory: 'resin',
    materialId: `mat_cz_resin_${sizeNum}`,
    materialName: sizeKey === '#3' ? 'Resin for CZ#3' : 'CZ#5 Resin',
    specification: `POM / Element Resin (Divisor ${activeParams.resinDivisor})`,
    unit: 'KG',
    totalQuantity: resinKg,
    avgQtyPerZipper: totalQty > 0 ? (resinKg / totalQty) : 0,
    unitPrice: resinPrice,
    wastagePercent: 0,
    isLengthDependent: false,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: sizeKey === '#3' ? 'Resin for CZ#3' : 'CZ#5 Resin',
      component: resinComponent,
      category: 'cz',
      size: sizeKey,
      unit: 'KG',
      finalQuantity: resinKg,
      displayQuantity: `${resinKg.toFixed(2)} KG`,
      baseFormula: `Resin Requirement (KG) = Total Order Quantity ÷ POM Resin Divisor: ${activeParams.resinDivisor}`,
      steps: [
        {
          stepNumber: 1,
          title: 'Total Order Quantity',
          explanation: 'Sum of all variant quantities across this category group:',
          formula: `Total Order Quantity = ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`,
          result: `${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`
        },
        {
          stepNumber: 2,
          title: 'POM Element Resin Weight Formula',
          explanation: `For CZ${sizeKey}, resin is calculated using factory divisor ${activeParams.resinDivisor}:`,
          formula: `Order Quantity: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs ÷ POM Divisor: ${activeParams.resinDivisor} = ${(resinKg).toFixed(4)} KG ≈ ${resinKg.toFixed(2)} KG`,
          result: `${resinKg.toFixed(2)} KG`
        }
      ]
    }
  });

  // 6. TOLLILON FLAT WIRE (Unit)
  const totalTollilon = czCalcResult.totalTollilon || 0;
  const tollilonPrice = getPrice(`tollilonWire_${sizeNum}`, getPrice('tollilonWire', defaultPrices.tollilonWire));
  rows.push({
    id: `cz_bom_tollilon_${sizeNum}`,
    key: `mat_cz_tollilon_${sizeNum}`,
    component: 'TOLLILON FLAT WIRE',
    componentCategory: 'wire',
    materialId: `mat_cz_tollilon_${sizeNum}`,
    materialName: `Tollilon Flat Wire (CZ${sizeKey})`,
    specification: `Tollilon #1 (/${activeParams.tollilon1Divisor.toLocaleString()}) + #2 (/${activeParams.tollilon2Divisor.toLocaleString()})`,
    unit: 'Unit',
    totalQuantity: totalTollilon,
    avgQtyPerZipper: totalQty > 0 ? (totalTollilon / totalQty) : 0,
    unitPrice: tollilonPrice,
    wastagePercent: 0,
    isLengthDependent: false,
    isFactoryStandard: true,
    allowDelete: false,
    calculationDetail: {
      materialName: `Tollilon Flat Wire (CZ${sizeKey})`,
      component: 'TOLLILON FLAT WIRE',
      category: 'cz',
      size: sizeKey,
      unit: 'Unit',
      finalQuantity: totalTollilon,
      displayQuantity: `${Math.round(totalTollilon)} Unit`,
      baseFormula: `Tollilon #1 = (Total Order Quantity ÷ Divisor: ${activeParams.tollilon1Divisor.toLocaleString()}) × 100\nTollilon #2 = (Total Order Quantity ÷ Divisor: ${activeParams.tollilon2Divisor.toLocaleString()}) × 100\nTotal Tollilon Requirement (Unit) = Tollilon #1 + Tollilon #2`,
      steps: [
        {
          stepNumber: 1,
          title: 'Total Order Quantity',
          explanation: 'Sum of all variant quantities across this category group:',
          formula: `Total Order Quantity = ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`,
          result: `${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`
        },
        {
          stepNumber: 2,
          title: 'Tollilon #1 & #2 Partial Calculations',
          explanation: `Tollilon #1 divisor: ${activeParams.tollilon1Divisor.toLocaleString()}, Tollilon #2 divisor: ${activeParams.tollilon2Divisor.toLocaleString()}:`,
          formula: `Tollilon #1 = (Order Qty: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs ÷ Divisor: ${activeParams.tollilon1Divisor.toLocaleString()}) × 100 = ${(czCalcResult.tollilonOne || 0).toFixed(2)} Units\nTollilon #2 = (Order Qty: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs ÷ Divisor: ${activeParams.tollilon2Divisor.toLocaleString()}) × 100 = ${(czCalcResult.tollilonTwo || 0).toFixed(2)} Units`,
          result: `T1: ${(czCalcResult.tollilonOne || 0).toFixed(2)} Units, T2: ${(czCalcResult.tollilonTwo || 0).toFixed(2)} Units`
        },
        {
          stepNumber: 3,
          title: 'Total Combined Tollilon Requirement',
          explanation: 'Sum of Tollilon #1 and Tollilon #2:',
          formula: `Tollilon #1: ${(czCalcResult.tollilonOne || 0).toFixed(2)} Units + Tollilon #2: ${(czCalcResult.tollilonTwo || 0).toFixed(2)} Units = ${(totalTollilon).toFixed(2)} Units ≈ ${Math.round(totalTollilon)} Unit`,
          result: `${Math.round(totalTollilon)} Unit`
        }
      ]
    }
  });

  // 7. ULTRASONIC U-TOP (only for CZ#5)
  if (activeParams.hasUTop || czCalcResult.constants.hasUTop) {
    const uTopKg = czCalcResult.uTopKg || 0;
    const uTopPrice = getPrice(`uTopKg_${sizeNum}`, getPrice('uTopKg', defaultPrices.uTopKg));
    rows.push({
      id: `cz_bom_utop_5`,
      key: `mat_cz_utop_5`,
      component: 'ULTRASONIC U-TOP',
      componentCategory: 'stop',
      materialId: `mat_cz_utop_5`,
      materialName: `Ultrasonic U-Top (CZ#5)`,
      specification: `Ultrasonic U-Top Factor ${activeParams.uTopFactor} / ${activeParams.uTopDivisor || 1000}`,
      unit: 'KG',
      totalQuantity: uTopKg,
      avgQtyPerZipper: totalQty > 0 ? (uTopKg / totalQty) : 0,
      unitPrice: uTopPrice,
      wastagePercent: 0,
      isLengthDependent: false,
      isFactoryStandard: true,
      allowDelete: false,
      calculationDetail: {
        materialName: `Ultrasonic U-Top (CZ#5)`,
        component: 'ULTRASONIC U-TOP',
        category: 'cz',
        size: '#5',
        unit: 'KG',
        finalQuantity: uTopKg,
        displayQuantity: `${uTopKg.toFixed(2)} KG`,
        baseFormula: `Ultrasonic U-Top (KG) = (Total Order Quantity × U-Top Factor: ${activeParams.uTopFactor}) ÷ Divisor: ${activeParams.uTopDivisor || 1000}`,
        steps: [
          {
            stepNumber: 1,
            title: 'Total Order Quantity',
            explanation: 'Sum of all variant quantities across this category group:',
            formula: `Total Order Quantity = ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`,
            result: `${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs`
          },
          {
            stepNumber: 2,
            title: 'Ultrasonic U-Top Weight Formula',
            explanation: `For CZ#5, U-Top factor is ${activeParams.uTopFactor} / ${activeParams.uTopDivisor || 1000}:`,
            formula: `Order Quantity: ${(czCalcResult.totalQuantity || 0).toLocaleString()} pcs × U-Top Factor: ${activeParams.uTopFactor} ÷ Divisor: ${activeParams.uTopDivisor || 1000} = ${(uTopKg).toFixed(4)} KG ≈ ${uTopKg.toFixed(2)} KG`,
            result: `${uTopKg.toFixed(2)} KG`
          }
        ]
      }
    });
  }

  // 8. Append any user-added custom materials
  if (Array.isArray(existingCustomRows)) {
    existingCustomRows.forEach(cust => {
      if (cust.materialId === 'custom' || cust.isCustom) {
        const custQty = Math.max(0, Number(cust.totalQuantity) || ((Number(cust.qtyPerZipper) || 1) * totalQty));
        rows.push({
          ...cust,
          totalQuantity: custQty,
          avgQtyPerZipper: totalQty > 0 ? (custQty / totalQty) : 0
        });
      }
    });
  }

  // Compute calculated costs for each row
  return rows.map((r, idx) => {
    const totalQ = Math.max(0, Number(r.totalQuantity) || 0);
    const uPrice = Math.max(0, Number(r.unitPrice) || 0);
    const wasteP = Math.max(0, Number(r.wastagePercent) || 0);

    const baseCost = totalQ * uPrice;
    const wasteCost = baseCost * (wasteP / 100);
    const totalCost = baseCost + wasteCost;

    return {
      ...r,
      index: idx + 1,
      subtypeKey: sizeKey,
      subtypeName: `CZ${sizeKey}`,
      subtypeLabel: sizeKey === '#5' ? 'CZ#5 (Nylon Zipper Size #5)' : 'CZ#3 (Nylon Zipper Size #3)',
      sourceVariants: (czCalcResult.variantBreakdowns || []).map(v => ({
        id: v.variantId,
        name: v.variantName || 'Variant',
        length: v.rawLength,
        unit: v.unit,
        quantity: v.quantity
      })),
      totalSubtypeQuantity: czCalcResult.totalQuantity || 0,
      baseMaterialCost: baseCost,
      wastageCost: wasteCost,
      totalMaterialCost: totalCost,
      costPerZipper: totalQty > 0 ? (totalCost / totalQty) : 0
    };
  });
}

/**
 * Helper to resolve size-specific parameter overrides for CZ
 * @param {Object} czParams 
 * @param {string} sizeKey - '#3' | '#5'
 * @param {string} primarySize - '#3' | '#5'
 * @returns {Object}
 */
function resolveCZSizeParams(czParams = {}, sizeKey = '#3', primarySize = '#5') {
  if (!czParams || typeof czParams !== 'object') return {};

  const sizeNum = sizeKey.replace('#', '');
  if (czParams[sizeKey] && typeof czParams[sizeKey] === 'object') {
    return czParams[sizeKey];
  }
  if (czParams[sizeNum] && typeof czParams[sizeNum] === 'object') {
    return czParams[sizeNum];
  }

  const resolved = {};
  const paramKeys = [
    'chainAllowance', 'inchAllowance', 'cmAllowance', 'tapeDivisor',
    'topStopFactor', 'topStopDivisor', 'bottomStopFactor', 'bottomStopDivisor',
    'resinDivisor', 'tollilon1Divisor', 'tollilon2Divisor', 'uTopFactor', 'uTopDivisor'
  ];

  paramKeys.forEach(pk => {
    if (czParams[`${pk}_${sizeNum}`] !== undefined) {
      resolved[pk] = czParams[`${pk}_${sizeNum}`];
    } else if (czParams[`${pk}_${sizeKey}`] !== undefined) {
      resolved[pk] = czParams[`${pk}_${sizeKey}`];
    } else if (czParams[pk] !== undefined) {
      const targetSize = czParams.primarySize || czParams.targetSize || primarySize;
      if (targetSize === sizeKey) {
        resolved[pk] = czParams[pk];
      }
    }
  });

  return resolved;
}

/**
 * Master CZ Calculation Orchestrator
 * Evaluates variants under CZ category, grouping by individual variant zipper size (#3 vs #5),
 * calculating each size group independently, and generating a single consolidated BOM.
 * 
 * @param {Array<Object>} variants - Multi-variant input list
 * @param {Object} [options={}] - Settings such as lossPercent, priceOverrides, customRows, czParams
 * @returns {Object} Complete CZ calculation details and BOM materials
 */
function calculateCZMaster(variants, options = {}) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  const lossPercent = options.lossPercent !== undefined ? Number(options.lossPercent) : 3.0;
  const sliderAdditionPercent = options.sliderAdditionPercent !== undefined 
    ? Number(options.sliderAdditionPercent) 
    : (options.sliderAddPercent !== undefined ? Number(options.sliderAddPercent) : null);
  const czParams = options.czParams || options.customParams || {};
  const customRows = Array.isArray(options.customRows) ? options.customRows : [];
  const priceOverrides = options.priceOverrides || {};

  // Group variants by CZ size (#3 vs #5)
  const sizeGroups = {
    '#3': [],
    '#5': []
  };

  variants.forEach(v => {
    const size = normalizeCZSize(v.zipperSize || '#3');
    if (sizeGroups[size]) {
      sizeGroups[size].push(v);
    } else {
      sizeGroups['#3'].push(v);
    }
  });

  const groupResults = [];
  let masterTotalQty = 0;
  let masterBaseChainMtr = 0;
  let masterLossMtr = 0;
  let masterLossInclusiveChainMtr = 0;
  let masterTotalTapeKg = 0;

  // Determine primary size from first variant if available
  const primarySize = (variants.length > 0 && variants[0].zipperSize) 
    ? normalizeCZSize(variants[0].zipperSize) 
    : '#5';

  // Process size groups (primary size first)
  const sizeOrder = (primarySize === '#3') ? ['#3', '#5'] : ['#5', '#3'];

  sizeOrder.forEach(sizeKey => {
    const groupVars = sizeGroups[sizeKey];
    if (groupVars && groupVars.length > 0) {
      const sizeParams = resolveCZSizeParams(czParams, sizeKey, primarySize);
      const res = calculateCZGroup(groupVars, sizeKey, lossPercent, sliderAdditionPercent, sizeParams);
      groupResults.push(res);

      masterTotalQty += res.totalQuantity;
      masterBaseChainMtr += res.baseChainConsumptionMtr;
      masterLossMtr += res.lossMtr;
      masterLossInclusiveChainMtr = (masterLossInclusiveChainMtr || 0) + res.lossInclusiveChainMtr;
      masterTotalTapeKg += res.totalTapeKg;
    }
  });

  // If no variants exist, calculate empty group for default primary size
  if (groupResults.length === 0) {
    const sizeParams = resolveCZSizeParams(czParams, primarySize, primarySize);
    const res = calculateCZGroup([], primarySize, lossPercent, sliderAdditionPercent, sizeParams);
    groupResults.push(res);
  }

  // Build master consolidated BOM material rows across ALL size groups
  const allBOMRows = [];
  groupResults.forEach(res => {
    if (res.totalQuantity > 0 || variants.length === 0) {
      const rows = buildCZConsolidatedBOMRows(res, [], priceOverrides);
      rows.forEach(r => allBOMRows.push(r));
    }
  });

  // Include user custom rows if any
  if (Array.isArray(customRows)) {
    customRows.forEach(cr => {
      if (cr.materialId === 'custom' || cr.isCustom) {
        const custQty = Math.max(0, Number(cr.totalQuantity) || ((Number(cr.qtyPerZipper) || 1) * masterTotalQty));
        const custPrice = Math.max(0, Number(cr.unitPrice) || 0);
        const custCost = custQty * custPrice;
        allBOMRows.push({
          ...cr,
          totalQuantity: custQty,
          baseMaterialCost: custCost,
          wastageCost: 0,
          totalMaterialCost: custCost,
          avgQtyPerZipper: masterTotalQty > 0 ? (custQty / masterTotalQty) : 0,
          costPerZipper: masterTotalQty > 0 ? (custCost / masterTotalQty) : 0
        });
      }
    });
  }

  // Compute total BOM costs
  const totalBaseMaterialCost = allBOMRows.reduce((sum, r) => sum + (r.baseMaterialCost || 0), 0);
  const totalWastageCost = allBOMRows.reduce((sum, r) => sum + (r.wastageCost || 0), 0);
  const totalMaterialCost = totalBaseMaterialCost + totalWastageCost;
  const materialCostPerZipper = masterTotalQty > 0 ? (totalMaterialCost / masterTotalQty) : 0;

  const primaryResult = groupResults[0] || {};
  const formulaDetails = {
    category: 'cz',
    primarySize: primaryResult.czSize,
    totalQuantity: masterTotalQty,
    groupResults: groupResults,
    steps: buildCZFormulaSteps(groupResults, lossPercent)
  };

  return {
    category: 'cz',
    primarySize: primaryResult.czSize,
    totalQuantity: masterTotalQty,
    baseChainConsumptionMtr: masterBaseChainMtr,
    lossMtr: masterLossMtr,
    lossInclusiveChainMtr: masterLossInclusiveChainMtr,
    totalTapeKg: masterTotalTapeKg,
    lossPercent,
    groupResults,
    primaryResult,
    formulaDetails,
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
 * Generate human-readable mathematical steps explaining the CZ calculation
 * @param {Array<Object>|Object} groupResults 
 * @param {number} lossPercent 
 * @returns {Array<Object>}
 */
function buildCZFormulaSteps(groupResults, lossPercent) {
  const steps = [];
  const resultsList = Array.isArray(groupResults) ? groupResults : Object.values(groupResults);

  resultsList.forEach(res => {
    if (!res || res.totalQuantity === 0) return;

    const size = res.czSize || '#3';
    const cfg = res.constants || CZ_CONSTANTS[size] || CZ_CONSTANTS['#3'];
    const activeParams = res.activeParams || cfg;

    // STEP 1 — VARIANT INPUTS & ADJUSTED LENGTHS
    steps.push({
      title: `Step 1 — Variant Inputs & Adjusted Lengths (${size})`,
      explanation: `For ${size} nylon zippers, factory allowance is ${activeParams.inchAllowance}" (Inch) / ${activeParams.cmAllowance} cm (CM). Unit divisor is ${cfg.inchDivisor} (Inch) / ${cfg.cmDivisor} (CM).`,
      variants: (res.variantBreakdowns || []).map(vb => ({
        label: `${vb.variantName}: ${vb.rawLength} ${vb.unit} × ${vb.quantity.toLocaleString()} pcs`,
        formula: vb.formulaString,
        result: `${vb.chainConsumptionMtr.toFixed(2)} Mtr`
      })),
      subtotalLabel: `Total Base Chain Consumption (${size})`,
      subtotalValue: `${res.baseChainConsumptionMtr.toFixed(2)} Mtr (Display: ${Math.round(res.baseChainConsumptionMtr).toLocaleString()} Mtr)`
    });

    // STEP 2 — TOTAL QUANTITY
    steps.push({
      title: `Step 2 — Total Order Quantity (${size})`,
      explanation: `Sum of all variant order quantities under ${size}.`,
      formula: `${(res.variantBreakdowns || []).map(v => v.quantity.toLocaleString()).join(' + ')} = ${res.totalQuantity.toLocaleString()} pcs`,
      result: `${res.totalQuantity.toLocaleString()} PCS`
    });

    // STEP 3 — BASE CHAIN CONSUMPTION (PRE-LOSS)
    steps.push({
      title: `Step 3 — Base Chain Consumption (${size})`,
      explanation: `Base Chain Consumption is calculated before applying factory production loss.`,
      formula: `Base Chain Consumption:\n${(res.variantBreakdowns || []).map(v => `${v.chainConsumptionMtr.toFixed(2)} Mtr`).join(' + ')} = ${res.baseChainConsumptionMtr.toFixed(2)} Mtr`,
      result: `${res.baseChainConsumptionMtr.toFixed(2)} Mtr`
    });

    // STEP 4 — FACTORY PRODUCTION LOSS & LOSS-INCLUSIVE REQUIREMENT
    steps.push({
      title: `Step 4 — Factory Production Loss (${lossPercent}%) & Loss-Inclusive Requirement`,
      explanation: `Factory loss is calculated separately on Base Chain Consumption and added to determine total continuous chain requirement.`,
      formula: `Loss Amount (${lossPercent}%):\n${res.baseChainConsumptionMtr.toFixed(2)} Mtr × ${lossPercent}% = ${res.lossMtr.toFixed(2)} Mtr\n\nLoss-Inclusive Chain Requirement:\n${res.baseChainConsumptionMtr.toFixed(2)} Mtr + ${res.lossMtr.toFixed(2)} Mtr = ${res.lossInclusiveChainMtr.toFixed(2)} Mtr`,
      result: `Req: ${res.lossInclusiveChainMtr.toFixed(2)} Mtr (Loss: ${res.lossMtr.toFixed(2)} Mtr)`
    });

    // STEP 5 — TOTAL TAPE WEIGHT (KG)
    steps.push({
      title: `Step 5 — Total Tape Requirement (${size})`,
      explanation: `Loss-Inclusive Chain Requirement divided by factory tape divisor (${activeParams.tapeDivisor}).`,
      formula: `Final Tape Calculation:\n${res.lossInclusiveChainMtr.toFixed(2)} ÷ ${activeParams.tapeDivisor} = ${res.totalTapeKg.toFixed(4)} KG`,
      result: `${res.totalTapeKg.toFixed(2)} KG Tape`
    });

    // STEP 6 — TOP STOP & BOTTOM STOP
    steps.push({
      title: `Step 6 — Top & Bottom Stops (${size})`,
      explanation: `Top Stop wire: (${activeParams.topStopFactor} / ${activeParams.topStopDivisor || 1000}) × Total Qty. Bottom Stop wire: (${activeParams.bottomStopFactor} / ${activeParams.bottomStopDivisor || 1000}) × Total Qty.`,
      formula: `T/S: (${res.totalQuantity.toLocaleString()} × ${activeParams.topStopFactor}) / ${activeParams.topStopDivisor || 1000} = ${res.topStopKg.toFixed(4)} KG\nB/S: (${res.totalQuantity.toLocaleString()} × ${activeParams.bottomStopFactor}) / ${activeParams.bottomStopDivisor || 1000} = ${res.bottomStopKg.toFixed(4)} KG`,
      result: `T/S: ${res.topStopKg.toFixed(2)} KG | B/S: ${res.bottomStopKg.toFixed(2)} KG`
    });

    // STEP 7 — RESIN REQUIREMENT
    steps.push({
      title: `Step 7 — Resin Weight (${size})`,
      explanation: `Resin required for element molding (Factory divisor: ${activeParams.resinDivisor}).`,
      formula: `${res.totalQuantity.toLocaleString()} / ${activeParams.resinDivisor} = ${res.resinKg.toFixed(4)} KG`,
      result: `${res.resinKg.toFixed(2)} KG Resin`
    });

    // STEP 8 — TOLLILON FLAT WIRE
    steps.push({
      title: `Step 8 — Tollilon Flat Wire (#1 & #2)`,
      explanation: `Tollilon #1 (divisor ${activeParams.tollilon1Divisor.toLocaleString()}) + Tollilon #2 (divisor ${activeParams.tollilon2Divisor.toLocaleString()}).`,
      formula: `#1: (${res.totalQuantity.toLocaleString()} / ${activeParams.tollilon1Divisor.toLocaleString()}) × 100 = ${res.tollilonOne.toFixed(2)} (Display: ${Math.round(res.tollilonOne)})\n#2: (${res.totalQuantity.toLocaleString()} / ${activeParams.tollilon2Divisor.toLocaleString()}) × 100 = ${res.tollilonTwo.toFixed(2)} (Display: ${Math.round(res.tollilonTwo)})\nTotal Tollilon = ${res.totalTollilon.toFixed(2)} (Display: ${Math.round(res.totalTollilon)})`,
      result: `${Math.round(res.totalTollilon)} Units`
    });

    // STEP 9 — ULTRASONIC U-TOP (If CZ#5)
    if (cfg.hasUTop && res.uTopKg > 0) {
      steps.push({
        title: `Step 9 — Ultrasonic U-Top (CZ#5)`,
        explanation: `Ultrasonic U-Top calculated at ${activeParams.uTopFactor} kg per 1,000 zippers.`,
        formula: `(${res.totalQuantity.toLocaleString()} × ${activeParams.uTopFactor}) / ${activeParams.uTopDivisor || 1000} = ${res.uTopKg.toFixed(4)} KG`,
        result: `${res.uTopKg.toFixed(2)} KG U-Top`
      });
    }

    // STEP 10 — SLIDER REQUIREMENT (+1.5% Factory Addition)
    steps.push({
      title: `Step 10 — Slider Requirement (+1.5% Addition)`,
      explanation: `Slider quantity calculated with standard +1.5% factory wastage addition.`,
      formula: `${res.totalQuantity.toLocaleString()} × ${cfg.sliderMultiplier} = ${res.sliderQuantity.toFixed(2)} PCS`,
      result: `${res.sliderQuantity.toFixed(2)} PCS`
    });
  });

  return steps;
}

// Global Export for Browser and Node.js
if (typeof window !== 'undefined') {
  window.CZFormulaEngine = {
    CZ_CONSTANTS,
    CZ_DEFAULT_PRICES,
    normalizeCZSize,
    normalizeCZUnit,
    calculateCZGroup,
    buildCZConsolidatedBOMRows,
    calculateCZMaster,
    buildCZFormulaSteps
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CZ_CONSTANTS,
    CZ_DEFAULT_PRICES,
    normalizeCZSize,
    normalizeCZUnit,
    calculateCZGroup,
    buildCZConsolidatedBOMRows,
    calculateCZMaster,
    buildCZFormulaSteps
  };
}

