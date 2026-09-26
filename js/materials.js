/**
 * Sample Material Master Data for Zipper BOM Calculator
 * Updated with Factory Standard Terminology:
 *   CZ = Nylon / Coil Zipper
 *   MZ = Metal Zipper
 *   PZ = Plastic / Molded Zipper
 *   T/S = Top Stop (including U-Top stops)
 *   B/S = Bottom Stop
 *   Resin = POM/polyacetal resin for molded zipper teeth & stops
 *   Tolilon Flat Wire = Specialized non-metallic flat wire for ultrasonic/plastic stops
 * NOTE: All prices are DEMO / SAMPLE reference prices in Bangladeshi Taka (৳ BDT).
 */

const SAMPLE_MATERIALS = [
  // ==================== 1. TAPES (TOTL TAPE KG) ====================
  {
    id: 'mat_cz_tape_kg_3',
    name: 'CZ#3 Tape',
    componentCategory: 'tape',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#3'],
    specification: 'Factory Tape for CZ#3 (Divisor 87.0)',
    defaultUnit: 'KG',
    unitPriceBDT: 450.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_cz_tape_kg_5',
    name: 'CZ#5 Tape',
    componentCategory: 'tape',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#5'],
    specification: 'Factory Tape for CZ#5 (Divisor 54.5)',
    defaultUnit: 'KG',
    unitPriceBDT: 420.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_tape_3',
    name: 'MZ#3 Tape',
    componentCategory: 'tape',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#3'],
    specification: 'Factory Tape for MZ#3 (Divisor 97.0)',
    defaultUnit: 'KG',
    unitPriceBDT: 480.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_tape_5',
    name: 'MZ#5 Tape',
    componentCategory: 'tape',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#5'],
    specification: 'Factory Tape for MZ#5 (Divisor 71.0)',
    defaultUnit: 'KG',
    unitPriceBDT: 450.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_tape_kg_3',
    name: 'PZ#3 Tape',
    componentCategory: 'tape',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#3'],
    specification: 'Factory Tape for PZ#3 (Divisor 101.0)',
    defaultUnit: 'KG',
    unitPriceBDT: 460.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_tape_kg_5',
    name: 'PZ#5 Tape',
    componentCategory: 'tape',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#5'],
    specification: 'Factory Tape for PZ#5 (Divisor 81.0)',
    defaultUnit: 'KG',
    unitPriceBDT: 430.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_tape_kg_8',
    name: 'PZ#8 Tape',
    componentCategory: 'tape',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#8'],
    specification: 'Factory Tape for PZ#8 (Divisor 57.0)',
    defaultUnit: 'KG',
    unitPriceBDT: 400.00,
    defaultWastagePercent: 0
  },

  // ==================== 2. TEETH WIRE ====================
  {
    id: 'mat_mz_teeth_wire_3',
    name: 'Teeth Wire #3 (Brass / Metal)',
    componentCategory: 'wire',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#3'],
    specification: 'Teeth forming wire for MZ#3 (Divisor 32, Loss 4%)',
    defaultUnit: 'KG',
    unitPriceBDT: 850.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_wire_3',
    name: 'Teeth Wire #3',
    componentCategory: 'wire',
    compatibleCategory: ['wire'],
    compatibleSizes: ['#3'],
    specification: 'Teeth forming wire #3 (Divisor 32 / 27.73, Loss 4%)',
    defaultUnit: 'KG',
    unitPriceBDT: 820.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_wire_5_normal',
    name: 'Teeth Wire #5 (Normal Teeth)',
    componentCategory: 'wire',
    compatibleCategory: ['wire'],
    compatibleSizes: ['#5'],
    specification: 'Teeth forming wire #5 Normal (Divisor 20.6, Loss 5%)',
    defaultUnit: 'KG',
    unitPriceBDT: 780.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_wire_5_long',
    name: 'Teeth Wire #5 (Long Teeth)',
    componentCategory: 'wire',
    compatibleCategory: ['wire'],
    compatibleSizes: ['#5'],
    specification: 'Teeth forming wire #5 Long (Divisor 20.6, Loss 5%, Allowance 1.97" / 5.0cm)',
    defaultUnit: 'KG',
    unitPriceBDT: 780.00,
    defaultWastagePercent: 0
  },

  // ==================== 3. TOP STOPS (T/S) ====================
  {
    id: 'mat_cz_ts_3',
    name: 'CZ#3 Top Stop Wire',
    componentCategory: 'top_stop',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#3'],
    specification: 'Top stop wire for CZ#3 (Factor 0.02 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 280.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_cz_ts_5',
    name: 'CZ#5 Top Stop Wire',
    componentCategory: 'top_stop',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#5'],
    specification: 'Top stop wire for CZ#5 (Factor 0.04 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 280.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_ts_3',
    name: 'Top Stop Wire T/S#3',
    componentCategory: 'top_stop',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#3'],
    specification: 'Top stop wire for MZ#3 (Factor 0.22 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 550.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_ts_5',
    name: 'Wire for T/S# 4 & 5',
    componentCategory: 'top_stop',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#5'],
    specification: 'Top stop wire for MZ#5 (Factor 0.32 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 550.00,
    defaultWastagePercent: 0
  },

  // ==================== 4. BOTTOM STOPS (B/S & H-BOTTOM) ====================
  {
    id: 'mat_cz_bs_3',
    name: 'CZ#3 Bottom Stop Wire',
    componentCategory: 'bottom_stop',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#3'],
    specification: 'Bottom stop wire for CZ#3 (Factor 0.03 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 280.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_cz_bs_5',
    name: 'CZ#5 Bottom Stop Wire',
    componentCategory: 'bottom_stop',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#5'],
    specification: 'Bottom stop wire for CZ#5 (Factor 0.04 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 280.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_h_bottom_3',
    name: 'H-Bottom Stop (MZ#3)',
    componentCategory: 'bottom_stop',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#3'],
    specification: 'H-Bottom stop for MZ#3 (+2.5% Loss Factor)',
    defaultUnit: 'Pcs',
    unitPriceBDT: 0.65,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_bs_5',
    name: 'Wire for B/S# 4 & 5',
    componentCategory: 'bottom_stop',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#5'],
    specification: 'Bottom stop wire for MZ#5 (Factor 0.172 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 550.00,
    defaultWastagePercent: 0
  },

  // ==================== 5. RESIN ====================
  {
    id: 'mat_cz_resin_3',
    name: 'Resin for CZ#3',
    componentCategory: 'resin',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#3'],
    specification: 'POM / Element Resin for CZ#3 (Divisor 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 320.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_cz_resin_5',
    name: 'CZ#5 Resin',
    componentCategory: 'resin',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#5'],
    specification: 'POM / Element Resin for CZ#5 (Divisor 900)',
    defaultUnit: 'KG',
    unitPriceBDT: 320.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_chain_consumption_3',
    name: 'Chain Consumption',
    componentCategory: 'chain',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#3'],
    specification: 'Base Chain Consumption for PZ#3 (pre-loss)',
    defaultUnit: 'Mtr',
    unitPriceBDT: 0.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_chain_consumption_5',
    name: 'Chain Consumption',
    componentCategory: 'chain',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#5'],
    specification: 'Base Chain Consumption for PZ#5 (pre-loss)',
    defaultUnit: 'Mtr',
    unitPriceBDT: 0.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_chain_consumption_8',
    name: 'Chain Consumption',
    componentCategory: 'chain',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#8'],
    specification: 'Base Chain Consumption for PZ#8 (pre-loss)',
    defaultUnit: 'Mtr',
    unitPriceBDT: 0.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_tape_wise_3',
    name: 'PZO#3 & PZC#3 Tape Wise',
    componentCategory: 'resin',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#3'],
    specification: 'PZO#3 & PZC#3 Tape Wise (+2.5% Add., Factor 8.15 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 340.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_tape_resin_3',
    name: 'PZO#3 & PZC#3 Tape Wise',
    componentCategory: 'resin',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#3'],
    specification: 'PZO#3 & PZC#3 Tape Wise (+2.5% Add., Factor 8.15 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 340.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_tape_resin_5',
    name: 'Resin for PZ#5 Chain',
    componentCategory: 'resin',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#5'],
    specification: 'Tape-Based Resin for PZ#5 (+2.5% Add., Factor 13.07 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 340.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_tape_resin_8',
    name: 'Resin for PZ#8 Chain',
    componentCategory: 'resin',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#8'],
    specification: 'Tape-Based Resin for PZ#8 (+2.5% Add., Factor 26.23 / 1000)',
    defaultUnit: 'KG',
    unitPriceBDT: 340.00,
    defaultWastagePercent: 0
  },

  // ==================== 6. TOLLILON FLAT WIRE ====================
  {
    id: 'mat_cz_tollilon_3',
    name: 'Tollilon Flat Wire (CZ#3)',
    componentCategory: 'wire',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#3'],
    specification: 'Tollilon wire for CZ#3 (#1 / 14400 + #2 / 9500)',
    defaultUnit: 'Unit',
    unitPriceBDT: 1.50,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_cz_tollilon_5',
    name: 'Tollilon Flat Wire (CZ#5)',
    componentCategory: 'wire',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#5'],
    specification: 'Tollilon wire for CZ#5 (#1 / 7700 + #2 / 8600)',
    defaultUnit: 'Unit',
    unitPriceBDT: 1.50,
    defaultWastagePercent: 0
  },

  // ==================== 7. U-TOP ====================
  {
    id: 'mat_cz_utop_5',
    name: 'U-Top (CZ#5)',
    componentCategory: 'stop',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#5'],
    specification: 'U-Top Stop for CZ#5',
    defaultUnit: 'Pcs',
    unitPriceBDT: 350.00,
    defaultWastagePercent: 0
  },

  // ==================== 8. SLIDERS ====================
  {
    id: 'mat_cz_slider_3',
    name: 'Slider CZ#3 (+1.5% Add.)',
    componentCategory: 'slider',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#3'],
    specification: 'Slider for CZ#3 with +1.5% factory addition',
    defaultUnit: 'Pcs',
    unitPriceBDT: 3.50,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_cz_slider_5',
    name: 'Slider CZ#5 (+1.5% Add.)',
    componentCategory: 'slider',
    compatibleCategory: ['cz', 'nylon'],
    compatibleSizes: ['#5'],
    specification: 'Slider for CZ#5 with +1.5% factory addition',
    defaultUnit: 'Pcs',
    unitPriceBDT: 4.80,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_slider_3',
    name: 'Slider MZ#3 (+1.5% Add.)',
    componentCategory: 'slider',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#3'],
    specification: 'Slider for MZ#3 with +1.5% factory addition',
    defaultUnit: 'Pcs',
    unitPriceBDT: 5.20,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_mz_slider_5',
    name: 'Slider MZ#5 (+1.5% Add.)',
    componentCategory: 'slider',
    compatibleCategory: ['mz', 'metal'],
    compatibleSizes: ['#5'],
    specification: 'Slider for MZ#5 with +1.5% factory addition',
    defaultUnit: 'Pcs',
    unitPriceBDT: 6.80,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_slider_3',
    name: 'Slider PZ#3 (+1.5% Add.)',
    componentCategory: 'slider',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#3'],
    specification: 'Slider for PZ#3 with +1.5% factory addition',
    defaultUnit: 'Pcs',
    unitPriceBDT: 3.80,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_slider_5',
    name: 'Slider PZ#5 (+1.5% Add.)',
    componentCategory: 'slider',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#5'],
    specification: 'Slider for PZ#5 with +1.5% factory addition',
    defaultUnit: 'Pcs',
    unitPriceBDT: 5.00,
    defaultWastagePercent: 0
  },
  {
    id: 'mat_pz_slider_8',
    name: 'Slider PZ#8 (+1.5% Add.)',
    componentCategory: 'slider',
    compatibleCategory: ['pz', 'plastic'],
    compatibleSizes: ['#8'],
    specification: 'Slider for PZ#8 with +1.5% factory addition',
    defaultUnit: 'Pcs',
    unitPriceBDT: 7.50,
    defaultWastagePercent: 0
  }
];

/**
 * Normalize category code to standard identifiers
 * @param {string} category 
 * @returns {string} 'cz' | 'mz' | 'pz' | 'invisible'
 */
function normalizeCategoryCode(category) {
  const c = String(category || '').toLowerCase().trim();
  if (c === 'wire' || c.includes('wire')) return 'wire';
  if (c === 'cz' || c === 'nylon' || c.includes('nylon') || c.includes('coil')) return 'cz';
  if (c === 'mz' || c === 'metal' || c.includes('metal')) return 'mz';
  if (c === 'pz' || c === 'plastic' || c.includes('plastic') || c.includes('vislon')) return 'pz';
  if (c === 'invisible') return 'invisible';
  return c || 'cz';
}

/**
 * Get sample materials filtered by category, size, and component type
 * @param {string} category - 'cz' | 'mz' | 'wire' | 'pz' | 'nylon' | 'plastic' | 'metal' | 'invisible'
 * @param {string} size - '#3' | '#4' | '#5' | '#8' | '#10'
 * @param {string} [componentCategory] - 'chain' | 'slider' | 'puller' | 'top_stop' | 'bottom_stop' | etc.
 * @returns {Array<Object>}
 */
function getSampleMaterials(category, size, componentCategory = null) {
  const normCat = normalizeCategoryCode(category);
  const normSize = String(size || '').trim();

  return SAMPLE_MATERIALS.filter(mat => {
    // Component category check
    if (componentCategory && mat.componentCategory !== componentCategory) {
      return false;
    }
    
    // Zipper category check
    const catMatch = mat.compatibleCategory.includes('all') || 
                     mat.compatibleCategory.includes(normCat) ||
                     (normCat === 'cz' && mat.compatibleCategory.includes('nylon')) ||
                     (normCat === 'mz' && mat.compatibleCategory.includes('metal')) ||
                     (normCat === 'pz' && mat.compatibleCategory.includes('plastic'));
    
    // Zipper size check
    const sizeMatch = mat.compatibleSizes.includes('all') || 
                      mat.compatibleSizes.includes(normSize);
                      
    return catMatch && sizeMatch;
  });
}

/**
 * Get a specific material by its ID
 * @param {string} id 
 * @returns {Object|null}
 */
function getMaterialById(id) {
  return SAMPLE_MATERIALS.find(m => m.id === id) || null;
}

/**
 * Get all materials in the sample database
 * @returns {Array<Object>}
 */
function getAllSampleMaterials() {
  return [...SAMPLE_MATERIALS];
}

// Export for global access in Vanilla JS & Node.js
if (typeof window !== 'undefined') {
  window.MaterialsCatalog = {
    SAMPLE_MATERIALS,
    normalizeCategoryCode,
    getSampleMaterials,
    getMaterialById,
    getAllSampleMaterials
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SAMPLE_MATERIALS,
    normalizeCategoryCode,
    getSampleMaterials,
    getMaterialById,
    getAllSampleMaterials
  };
}


