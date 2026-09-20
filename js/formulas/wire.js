/**
 * Factory Formula Engine for WIRE (Brass / Metal Wire)
 * 
 * IMPORTANT: This module is the SOURCE OF TRUTH implementation for Factory Excel
 * manufacturing calculations for Wire across 3 distinct calculation models:
 * - WIRE#3
 * - WIRE#5 Normal Teeth
 * - WIRE#5 Long Teeth
 * 
 * Formulas, constants, divisors, allowances, and loss percentages are preserved exactly.
 */

// ==================== 1. IMMUTABLE FACTORY CONSTANTS FOR WIRE ====================
const WIRE_CONSTANTS = {
  '#3': {
    typeKey: '#3',
    typeName: 'WIRE #3 (Brass / Metal Wire Size #3)',
    inchAllowance: 0.0,        // EXACT: 0 allowance
    cmAllowance: 0.0,          // EXACT: 0 allowance
    inchDivisor: 39.37,        // EXACT: 39.37 inch per meter
    cmDivisor: 100.0,          // EXACT: 100 cm per meter
    inchCalcDivisor: 32.0,     // EXACT: 32.0 divisor for Inch in WIRE#3 sheet
    cmCalcDivisor: 27.73,      // EXACT: 27.73 divisor for CM in WIRE#3 sheet
    lossPercent: 4.0,          // EXACT: 4% loss (1.04 multiplier)
    lossMultiplier: 1.04,
    materialName: 'Teeth Wire #3 (Brass / Metal)',
    materialId: 'mat_wire_3',
    unit: 'KG'
  },
  '#5_normal': {
    typeKey: '#5_normal',
    typeName: 'WIRE #5 — Normal Teeth',
    inchAllowance: 0.0,        // EXACT: 0 allowance
    cmAllowance: 0.0,          // EXACT: 0 allowance
    inchDivisor: 39.37,        // EXACT: 39.37 inch per meter
    cmDivisor: 100.0,          // EXACT: 100 cm per meter
    inchCalcDivisor: 20.6,     // EXACT: 20.6 divisor in WIRE#5 NORMAL TEETH sheet
    cmCalcDivisor: 20.6,       // EXACT: 20.6 divisor in WIRE#5 NORMAL TEETH sheet
    lossPercent: 5.0,          // EXACT: 5% loss (1.05 multiplier)
    lossMultiplier: 1.05,
    materialName: 'Teeth Wire #5 Normal Teeth (Brass / Metal)',
    materialId: 'mat_wire_5_normal',
    unit: 'KG'
  },
  '#5_long': {
    typeKey: '#5_long',
    typeName: 'WIRE #5 — Long Teeth',
    inchAllowance: 1.97,       // EXACT: 1.97 inch allowance in WIRE#5 LONG TEETH sheet
    cmAllowance: 5.0,          // EXACT: 5.0 cm allowance in WIRE#5 LONG TEETH sheet
    inchDivisor: 39.37,        // EXACT: 39.37 inch per meter
    cmDivisor: 100.0,          // EXACT: 100 cm per meter
    inchCalcDivisor: 20.6,     // EXACT: 20.6 divisor in WIRE#5 LONG TEETH sheet
    cmCalcDivisor: 20.6,       // EXACT: 20.6 divisor in WIRE#5 LONG TEETH sheet
    lossPercent: 5.0,          // EXACT: 5% loss / 105% (1.05 multiplier)
    lossMultiplier: 1.05,
    materialName: 'Teeth Wire #5 Long Teeth (Brass / Metal)',
    materialId: 'mat_wire_5_long',
    unit: 'KG'
  }
};

/**
 * Standard factory reference prices for default WIRE BOM cost evaluation in BDT (৳)
 */
const WIRE_DEFAULT_PRICES = {
  '#3': {
    wireKg: 680.00 // ৳ / KG
  },
  '#5_normal': {
    wireKg: 650.00 // ৳ / KG
  },
  '#5_long': {
    wireKg: 650.00 // ৳ / KG
  }
};

/**
 * Normalize wire type string to '#3' | '#5_normal' | '#5_long'
 * @param {string} typeStr 
 * @returns {'#3'|'#5_normal'|'#5_long'}
 */
function normalizeWireType(typeStr) {
  const s = String(typeStr || '').toLowerCase().trim();
  if (s.includes('long')) return '#5_long';
  if (s.includes('normal')) return '#5_normal';
  if (s.includes('3')) return '#3';
  if (s.includes('5')) return '#5_normal'; // default #5 to normal if unspecified
  return '#5_normal';
}

/**
 * Normalize unit string to 'inch' or 'cm'
 * @param {string} unitStr 
 * @returns {'inch'|'cm'}
 */
function normalizeWireUnit(unitStr) {
  const u = String(unitStr || '').toLowerCase().trim();
  if (u === 'cm' || u === 'centimeter' || u === 'centimeters') return 'cm';
  if (u === 'mm' || u === 'millimeter') return 'cm';
  return 'inch';
}

/**
 * Calculate WIRE factory calculations for a specific wire type group of variants
 * @param {Array<Object>} variants - Variants belonging to this WIRE type
 * @param {string} wireType - '#3' | '#5_normal' | '#5_long'
 * @param {number} [customLossPercent] - Optional override of default Excel loss percent
 * @param {Object} [customParams] - Optional editable formula parameter overrides
 * @returns {Object} Full calculation results with intermediate values and formula explanations
 */
function calculateWireGroup(variants, wireType = '#5_normal', customLossPercent = null, customParams = null) {
  const typeKey = normalizeWireType(wireType);
  const cfg = WIRE_CONSTANTS[typeKey];
  const lossPercent = (customLossPercent !== null && customLossPercent !== undefined)
    ? Math.max(0, Number(customLossPercent) || 0)
    : cfg.lossPercent;
  const lossMultiplier = 1 + (lossPercent / 100);

  // Resolve active parameters with fallback to immutable WIRE_CONSTANTS
  const activeParams = {
    inchAllowance: cfg.inchAllowance,
    cmAllowance: cfg.cmAllowance,
    inchCalcDivisor: cfg.inchCalcDivisor,
    cmCalcDivisor: cfg.cmCalcDivisor
  };

  if (customParams && typeof customParams === 'object') {
    if (typeKey === '#3') {
      if (customParams.inchWireDivisor !== undefined && !isNaN(Number(customParams.inchWireDivisor)) && Number(customParams.inchWireDivisor) > 0) {
        activeParams.inchCalcDivisor = Number(customParams.inchWireDivisor);
      } else if (customParams.inchCalcDivisor !== undefined && !isNaN(Number(customParams.inchCalcDivisor)) && Number(customParams.inchCalcDivisor) > 0) {
        activeParams.inchCalcDivisor = Number(customParams.inchCalcDivisor);
      }

      if (customParams.cmWireDivisor !== undefined && !isNaN(Number(customParams.cmWireDivisor)) && Number(customParams.cmWireDivisor) > 0) {
        activeParams.cmCalcDivisor = Number(customParams.cmWireDivisor);
      } else if (customParams.cmCalcDivisor !== undefined && !isNaN(Number(customParams.cmCalcDivisor)) && Number(customParams.cmCalcDivisor) > 0) {
        activeParams.cmCalcDivisor = Number(customParams.cmCalcDivisor);
      }
    } else if (typeKey === '#5_normal') {
      if (customParams.wireDivisor !== undefined && !isNaN(Number(customParams.wireDivisor)) && Number(customParams.wireDivisor) > 0) {
        activeParams.inchCalcDivisor = Number(customParams.wireDivisor);
        activeParams.cmCalcDivisor = Number(customParams.wireDivisor);
      } else if (customParams.inchCalcDivisor !== undefined && !isNaN(Number(customParams.inchCalcDivisor)) && Number(customParams.inchCalcDivisor) > 0) {
        activeParams.inchCalcDivisor = Number(customParams.inchCalcDivisor);
        activeParams.cmCalcDivisor = Number(customParams.inchCalcDivisor);
      }
    } else if (typeKey === '#5_long') {
      if (customParams.wireDivisor !== undefined && !isNaN(Number(customParams.wireDivisor)) && Number(customParams.wireDivisor) > 0) {
        activeParams.inchCalcDivisor = Number(customParams.wireDivisor);
        activeParams.cmCalcDivisor = Number(customParams.wireDivisor);
      } else if (customParams.inchCalcDivisor !== undefined && !isNaN(Number(customParams.inchCalcDivisor)) && Number(customParams.inchCalcDivisor) > 0) {
        activeParams.inchCalcDivisor = Number(customParams.inchCalcDivisor);
        activeParams.cmCalcDivisor = Number(customParams.inchCalcDivisor);
      }

      if (customParams.wireAllowance !== undefined && !isNaN(Number(customParams.wireAllowance)) && Number(customParams.wireAllowance) >= 0) {
        activeParams.inchAllowance = Number(customParams.wireAllowance);
        activeParams.cmAllowance = Number(customParams.wireAllowance);
      }
      if (customParams.inchAllowance !== undefined && !isNaN(Number(customParams.inchAllowance)) && Number(customParams.inchAllowance) >= 0) {
        activeParams.inchAllowance = Number(customParams.inchAllowance);
      }
      if (customParams.cmAllowance !== undefined && !isNaN(Number(customParams.cmAllowance)) && Number(customParams.cmAllowance) >= 0) {
        activeParams.cmAllowance = Number(customParams.cmAllowance);
      }
    }
  }

  let totalQuantity = 0;
  let totalReqMtr = 0;
  let totalBaseWireKg = 0;
  let totalLossWireKg = 0;
  let totalWireKg = 0;
  const variantBreakdowns = [];

  variants.forEach((v, idx) => {
    const qty = Math.max(0, Number(v.quantity) || 0);
    const rawLength = Math.max(0, Number(v.length) || 0);
    const unit = normalizeWireUnit(v.lengthUnit || 'inch');

    totalQuantity += qty;

    let allowance = 0;
    let unitDivisor = 1;
    let calcDivisor = 1;
    let lengthValue = rawLength;

    if (unit === 'cm') {
      allowance = activeParams.cmAllowance;
      unitDivisor = cfg.cmDivisor;
      calcDivisor = activeParams.cmCalcDivisor;
    } else {
      // Inch
      allowance = activeParams.inchAllowance;
      unitDivisor = cfg.inchDivisor;
      calcDivisor = activeParams.inchCalcDivisor;
    }

    const effectiveLength = lengthValue + allowance;
    // Required meters per Excel formula: (Length + Allowance) * Qty / UnitDivisor
    const reqMtr = (effectiveLength * qty) / unitDivisor;
    totalReqMtr += reqMtr;

    // Base Wire Calculation in KG (before loss): reqMtr / calcDivisor
    const baseKg = reqMtr / calcDivisor;
    totalBaseWireKg += baseKg;

    // Loss Amount in KG: baseKg * (lossPercent / 100)
    const lossKg = baseKg * (lossPercent / 100);
    totalLossWireKg += lossKg;

    // Total Wire in KG with loss: baseKg + lossKg (or baseKg * lossMultiplier)
    const variantTotalKg = baseKg + lossKg;
    totalWireKg += variantTotalKg;

    let formulaStr = '';
    if (allowance > 0) {
      formulaStr = `(Length: ${lengthValue} ${unit} + Allowance: ${allowance} ${unit}) × Quantity: ${qty.toLocaleString('en-US')} pcs ÷ Divisor: ${unitDivisor} = ${reqMtr.toFixed(2)} Mtr`;
    } else {
      formulaStr = `Length: ${lengthValue} ${unit} × Quantity: ${qty.toLocaleString('en-US')} pcs ÷ Divisor: ${unitDivisor} = ${reqMtr.toFixed(2)} Mtr`;
    }

    variantBreakdowns.push({
      variantId: v.id || `var_${idx + 1}`,
      name: v.name || `Variant ${idx + 1}`,
      rawLength: lengthValue,
      unit: unit,
      quantity: qty,
      allowance: allowance,
      effectiveLength: effectiveLength,
      unitDivisor: unitDivisor,
      calcDivisor: calcDivisor,
      reqMtr: reqMtr,
      baseKg: baseKg,
      lossKg: lossKg,
      totalKg: variantTotalKg,
      color: v.color || '',
      remarks: v.remarks || '',
      formulaString: formulaStr
    });
  });

  return {
    typeKey: typeKey,
    typeName: cfg.typeName,
    constants: cfg,
    activeParams: activeParams,
    totalQuantity,
    lossPercent,
    lossMultiplier,
    variantBreakdowns,
    // Step-by-Step Intermediate Values
    totalReqMtr: totalReqMtr,
    totalBaseWireKg: totalBaseWireKg,
    totalLossWireKg: totalLossWireKg,
    totalWireKg: totalWireKg,
    // Display-rounded formatted values
    display: {
      totalQuantity: totalQuantity.toLocaleString('en-US'),
      totalReqMtr: Math.round(totalReqMtr).toLocaleString('en-US'),
      totalReqMtrExact: totalReqMtr.toFixed(2),
      totalBaseWireKg: totalBaseWireKg.toFixed(4),
      totalLossWireKg: totalLossWireKg.toFixed(4),
      totalWireKg: totalWireKg.toFixed(2)
    }
  };
}

/**
 * Master calculation coordinator for WIRE category.
 * Groups variants by wire type (#3, #5_normal, #5_long) and calculates independently.
 * @param {Array<Object>} rawVariants 
 * @param {Object} [options={}] 
 * @returns {Object} Complete factory calculation result with BOM rows and mathematical breakdown
 */
function calculateWireMaster(rawVariants, options = {}) {
  const customLossPercent = options.lossPercent !== undefined ? Number(options.lossPercent) : null;
  const wireParams = (options.wireParams && typeof options.wireParams === 'object') ? options.wireParams : {};
  const priceOverrides = options.priceOverrides || {};
  const customRows = Array.isArray(options.customRows) ? options.customRows : [];

  const variants = Array.isArray(rawVariants) ? rawVariants : [];
  if (variants.length === 0) {
    return null;
  }

  // Group variants by wire type
  const typeGroups = {
    '#3': [],
    '#5_normal': [],
    '#5_long': []
  };

  variants.forEach(v => {
    const wireType = normalizeWireType(v.zipperSize || v.wireType || '#5_normal');
    typeGroups[wireType].push(v);
  });

  const groupResults = {};
  let totalOrderQuantity = 0;
  let primaryType = '#5_normal';
  let maxQtyInType = -1;

  for (const [type, vars] of Object.entries(typeGroups)) {
    if (vars.length > 0) {
      const res = calculateWireGroup(vars, type, customLossPercent, wireParams);
      groupResults[type] = res;
      totalOrderQuantity += res.totalQuantity;
      if (res.totalQuantity > maxQtyInType) {
        maxQtyInType = res.totalQuantity;
        primaryType = type;
      }
    }
  }

  // Construct Factory BOM Rows for WIRE
  const bomRows = [];
  let rowIndex = 1;

  for (const [type, res] of Object.entries(groupResults)) {
    if (!res || res.totalQuantity === 0) continue;

    const defaultPrices = WIRE_DEFAULT_PRICES[type] || WIRE_DEFAULT_PRICES['#5_normal'];
    const wirePrice = priceOverrides[`wire_${type.replace('#', '')}`] !== undefined
      ? Number(priceOverrides[`wire_${type.replace('#', '')}`])
      : defaultPrices.wireKg;
    const wireCost = res.totalWireKg * wirePrice;

    const compName = (type === '#3') ? 'WIRE#3' : (type === '#5_long' ? 'Teeth for Long Chain#5' : 'WIRE#5');
    const spec = (type === '#3')
      ? `Divisor: ${res.activeParams.inchCalcDivisor} (Inch) / ${res.activeParams.cmCalcDivisor} (CM), Loss: ${res.lossPercent}%`
      : (type === '#5_long'
        ? `Allowance: ${res.activeParams.inchAllowance}" / ${res.activeParams.cmAllowance} cm, Divisor: ${res.activeParams.inchCalcDivisor}, Loss: ${res.lossPercent}%`
        : `Divisor: ${res.activeParams.inchCalcDivisor}, Loss: ${res.lossPercent}%`);

    // 1. Total Required Chain Length for EVERY Wire variant
    (res.variantBreakdowns || []).forEach((v, vIdx) => {
      const variantName = v.name || `Variant ${vIdx + 1}`;
      const matName = (res.variantBreakdowns.length > 1)
        ? `Total Required Chain Length (${variantName})`
        : 'Total Required Chain Length';
      const specVariant = (v.allowance > 0)
        ? `${variantName}: (${v.rawLength} ${v.unit} + ${v.allowance} ${v.unit}) × ${(v.quantity || 0).toLocaleString()} pcs ÷ ${v.unitDivisor}`
        : `${variantName}: ${v.rawLength} ${v.unit} × ${(v.quantity || 0).toLocaleString()} pcs ÷ ${v.unitDivisor}`;

      bomRows.push({
        index: rowIndex++,
        id: `wire_bom_req_chain_${type.replace('#', '')}_${v.variantId || vIdx + 1}`,
        key: `mat_wire_req_chain_${type.replace('#', '')}_${v.variantId || vIdx + 1}`,
        component: 'Total Required Chain Length',
        componentCategory: 'chain',
        subtypeKey: type,
        subtypeName: (type === '#3') ? 'WIRE#3' : (type === '#5_long' ? 'WIRE#5 (Long)' : 'WIRE#5 (Normal)'),
        subtypeLabel: res.constants.typeName || (type === '#3' ? 'WIRE#3 (Wire Size #3)' : (type === '#5_long' ? 'WIRE#5 (Long Teeth)' : 'WIRE#5 (Normal Teeth)')),
        sourceVariants: [{
          id: v.variantId || v.id,
          name: variantName,
          length: v.rawLength,
          unit: v.unit,
          quantity: v.quantity
        }],
        totalSubtypeQuantity: res.totalQuantity || 0,
        materialId: `mat_wire_req_chain_${type.replace('#', '')}_${v.variantId || vIdx + 1}`,
        materialName: matName,
        specification: specVariant,
        unit: 'Mtr',
        unitPrice: 0,
        wastagePercent: 0,
        totalQuantity: v.reqMtr,
        baseMaterialCost: 0,
        wastageCost: 0,
        totalMaterialCost: 0,
        avgQtyPerZipper: v.quantity > 0 ? (v.reqMtr / v.quantity) : 0,
        costPerZipper: 0,
        isLengthDependent: true,
        isFactoryStandard: true,
        allowDelete: false,
        formulaNote: `Formula: ${v.formulaString || specVariant}`,
        calculationDetail: {
          materialName: matName,
          component: 'Total Required Chain Length',
          category: 'wire',
          size: type,
          unit: 'Mtr',
          finalQuantity: v.reqMtr,
          displayQuantity: `${Math.round(v.reqMtr).toLocaleString('en-US')} Mtr`,
          baseFormula: (type === '#5_long')
            ? `Total Required Chain Length = (Length + Allowance: ${res.activeParams.inchAllowance}") × Quantity ÷ Unit Divisor (${v.unitDivisor} for ${v.unit.toUpperCase()})`
            : `Total Required Chain Length = Length × Quantity ÷ Unit Divisor (${v.unitDivisor} for ${v.unit.toUpperCase()})`,
          steps: [
            {
              stepNumber: 1,
              title: `Variant Required Chain Length (${variantName})`,
              explanation: (type === '#5_long')
                ? `For #5 Long Teeth wire, allowance is ${res.activeParams.inchAllowance}" (${res.activeParams.cmAllowance} cm). Unit divisor: ${v.unitDivisor} ${v.unit}/meter.`
                : `For ${res.constants.typeName}, wire length is calculated directly from variant length without allowance. Unit divisor: ${v.unitDivisor} ${v.unit}/meter.`,
              variants: [
                {
                  label: `${variantName}: Length ${v.rawLength} ${v.unit} × Quantity ${(v.quantity || 0).toLocaleString()} pcs`,
                  formula: v.formulaString || `(${v.rawLength} ${v.unit} + ${v.allowance} ${v.unit}) × ${(v.quantity || 0).toLocaleString()} pcs ÷ ${v.unitDivisor} = ${(v.reqMtr || 0).toFixed(2)} Mtr`,
                  result: `${(v.reqMtr || 0).toFixed(2)} Mtr`
                }
              ],
              subtotalLabel: 'Total Required Chain Length',
              subtotalValue: `${(v.reqMtr || 0).toFixed(2)} Mtr`
            }
          ]
        }
      });
    });

    // 2. Teeth Wire (KG)
    bomRows.push({
      index: rowIndex++,
      key: `mat_wire_${type.replace('#', '')}`,
      component: compName,
      componentCategory: 'wire',
      subtypeKey: type,
      subtypeName: (type === '#3') ? 'WIRE#3' : (type === '#5_long' ? 'WIRE#5 (Long)' : 'WIRE#5 (Normal)'),
      subtypeLabel: res.constants.typeName || (type === '#3' ? 'WIRE#3 (Wire Size #3)' : (type === '#5_long' ? 'WIRE#5 (Long Teeth)' : 'WIRE#5 (Normal Teeth)')),
      sourceVariants: (res.variantBreakdowns || []).map(v => ({
        id: v.variantId || v.id,
        name: v.name || v.variantName || 'Variant',
        length: v.rawLength,
        unit: v.unit,
        quantity: v.quantity
      })),
      totalSubtypeQuantity: res.totalQuantity || 0,
      materialId: res.constants.materialId,
      materialName: res.constants.materialName,
      specification: spec,
      unit: 'KG',
      unitPrice: wirePrice,
      wastagePercent: 0,
      totalQuantity: res.totalWireKg,
      baseMaterialCost: wireCost,
      wastageCost: 0,
      totalMaterialCost: wireCost,
      avgQtyPerZipper: totalOrderQuantity > 0 ? (res.totalWireKg / totalOrderQuantity) : 0,
      costPerZipper: totalOrderQuantity > 0 ? (wireCost / totalOrderQuantity) : 0,
      formulaNote: `Formula: (Req Mtr / Divisor) × (1 + ${res.lossPercent}%)`,
      calculationDetail: {
        materialName: res.constants.materialName,
        component: compName,
        category: 'wire',
        size: type,
        unit: 'KG',
        finalQuantity: res.totalWireKg,
        displayQuantity: `${res.totalWireKg.toFixed(2)} KG`,
        baseFormula: (type === '#5_long')
          ? `Base Chain (Mtr) = Sum of [ (Length + Allowance: ${res.activeParams.inchAllowance}") × Quantity ] ÷ 39.37 Inch/Mtr\nTeeth Wire (KG) = (Base Chain (Mtr) ÷ Wire Divisor: ${res.activeParams.inchCalcDivisor}) × Loss Factor: ${(res.lossMultiplier || 1.05).toFixed(2)} (+${res.lossPercent}% Loss)`
          : (type === '#3'
            ? `Required Chain (Mtr) = Sum of [ Length × Quantity ] ÷ Unit Divisor (39.37 for Inch / 100 for CM)\nTeeth Wire (KG) = (Required Chain (Mtr) ÷ Wire Divisor: ${res.activeParams.inchCalcDivisor} for Inch / ${res.activeParams.cmCalcDivisor} for CM) × Loss Factor: ${(res.lossMultiplier || 1.04).toFixed(2)} (+${res.lossPercent}% Loss)`
            : `Required Chain (Mtr) = Sum of [ Length × Quantity ] ÷ Unit Divisor (39.37 for Inch / 100 for CM)\nTeeth Wire (KG) = (Required Chain (Mtr) ÷ Wire Divisor: ${res.activeParams.inchCalcDivisor}) × Loss Factor: ${(res.lossMultiplier || 1.05).toFixed(2)} (+${res.lossPercent}% Loss)`),
        steps: [
          {
            stepNumber: 1,
            title: 'Variant Lengths & Wire Allowances',
            explanation: (type === '#5_long')
              ? `For #5 Long Teeth wire, allowance is ${res.activeParams.inchAllowance}" (${res.activeParams.cmAllowance} cm). Divisor: 39.37 inch/meter.`
              : `For ${res.constants.typeName}, wire length is calculated directly from variant length without allowance.`,
            variants: (res.variantBreakdowns || []).map(v => ({
              label: `${v.name || 'Variant'}: Length ${v.rawLength} ${v.unit} × Quantity ${(v.quantity || 0).toLocaleString()} pcs`,
              formula: v.formulaString || `Length: ${v.rawLength} ${v.unit} × Quantity: ${v.quantity} pcs = ${(v.reqMtr || 0).toFixed(2)} Mtr`,
              result: `${(v.reqMtr || 0).toFixed(2)} Mtr`
            })),
            subtotalLabel: 'Total Required Chain Length',
            subtotalValue: `${(res.totalReqMtr || 0).toFixed(2)} Mtr`
          },
          {
            stepNumber: 2,
            title: 'Base Wire Weight Calculation',
            explanation: (type === '#3')
              ? `Divided by wire divisor (${res.activeParams.inchCalcDivisor} for Inch / ${res.activeParams.cmCalcDivisor} for CM):`
              : `Divided by wire divisor (${res.activeParams.inchCalcDivisor}):`,
            formula: (type === '#3')
              ? `Chain Length: ${(res.totalReqMtr || 0).toFixed(2)} Mtr ÷ Wire Divisor: ${res.activeParams.inchCalcDivisor} (Inch) / ${res.activeParams.cmCalcDivisor} (CM) = ${(res.totalBaseWireKg || 0).toFixed(4)} KG`
              : `Chain Length: ${(res.totalReqMtr || 0).toFixed(2)} Mtr ÷ Wire Divisor: ${res.activeParams.inchCalcDivisor} = ${(res.totalBaseWireKg || 0).toFixed(4)} KG`,
            result: `${(res.totalBaseWireKg || 0).toFixed(4)} KG`
          },
          {
            stepNumber: 3,
            title: `Factory Wire Loss Addition (+${res.lossPercent}%)`,
            explanation: `Applies factory loss multiplier of ${(res.lossMultiplier || 1.05).toFixed(2)} (+${res.lossPercent}%):`,
            formula: `Base Wire: ${(res.totalBaseWireKg || 0).toFixed(4)} KG × Loss Multiplier: ${(res.lossMultiplier || 1.05).toFixed(2)} (+${res.lossPercent}% = 1 + ${res.lossPercent}/100) = ${(res.totalWireKg).toFixed(4)} KG ≈ ${(res.totalWireKg).toFixed(2)} KG`,
            result: `${(res.totalWireKg).toFixed(2)} KG`
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
  const primaryResult = groupResults[primaryType] || Object.values(groupResults)[0];
  const formulaDetails = {
    category: 'wire',
    primaryType: primaryType,
    totalQuantity: totalOrderQuantity,
    groupResults: groupResults,
    steps: buildWireFormulaSteps(groupResults)
  };

  return {
    category: 'wire',
    totalQuantity: totalOrderQuantity,
    primaryResult: primaryResult,
    groupResults: groupResults,
    formulaDetails: formulaDetails,
    materials: {
      processedRows: bomRows,
      totalBaseMaterialCost,
      totalWastageCost,
      totalMaterialCost,
      materialCostPerZipper
    }
  };
}

/**
 * Generate human-readable mathematical steps explaining the WIRE calculation
 * @param {Object} groupResults 
 * @returns {Array<Object>}
 */
function buildWireFormulaSteps(groupResults) {
  const steps = [];

  for (const [type, res] of Object.entries(groupResults)) {
    if (!res || res.totalQuantity === 0) continue;

    const inchDiv = res.activeParams ? res.activeParams.inchCalcDivisor : res.constants.inchCalcDivisor;
    const cmDiv = res.activeParams ? res.activeParams.cmCalcDivisor : res.constants.cmCalcDivisor;
    const inchAll = res.activeParams ? res.activeParams.inchAllowance : res.constants.inchAllowance;
    const cmAll = res.activeParams ? res.activeParams.cmAllowance : res.constants.cmAllowance;

    steps.push({
      title: `Step 1: Required Meters Calculation (${res.typeName})`,
      explanation: inchAll > 0
        ? `Allowance applied: ${inchAll}" (Inch) / ${cmAll} cm (CM).`
        : `Direct required length (no allowance added).`,
      variants: res.variantBreakdowns.map(vb => ({
        label: `${vb.name} (${vb.rawLength} ${vb.unit} | ${vb.quantity.toLocaleString()} pcs)`,
        formula: vb.allowance > 0
          ? `((${vb.rawLength} + ${vb.allowance}) × ${vb.quantity}) / ${vb.unitDivisor}`
          : `(${vb.rawLength} × ${vb.quantity}) / ${vb.unitDivisor}`,
        result: `${vb.reqMtr.toFixed(2)} Mtr`
      })),
      subtotalLabel: `Total Required Meters`,
      subtotalValue: `${res.totalReqMtr.toFixed(2)} Mtr (Display: ${res.display.totalReqMtr} Mtr)`
    });

    steps.push({
      title: `Step 2: Teeth Wire Calculation & Factory Loss (${res.typeName})`,
      explanation: `Divide required meters by factory divisor (${inchDiv} for Inch, ${cmDiv} for CM) and add ${res.lossPercent}% loss factor (1 + ${res.lossPercent} ÷ 100).`,
      formula: `(${res.totalReqMtr.toFixed(2)} Mtr / Divisor) × (1 + ${res.lossPercent}%) = ${res.totalWireKg.toFixed(4)} KG`,
      result: `${res.display.totalWireKg} KG Teeth Wire`
    });
  }

  return steps;
}

// Export for Vanilla JS & Node.js
if (typeof window !== 'undefined') {
  window.WireFormulaEngine = {
    WIRE_CONSTANTS,
    WIRE_DEFAULT_PRICES,
    normalizeWireType,
    normalizeWireUnit,
    calculateWireGroup,
    calculateWireMaster
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WIRE_CONSTANTS,
    WIRE_DEFAULT_PRICES,
    normalizeWireType,
    normalizeWireUnit,
    calculateWireGroup,
    calculateWireMaster
  };
}
