/**
 * Main Application Controller for Zipper BOM Calculator
 * Orchestrates Multi-Category Group Architecture, Live DOM events,
 * ONE True Consolidated/Merged BOM Table, Category-Specific Calculation Details,
 * and Real-Time Production Cost Estimation.
 */

// Application State
let appState = {
  currentEstimate: {
    id: null,
    name: '',
    reference: 'EST-' + Math.floor(1000 + Math.random() * 9000),
    categoryGroups: [
      {
        id: 'categoryGroup_1',
        name: 'Category Group 1',
        category: '', // Starts empty for fresh user selection
        styleName: '',
        color: '',
        remarks: '',
        lossPercent: 3.0,
        variants: [
          {
            id: 'var_1',
            name: 'Variant 1',
            zipperSize: '#5',
            zipperType: 'closed_end',
            length: '',
            lengthUnit: 'inch',
            quantity: '',
            color: '',
            remarks: '',
            bomRows: []
          }
        ]
      }
    ],
    labor: {
      method: 'per_zipper',
      ratePerZipper: '',
      workers: '',
      hours: '',
      hourlyRate: ''
    },
    overhead: {
      percentage: '',
      basis: 'material_and_labor'
    },
    otherCosts: [],
    priceOverrides: {}
  },
  selectedMaterialKey: null,
  selectedCalcDetailsGroupId: 'categoryGroup_1',
  lastCalculation: null,
  isFormulaDetailsCollapsed: false
};


if (typeof window !== 'undefined') {
  window.appState = appState;
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initialize Application
 */
function initApp() {
  // Populate common form controls
  populateCommonForm();

  // Bind All DOM Event Listeners
  bindEvents();

  // Initial Full Render of UI structures & calculations
  rebuildAndRenderAll();

  // Update Saved Estimates Badge Counter
  updateSavedBadgeCount();
}

/**
 * Populate common form inputs from appState
 */
function populateCommonForm() {
  // Category groups and variants are rendered in rebuildAndRenderAll
}

/**
 * Bind Static DOM Event Listeners
 */
function bindEvents() {
  // Toggle Formula Details Card Body
  const btnToggleFormula = document.getElementById('btn-toggle-formula-details');
  if (btnToggleFormula) {
    btnToggleFormula.addEventListener('click', () => {
      const body = document.getElementById('formula-details-body');
      const label = document.getElementById('label-toggle-formula');
      if (body) {
        appState.isFormulaDetailsCollapsed = !appState.isFormulaDetailsCollapsed;
        body.style.display = appState.isFormulaDetailsCollapsed ? 'none' : 'block';
        if (label) label.textContent = appState.isFormulaDetailsCollapsed ? 'Show Details' : 'Hide Details';
      }
    });
  }

  // Calculation Details Group Switcher
  const selectCalcDetailsGroup = document.getElementById('select-calc-details-group');
  if (selectCalcDetailsGroup) {
    selectCalcDetailsGroup.addEventListener('change', (e) => {
      appState.selectedCalcDetailsGroupId = e.target.value;
      renderCalculationDetails();
    });
  }

  // Button: "+ Add New Category" (Global button below groups)
  const btnAddCategoryGroup = document.getElementById('btn-add-category-group');
  if (btnAddCategoryGroup) {
    btnAddCategoryGroup.addEventListener('click', handleAddCategoryGroup);
  }

  // Reset ALL BOMs Button
  const btnResetBOM = document.getElementById('btn-reset-bom');
  if (btnResetBOM) {
    btnResetBOM.addEventListener('click', () => {
      if (confirm('Reset BOM recipes for all variants across all category groups to suggested defaults?')) {
        appState.currentEstimate.categoryGroups.forEach(group => {
          const cat = group.category || 'cz';
          group.variants.forEach(v => {
            v.bomRows = window.BOMRules ? window.BOMRules.generateSuggestedBOM(v, cat) : [];
          });
        });
        rebuildAndRenderAll();
        showToast('All variant BOM recipes reset to suggested defaults', 'info');
      }
    });
  }

  // Add Custom Material Modal Trigger
  const btnAddCustom = document.getElementById('btn-add-custom-material');
  if (btnAddCustom) {
    btnAddCustom.addEventListener('click', () => openAddMaterialModal());
  }

  // Add Custom Material Form Submit
  const formAddMaterial = document.getElementById('form-add-material');
  if (formAddMaterial) {
    formAddMaterial.addEventListener('submit', handleAddCustomMaterialSubmit);
  }

  // Header Actions
  const btnNewEstimate = document.getElementById('btn-new-estimate');
  if (btnNewEstimate) {
    btnNewEstimate.addEventListener('click', handleNewEstimate);
  }

  const btnSavedEstimates = document.getElementById('btn-saved-estimates');
  if (btnSavedEstimates) {
    btnSavedEstimates.addEventListener('click', openSavedEstimatesModal);
  }

  const btnExportPDF = document.getElementById('btn-export-pdf');
  if (btnExportPDF) {
    btnExportPDF.addEventListener('click', handleExportPDF);
  }


  // Save Modal Form Submit
  const formSaveEstimate = document.getElementById('form-save-estimate');
  if (formSaveEstimate) {
    formSaveEstimate.addEventListener('submit', handleSaveEstimateSubmit);
  }

  // Backup Import & Export
  const btnExportBackup = document.getElementById('btn-export-backup');
  if (btnExportBackup) {
    btnExportBackup.addEventListener('click', () => {
      if (window.StorageManager) {
        window.StorageManager.exportEstimatesToJSON();
        showToast('Estimates backup downloaded successfully', 'success');
      }
    });
  }

  const inputImportBackup = document.getElementById('input-import-backup');
  if (inputImportBackup) {
    inputImportBackup.addEventListener('change', handleImportBackup);
  }

  // Modal Close Buttons
  document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  // Close modals on clicking overlay backdrop
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Search input in Saved Estimates modal
  const inputSearchSaved = document.getElementById('input-search-saved');
  if (inputSearchSaved) {
    inputSearchSaved.addEventListener('input', (e) => {
      renderSavedEstimatesList(e.target.value);
    });
  }
}

/**
 * Handle adding a new independent Category Group
 */
function handleAddCategoryGroup() {
  const groups = appState.currentEstimate.categoryGroups;
  const nextGroupNum = groups.length + 1;
  const uniqueId = 'categoryGroup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

  const newGroup = {
    id: uniqueId,
    name: `Category Group ${nextGroupNum}`,
    category: '', // Empty category selection
    styleName: '',
    color: '',
    remarks: '',
    lossPercent: 3.0,
    sliderAdditionPercent: 1.5,
    variants: [
      {
        id: 'var_' + Date.now() + '_1',
        name: 'Variant 1',
        zipperSize: '#5',
        zipperType: 'closed_end',
        length: '',
        lengthUnit: 'inch',
        quantity: '',
        color: '',
        remarks: '',
        bomRows: []
      }
    ]
  };

  groups.push(newGroup);
  appState.selectedCalcDetailsGroupId = uniqueId;

  rebuildAndRenderAll();

  // Scroll to the newly added group card
  const newCardEl = document.getElementById(`category-group-card-${uniqueId}`);
  if (newCardEl) {
    newCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const selectCat = newCardEl.querySelector('.select-group-category');
    if (selectCat) selectCat.focus();
  }

  showToast(`Added ${newGroup.name}. Select a category to begin.`, 'success');
}

/**
 * Handle removing a Category Group
 * @param {string} groupId 
 */
function handleRemoveCategoryGroup(groupId) {
  const groups = appState.currentEstimate.categoryGroups;
  if (groups.length <= 1) {
    showToast('At least one Category Group must remain in the estimate.', 'warning');
    return;
  }

  const groupIdx = groups.findIndex(g => g.id === groupId);
  if (groupIdx === -1) return;

  const targetGroup = groups[groupIdx];
  const hasData = targetGroup.variants.some(v => (v.length && v.quantity));

  if (hasData) {
    if (!confirm(`Are you sure you want to remove "${targetGroup.name}" and its variants?`)) {
      return;
    }
  }

  groups.splice(groupIdx, 1);

  // If deleted active details group, switch to first remaining group
  if (appState.selectedCalcDetailsGroupId === groupId) {
    appState.selectedCalcDetailsGroupId = groups[0] ? groups[0].id : null;
  }

  rebuildAndRenderAll();
  showToast(`Removed "${targetGroup.name}".`, 'info');
}

/**
 * Handle "+ Select Another Variant" inside a specific Category Group
 * @param {string} groupId 
 */
function handleAddVariantToGroup(groupId) {
  const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
  if (!group) return;

  const cat = group.category || 'cz';
  const variants = group.variants;
  const nextNum = variants.length + 1;
  const prevVar = variants[variants.length - 1] || {};

  const size = prevVar.zipperSize || (cat === 'wire' ? '#5_normal' : '#5');
  const unit = prevVar.lengthUnit || 'inch';
  const type = prevVar.zipperType || 'closed_end';

  const newVariant = {
    id: 'var_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: `Variant ${nextNum}`,
    zipperSize: size,
    zipperType: type,
    length: (prevVar.length !== undefined && prevVar.length !== '') ? (Number(prevVar.length) + 0.25) : '',
    lengthUnit: unit,
    quantity: (prevVar.quantity !== undefined && prevVar.quantity !== '') ? prevVar.quantity : '',
    color: prevVar.color || '',
    remarks: '',
    bomRows: []
  };

  if (window.BOMRules) {
    newVariant.bomRows = window.BOMRules.generateSuggestedBOM(newVariant, cat);
  }

  variants.push(newVariant);
  rebuildAndRenderAll();

  // Scroll to the newly added variant
  const newEl = document.getElementById(`variant-card-${newVariant.id}`);
  if (newEl) {
    newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const lengthInput = newEl.querySelector('.input-var-length');
    if (lengthInput) lengthInput.focus();
  }

  showToast(`Added ${newVariant.name} inside ${group.name}`, 'success');
}

/**
 * Handle removing a variant from a specific Category Group
 * @param {string} groupId 
 * @param {string} variantId 
 */
function handleRemoveVariantFromGroup(groupId, variantId) {
  const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
  if (!group) return;

  if (group.variants.length <= 1) {
    showToast('Each Category Group must have at least one variant.', 'warning');
    return;
  }

  const idx = group.variants.findIndex(v => v.id === variantId);
  if (idx !== -1) {
    const removedName = group.variants[idx].name;
    group.variants.splice(idx, 1);
    rebuildAndRenderAll();
    showToast(`Removed ${removedName} from ${group.name}`, 'info');
  }
}

/**
 * Master UI rebuild and recalculation function
 */
function rebuildAndRenderAll() {
  // 1. Render all Category Groups and their Variants
  renderCategoryGroups();

  // 2. Run master calculations across all independent groups and build merged BOM
  updateLiveCalculations();
}

/**
 * Render all Category Groups into the Product Information container
 */
function renderCategoryGroups() {
  const container = document.getElementById('category-groups-container');
  if (!container) return;

  const groups = appState.currentEstimate.categoryGroups;
  if (!Array.isArray(groups) || groups.length === 0) {
    container.innerHTML = `<div class="empty-state">No category groups defined. Click "+ Add New Category" below to start.</div>`;
    return;
  }

  container.innerHTML = '';

  groups.forEach((group, gIdx) => {
    const groupCard = document.createElement('div');
    groupCard.className = 'category-group-card';
    groupCard.id = `category-group-card-${group.id}`;
    groupCard.innerHTML = buildCategoryGroupHTML(group, gIdx, groups.length);
    container.appendChild(groupCard);
  });

  // Attach live event listeners to all newly rendered category group DOM controls
  bindCategoryGroupEventListeners();
}

/**
 * Build HTML for a single Category Group card
 * @param {Object} group 
 * @param {number} gIdx 
 * @param {number} totalGroupsCount 
 * @returns {string}
 */
function buildCategoryGroupHTML(group, gIdx, totalGroupsCount) {
  const cat = group.category || '';
  const isLossApplicable = (cat === 'cz' || cat === 'mz' || cat === 'wire' || cat === 'pz');
  const isZipperCategory = (cat === 'cz' || cat === 'mz' || cat === 'pz');

  const mzParams = (group.mzParams && typeof group.mzParams === 'object') ? group.mzParams : {};
  const primaryMzSize = (group.variants && group.variants.length > 0 && group.variants[0].zipperSize && group.variants[0].zipperSize.includes('5')) ? '#5' : '#3';
  const defaultMzTapeDivisor = primaryMzSize === '#5' ? 71 : 97;
  const defaultTopStopFactor = primaryMzSize === '#5' ? 0.32 : 0.22;

  const czParams = (group.czParams && typeof group.czParams === 'object') ? group.czParams : {};
  const primaryCzSize = (group.variants && group.variants.length > 0 && group.variants[0].zipperSize && group.variants[0].zipperSize.includes('5')) ? '#5' : '#3';
  const primaryUnit = (group.variants && group.variants.length > 0 && group.variants[0].lengthUnit === 'cm') ? 'cm' : 'inch';
  const defaultCzAllowance = primaryCzSize === '#5' 
    ? (primaryUnit === 'cm' ? 4.5 : 1.78) 
    : (primaryUnit === 'cm' ? 4.0 : 1.58);
  const defaultCzTapeDivisor = primaryCzSize === '#5' ? 54.5 : 87.0;
  const defaultCzTopStopFactor = primaryCzSize === '#5' ? 0.04 : 0.02;
  const defaultCzBottomStopFactor = primaryCzSize === '#5' ? 0.04 : 0.03;
  const defaultCzResinDivisor = primaryCzSize === '#5' ? 900 : 1000;
  const defaultCzUTopFactor = 0.074;
  const defaultCzTollilon1Divisor = primaryCzSize === '#5' ? 7700 : 14400;
  const defaultCzTollilon2Divisor = primaryCzSize === '#5' ? 8600 : 9500;

  const wireParams = (group.wireParams && typeof group.wireParams === 'object') ? group.wireParams : {};
  const firstVariant = (group.variants && group.variants.length > 0) ? group.variants[0] : null;
  const primaryWireType = firstVariant 
    ? (firstVariant.zipperSize && firstVariant.zipperSize.includes('3') ? '#3' : (firstVariant.zipperSize && firstVariant.zipperSize.includes('long') ? '#5_long' : '#5_normal'))
    : '#5_normal';
  const primaryWireUnit = (firstVariant && firstVariant.lengthUnit === 'cm') ? 'cm' : 'inch';
  const defaultWireAllowance = primaryWireType === '#5_long'
    ? (primaryWireUnit === 'cm' ? 5.0 : 1.97)
    : 0;
  const defaultWireDivisor = 20.6;
  const defaultWire3InchDivisor = 32.0;
  const defaultWire3CmDivisor = 27.73;

  const pzParams = (group.pzParams && typeof group.pzParams === 'object') ? group.pzParams : {};
  const primaryPzVariant = (group.variants && group.variants.length > 0) ? group.variants[0] : null;
  const primaryPzSize = (primaryPzVariant && primaryPzVariant.zipperSize && primaryPzVariant.zipperSize.includes('8')) ? '#8' 
    : ((primaryPzVariant && primaryPzVariant.zipperSize && primaryPzVariant.zipperSize.includes('3')) ? '#3' : '#5');
  const primaryPzUnit = (primaryPzVariant && primaryPzVariant.lengthUnit === 'cm') ? 'cm' : 'inch';

  const defaultPzAllowance = primaryPzSize === '#8'
    ? (primaryPzUnit === 'cm' ? 6.3 : 2.4)
    : (primaryPzUnit === 'cm' ? 5.0 : 1.97);
  const defaultPzTapeDivisor = primaryPzSize === '#8' ? 57 : (primaryPzSize === '#3' ? 101 : 81);
  const defaultPzTapeAddPct = 2.5;
  const defaultPzTapeFactor = primaryPzSize === '#8' ? 26.23 : (primaryPzSize === '#3' ? 8.15 : 13.07);

  let catBadge = 'Unselected';
  let catBadgeClass = 'badge-secondary';
  if (cat === 'cz') { catBadge = 'CZ (Nylon)'; catBadgeClass = 'badge-primary'; }
  else if (cat === 'mz') { catBadge = 'MZ (Metal)'; catBadgeClass = 'badge-success'; }
  else if (cat === 'wire') { catBadge = 'WIRE (Metal Wire)'; catBadgeClass = 'badge-warning'; }
  else if (cat === 'pz') { catBadge = 'PZ (Plastic)'; catBadgeClass = 'badge-primary'; }

  return `
    <div class="category-group-header">
      <div class="category-group-title-area">
        <span class="group-number-pill">Group ${gIdx + 1}</span>
        <h3 class="group-title-text">${escapeHtml(group.name || `Category Group ${gIdx + 1}`)}</h3>
        <span class="badge ${catBadgeClass}">${catBadge}</span>
      </div>

      <div class="category-group-header-actions">
        ${totalGroupsCount > 1 ? `
          <button type="button" class="btn btn-sm btn-ghost btn-remove-category-group" data-group-id="${group.id}" title="Remove this Category Group">
            <svg class="w-4 h-4 text-rose-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Group
          </button>
        ` : ''}
      </div>
    </div>

    <div class="category-group-body">
      <!-- Category & Factory Parameters Configuration Card -->
      <div class="category-selector-wrapper mb-3">
        <div class="category-selector-header">
          <h4 class="category-selector-heading">
            <svg class="w-4 h-4 text-indigo-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10M7 11h10M7 15h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
            Zipper Category <span class="text-rose-400 font-bold">*</span>
          </h4>
          <p class="category-selector-subtext">Select manufacturing formula family for this independent category group</p>
        </div>

        <div class="category-controls-grid">
          <!-- 1. Zipper Category Field -->
          <div class="category-control-item category-control-main">
            <label class="category-control-label" for="select-cat-${group.id}">
              Zipper Category
            </label>
            <select id="select-cat-${group.id}" class="form-select select-group-category category-styled-select" data-group-id="${group.id}">
              <option value="" ${!cat ? 'selected' : ''} disabled>-- Select Category --</option>
              <option value="cz" ${cat === 'cz' ? 'selected' : ''}>Nylon Zipper (CZ)</option>
              <option value="mz" ${cat === 'mz' ? 'selected' : ''}>Metal Zipper (MZ)</option>
              <option value="wire" ${cat === 'wire' ? 'selected' : ''}>Brass / Metal Wire (WIRE)</option>
              <option value="pz" ${cat === 'pz' ? 'selected' : ''}>Plastic Zipper (PZ)</option>
            </select>
          </div>

          <!-- 2. Loss Percentage Field -->
          ${isLossApplicable ? `
            <div class="category-control-item category-control-loss">
              <label class="category-control-label" for="input-loss-${group.id}" title="Factory Loss Allowance Percentage">
                Loss Percentage
              </label>
              <div class="input-with-addon category-addon-wrapper">
                <input type="number" id="input-loss-${group.id}" class="form-input font-mono input-group-loss category-styled-input" 
                  data-group-id="${group.id}"
                  value="${group.lossPercent !== undefined ? group.lossPercent : 3.0}" 
                  min="0" max="100" step="0.5">
                <span class="input-addon input-addon-right category-addon-badge">%</span>
              </div>
            </div>
          ` : ''}

          <!-- 3. Slider Add Percentage Field (Zipper categories only) -->
          ${isZipperCategory ? `
            <div class="category-control-item category-control-slider">
              <label class="category-control-label" for="input-slider-${group.id}" title="Slider Addition Allowance Percentage">
                Slider Add %
              </label>
              <div class="input-with-addon category-addon-wrapper">
                <input type="number" id="input-slider-${group.id}" class="form-input font-mono input-group-slider-add category-styled-input" 
                  data-group-id="${group.id}"
                  value="${group.sliderAdditionPercent !== undefined ? group.sliderAdditionPercent : 1.5}" 
                  min="0" max="100" step="0.1">
                <span class="input-addon input-addon-right category-addon-badge">%</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Dynamic Category-Specific Calculation Parameters for CZ -->
        ${cat === 'cz' ? `
          <div class="category-dynamic-params-section">
            <div class="category-dynamic-params-header">
              <span class="category-dynamic-params-title">
                <svg class="w-3.5 h-3.5 text-indigo-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                CZ Production Parameters (${primaryCzSize === '#5' ? 'CZ#5' : 'CZ#3'})
              </span>
              <span class="category-dynamic-params-hint">Factory calculation constants for Nylon Zipper</span>
            </div>

            <div class="category-dynamic-params-grid">
              <!-- 1. Chain Allowance -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="cz-allowance-${group.id}" title="Production Allowance for Chain Cutting">
                  Chain Allowance
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="cz-allowance-${group.id}" 
                         class="form-input font-mono category-styled-input input-cz-param" 
                         data-group-id="${group.id}" 
                         data-param="chainAllowance" 
                         value="${czParams.chainAllowance !== undefined ? czParams.chainAllowance : defaultCzAllowance}" 
                         min="0" max="100" step="0.01">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">${primaryUnit === 'cm' ? 'CM' : 'Inch'}</span>
                </div>
              </div>

              <!-- 2. Tape Divisor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="cz-tape-div-${group.id}" title="Tape Weight Divisor Factor">
                  Tape Divisor
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="cz-tape-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-cz-param" 
                         data-group-id="${group.id}" 
                         data-param="tapeDivisor" 
                         value="${czParams.tapeDivisor !== undefined ? czParams.tapeDivisor : defaultCzTapeDivisor}" 
                         min="1" max="500" step="0.1">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">Mtr/KG</span>
                </div>
              </div>

              <!-- 3. Top Stop Factor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="cz-top-factor-${group.id}" title="Top Stop Calculation Factor (Divided by 1000)">
                  Top Stop Factor
                </label>
                <input type="number" id="cz-top-factor-${group.id}" 
                       class="form-input font-mono category-styled-input input-cz-param" 
                       data-group-id="${group.id}" 
                       data-param="topStopFactor" 
                       value="${czParams.topStopFactor !== undefined ? czParams.topStopFactor : defaultCzTopStopFactor}" 
                       min="0" max="5.0" step="0.001">
              </div>

              <!-- 4. Bottom Stop Factor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="cz-bottom-factor-${group.id}" title="Bottom Stop Calculation Factor (Divided by 1000)">
                  Bottom Stop Factor
                </label>
                <input type="number" id="cz-bottom-factor-${group.id}" 
                       class="form-input font-mono category-styled-input input-cz-param" 
                       data-group-id="${group.id}" 
                       data-param="bottomStopFactor" 
                       value="${czParams.bottomStopFactor !== undefined ? czParams.bottomStopFactor : defaultCzBottomStopFactor}" 
                       min="0" max="5.0" step="0.001">
              </div>

              <!-- 5. Resin Divisor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="cz-resin-div-${group.id}" title="POM Element Resin Weight Divisor">
                  Resin Divisor
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="cz-resin-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-cz-param" 
                         data-group-id="${group.id}" 
                         data-param="resinDivisor" 
                         value="${czParams.resinDivisor !== undefined ? czParams.resinDivisor : defaultCzResinDivisor}" 
                         min="1" max="100000" step="1">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">Pcs/KG</span>
                </div>
              </div>

              ${primaryCzSize === '#5' ? `
                <!-- 6. Ultrasonic U-Top Factor (ONLY FOR CZ#5) -->
                <div class="category-dynamic-param-item">
                  <label class="category-control-label" for="cz-utop-factor-${group.id}" title="Ultrasonic U-Top Wire Factor (Divided by 1000)">
                    U-Top Factor
                  </label>
                  <input type="number" id="cz-utop-factor-${group.id}" 
                         class="form-input font-mono category-styled-input input-cz-param" 
                         data-group-id="${group.id}" 
                         data-param="uTopFactor" 
                         value="${czParams.uTopFactor !== undefined ? czParams.uTopFactor : defaultCzUTopFactor}" 
                         min="0" max="5.0" step="0.001">
                </div>
              ` : ''}

              <!-- 7. Tollilon Divisor 1 -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="cz-tollilon1-div-${group.id}" title="Tollilon Flat Wire Component #1 Divisor">
                  Tollilon Divisor 1
                </label>
                <input type="number" id="cz-tollilon1-div-${group.id}" 
                       class="form-input font-mono category-styled-input input-cz-param" 
                       data-group-id="${group.id}" 
                       data-param="tollilon1Divisor" 
                       value="${czParams.tollilon1Divisor !== undefined ? czParams.tollilon1Divisor : defaultCzTollilon1Divisor}" 
                       min="1" max="100000" step="1">
              </div>

              <!-- 8. Tollilon Divisor 2 -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="cz-tollilon2-div-${group.id}" title="Tollilon Flat Wire Component #2 Divisor">
                  Tollilon Divisor 2
                </label>
                <input type="number" id="cz-tollilon2-div-${group.id}" 
                       class="form-input font-mono category-styled-input input-cz-param" 
                       data-group-id="${group.id}" 
                       data-param="tollilon2Divisor" 
                       value="${czParams.tollilon2Divisor !== undefined ? czParams.tollilon2Divisor : defaultCzTollilon2Divisor}" 
                       min="1" max="100000" step="1">
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Dynamic Category-Specific Calculation Parameters for MZ -->
        ${cat === 'mz' ? `
          <div class="category-dynamic-params-section">
            <div class="category-dynamic-params-header">
              <span class="category-dynamic-params-title">
                <svg class="w-3.5 h-3.5 text-amber-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                MZ Production Parameters (${primaryMzSize === '#5' ? 'MZ#5' : 'MZ#3'})
              </span>
              <span class="category-dynamic-params-hint">Factory calculation constants for Metal Zipper</span>
            </div>

            <div class="category-dynamic-params-grid">
              <!-- 1. Tape Divisor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="mz-tape-div-${group.id}">
                  Tape Divisor
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="mz-tape-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-mz-param" 
                         data-group-id="${group.id}" 
                         data-param="tapeDivisor" 
                         value="${mzParams.tapeDivisor !== undefined ? mzParams.tapeDivisor : defaultMzTapeDivisor}" 
                         min="1" max="500" step="1">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">Mtr/KG</span>
                </div>
              </div>

              <!-- 2. Teeth Wire Divisor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="mz-teeth-div-${group.id}">
                  Teeth Wire Divisor
                </label>
                <input type="number" id="mz-teeth-div-${group.id}" 
                       class="form-input font-mono category-styled-input input-mz-param" 
                       data-group-id="${group.id}" 
                       data-param="teethWireDivisor" 
                       value="${mzParams.teethWireDivisor !== undefined ? mzParams.teethWireDivisor : 32}" 
                       min="1" max="200" step="1">
              </div>

              <!-- 3. Teeth Wire Loss Factor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="mz-teeth-loss-${group.id}">
                  Teeth Loss Factor
                </label>
                <input type="number" id="mz-teeth-loss-${group.id}" 
                       class="form-input font-mono category-styled-input input-mz-param" 
                       data-group-id="${group.id}" 
                       data-param="teethWireLossFactor" 
                       value="${mzParams.teethWireLossFactor !== undefined ? mzParams.teethWireLossFactor : 1.04}" 
                       min="0.5" max="3.0" step="0.01">
              </div>

              <!-- 4. Top Stop Factor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="mz-top-factor-${group.id}">
                  Top Stop Factor
                </label>
                <input type="number" id="mz-top-factor-${group.id}" 
                       class="form-input font-mono category-styled-input input-mz-param" 
                       data-group-id="${group.id}" 
                       data-param="topStopFactor" 
                       value="${mzParams.topStopFactor !== undefined ? mzParams.topStopFactor : defaultTopStopFactor}" 
                       min="0.01" max="5.0" step="0.01">
              </div>

              <!-- 5. Top Stop Divisor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="mz-top-div-${group.id}">
                  Top Stop Divisor
                </label>
                <input type="number" id="mz-top-div-${group.id}" 
                       class="form-input font-mono category-styled-input input-mz-param" 
                       data-group-id="${group.id}" 
                       data-param="topStopDivisor" 
                       value="${mzParams.topStopDivisor !== undefined ? mzParams.topStopDivisor : 1000}" 
                       min="1" max="10000" step="1">
              </div>

              <!-- 6. H-Bottom Stop Loss Addition -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="mz-hbottom-loss-${group.id}">
                  H-Bottom Loss %
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="mz-hbottom-loss-${group.id}" 
                         class="form-input font-mono category-styled-input input-mz-param" 
                         data-group-id="${group.id}" 
                         data-param="hBottomLossPercent" 
                         value="${mzParams.hBottomLossPercent !== undefined ? mzParams.hBottomLossPercent : 2.5}" 
                         min="0" max="100" step="0.1">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">%</span>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Dynamic Category-Specific Calculation Parameters for WIRE -->
        ${cat === 'wire' ? `
          <div class="category-dynamic-params-section">
            <div class="category-dynamic-params-header">
              <span class="category-dynamic-params-title">
                <svg class="w-3.5 h-3.5 text-amber-500 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                WIRE Production Parameters (${primaryWireType === '#3' ? 'WIRE#3' : (primaryWireType === '#5_long' ? 'WIRE#5 Long Teeth' : 'WIRE#5 Normal Teeth')})
              </span>
              <span class="category-dynamic-params-hint">Factory calculation constants for Brass / Metal Wire</span>
            </div>

            <div class="category-dynamic-params-grid">
              ${primaryWireType === '#3' ? `
                <!-- 1. Inch Wire Divisor -->
                <div class="category-dynamic-param-item">
                  <label class="category-control-label" for="wire-inch-div-${group.id}" title="Wire weight calculation divisor for Inch length entries">
                    Inch Wire Divisor
                  </label>
                  <input type="number" id="wire-inch-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-wire-param" 
                         data-group-id="${group.id}" 
                         data-param="inchWireDivisor" 
                         value="${wireParams.inchWireDivisor !== undefined ? wireParams.inchWireDivisor : defaultWire3InchDivisor}" 
                         min="1" max="500" step="0.01">
                </div>

                <!-- 2. CM Wire Divisor -->
                <div class="category-dynamic-param-item">
                  <label class="category-control-label" for="wire-cm-div-${group.id}" title="Wire weight calculation divisor for CM length entries">
                    CM Wire Divisor
                  </label>
                  <input type="number" id="wire-cm-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-wire-param" 
                         data-group-id="${group.id}" 
                         data-param="cmWireDivisor" 
                         value="${wireParams.cmWireDivisor !== undefined ? wireParams.cmWireDivisor : defaultWire3CmDivisor}" 
                         min="1" max="500" step="0.01">
                </div>
              ` : ''}

              ${primaryWireType === '#5_normal' ? `
                <!-- 1. Wire Divisor -->
                <div class="category-dynamic-param-item">
                  <label class="category-control-label" for="wire-div-${group.id}" title="Wire weight calculation divisor for Normal Teeth #5">
                    Wire Divisor
                  </label>
                  <input type="number" id="wire-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-wire-param" 
                         data-group-id="${group.id}" 
                         data-param="wireDivisor" 
                         value="${wireParams.wireDivisor !== undefined ? wireParams.wireDivisor : defaultWireDivisor}" 
                         min="1" max="500" step="0.1">
                </div>
              ` : ''}

              ${primaryWireType === '#5_long' ? `
                <!-- 1. Wire Allowance -->
                <div class="category-dynamic-param-item">
                  <label class="category-control-label" for="wire-allowance-${group.id}" title="Production allowance added to length for Long Teeth #5 wire">
                    Wire Allowance
                  </label>
                  <div class="input-with-addon category-addon-wrapper">
                    <input type="number" id="wire-allowance-${group.id}" 
                           class="form-input font-mono category-styled-input input-wire-param" 
                           data-group-id="${group.id}" 
                           data-param="wireAllowance" 
                           value="${wireParams.wireAllowance !== undefined ? wireParams.wireAllowance : defaultWireAllowance}" 
                           min="0" max="100" step="0.01">
                    <span class="input-addon input-addon-right category-addon-badge text-xs">${primaryWireUnit === 'cm' ? 'CM' : 'Inch'}</span>
                  </div>
                </div>

                <!-- 2. Wire Divisor -->
                <div class="category-dynamic-param-item">
                  <label class="category-control-label" for="wire-div-${group.id}" title="Wire weight calculation divisor for Long Teeth #5">
                    Wire Divisor
                  </label>
                  <input type="number" id="wire-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-wire-param" 
                         data-group-id="${group.id}" 
                         data-param="wireDivisor" 
                         value="${wireParams.wireDivisor !== undefined ? wireParams.wireDivisor : defaultWireDivisor}" 
                         min="1" max="500" step="0.1">
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Dynamic Category-Specific Calculation Parameters for PZ -->
        ${cat === 'pz' ? `
          <div class="category-dynamic-params-section">
            <div class="category-dynamic-params-header">
              <span class="category-dynamic-params-title">
                <svg class="w-3.5 h-3.5 text-blue-500 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                PZ Production Parameters (${primaryPzSize === '#8' ? 'PZ#8' : (primaryPzSize === '#3' ? 'PZ#3' : 'PZ#5')})
              </span>
              <span class="category-dynamic-params-hint">Factory calculation constants for Plastic / Molded Zipper</span>
            </div>

            <div class="category-dynamic-params-grid">
              <!-- 1. Chain Allowance -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="pz-allowance-${group.id}" title="Production Allowance for Chain Cutting">
                  Chain Allowance
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="pz-allowance-${group.id}" 
                         class="form-input font-mono category-styled-input input-pz-param" 
                         data-group-id="${group.id}" 
                         data-param="chainAllowance" 
                         value="${pzParams.chainAllowance !== undefined ? pzParams.chainAllowance : defaultPzAllowance}" 
                         min="0" max="100" step="0.01">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">${primaryPzUnit === 'cm' ? 'CM' : 'Inch'}</span>
                </div>
              </div>

              <!-- 2. Tape Divisor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="pz-tape-div-${group.id}" title="Tape Weight Divisor Factor">
                  Tape Divisor
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="pz-tape-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-pz-param" 
                         data-group-id="${group.id}" 
                         data-param="tapeDivisor" 
                         value="${pzParams.tapeDivisor !== undefined ? pzParams.tapeDivisor : defaultPzTapeDivisor}" 
                         min="1" max="500" step="1">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">Mtr/KG</span>
                </div>
              </div>

              <!-- 3. Tape Additional % -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="pz-tape-add-${group.id}" title="Tape Additional Percentage Allowance">
                  Tape Add %
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="pz-tape-add-${group.id}" 
                         class="form-input font-mono category-styled-input input-pz-param" 
                         data-group-id="${group.id}" 
                         data-param="tapeAdditionalPercent" 
                         value="${pzParams.tapeAdditionalPercent !== undefined ? pzParams.tapeAdditionalPercent : defaultPzTapeAddPct}" 
                         min="0" max="100" step="0.1">
                  <span class="input-addon input-addon-right category-addon-badge text-xs">%</span>
                </div>
              </div>

              <!-- 4. Tape Factor -->
              <div class="category-dynamic-param-item">
                <label class="category-control-label" for="pz-tape-factor-${group.id}" title="PZ Tape Factor (Divided by 1000)">
                  PZ Tape Factor
                </label>
                <input type="number" id="pz-tape-factor-${group.id}" 
                       class="form-input font-mono category-styled-input input-pz-param" 
                       data-group-id="${group.id}" 
                       data-param="tapeFactor" 
                       value="${pzParams.tapeFactor !== undefined ? pzParams.tapeFactor : defaultPzTapeFactor}" 
                       min="0" max="100" step="0.01">
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Optional Group-Level Order / Style Metadata -->
      <div class="form-grid-3 mb-3">
        <div class="form-group mb-0">
          <label class="form-label text-xs">
            Product / Style Name <span class="form-label-hint">(Optional)</span>
          </label>
          <input type="text" class="form-input form-input-sm input-group-style" 
            data-group-id="${group.id}" 
            placeholder="e.g. Jacket Front / Pocket A"
            value="${escapeHtml(group.styleName || '')}">
        </div>

        <div class="form-group mb-0">
          <label class="form-label text-xs">
            Color / Shade Code <span class="form-label-hint">(Optional)</span>
          </label>
          <input type="text" class="form-input form-input-sm input-group-color" 
            data-group-id="${group.id}" 
            placeholder="e.g. Black / #019"
            value="${escapeHtml(group.color || '')}">
        </div>

        <div class="form-group mb-0">
          <label class="form-label text-xs">
            Remarks <span class="form-label-hint">(Optional)</span>
          </label>
          <input type="text" class="form-input form-input-sm input-group-remarks" 
            data-group-id="${group.id}" 
            placeholder="e.g. Anti-nickel, 50pc bundles"
            value="${escapeHtml(group.remarks || '')}">
        </div>
      </div>

      <!-- Variants for this Category Group -->
      <div class="group-variants-wrapper">
        <div class="group-variants-header flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Variants (${group.variants.length})
          </span>
        </div>

        <div class="variants-container" id="variants-container-${group.id}">
          ${group.variants.map((v, vIdx) => buildVariantCardHTML(v, vIdx, group)).join('')}
        </div>

        <div class="add-variant-wrapper mt-3">
          <button type="button" class="btn btn-sm btn-add-variant-to-group" data-group-id="${group.id}" title="Add another variant inside ${escapeHtml(group.name)}">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            + Select Another Variant
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Build HTML for an individual variant card inside a category group
 * @param {Object} v - Variant object
 * @param {number} vIdx - Variant index
 * @param {Object} group - Parent category group
 * @returns {string}
 */
function buildVariantCardHTML(v, vIdx, group) {
  const cat = group.category || 'cz';
  const size = v.zipperSize || (cat === 'wire' ? '#5_normal' : '#5');
  const unit = v.lengthUnit || 'inch';
  const type = v.zipperType || 'closed_end';

  return `
    <div class="variant-card" id="variant-card-${v.id}">
      <div class="variant-card-header">
        <div class="flex items-center gap-2">
          <span class="variant-index-badge">${vIdx + 1}</span>
          <input type="text" class="variant-name-input input-var-name" 
            data-group-id="${group.id}" 
            data-var-id="${v.id}" 
            value="${escapeHtml(v.name || `Variant ${vIdx + 1}`)}" 
            placeholder="Variant Name">
        </div>

        <div class="flex items-center gap-2">
          ${group.variants.length > 1 ? `
            <button type="button" class="btn-var-action text-rose-500 hover:text-rose-700 btn-remove-var" 
              data-group-id="${group.id}" 
              data-var-id="${v.id}" 
              title="Delete variant">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ` : ''}
        </div>
      </div>

      <div class="variant-card-body">
        <div class="form-grid-4">
          <!-- Size / Type Selection -->
          <div class="form-group mb-0">
            <label class="form-label text-xs font-semibold mb-1">
              ${cat === 'wire' ? 'Wire Type' : 'Zipper Size'} <span class="text-rose-500">*</span>
            </label>
            <select class="form-select form-select-sm input-var-size" data-group-id="${group.id}" data-var-id="${v.id}">
              ${buildSizeOptionsHTML(cat, size)}
            </select>
          </div>

          <!-- Length & Unit -->
          <div class="form-group mb-0">
            <label class="form-label text-xs font-semibold mb-1">
              Finished Length <span class="text-rose-500">*</span>
            </label>
            <div class="flex items-center gap-1">
              <input type="number" class="form-input form-input-sm font-mono input-var-length" 
                data-group-id="${group.id}" 
                data-var-id="${v.id}" 
                placeholder="e.g. 8.00" 
                min="0.1" step="0.25"
                value="${v.length !== undefined && v.length !== null ? v.length : ''}">
              
              <select class="form-select form-select-sm input-var-unit" style="width: 75px;" data-group-id="${group.id}" data-var-id="${v.id}">
                <option value="inch" ${unit === 'inch' ? 'selected' : ''}>Inch</option>
                <option value="cm" ${unit === 'cm' ? 'selected' : ''}>CM</option>
              </select>
            </div>
          </div>

          <!-- Order Quantity -->
          <div class="form-group mb-0">
            <label class="form-label text-xs font-semibold mb-1">
              Order Quantity <span class="text-rose-500">*</span>
            </label>
            <div class="input-with-addon">
              <input type="number" class="form-input form-input-sm font-mono input-var-qty" 
                data-group-id="${group.id}" 
                data-var-id="${v.id}" 
                placeholder="e.g. 5000" 
                min="1" step="1"
                value="${v.quantity !== undefined && v.quantity !== null ? v.quantity : ''}">
              <span class="input-addon input-addon-right text-xs">pcs</span>
            </div>
          </div>

          <!-- Zipper Type / Application (For CZ & MZ) -->
          ${cat !== 'wire' ? `
            <div class="form-group mb-0">
              <label class="form-label text-xs font-semibold mb-1">Zipper Type</label>
              <select class="form-select form-select-sm input-var-type" data-group-id="${group.id}" data-var-id="${v.id}">
                <option value="closed_end" ${type === 'closed_end' ? 'selected' : ''}>Closed End</option>
                <option value="open_end" ${type === 'open_end' ? 'selected' : ''}>Open End</option>
                <option value="two_way" ${type === 'two_way' ? 'selected' : ''}>Two-Way Open</option>
                ${cat === 'cz' ? `<option value="invisible" ${type === 'invisible' ? 'selected' : ''}>Invisible</option>` : ''}
                <option value="continuous" ${type === 'continuous' ? 'selected' : ''}>Continuous Chain</option>
              </select>
            </div>
          ` : `
            <div class="form-group mb-0">
              <label class="form-label text-xs font-semibold mb-1">Color / Note</label>
              <input type="text" class="form-input form-input-sm input-var-color" 
                data-group-id="${group.id}" 
                data-var-id="${v.id}" 
                placeholder="e.g. Golden / Brass"
                value="${escapeHtml(v.color || '')}">
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Build dynamic size/type options for a variant based on its parent category
 * @param {string} category 
 * @param {string} currentSelected 
 * @returns {string}
 */
function buildSizeOptionsHTML(category, currentSelected) {
  const cat = String(category || '').toLowerCase().trim();

  if (cat === 'wire') {
    const is3 = currentSelected === '#3';
    const is5Long = currentSelected === '#5_long' || currentSelected.includes('long');
    const is5Norm = !is3 && !is5Long;

    return `
      <option value="#3" ${is3 ? 'selected' : ''}>WIRE #3</option>
      <option value="#5_normal" ${is5Norm ? 'selected' : ''}>WIRE #5 — Normal Teeth</option>
      <option value="#5_long" ${is5Long ? 'selected' : ''}>WIRE #5 — Long Teeth</option>
    `;
  }

  if (cat === 'mz') {
    const is3 = currentSelected === '#3' || currentSelected.includes('3');
    return `
      <option value="#3" ${is3 ? 'selected' : ''}>MZ#3 (Metal Zipper #3)</option>
      <option value="#5" ${!is3 ? 'selected' : ''}>MZ#5 (Metal Zipper #5)</option>
    `;
  }

  if (cat === 'pz' || cat === 'plastic') {
    const is8 = currentSelected === '#8' || currentSelected.includes('8');
    const is3 = currentSelected === '#3' || currentSelected.includes('3');
    const is5 = !is8 && !is3;

    return `
      <option value="#3" ${is3 ? 'selected' : ''}>PZ#3 (Plastic Zipper #3)</option>
      <option value="#5" ${is5 ? 'selected' : ''}>PZ#5 (Plastic Zipper #5)</option>
      <option value="#8" ${is8 ? 'selected' : ''}>PZ#8 (Plastic Zipper #8)</option>
    `;
  }

  // Default: CZ (Nylon)
  const is3 = currentSelected === '#3' || currentSelected.includes('3');
  return `
    <option value="#3" ${is3 ? 'selected' : ''}>CZ#3 (Nylon Zipper #3)</option>
    <option value="#5" ${!is3 ? 'selected' : ''}>CZ#5 (Nylon Zipper #5)</option>
  `;
}

/**
 * Bind live event listeners to dynamically rendered Category Group cards
 */
function bindCategoryGroupEventListeners() {
  const container = document.getElementById('category-groups-container');
  if (!container) return;

  // 1. Category Dropdown Change
  container.querySelectorAll('.select-group-category').forEach(select => {
    select.addEventListener('change', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const newCat = e.target.value;
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (!group) return;

      group.category = newCat;

      // Ensure slider addition default is initialized if switching to a zipper category
      if (newCat === 'cz' || newCat === 'mz' || newCat === 'pz') {
        if (group.sliderAdditionPercent === undefined) {
          group.sliderAdditionPercent = 1.5;
        }
      }

      // Reset variant sizes if necessary to match the new category
      group.variants.forEach(v => {
        if (newCat === 'wire') {
          v.zipperSize = '#5_normal';
          if (group.lossPercent === undefined || group.lossPercent === 3.0) {
            group.lossPercent = 5.0;
          }
        } else if (newCat === 'mz' || newCat === 'cz') {
          v.zipperSize = v.zipperSize && v.zipperSize.includes('3') ? '#3' : '#5';
          if (group.lossPercent === undefined || group.lossPercent === 4.0 || group.lossPercent === 5.0) {
            group.lossPercent = 3.0;
          }
        } else if (newCat === 'pz') {
          v.zipperSize = v.zipperSize && v.zipperSize.includes('8') ? '#8' : (v.zipperSize && v.zipperSize.includes('3') ? '#3' : '#5');
          if (group.lossPercent === undefined || group.lossPercent === 4.0 || group.lossPercent === 5.0) {
            group.lossPercent = 3.0;
          }
        }

        if (window.BOMRules && window.BOMRules.getSuggestedAllowance) {
          v.allowance = window.BOMRules.getSuggestedAllowance(newCat, v.zipperSize, v.lengthUnit, v.zipperType);
        }
        if (window.BOMRules) {
          v.bomRows = window.BOMRules.generateSuggestedBOM(v, newCat);
        }
      });

      rebuildAndRenderAll();
      showToast(`Group "${group.name}" switched to ${getCategoryDisplayName(newCat)}.`, 'info');
    });
  });

  // 2. Group Loss % Input
  container.querySelectorAll('.input-group-loss').forEach(input => {
    input.addEventListener('input', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group) {
        group.lossPercent = e.target.value !== '' ? (parseFloat(e.target.value) || 0) : 3.0;
        updateLiveCalculations();
      }
    });
  });

  // 2b. Group Slider Add % Input
  container.querySelectorAll('.input-group-slider-add').forEach(input => {
    input.addEventListener('input', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group) {
        group.sliderAdditionPercent = e.target.value !== '' ? (parseFloat(e.target.value) || 0) : 1.5;
        updateLiveCalculations();
      }
    });
  });

  // 2c. Group Dynamic MZ Parameters Input
  container.querySelectorAll('.input-mz-param').forEach(input => {
    input.addEventListener('input', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const paramName = e.target.getAttribute('data-param');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group && paramName) {
        group.mzParams = group.mzParams || {};
        if (e.target.value !== '') {
          group.mzParams[paramName] = parseFloat(e.target.value);
        } else {
          delete group.mzParams[paramName];
        }
        updateLiveCalculations();
      }
    });
  });

  // 2d. Group Dynamic CZ Parameters Input
  container.querySelectorAll('.input-cz-param').forEach(input => {
    input.addEventListener('input', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const paramName = e.target.getAttribute('data-param');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group && paramName) {
        group.czParams = group.czParams || {};
        if (e.target.value !== '') {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            // Validation: divisors must be > 0, factors/allowance >= 0
            if (paramName.toLowerCase().includes('divisor') || paramName.toLowerCase().includes('div')) {
              group.czParams[paramName] = val > 0 ? val : undefined;
            } else {
              group.czParams[paramName] = val >= 0 ? val : 0;
            }
          }
        } else {
          delete group.czParams[paramName];
        }
        updateLiveCalculations();
      }
    });
  });

  // 2e. Group Dynamic WIRE Parameters Input
  container.querySelectorAll('.input-wire-param').forEach(input => {
    input.addEventListener('input', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const paramName = e.target.getAttribute('data-param');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group && paramName) {
        group.wireParams = group.wireParams || {};
        if (e.target.value !== '') {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            // Validation: divisors must be > 0, allowance >= 0
            if (paramName.toLowerCase().includes('divisor') || paramName.toLowerCase().includes('div')) {
              group.wireParams[paramName] = val > 0 ? val : undefined;
            } else {
              group.wireParams[paramName] = val >= 0 ? val : 0;
            }
          }
        } else {
          delete group.wireParams[paramName];
        }
        updateLiveCalculations();
      }
    });
  });

  // 2f. Group Dynamic PZ Parameters Input
  container.querySelectorAll('.input-pz-param').forEach(input => {
    input.addEventListener('input', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const paramName = e.target.getAttribute('data-param');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group && paramName) {
        group.pzParams = group.pzParams || {};
        if (e.target.value !== '') {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) {
            // Validation: divisors must be > 0, factors/allowance/percentages >= 0
            if (paramName.toLowerCase().includes('divisor') || paramName.toLowerCase().includes('div')) {
              group.pzParams[paramName] = val > 0 ? val : undefined;
            } else {
              group.pzParams[paramName] = val >= 0 ? val : 0;
            }
          }
        } else {
          delete group.pzParams[paramName];
        }
        updateLiveCalculations();
      }
    });
  });

  // 3. Group Style, Color, Remarks Metadata
  ['input-group-style', 'input-group-color', 'input-group-remarks'].forEach(cls => {
    container.querySelectorAll(`.${cls}`).forEach(input => {
      input.addEventListener('input', (e) => {
        const groupId = e.target.getAttribute('data-group-id');
        const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
        if (!group) return;

        if (cls === 'input-group-style') group.styleName = e.target.value;
        if (cls === 'input-group-color') group.color = e.target.value;
        if (cls === 'input-group-remarks') group.remarks = e.target.value;

        // Update Calculation Details dropdown labels if style changed
        if (cls === 'input-group-style') {
          populateCalculationDetailsDropdown();
        }
      });
    });
  });

  // 4. Remove Category Group Button
  container.querySelectorAll('.btn-remove-category-group').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const groupId = e.currentTarget.getAttribute('data-group-id');
      handleRemoveCategoryGroup(groupId);
    });
  });

  // 5. "+ Select Another Variant" Inside Group
  container.querySelectorAll('.btn-add-variant-to-group').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const groupId = e.currentTarget.getAttribute('data-group-id');
      handleAddVariantToGroup(groupId);
    });
  });

  // 6. Variant Field Inputs (Live Calculation Updates)
  container.querySelectorAll('.input-var-name').forEach(input => {
    input.addEventListener('input', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const v = findVariant(groupId, varId);
      if (v) v.name = e.target.value;
    });
  });

  container.querySelectorAll('.input-var-size').forEach(select => {
    select.addEventListener('change', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      const v = findVariant(groupId, varId);
      if (v && group) {
        v.zipperSize = e.target.value;
        if (group.category === 'wire') {
          if (v.zipperSize === '#3' && (group.lossPercent === 5.0 || group.lossPercent === undefined)) {
            group.lossPercent = 4.0;
          } else if (v.zipperSize !== '#3' && (group.lossPercent === 4.0 || group.lossPercent === undefined)) {
            group.lossPercent = 5.0;
          }
        }
        if (window.BOMRules) {
          v.allowance = window.BOMRules.getSuggestedAllowance(group.category, v.zipperSize, v.lengthUnit, v.zipperType);
          v.bomRows = window.BOMRules.generateSuggestedBOM(v, group.category);
        }
        rebuildAndRenderAll();
      }
    });
  });

  container.querySelectorAll('.input-var-length').forEach(input => {
    input.addEventListener('input', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const v = findVariant(groupId, varId);
      if (v) {
        v.length = e.target.value !== '' ? (parseFloat(e.target.value) || 0) : '';
        updateLiveCalculations();
      }
    });
  });

  container.querySelectorAll('.input-var-unit').forEach(select => {
    select.addEventListener('change', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      const v = findVariant(groupId, varId);
      if (v && group) {
        v.lengthUnit = e.target.value;
        if (window.BOMRules) {
          v.allowance = window.BOMRules.getSuggestedAllowance(group.category, v.zipperSize, v.lengthUnit, v.zipperType);
        }
        rebuildAndRenderAll();
      }
    });
  });

  container.querySelectorAll('.input-var-qty').forEach(input => {
    input.addEventListener('input', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const v = findVariant(groupId, varId);
      if (v) {
        v.quantity = e.target.value !== '' ? (parseFloat(e.target.value) || 0) : '';
        updateLiveCalculations();
      }
    });
  });

  container.querySelectorAll('.input-var-type').forEach(select => {
    select.addEventListener('change', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      const v = findVariant(groupId, varId);
      if (v && group) {
        v.zipperType = e.target.value;
        if (window.BOMRules) {
          v.allowance = window.BOMRules.getSuggestedAllowance(group.category, v.zipperSize, v.lengthUnit, v.zipperType);
          v.bomRows = window.BOMRules.generateSuggestedBOM(v, group.category);
        }
        updateLiveCalculations();
      }
    });
  });

  container.querySelectorAll('.input-var-color').forEach(input => {
    input.addEventListener('input', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const v = findVariant(groupId, varId);
      if (v) v.color = e.target.value;
    });
  });

  // 7. Remove Variant Button
  container.querySelectorAll('.btn-remove-var').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const groupId = e.currentTarget.getAttribute('data-group-id');
      const varId = e.currentTarget.getAttribute('data-var-id');
      handleRemoveVariantFromGroup(groupId, varId);
    });
  });
}

/**
 * Helper to extract groupId and varId from dataset attributes
 */
function getEventGroupAndVarIds(target) {
  return {
    groupId: target.getAttribute('data-group-id'),
    varId: target.getAttribute('data-var-id')
  };
}

/**
 * Helper to find a variant by groupId and varId
 */
function findVariant(groupId, varId) {
  const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
  if (!group) return null;
  return group.variants.find(v => v.id === varId) || null;
}

/**
 * Master Live Calculation update routine
 */
function updateLiveCalculations() {
  if (!window.CalculatorEngine) return;

  const result = window.CalculatorEngine.calculateFullEstimate(appState.currentEstimate);
  appState.lastCalculation = result;

  const rows = (result && result.aggregatedMaterials && Array.isArray(result.aggregatedMaterials.processedRows)) 
    ? result.aggregatedMaterials.processedRows 
    : [];

  // Default active material if none is currently selected or if previous selection is invalid
  if (rows.length > 0) {
    const isCurrentValid = rows.some(r => r.key === appState.selectedMaterialKey);
    if (!isCurrentValid) {
      appState.selectedMaterialKey = rows[0].key;
    }
  } else {
    appState.selectedMaterialKey = null;
  }

  // 1. Render Consolidated / Merged BOM Table with [ View Calculation ] buttons
  renderConsolidatedBOM(result.aggregatedMaterials);

  // 2. Render Material-Specific Calculation Details
  renderCalculationDetails();

  // 3. Update Summary KPI Cards & Totals
  updateSummaryKPIs(result);
}

/**
 * Helper to find the exact material row across Category Groups and Aggregated Materials
 * @param {string} targetKey 
 * @returns {Object|null}
 */
function findActiveMaterial(targetKey) {
  const lastCalc = appState.lastCalculation;
  if (!lastCalc) return null;

  // 1. Search Category Groups' processedRows (for exact group-level row matches)
  if (Array.isArray(lastCalc.categoryGroups)) {
    for (const group of lastCalc.categoryGroups) {
      if (group && group.materials && Array.isArray(group.materials.processedRows)) {
        for (const row of group.materials.processedRows) {
          const rowUniqueKey = row.uniqueKey || `${group.id}__${row.key || row.id}`;
          if (
            targetKey && (
              rowUniqueKey === targetKey ||
              row.key === targetKey ||
              row.id === targetKey ||
              row.materialId === targetKey ||
              `${group.id}_${row.key}` === targetKey ||
              `${group.id}_${row.id}` === targetKey
            )
          ) {
            return {
              ...row,
              uniqueKey: rowUniqueKey,
              groupId: row.groupId || group.id,
              groupName: row.groupName || group.name,
              groupCategory: row.groupCategory || group.category,
              groupStyleName: row.groupStyleName || group.styleName,
              groupColor: row.groupColor || group.color
            };
          }
        }
      }
    }
  }

  // 2. Search Aggregated Materials (for merged rows or generic keys)
  if (lastCalc.aggregatedMaterials && Array.isArray(lastCalc.aggregatedMaterials.processedRows)) {
    for (const row of lastCalc.aggregatedMaterials.processedRows) {
      if (
        targetKey && (
          row.key === targetKey ||
          row.id === targetKey ||
          row.materialId === targetKey
        )
      ) {
        return row;
      }
    }
  }

  // 3. Fallback: Return first available material from the first active category group
  if (Array.isArray(lastCalc.categoryGroups)) {
    for (const group of lastCalc.categoryGroups) {
      if (group && group.materials && Array.isArray(group.materials.processedRows) && group.materials.processedRows.length > 0) {
        const first = group.materials.processedRows[0];
        const rowUniqueKey = first.uniqueKey || `${group.id}__${first.key || first.id}`;
        return {
          ...first,
          uniqueKey: rowUniqueKey,
          groupId: first.groupId || group.id,
          groupName: first.groupName || group.name,
          groupCategory: first.groupCategory || group.category,
          groupStyleName: first.groupStyleName || group.styleName,
          groupColor: first.groupColor || group.color
        };
      }
    }
  }

  if (lastCalc.aggregatedMaterials && Array.isArray(lastCalc.aggregatedMaterials.processedRows) && lastCalc.aggregatedMaterials.processedRows.length > 0) {
    return lastCalc.aggregatedMaterials.processedRows[0];
  }

  return null;
}

/**
 * Render Material-Specific Calculation Details
 * Displays the exact mathematical derivation for the currently selected BOM material row.
 */
function renderCalculationDetails() {
  const body = document.getElementById('formula-details-body');
  if (!body) return;

  const lastCalc = appState.lastCalculation;
  if (!lastCalc) {
    body.innerHTML = `
      <div class="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <div class="w-12 h-12 mx-auto mb-3 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-base text-slate-700 font-semibold mb-1">No Material Calculation Available</p>
        <p class="text-sm text-slate-500 max-w-sm mx-auto">Configure finished lengths and order quantities in the Product Information section to inspect live factory formulas.</p>
      </div>
    `;
    return;
  }

  const activeMaterial = findActiveMaterial(appState.selectedMaterialKey);

  if (!activeMaterial) {
    body.innerHTML = `
      <div class="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <p class="text-base text-slate-700 font-semibold mb-1">Select a Material from the BOM</p>
        <p class="text-sm text-slate-500">Click <strong>[ View Calculation ]</strong> on any row in the Bill of Materials table to inspect its complete mathematical derivation.</p>
      </div>
    `;
    return;
  }

  // Ensure appState.selectedMaterialKey is synchronized
  appState.selectedMaterialKey = activeMaterial.uniqueKey || activeMaterial.key || activeMaterial.id;

  const sources = Array.isArray(activeMaterial.contributingSources) ? activeMaterial.contributingSources : [];
  const isMerged = sources.length > 1;

  const formattedTotalQty = formatBOMQuantity(activeMaterial);
  const exactUnroundedVal = Number(activeMaterial.totalQuantity);
  const exactFormatted = exactUnroundedVal.toLocaleString('en-US', { maximumFractionDigits: 4 });
  const showExactHint = (exactFormatted !== formattedTotalQty && Math.abs(exactUnroundedVal - parseFloat(formattedTotalQty.replace(/,/g, ''))) > 0.0001);

  const materialTitle = activeMaterial.materialName || activeMaterial.component;
  const componentLabel = activeMaterial.component;
  const unitLabel = activeMaterial.unit || 'pcs';
  const groupLabel = activeMaterial.groupName || (activeMaterial.groupId ? `Category Group ${activeMaterial.groupId}` : '');
  const subtypeLabel = activeMaterial.subtypeName || activeMaterial.subtypeLabel || '';

  // Retrieve base formula from activeMaterial calculationDetail or first source
  const firstSource = sources[0] || {};
  const activeDetail = activeMaterial.calculationDetail || firstSource.calculationDetail || {};
  const baseFormulaText = activeDetail.baseFormula || (firstSource.calculationDetail && firstSource.calculationDetail.baseFormula) || '';

  let html = `
    <!-- Top Selected Material Card -->
    <div class="calc-material-header-card mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div class="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <div class="text-xs uppercase font-bold tracking-wider text-blue-600 mb-0.5">Selected Material</div>
          <h3 class="text-base font-bold text-slate-900 leading-snug">${escapeHtml(materialTitle)}</h3>
          ${activeMaterial.specification ? `<p class="text-xs text-slate-500 mt-1">${escapeHtml(activeMaterial.specification)}</p>` : ''}
        </div>
        <div class="text-right">
          <div class="text-xs uppercase font-bold tracking-wider text-slate-400 mb-0.5">BOM Output Qty</div>
          <div class="text-base font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 inline-block shadow-sm">
            ${formattedTotalQty} ${escapeHtml(unitLabel)}
          </div>
          ${showExactHint ? `<div class="text-xs text-slate-400 font-mono mt-0.5" title="Exact calculated value before display rounding">(Exact: ${exactFormatted} ${escapeHtml(unitLabel)})</div>` : ''}
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap pt-2.5 border-t border-slate-100 text-xs">
        <span class="badge badge-primary text-xs uppercase font-bold px-2.5 py-0.5">${escapeHtml(componentLabel)}</span>
        ${subtypeLabel ? `<span class="badge badge-primary text-xs font-bold px-2.5 py-0.5">${escapeHtml(subtypeLabel)}</span>` : ''}
        ${groupLabel ? `<span class="badge badge-secondary text-xs px-2.5 py-0.5">${escapeHtml(groupLabel)}</span>` : ''}
        ${activeMaterial.groupStyleName ? `<span class="badge badge-secondary text-xs px-2.5 py-0.5">${escapeHtml(activeMaterial.groupStyleName)}</span>` : ''}
        ${activeMaterial.groupColor ? `<span class="badge badge-secondary text-xs px-2.5 py-0.5">${escapeHtml(activeMaterial.groupColor)}</span>` : ''}
        ${isMerged ? `<span class="badge badge-amber text-xs font-bold px-2.5 py-0.5">MERGED FROM ${sources.length} SOURCES</span>` : ''}
      </div>
    </div>

    <!-- Black Background Factory Base Formula Box -->
    ${baseFormulaText ? renderBaseFormulaBox(baseFormulaText, materialTitle) : ''}
  `;

  if (isMerged) {
    html += `
      <div class="calc-merger-notice mb-4 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 shadow-sm">
        <div class="font-bold text-sm flex items-center gap-2 mb-1 text-amber-900">
          <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Multi-Source Merged Material Calculation
        </div>
        This material quantity is aggregated from <strong>${sources.length} independent category groups</strong>. Step-by-step arithmetic evaluations for each source are shown below:
      </div>
    `;

    // Render each contributing source
    sources.forEach((src, sIdx) => {
      const srcQtyFormatted = formatNumberPrecision(src.quantity);
      const srcDetail = src.calculationDetail;
      const srcSteps = (srcDetail && Array.isArray(srcDetail.steps)) ? srcDetail.steps : [];

      html += `
        <div class="calc-source-block mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div class="calc-source-header pb-3 mb-3 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
            <div>
              <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Source ${sIdx + 1}</span>
              <h4 class="text-sm font-bold text-slate-800">${escapeHtml(src.groupName)} (${src.groupCategory.toUpperCase()}) ${src.groupStyleName ? '— ' + escapeHtml(src.groupStyleName) : ''}</h4>
            </div>
            <span class="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              ${srcQtyFormatted} ${escapeHtml(src.unit || unitLabel)}
            </span>
          </div>

          <div class="calc-source-steps flex flex-col gap-3">
            ${renderStepListHTML(srcSteps, src.groupCategory)}
          </div>
        </div>
      `;
    });

    // Final Summation Block
    const sumParts = sources.map((s, idx) => `Source ${idx + 1} [${escapeHtml(s.groupName)}]: ${formatNumberPrecision(s.quantity)} ${escapeHtml(s.unit || unitLabel)}`).join(' + ');
    html += `
      <div class="calc-merger-total-card p-4 bg-emerald-50/90 rounded-xl border border-emerald-200 mt-3 shadow-sm">
        <div class="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1.5">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Final Merged Requirement Summary:
        </div>
        <div class="font-mono text-xs text-emerald-950 font-bold bg-white/70 p-2.5 rounded-lg border border-emerald-200/60 mb-2">
          ${sumParts}
        </div>
        <div class="text-right pt-1 font-mono text-sm font-bold text-emerald-900">
          = ${formattedTotalQty} ${escapeHtml(unitLabel)} Total Merged BOM Requirement
        </div>
      </div>
    `;
  } else {
    // Single source material calculation
    const detail = activeMaterial.calculationDetail || firstSource.calculationDetail;
    const steps = (detail && Array.isArray(detail.steps)) ? detail.steps : [];

    if (steps.length === 0) {
      html += `
        <div class="calc-step-card">
          <div class="calc-step-header">
            <span class="calc-step-badge">1</span>
            <h4 class="calc-step-heading">Material Quantity Derivation</h4>
            <span class="calc-step-result-pill">${formattedTotalQty} ${escapeHtml(unitLabel)}</span>
          </div>
          <p class="calc-step-desc">Calculated based on configured item specifications and order volume.</p>
          <div class="calc-math-box">
            <pre class="calc-math-pre"><code>Total Requirement = ${formattedTotalQty} ${escapeHtml(unitLabel)}</code></pre>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="calc-section-divider mb-3">
          <span class="calc-section-label">Step-by-Step Calculation Breakdown</span>
        </div>
        <div class="calc-steps-scroll-container">
          ${renderStepListHTML(steps, activeMaterial.groupCategory || 'cz')}
        </div>
      `;
    }
  }

  body.innerHTML = html;
}

/**
 * Render a high-contrast black box displaying the base factory formula
 */
function renderBaseFormulaBox(formulaText, materialName = '') {
  if (!formulaText) return '';
  return `
    <div class="calc-dark-formula-box mb-4">
      <div class="calc-dark-formula-header">
        <div class="flex items-center gap-2">
          <span class="calc-fx-badge">f(x)</span>
          <span class="calc-dark-formula-title">FACTORY BASE FORMULA</span>
        </div>
        <span class="calc-dark-formula-tag">STANDARD SPEC</span>
      </div>
      <div class="calc-dark-formula-content">
        <pre class="calc-dark-formula-pre"><code>${escapeHtml(formulaText)}</code></pre>
      </div>
    </div>
  `;
}

/**
 * Helper to render an array of formula steps into clean, spacious HTML
 */
function renderStepListHTML(steps, categoryHint = 'cz') {
  if (!Array.isArray(steps) || steps.length === 0) {
    return `<p class="text-xs text-slate-400 italic">No intermediate step details available.</p>`;
  }

  return steps.map((step, sIdx) => {
    const stepNum = step.stepNumber || (sIdx + 1);
    return `
      <div class="calc-step-card">
        <div class="calc-step-header">
          <div class="calc-step-title-wrap">
            <span class="calc-step-badge">${stepNum}</span>
            <h4 class="calc-step-heading">${escapeHtml(step.title || `Step ${stepNum}`)}</h4>
          </div>
          ${step.result ? `
            <span class="calc-step-result-pill">${escapeHtml(step.result)}</span>
          ` : ''}
        </div>

        ${step.explanation ? `<p class="calc-step-desc">${escapeHtml(step.explanation)}</p>` : ''}

        ${Array.isArray(step.variants) && step.variants.length > 0 ? `
          <div class="calc-variants-stack">
            ${step.variants.map(v => `
              <div class="calc-variant-card">
                <div class="calc-variant-top">
                  <span class="calc-var-name">${escapeHtml(v.label)}</span>
                  <span class="calc-var-val font-mono font-bold text-indigo-700">${escapeHtml(v.result || '')}</span>
                </div>
                ${v.formula ? `
                  <div class="calc-var-formula font-mono">${escapeHtml(v.formula)}</div>
                ` : ''}
              </div>
            `).join('')}
            ${step.subtotalLabel ? `
              <div class="calc-subtotal-row">
                <span>${escapeHtml(step.subtotalLabel)}:</span>
                <strong class="font-mono text-indigo-700">${escapeHtml(step.subtotalValue)}</strong>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${step.formula ? `
          <div class="calc-math-box">
            <pre class="calc-math-pre"><code>${escapeHtml(step.formula)}</code></pre>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}


/**
 * Render Hierarchically Organized Bill of Materials (BOM)
 * Structured cleanly by:
 * 1. Category Group (e.g. Category Group 1 — Nylon Zipper)
 * 2. Subtype / Calculation Group (e.g. CZ#5 with Variant 1, CZ#3 with Variants 2 & 3)
 * 3. Physical materials table belonging to that specific calculation group
 * 
 * Includes collapsible headers, source variant badges, and [ View Calculation ] inspection buttons.
 * 
 * @param {Object} materialsData 
 */
function renderConsolidatedBOM(materialsData) {
  const container = document.getElementById('consolidated-bom-container');
  if (!container) return;

  const lastCalc = appState.lastCalculation;
  const rawGroups = (lastCalc && Array.isArray(lastCalc.categoryGroups)) ? lastCalc.categoryGroups : [];
  const activeGroups = rawGroups.filter(g => g && g.variants && g.variants.length > 0 && g.totalQuantity > 0);

  // Fallback to flat rows if no group structure is found
  const flatRows = (materialsData && Array.isArray(materialsData.processedRows)) ? materialsData.processedRows : [];

  if (flatRows.length === 0 && activeGroups.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:48px;height:48px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-sm font-medium text-slate-600">No materials calculated yet</p>
        <p class="text-xs text-slate-400">Configure finished length and order quantities in the category groups above</p>
      </div>
    `;
    return;
  }

  // Ensure an active material key is selected
  if (!appState.selectedMaterialKey) {
    const firstRow = flatRows[0] || (activeGroups[0] && activeGroups[0].materials && activeGroups[0].materials.processedRows && activeGroups[0].materials.processedRows[0]);
    if (firstRow) {
      appState.selectedMaterialKey = firstRow.key;
    }
  }

  let html = `<div class="bom-hierarchy-wrapper">`;

  let totalDistinctMaterials = 0;
  let totalOrderVolume = 0;
  let totalVariants = 0;

  activeGroups.forEach((group, gIdx) => {
    const groupCat = String(group.category || '').toLowerCase().trim();
    const groupRows = (group.materials && Array.isArray(group.materials.processedRows)) ? group.materials.processedRows : [];
    if (groupRows.length === 0) return;

    totalDistinctMaterials += groupRows.length;
    totalOrderVolume += (group.totalQuantity || 0);
    totalVariants += (group.variants ? group.variants.length : 0);

    const categoryDisplayName = getCategoryDisplayName(groupCat);
    const badgeClass = `bom-group-icon-${groupCat}`;

    // Partition groupRows into Subtypes
    const subtypeMap = {};

    groupRows.forEach(r => {
      const subKey = r.subtypeKey || (r.calculationDetail ? r.calculationDetail.size : 'default');
      if (!subtypeMap[subKey]) {
        subtypeMap[subKey] = {
          key: subKey,
          name: r.subtypeName || (subKey.startsWith('#') ? `${groupCat.toUpperCase()}${subKey}` : subKey),
          label: r.subtypeLabel || `${groupCat.toUpperCase()} ${subKey}`,
          sourceVariants: r.sourceVariants || [],
          totalQuantity: r.totalSubtypeQuantity || 0,
          rows: []
        };
      }
      subtypeMap[subKey].rows.push(r);
    });

    const subtypes = Object.values(subtypeMap);

    html += `
      <!-- Category Group Block -->
      <div class="bom-group-card" id="bom-group-card-${group.id}">
        <!-- Level 1: Category Group Header -->
        <div class="bom-group-header" data-toggle-collapse="bom-group-body-${group.id}">
          <div class="bom-group-title-left">
            <div class="bom-collapse-indicator">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div class="bom-group-icon-badge ${badgeClass}">
              ${groupCat.toUpperCase()}
            </div>
            <div>
              <div class="bom-group-name-row">
                <h3 class="bom-group-name">${escapeHtml(group.name || `Category Group ${gIdx + 1}`)}</h3>
                <span class="badge badge-primary">${escapeHtml(categoryDisplayName)}</span>
                ${group.styleName ? `<span class="badge badge-secondary">${escapeHtml(group.styleName)}</span>` : ''}
                ${group.color ? `<span class="badge badge-secondary">${escapeHtml(group.color)}</span>` : ''}
              </div>
              <p class="bom-group-meta-sub">
                ${(group.variants || []).length} Variant${(group.variants || []).length > 1 ? 's' : ''} &bull; Total Order: <strong>${(group.totalQuantity || 0).toLocaleString()} pcs</strong> &bull; Factory Loss: ${group.lossPercent}%
              </p>
            </div>
          </div>

          <div class="bom-group-header-right">
            <div class="bom-group-stats-pill font-mono">
              ${(group.totalQuantity || 0).toLocaleString()} <span class="text-xs font-sans text-slate-500">pcs</span>
            </div>
          </div>
        </div>

        <!-- Level 2 & 3: Group Body & Subtype Blocks -->
        <div class="bom-group-body" id="bom-group-body-${group.id}">
    `;

    subtypes.forEach(subtype => {
      // Format source variants summary string
      let sourceVariantsSummary = '';
      if (Array.isArray(subtype.sourceVariants) && subtype.sourceVariants.length > 0) {
        sourceVariantsSummary = subtype.sourceVariants.map(v => 
          `${v.name || 'Variant'}: ${v.length} ${v.unit || 'inch'} × ${(v.quantity || 0).toLocaleString()} pcs`
        ).join(' + ');
      } else {
        sourceVariantsSummary = `${(subtype.totalQuantity || 0).toLocaleString()} pcs`;
      }

      html += `
        <!-- Subtype / Specification Block -->
        <div class="bom-subtype-block">
          <div class="bom-subtype-header">
            <div class="bom-subtype-info">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="bom-subtype-badge">${escapeHtml(subtype.name)}</span>
                <span class="bom-subtype-title">${escapeHtml(subtype.label)}</span>
                <span class="bom-subtype-qty-badge font-mono font-bold">${(subtype.totalQuantity || 0).toLocaleString()} pcs</span>
              </div>
              <div class="bom-subtype-source-bar">
                <span class="bom-source-tag">Source:</span>
                <span class="bom-source-variants font-mono">${escapeHtml(sourceVariantsSummary)}</span>
              </div>
            </div>
          </div>

          <!-- Materials Table for this Subtype -->
          <div class="table-responsive bom-subtable-responsive">
            <table class="bom-table">
              <thead>
                <tr>
                  <th style="width: 40px;" class="text-center">#</th>
                  <th>Component / Material</th>
                  <th>Category / Groups</th>
                  <th class="text-center" style="width: 80px;">Unit</th>
                  <th class="text-right" style="width: 140px;">Total Quantity</th>
                  <th class="text-center" style="width: 145px;">Calculation</th>
                </tr>
              </thead>
              <tbody>
      `;

      subtype.rows.forEach((r, rIdx) => {
        const rowUniqueKey = r.uniqueKey || `${group.id}__${r.key || r.id}`;
        const isSelected = (
          appState.selectedMaterialKey === rowUniqueKey ||
          appState.selectedMaterialKey === r.key ||
          appState.selectedMaterialKey === r.id ||
          appState.selectedMaterialKey === `${group.id}_${r.id}` ||
          appState.selectedMaterialKey === `${group.id}_${r.key}`
        );
        const groupsLabel = subtype.name || groupCat.toUpperCase();

        html += `
          <tr class="${isSelected ? 'bom-row-active' : ''}">
            <td class="text-center text-slate-400 font-mono text-xs">${rIdx + 1}</td>
            <td>
              <div class="material-name-cell">
                <span class="font-semibold text-slate-800 text-xs">${escapeHtml(r.materialName || r.component)}</span>
                ${r.specification ? `<span class="material-spec-hint text-xs text-slate-400 block">${escapeHtml(r.specification)}</span>` : ''}
              </div>
            </td>
            <td>
              <span class="badge badge-secondary text-xs">${escapeHtml(groupsLabel)}</span>
            </td>
            <td class="text-center font-mono text-xs uppercase font-semibold text-slate-600">${escapeHtml(r.unit || 'pcs')}</td>
            <td class="text-right font-mono text-xs font-bold text-slate-900">${formatBOMQuantity(r)}</td>
            <td class="text-center">
              <button type="button" 
                      class="btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline'} btn-view-calc" 
                      data-material-key="${escapeHtml(rowUniqueKey)}"
                      data-row-key="${escapeHtml(r.key || r.id)}"
                      data-group-id="${escapeHtml(group.id)}"
                      title="Inspect detailed formula for ${escapeHtml(r.materialName || r.component)}">
                <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px;height:12px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                View Calculation
              </button>
            </td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
        <!-- End Subtype Block -->
      `;
    });

    // Group Summary Footer
    html += `
          <div class="bom-group-summary-footer">
            <div class="bom-summary-item">
              <span class="text-xs text-slate-500">Group Materials:</span>
              <strong class="text-xs font-bold text-slate-800">${groupRows.length} items</strong>
            </div>
            <div class="bom-summary-item">
              <span class="text-xs text-slate-500">Group Order Quantity:</span>
              <strong class="text-xs font-mono font-bold text-slate-900">${(group.totalQuantity || 0).toLocaleString()} pcs</strong>
            </div>
          </div>
        </div>
      </div>
      <!-- End Category Group Block -->
    `;
  });

  // Overall summary card if more than 1 category group exists
  if (activeGroups.length > 1) {
    html += `
      <div class="bom-overall-summary-card">
        <div class="flex justify-between items-center flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <span class="bom-summary-trophy-badge">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800">Total Estimation Summary</h4>
              <p class="text-xs text-slate-500">${activeGroups.length} Category Groups &bull; ${totalVariants} Total Product Variants</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <span class="text-xs uppercase tracking-wider text-slate-400 block font-semibold">Total Order Volume</span>
              <span class="font-mono text-base font-bold text-slate-900">${totalOrderVolume.toLocaleString()} pcs</span>
            </div>
            <div class="text-right">
              <span class="text-xs uppercase tracking-wider text-slate-400 block font-semibold">Total BOM Material Items</span>
              <span class="font-mono text-base font-bold text-indigo-700">${totalDistinctMaterials} Line Items</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Bind View Calculation click listeners
  container.querySelectorAll('.btn-view-calc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = e.currentTarget.getAttribute('data-material-key') || e.currentTarget.getAttribute('data-row-key');
      if (key) {
        appState.selectedMaterialKey = key;

        // Auto-expand Calculation Details if collapsed
        const panel = document.getElementById('section-formula-details');
        if (panel && panel.classList.contains('is-collapsed')) {
          panel.classList.remove('is-collapsed');
          const toggleLabel = document.getElementById('label-toggle-formula');
          if (toggleLabel) toggleLabel.textContent = 'Hide';
        }

        renderConsolidatedBOM(appState.lastCalculation ? appState.lastCalculation.aggregatedMaterials : null);
        renderCalculationDetails();

        // Smooth scroll on mobile/tablet screens
        if (window.innerWidth <= 1024) {
          const calcPanel = document.getElementById('section-formula-details');
          if (calcPanel) {
            calcPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });
  });

  // Bind Collapsible Category Group Header click listeners
  container.querySelectorAll('.bom-group-header').forEach(hdr => {
    hdr.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const card = hdr.closest('.bom-group-card');
      if (card) {
        card.classList.toggle('is-collapsed');
      }
    });
  });
}


/**
 * Handle "+ Add Custom Material" Form Submission
 */
function handleAddCustomMaterialSubmit(e) {
  e.preventDefault();
  const name = getInputValue('input-custom-comp-name');
  const spec = getInputValue('input-custom-mat-desc') || 'Custom Added Item';
  const unit = getInputValue('select-custom-unit') || 'pcs';
  const qty = parseFloat(getInputValue('input-custom-qty')) || 0;
  const isLenDep = document.getElementById('check-custom-length-dep') ? document.getElementById('check-custom-length-dep').checked : false;

  if (!name || qty <= 0) {
    showToast('Please specify a component name and valid quantity', 'warning');
    return;
  }

  const customRow = {
    id: 'custom_' + Date.now(),
    materialId: 'custom',
    isCustom: true,
    component: name,
    componentCategory: 'other',
    materialName: name,
    specification: spec,
    unit: unit,
    totalQuantity: qty,
    unitPrice: 0,
    wastagePercent: 0,
    isLengthDependent: isLenDep
  };

  // Add to selected target variant or first category group's first variant
  const targetVarId = getInputValue('select-custom-target-variant');
  let placed = false;
  if (targetVarId) {
    for (const g of appState.currentEstimate.categoryGroups) {
      const v = (g.variants || []).find(v => v.id === targetVarId);
      if (v) {
        if (!Array.isArray(v.bomRows)) v.bomRows = [];
        v.bomRows.push(customRow);
        placed = true;
        break;
      }
    }
  }

  if (!placed) {
    const firstGroup = appState.currentEstimate.categoryGroups[0];
    if (firstGroup && firstGroup.variants[0]) {
      if (!Array.isArray(firstGroup.variants[0].bomRows)) firstGroup.variants[0].bomRows = [];
      firstGroup.variants[0].bomRows.push(customRow);
    }
  }

  closeModal('modal-add-material');
  e.target.reset();
  rebuildAndRenderAll();
  showToast(`Added custom material "${name}" to BOM`, 'success');
}

/**
 * Handle "+ Add Other Cost"
 */
function handleAddOtherCostRow() {
  const container = document.getElementById('other-costs-container');
  if (!container) return;

  const costId = 'other_cost_' + Date.now();
  const newCostItem = {
    id: costId,
    name: 'Special Finish / Wash Testing',
    amount: 500,
    type: 'total_order'
  };

  if (!Array.isArray(appState.currentEstimate.otherCosts)) {
    appState.currentEstimate.otherCosts = [];
  }
  appState.currentEstimate.otherCosts.push(newCostItem);

  renderOtherCosts();
  updateLiveCalculations();
}

/**
 * Render Other Costs Container
 */
function renderOtherCosts() {
  const container = document.getElementById('other-costs-container');
  if (!container) return;

  const items = appState.currentEstimate.otherCosts || [];
  if (items.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic">No additional costs added yet.</p>`;
    return;
  }

  container.innerHTML = items.map((item, idx) => `
    <div class="other-cost-row flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded border border-slate-200" id="row-${item.id}">
      <input type="text" class="form-input form-input-sm input-other-cost-name" style="flex: 2;" 
        data-id="${item.id}" value="${escapeHtml(item.name)}" placeholder="Description">
      
      <div class="input-with-addon" style="flex: 1;">
        <span class="input-addon input-addon-left text-xs">৳</span>
        <input type="number" class="form-input form-input-sm font-mono input-other-cost-amount" 
          data-id="${item.id}" value="${item.amount}" min="0" step="10" placeholder="Amount">
      </div>

      <select class="form-select form-select-sm select-other-cost-type" style="width: 130px;" data-id="${item.id}">
        <option value="total_order" ${item.type === 'total_order' ? 'selected' : ''}>Total Order</option>
        <option value="per_zipper" ${item.type === 'per_zipper' ? 'selected' : ''}>Per Zipper</option>
      </select>

      <button type="button" class="btn btn-sm btn-ghost text-rose-500 btn-remove-other-cost" data-id="${item.id}" title="Remove">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `).join('');

  // Bind events for other cost rows
  container.querySelectorAll('.input-other-cost-name').forEach(input => {
    input.addEventListener('input', (e) => {
      const itm = appState.currentEstimate.otherCosts.find(c => c.id === e.target.getAttribute('data-id'));
      if (itm) itm.name = e.target.value;
    });
  });

  container.querySelectorAll('.input-other-cost-amount').forEach(input => {
    input.addEventListener('input', (e) => {
      const itm = appState.currentEstimate.otherCosts.find(c => c.id === e.target.getAttribute('data-id'));
      if (itm) {
        itm.amount = parseFloat(e.target.value) || 0;
        updateLiveCalculations();
      }
    });
  });

  container.querySelectorAll('.select-other-cost-type').forEach(select => {
    select.addEventListener('change', (e) => {
      const itm = appState.currentEstimate.otherCosts.find(c => c.id === e.target.getAttribute('data-id'));
      if (itm) {
        itm.type = e.target.value;
        updateLiveCalculations();
      }
    });
  });

  container.querySelectorAll('.btn-remove-other-cost').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const idx = appState.currentEstimate.otherCosts.findIndex(c => c.id === id);
      if (idx !== -1) {
        appState.currentEstimate.otherCosts.splice(idx, 1);
        renderOtherCosts();
        updateLiveCalculations();
      }
    });
  });
}

/**
 * Start a completely blank new estimate without pre-populated demo data
 */
function handleNewEstimate() {
  if (confirm('Start a fresh new estimate? All unsaved changes will be cleared.')) {
    appState.currentEstimate = {
      id: null,
      name: '',
      reference: 'EST-' + Math.floor(1000 + Math.random() * 9000),
      categoryGroups: [
        {
          id: 'categoryGroup_1',
          name: 'Category Group 1',
          category: '', // Empty category
          styleName: '',
          color: '',
          remarks: '',
          lossPercent: 3.0,
          variants: [
            {
              id: 'var_1',
              name: 'Variant 1',
              zipperSize: '#5',
              zipperType: 'closed_end',
              length: '',
              lengthUnit: 'inch',
              quantity: '',
              color: '',
              remarks: '',
              bomRows: []
            }
          ]
        }
      ],
      labor: {
        method: 'per_zipper',
        ratePerZipper: '',
        workers: '',
        hours: '',
        hourlyRate: ''
      },
      overhead: {
        percentage: '',
        basis: 'material_and_labor'
      },
      otherCosts: [],
      priceOverrides: {}
    };

    appState.selectedCalcDetailsGroupId = 'categoryGroup_1';
    populateCommonForm();
    rebuildAndRenderAll();
    showToast('Started fresh blank estimate.', 'info');
  }
}

/**
 * Handle PDF Export
 */
function handleExportPDF() {
  if (!window.exportEstimateToPDF) {
    alert('PDF generation module is loading. Please try again.');
    return;
  }
  window.exportEstimateToPDF(appState.currentEstimate, appState.lastCalculation);
}

/**
 * Open Save Estimate Modal
 */
function openSaveEstimateModal() {
  const est = appState.currentEstimate;
  setInputValue('input-save-name', est.name || est.styleName || `Zipper BOM Estimate - ${est.reference}`);
  setInputValue('input-save-reference', est.reference || '');
  setInputValue('textarea-save-notes', est.remarks || '');
  openModal('modal-save-estimate');
}

/**
 * Handle Save Estimate Form Submit
 */
function handleSaveEstimateSubmit(e) {
  e.preventDefault();
  const name = getInputValue('input-save-name');
  const ref = getInputValue('input-save-reference');
  const notes = getInputValue('textarea-save-notes');

  if (!name) {
    showToast('Please enter an estimate name', 'warning');
    return;
  }

  const est = appState.currentEstimate;
  est.name = name;
  est.reference = ref || est.reference;
  est.remarks = notes;

  if (window.StorageManager) {
    const savedId = window.StorageManager.saveEstimate(est);
    est.id = savedId;
    updateSavedBadgeCount();
    closeModal('modal-save-estimate');
    showToast(`Estimate "${name}" saved successfully!`, 'success');
  }
}

/**
 * Open Saved Estimates Modal & List
 */
function openSavedEstimatesModal() {
  renderSavedEstimatesList();
  openModal('modal-saved-estimates');
}

/**
 * Render Saved Estimates List
 */
function renderSavedEstimatesList(filterQuery = '') {
  const container = document.getElementById('saved-estimates-list');
  if (!container || !window.StorageManager) return;

  const estimates = window.StorageManager.getAllEstimates();
  const q = String(filterQuery || '').toLowerCase().trim();

  const filtered = estimates.filter(e => {
    if (!q) return true;
    const name = String(e.name || '').toLowerCase();
    const ref = String(e.reference || '').toLowerCase();
    const style = String(e.styleName || '').toLowerCase();
    return name.includes(q) || ref.includes(q) || style.includes(q);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="text-sm text-slate-500 font-medium">${q ? 'No matching saved estimates found.' : 'No saved estimates yet.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(e => `
    <div class="saved-estimate-item p-3 mb-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm hover:border-indigo-300">
      <div>
        <h4 class="text-sm font-bold text-slate-800">${escapeHtml(e.name || 'Untitled Estimate')}</h4>
        <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span class="font-mono font-semibold text-indigo-600">${escapeHtml(e.reference || '')}</span>
          <span>•</span>
          <span>${Array.isArray(e.categoryGroups) ? `${e.categoryGroups.length} Category Group(s)` : (e.category || 'CZ').toUpperCase()}</span>
          <span>•</span>
          <span>${new Date(e.updatedAt || e.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn btn-sm btn-primary btn-load-estimate" data-id="${e.id}">Load</button>
        <button type="button" class="btn btn-sm btn-ghost text-rose-500 btn-delete-estimate" data-id="${e.id}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-load-estimate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const loaded = window.StorageManager.getEstimateById(id);
      if (loaded) {
        appState.currentEstimate = loaded;
        appState.selectedCalcDetailsGroupId = loaded.categoryGroups && loaded.categoryGroups[0] ? loaded.categoryGroups[0].id : null;
        populateCommonForm();
        rebuildAndRenderAll();
        closeModal('modal-saved-estimates');
        showToast(`Loaded "${loaded.name}"`, 'success');
      }
    });
  });

  container.querySelectorAll('.btn-delete-estimate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('Delete this saved estimate snapshot?')) {
        window.StorageManager.deleteEstimate(id);
        renderSavedEstimatesList(filterQuery);
        updateSavedBadgeCount();
        showToast('Estimate deleted', 'info');
      }
    });
  });
}

/**
 * Handle Backup Import
 */
function handleImportBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (window.StorageManager) {
    window.StorageManager.importEstimatesFromJSON(file, (err, count) => {
      if (err) {
        showToast(`Import failed: ${err.message}`, 'error');
      } else {
        updateSavedBadgeCount();
        renderSavedEstimatesList();
        showToast(`Successfully imported ${count} estimates!`, 'success');
      }
    });
  }
}

/**
 * Update Saved Estimates Count Badge
 */
function updateSavedBadgeCount() {
  const badge = document.getElementById('badge-saved-count');
  if (badge && window.StorageManager) {
    badge.textContent = window.StorageManager.getAllEstimates().length;
  }
}

/**
 * Open Modal helper
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

/**
 * Close Modal helper
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

/**
 * Open Add Custom Material Modal
 */
function openAddMaterialModal() {
  openModal('modal-add-material');
}

/**
 * Toggle Labor Method UI Controls
 */
function toggleLaborMethodUI(method) {
  const perZipper = document.getElementById('group-labor-per-zipper');
  const hourly = document.getElementById('group-labor-hourly');
  if (perZipper && hourly) {
    if (method === 'per_zipper') {
      perZipper.style.display = 'block';
      hourly.style.display = 'none';
    } else {
      perZipper.style.display = 'none';
      hourly.style.display = 'grid';
    }
  }
}

/**
 * UI Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
    <button type="button" class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/**
 * Helper: Category display name
 */
function getCategoryDisplayName(cat) {
  const c = String(cat || '').toLowerCase().trim();
  if (c === 'cz' || c === 'nylon') return 'Nylon Zipper (CZ)';
  if (c === 'mz' || c === 'metal') return 'Metal Zipper (MZ)';
  if (c === 'wire') return 'Brass / Metal Wire (WIRE)';
  if (c === 'pz' || c === 'plastic') return 'Plastic Zipper (PZ)';
  return 'Nylon Zipper (CZ)';
}

/**
 * Utility Helpers
 */
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = (val !== undefined && val !== null) ? val : '';
}

function setSelectValue(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

function setRadioValue(name, val) {
  const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
  if (el) el.checked = true;
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setElementStyleWidth(id, width) {
  const el = document.getElementById(id);
  if (el) el.style.width = width;
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

function formatNumberPrecision(num, maxDecimals = 4, rowContext = null) {
  if (rowContext) {
    return formatBOMQuantity(num, rowContext.unit || '', rowContext);
  }
  const val = Number(num) || 0;
  return parseFloat(val.toFixed(maxDecimals)).toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
