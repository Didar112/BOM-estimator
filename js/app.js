/**
 * Main Application Controller for Zipper BOM Calculator
 * Orchestrates Multi-Category Group Architecture, Live DOM events,
 * ONE True Consolidated/Merged BOM Table, Category-Specific Calculation Details,
 * and Real-Time Production Cost Estimation.
 */

// Supported Item Variants definition
const SUPPORTED_ITEM_VARIANTS = [
  { key: 'cz_5', category: 'cz', size: '#5', displayName: 'CZ#5', label: 'CZ#5 (Nylon Zipper #5)' },
  { key: 'cz_3', category: 'cz', size: '#3', displayName: 'CZ#3', label: 'CZ#3 (Nylon Zipper #3)' },
  { key: 'mz_3', category: 'mz', size: '#3', displayName: 'MZ#3', label: 'MZ#3 (Metal Zipper #3)' },
  { key: 'mz_4', category: 'mz', size: '#4', displayName: 'MZ#4', label: 'MZ#4 (Metal Zipper #4)' },
  { key: 'mz_5', category: 'mz', size: '#5', displayName: 'MZ#5', label: 'MZ#5 (Metal Zipper #5)' },
  { key: 'pz_3', category: 'pz', size: '#3', displayName: 'PZ#3', label: 'PZ#3 (Plastic Zipper #3)' },
  { key: 'pz_5', category: 'pz', size: '#5', displayName: 'PZ#5', label: 'PZ#5 (Plastic Zipper #5)' },
  { key: 'pz_8', category: 'pz', size: '#8', displayName: 'PZ#8', label: 'PZ#8 (Plastic Zipper #8)' },
  { key: 'wire_3', category: 'wire', size: '#3', displayName: 'WIRE#3', label: 'WIRE#3 (Brass Wire #3)' },
  { key: 'wire_5_normal', category: 'wire', size: '#5_normal', displayName: 'WIRE#5 Normal Teeth', label: 'WIRE#5 — Normal Teeth' },
  { key: 'wire_5_long', category: 'wire', size: '#5_long', displayName: 'WIRE#5 Long Teeth', label: 'WIRE#5 — Long Teeth' }
];

/**
 * Get variant definition object
 * @param {string} variantKeyOrCat
 * @param {string|null} [size=null]
 * @returns {Object}
 */
function getVariantDef(variantKeyOrCat, size = null) {
  if (size !== null) {
    const cat = String(variantKeyOrCat || '').toLowerCase().trim();
    const sz = String(size || '').toLowerCase().trim();
    return SUPPORTED_ITEM_VARIANTS.find(v => v.category === cat && v.size.toLowerCase() === sz) ||
           SUPPORTED_ITEM_VARIANTS.find(v => v.category === cat) ||
           SUPPORTED_ITEM_VARIANTS[0];
  }
  const key = String(variantKeyOrCat || '').toLowerCase().trim();
  return SUPPORTED_ITEM_VARIANTS.find(v => v.key.toLowerCase() === key) ||
         SUPPORTED_ITEM_VARIANTS.find(v => v.category.toLowerCase() === key) ||
         SUPPORTED_ITEM_VARIANTS[0];
}

/**
 * Get display name for an item variant
 * @param {string} cat
 * @param {string} size
 * @returns {string}
 */
function getVariantDisplayName(cat, size) {
  const def = getVariantDef(cat, size);
  return def ? def.displayName : `${String(cat || '').toUpperCase()}${size || ''}`;
}

/**
 * Factory to create an independent Item object
 * @param {string} [variantKey='cz_5']
 * @param {Object} [overrides={}]
 * @returns {Object}
 */
function createItem(variantKey = 'cz_5', overrides = {}) {
  const vDef = getVariantDef(variantKey);
  const cat = vDef.category;
  const sz = vDef.size;
  const uniqueId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

  const defaultSliderAdd = 8.0;
  const defaultPinBoxLoss = 4.0;
  const defaultHBottomLoss = (cat === 'mz' && String(sz).includes('3')) ? 4.0 : undefined;

  const newItem = {
    id: uniqueId,
    variantKey: vDef.key,
    displayName: vDef.displayName,
    name: vDef.displayName,
    category: cat,
    zipperSize: sz,
    zipperType: overrides.zipperType || 'closed_end',
    length: overrides.length !== undefined && overrides.length !== null ? overrides.length : 7.5,
    lengthUnit: overrides.lengthUnit || 'inch',
    quantity: overrides.quantity !== undefined && overrides.quantity !== null ? overrides.quantity : 1000,
    color: overrides.color || '',
    styleName: overrides.styleName || '',
    remarks: overrides.remarks || '',
    lossPercent: cat === 'wire' ? (sz === '#3' ? 4.0 : 5.0) : 3.0,
    classLossOverrides: overrides.classLossOverrides ? { ...overrides.classLossOverrides } : {},
    sliderAdditionPercent: defaultSliderAdd,
    sliderAddPercent: defaultSliderAdd,
    isSliderOverridden: false,
    pinBoxLossPercent: defaultPinBoxLoss,
    isPinBoxLossOverridden: false,
    pinBoxPerZipper: 1,
    hBottomLossPercent: defaultHBottomLoss,
    isHBottomLossOverridden: false,
    isSpecialUTopOrder: false,
    czParams: overrides.czParams ? { ...overrides.czParams } : {},
    mzParams: overrides.mzParams ? { ...overrides.mzParams } : {},
    wireParams: overrides.wireParams ? { ...overrides.wireParams } : {},
    pzParams: overrides.pzParams ? { ...overrides.pzParams } : {},
    bomRows: []
  };

  if (typeof window !== 'undefined' && window.BOMRules) {
    newItem.allowance = window.BOMRules.getSuggestedAllowance(cat, sz, newItem.lengthUnit, newItem.zipperType);
    newItem.bomRows = window.BOMRules.generateSuggestedBOM(newItem, cat);
  }

  newItem.variants = [
    {
      id: 'var_' + uniqueId,
      name: vDef.displayName,
      zipperSize: sz,
      zipperType: newItem.zipperType,
      length: newItem.length,
      lengthUnit: newItem.lengthUnit,
      allowance: newItem.allowance || 0,
      quantity: newItem.quantity,
      color: newItem.color,
      remarks: newItem.remarks,
      bomRows: newItem.bomRows || []
    }
  ];

  return Object.assign(newItem, overrides);
}

/**
 * Retrieve the currently active independent Item object
 * @returns {Object|null}
 */
function getActiveItem() {
  const items = (appState.currentEstimate && Array.isArray(appState.currentEstimate.items)) ? appState.currentEstimate.items : [];
  if (items.length === 0) return null;
  return items.find(it => it.id === appState.activeItemId) || items[0];
}

/**
 * Synchronize state between items[] and categoryGroups[]
 * Ensures backward compatibility with existing calculation engine and test harnesses.
 */
function syncStateItemsAndGroups() {
  if (!appState.currentEstimate) return;

  const est = appState.currentEstimate;
  if (!Array.isArray(est.items)) est.items = [];
  if (!Array.isArray(est.categoryGroups)) est.categoryGroups = [];

  if (est.items.length > 0) {
    // Mirror items to categoryGroups (one category group per item)
    est.categoryGroups = est.items.map((item, idx) => ({
      id: item.id,
      name: item.displayName || item.name || `Item ${idx + 1}`,
      category: item.category || 'cz',
      styleName: item.styleName || '',
      color: item.color || '',
      remarks: item.remarks || '',
      lossPercent: item.lossPercent !== undefined ? Number(item.lossPercent) : 3.0,
      classLossOverrides: item.classLossOverrides || {},
      sliderAdditionPercent: item.sliderAdditionPercent,
      sliderAddPercent: item.sliderAddPercent || item.sliderAdditionPercent,
      isSliderOverridden: item.isSliderOverridden,
      pinBoxLossPercent: item.pinBoxLossPercent,
      isPinBoxLossOverridden: item.isPinBoxLossOverridden,
      pinBoxPerZipper: item.pinBoxPerZipper !== undefined ? Number(item.pinBoxPerZipper) : 1,
      hBottomLossPercent: item.hBottomLossPercent,
      isHBottomLossOverridden: item.isHBottomLossOverridden,
      isSpecialUTopOrder: Boolean(item.isSpecialUTopOrder || (item.czParams && item.czParams.isSpecialUTopOrder)),
      czParams: item.czParams || {},
      mzParams: item.mzParams || {},
      wireParams: item.wireParams || {},
      pzParams: item.pzParams || {},
      variants: [{
        id: `var_${item.id}`,
        name: item.displayName || item.name || `Item ${idx + 1}`,
        zipperSize: item.zipperSize || '#5',
        zipperType: item.zipperType || 'closed_end',
        length: item.length !== undefined && item.length !== null ? item.length : 0,
        lengthUnit: item.lengthUnit || 'inch',
        allowance: item.allowance !== undefined ? item.allowance : 0,
        quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : 0,
        color: item.color || '',
        remarks: item.remarks || '',
        bomRows: item.bomRows || []
      }]
    }));

    if (!appState.activeItemId || !est.items.some(it => it.id === appState.activeItemId)) {
      appState.activeItemId = est.items[0].id;
    }
  } else if (est.categoryGroups.length > 0) {
    // Convert legacy categoryGroups to independent items
    est.items = [];
    est.categoryGroups.forEach((g, gIdx) => {
      const cat = g.category || 'cz';
      const variants = Array.isArray(g.variants) && g.variants.length > 0 ? g.variants : [{
        id: `var_${g.id}_1`,
        name: 'CZ#5',
        zipperSize: '#5',
        zipperType: 'closed_end',
        length: 7.5,
        lengthUnit: 'inch',
        quantity: 1000
      }];

      variants.forEach((v, vIdx) => {
        const sz = v.zipperSize || (cat === 'wire' ? '#5_normal' : '#5');
        const vDef = getVariantDef(cat, sz);
        const itemObj = {
          id: v.id || `item_${g.id}_${vIdx + 1}`,
          variantKey: vDef.key,
          displayName: vDef.displayName,
          name: v.name || vDef.displayName,
          category: cat,
          zipperSize: sz,
          zipperType: v.zipperType || 'closed_end',
          length: v.length !== undefined ? v.length : 0,
          lengthUnit: v.lengthUnit || 'inch',
          quantity: v.quantity !== undefined ? v.quantity : 0,
          color: v.color || g.color || '',
          styleName: g.styleName || '',
          remarks: v.remarks || g.remarks || '',
          lossPercent: g.lossPercent !== undefined ? g.lossPercent : (cat === 'wire' ? 4.0 : 3.0),
          classLossOverrides: g.classLossOverrides || {},
          sliderAdditionPercent: g.sliderAdditionPercent,
          sliderAddPercent: g.sliderAddPercent,
          isSliderOverridden: g.isSliderOverridden,
          pinBoxLossPercent: g.pinBoxLossPercent,
          isPinBoxLossOverridden: g.isPinBoxLossOverridden,
          pinBoxPerZipper: 1,
          hBottomLossPercent: g.hBottomLossPercent,
          isHBottomLossOverridden: g.isHBottomLossOverridden,
          isSpecialUTopOrder: Boolean(g.isSpecialUTopOrder || (g.czParams && g.czParams.isSpecialUTopOrder)),
          czParams: g.czParams || {},
          mzParams: g.mzParams || {},
          wireParams: g.wireParams || {},
          pzParams: g.pzParams || {},
          bomRows: v.bomRows || []
        };
        est.items.push(itemObj);
      });
    });

    if (!appState.activeItemId && est.items.length > 0) {
      appState.activeItemId = est.items[0].id;
    }
  } else {
    appState.activeItemId = null;
  }
}

// Application State
let appState = {
  currentEstimate: {
    id: null,
    name: '',
    reference: 'EST-' + Math.floor(1000 + Math.random() * 9000),
    items: [
      {
        id: 'item_1',
        variantKey: 'cz_5',
        displayName: 'CZ#5',
        name: 'CZ#5',
        category: 'cz',
        zipperSize: '#5',
        zipperType: 'closed_end',
        length: 7.5,
        lengthUnit: 'inch',
        quantity: 1500,
        color: '',
        styleName: '',
        remarks: '',
        lossPercent: 3.0,
        classLossOverrides: {},
        sliderAdditionPercent: 8.0,
        sliderAddPercent: 8.0,
        isSliderOverridden: false,
        pinBoxLossPercent: 4.0,
        isPinBoxLossOverridden: false,
        pinBoxPerZipper: 1,
        hBottomLossPercent: undefined,
        isHBottomLossOverridden: false,
        isSpecialUTopOrder: false,
        czParams: {},
        mzParams: {},
        wireParams: {},
        pzParams: {},
        bomRows: []
      }
    ],
    categoryGroups: [
      {
        id: 'categoryGroup_1',
        name: 'CZ#5',
        category: 'cz',
        styleName: '',
        color: '',
        remarks: '',
        lossPercent: 3.0,
        classLossOverrides: {},
        sliderAdditionPercent: 8.0,
        sliderAddPercent: 8.0,
        isSliderOverridden: false,
        pinBoxLossPercent: 4.0,
        isPinBoxLossOverridden: false,
        pinBoxPerZipper: 1,
        hBottomLossPercent: undefined,
        isHBottomLossOverridden: false,
        isSpecialUTopOrder: false,
        czParams: {},
        mzParams: {},
        wireParams: {},
        pzParams: {},
        variants: [
          {
            id: 'var_1',
            name: 'CZ#5',
            zipperSize: '#5',
            zipperType: 'closed_end',
            length: 7.5,
            lengthUnit: 'inch',
            quantity: 1500,
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
  activeItemId: 'item_1',
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
  // Sync state structures
  syncStateItemsAndGroups();

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
  // Items and parameters are rendered in rebuildAndRenderAll
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

  // Button: "+ Add New Item" (Top Toolbar)
  const btnAddItem = document.getElementById('btn-add-item');
  if (btnAddItem) {
    btnAddItem.addEventListener('click', () => {
      const selectVariant = document.getElementById('select-add-item-variant');
      const vKey = selectVariant ? selectVariant.value : 'cz_5';
      handleAddNewItem(vKey);
    });
  }

  // Delegated Clicks & Inputs on Items Container
  const itemsContainer = document.getElementById('items-container');
  if (itemsContainer) {
    itemsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.btn-remove-item');
      if (removeBtn) {
        e.stopPropagation();
        const itemId = removeBtn.getAttribute('data-item-id');
        handleRemoveItem(itemId);
        return;
      }

      // If clicked inside an interactive form element, do not re-select/steal focus
      if (e.target.closest('input, select, textarea, button, a')) {
        const card = e.target.closest('.item-card');
        if (card) {
          const itemId = card.getAttribute('data-item-id');
          if (itemId && appState.activeItemId !== itemId) {
            selectActiveItem(itemId, false);
          }
        }
        return;
      }

      // Clicking item card body selects this item as active
      const card = e.target.closest('.item-card');
      if (card) {
        const itemId = card.getAttribute('data-item-id');
        if (itemId) {
          selectActiveItem(itemId, true);
        }
      }
    });

    ['input', 'keyup', 'change', 'paste'].forEach(evtName => {
      itemsContainer.addEventListener(evtName, (e) => {
        handleItemCardInput(e);
      });
    });
  }

  // Delegated Changes & Inputs on "Select Item" Configuration Panel
  const selectItemBody = document.getElementById('select-item-config-body');
  if (selectItemBody) {
    selectItemBody.addEventListener('change', (e) => {
      const target = e.target;
      if (!target) return;

      if (target.id === 'select-active-item-variant' || target.classList.contains('select-active-item-variant')) {
        handleChangeActiveItemVariant(target.value);
        return;
      }

      if (target.classList.contains('input-cz-utop-special')) {
        const activeItem = getActiveItem();
        if (activeItem) {
          const isChecked = Boolean(target.checked);
          activeItem.isSpecialUTopOrder = isChecked;
          activeItem.czParams = activeItem.czParams || {};
          activeItem.czParams.isSpecialUTopOrder = isChecked;
          updateLiveCalculations();
        }
      }
    });

    ['input', 'change'].forEach(evtName => {
      selectItemBody.addEventListener(evtName, (e) => {
        handleSelectItemConfigInput(e);
      });
    });
  }

  // Legacy Button: "+ Add New Category" (calls handleAddNewItem)
  const btnAddCategoryGroup = document.getElementById('btn-add-category-group');
  if (btnAddCategoryGroup) {
    btnAddCategoryGroup.addEventListener('click', handleAddCategoryGroup);
  }

  // Reset ALL BOMs Button
  const btnResetBOM = document.getElementById('btn-reset-bom');
  if (btnResetBOM) {
    btnResetBOM.addEventListener('click', () => {
      if (confirm('Reset BOM recipes for all items to suggested defaults?')) {
        const items = appState.currentEstimate.items || [];
        items.forEach(item => {
          const cat = item.category || 'cz';
          item.bomRows = window.BOMRules ? window.BOMRules.generateSuggestedBOM(item, cat) : [];
        });
        rebuildAndRenderAll();
        showToast('All item BOM recipes reset to suggested defaults', 'info');
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

  // Delegated Keystroke Listeners on Category Groups Container for backward compatibility
  const catGroupsContainer = document.getElementById('category-groups-container');
  if (catGroupsContainer) {
    ['input', 'keyup', 'change', 'paste'].forEach(evtName => {
      catGroupsContainer.addEventListener(evtName, (e) => {
        const target = e.target;
        if (!target) return;

        if (target.classList && (target.classList.contains('input-var-qty') || target.classList.contains('input-var-length'))) {
          const { groupId, varId } = getEventGroupAndVarIds(target);
          const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
          const v = findVariant(groupId, varId);
          if (!v || !group) return;

          const numVal = target.value !== '' ? (parseFloat(target.value) || 0) : '';
          if (target.classList.contains('input-var-qty')) {
            v.quantity = numVal;
            if (!group.isSliderOverridden) {
              const getSliderDefault = window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage);
              if (getSliderDefault) {
                const groupQty = (group.variants || []).reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
                const dynSliderAdd = getSliderDefault(groupQty);
                group.sliderAdditionPercent = dynSliderAdd;
                group.sliderAddPercent = dynSliderAdd;
                const sliderInput = document.getElementById(`input-slider-${group.id}`);
                if (sliderInput) {
                  sliderInput.value = dynSliderAdd;
                }
              }
            }
          } else {
            v.length = numVal;
          }

          if (group.classLossOverrides && window.CalculatorEngine && window.CalculatorEngine.getVariantZipperClass) {
            const classKey = window.CalculatorEngine.getVariantZipperClass(v, group.category);
            if (classKey && group.classLossOverrides[classKey] !== undefined) {
              delete group.classLossOverrides[classKey];
            }
          }

          try {
            updateClassLossDisplay(groupId);
          } catch (err) {
            console.error(err);
          }

          try {
            updateLiveCalculations();
          } catch (err) {
            console.error(err);
          }
        }
      });
    });
  }
}

/**
 * Handle adding a new independent Item
 * @param {string} [variantKey='cz_5']
 */
function handleAddNewItem(variantKey = 'cz_5') {
  if (!Array.isArray(appState.currentEstimate.items)) {
    appState.currentEstimate.items = [];
  }
  const newItem = createItem(variantKey);
  appState.currentEstimate.items.push(newItem);
  appState.activeItemId = newItem.id;
  appState.selectedCalcDetailsGroupId = newItem.id;

  rebuildAndRenderAll();

  const newCardEl = document.getElementById(`item-card-${newItem.id}`);
  if (newCardEl) {
    if (typeof newCardEl.scrollIntoView === 'function') {
      newCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const lengthInput = newCardEl.querySelector('.input-item-length') || newCardEl.querySelector('.input-item-qty');
    if (lengthInput && typeof lengthInput.focus === 'function') lengthInput.focus();
  }

  showToast(`Added ${newItem.displayName}. Ready to configure.`, 'success');
}

/**
 * Handle removing an Item
 * @param {string} itemId 
 */
function handleRemoveItem(itemId) {
  const items = appState.currentEstimate.items || [];
  if (items.length <= 1) {
    if (!confirm('Remove this item? The items list will be empty.')) return;
    appState.currentEstimate.items = [];
    appState.activeItemId = null;
    appState.selectedCalcDetailsGroupId = null;
    appState.selectedMaterialKey = null;
    rebuildAndRenderAll();
    showToast('All items removed.', 'info');
    return;
  }

  const idx = items.findIndex(it => it.id === itemId);
  if (idx === -1) return;

  const targetItem = items[idx];
  if (targetItem.length && targetItem.quantity) {
    if (!confirm(`Are you sure you want to remove "${targetItem.displayName || targetItem.name}"?`)) {
      return;
    }
  }

  items.splice(idx, 1);

  if (appState.activeItemId === itemId) {
    appState.activeItemId = items[0] ? items[0].id : null;
    appState.selectedCalcDetailsGroupId = appState.activeItemId;
  }

  rebuildAndRenderAll();
  showToast(`Removed "${targetItem.displayName || targetItem.name}".`, 'info');
}

/**
 * Update the active material shown in Calculation Details to follow the selected item
 * @param {string} itemId
 */
function updateActiveMaterialForSelectedItem(itemId) {
  const lastCalc = appState.lastCalculation;
  if (!lastCalc) return;

  // 1. Search categoryGroups matching itemId
  if (Array.isArray(lastCalc.categoryGroups)) {
    const group = lastCalc.categoryGroups.find(g => g.id === itemId);
    if (group && group.materials && Array.isArray(group.materials.processedRows) && group.materials.processedRows.length > 0) {
      const firstRow = group.materials.processedRows[0];
      appState.selectedMaterialKey = firstRow.uniqueKey || `${group.id}__${firstRow.key || firstRow.id}`;
      renderCalculationDetails();
      return;
    }
  }

  // 2. Search items in lastCalc matching itemId
  if (Array.isArray(lastCalc.items)) {
    const item = lastCalc.items.find(it => it.id === itemId);
    if (item && item.materials && Array.isArray(item.materials.processedRows) && item.materials.processedRows.length > 0) {
      const firstRow = item.materials.processedRows[0];
      appState.selectedMaterialKey = firstRow.uniqueKey || `${item.id}__${firstRow.key || firstRow.id}`;
      renderCalculationDetails();
      return;
    }
  }

  // 3. Fallback
  renderCalculationDetails();
}

/**
 * Select an active item card and switch the right-side configuration panel
 * @param {string} itemId
 * @param {boolean} [shouldFocus=false]
 */
function selectActiveItem(itemId, shouldFocus = false) {
  appState.activeItemId = itemId;
  appState.selectedCalcDetailsGroupId = itemId;

  // Update visual state on cards
  const container = document.getElementById('items-container');
  if (container) {
    container.querySelectorAll('.item-card').forEach(card => {
      const isCardActive = card.getAttribute('data-item-id') === itemId;
      if (isCardActive) {
        card.classList.add('is-active-item');
        if (!card.querySelector('.item-active-pill')) {
          const titleWrap = card.querySelector('.item-card-header-left');
          if (titleWrap) {
            const pill = document.createElement('span');
            pill.className = 'badge badge-primary text-2xs font-bold px-2 py-0.5 item-active-pill';
            pill.textContent = 'ACTIVE';
            titleWrap.appendChild(pill);
          }
        }
      } else {
        card.classList.remove('is-active-item');
        const pill = card.querySelector('.item-active-pill');
        if (pill) pill.remove();
      }
    });
  }

  // Re-render the right-side Select Item configuration panel
  renderSelectItemPanel();

  // Switch Calculation Details to this item
  updateActiveMaterialForSelectedItem(itemId);
}

/**
 * Switch the variant type of the currently active item
 * @param {string} newVariantKey
 */
function handleChangeActiveItemVariant(newVariantKey) {
  const activeItem = getActiveItem();
  if (!activeItem) return;

  const vDef = getVariantDef(newVariantKey);
  if (!vDef) return;

  activeItem.variantKey = vDef.key;
  activeItem.category = vDef.category;
  activeItem.zipperSize = vDef.size;
  activeItem.displayName = vDef.displayName;
  activeItem.name = vDef.displayName;

  if (window.BOMRules) {
    activeItem.allowance = window.BOMRules.getSuggestedAllowance(activeItem.category, activeItem.zipperSize, activeItem.lengthUnit, activeItem.zipperType);
    activeItem.bomRows = window.BOMRules.generateSuggestedBOM(activeItem, activeItem.category);
  }

  activeItem.classLossOverrides = {};
  if (activeItem.category === 'wire') {
    activeItem.lossPercent = activeItem.zipperSize === '#3' ? 4.0 : 5.0;
  } else {
    activeItem.lossPercent = 3.0;
  }

  if (Array.isArray(activeItem.variants) && activeItem.variants.length > 0) {
    activeItem.variants[0].zipperSize = vDef.size;
    activeItem.variants[0].name = vDef.displayName;
    activeItem.variants[0].allowance = activeItem.allowance;
    activeItem.variants[0].bomRows = activeItem.bomRows || [];
  }

  rebuildAndRenderAll();
  showToast(`Switched active item to ${vDef.displayName}`, 'info');
}

/**
 * Handle real-time keystroke and input events on item cards
 * @param {Event} e
 */
function handleItemCardInput(e) {
  const target = e.target;
  if (!target) return;

  const itemId = target.getAttribute('data-item-id') || target.getAttribute('data-group-id');
  if (!itemId) return;

  const item = (appState.currentEstimate.items || []).find(it => it.id === itemId);
  if (!item) return;

  if (target.classList.contains('input-item-qty') || target.classList.contains('input-var-qty')) {
    item.quantity = target.value !== '' ? (parseFloat(target.value) || 0) : '';
    if (!item.isSliderOverridden) {
      const getSliderDefault = window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage);
      if (getSliderDefault) {
        const dynSliderAdd = getSliderDefault(Math.max(0, Number(item.quantity) || 0));
        item.sliderAdditionPercent = dynSliderAdd;
        item.sliderAddPercent = dynSliderAdd;
        const sliderInput = document.getElementById(`input-slider-${item.id}`);
        if (sliderInput) sliderInput.value = dynSliderAdd;
      }
    }
    if (!item.isPinBoxLossOverridden && window.CalculatorEngine && window.CalculatorEngine.getPinBoxDynamicLossPercentage) {
      const pinBoxQty = (item.zipperType === 'open_end' || item.zipperType === 'two_way') ? Math.max(0, Number(item.quantity) || 0) : 0;
      const dynPinBox = window.CalculatorEngine.getPinBoxDynamicLossPercentage(pinBoxQty > 0 ? pinBoxQty : Math.max(0, Number(item.quantity) || 0));
      item.pinBoxLossPercent = dynPinBox;
      const pinBoxInput = document.getElementById(`input-pin-box-${item.id}`);
      if (pinBoxInput) pinBoxInput.value = dynPinBox;
    }
    if (item.category === 'mz' && String(item.zipperSize || '').includes('3') && !item.isHBottomLossOverridden && window.CalculatorEngine && window.CalculatorEngine.getHBottomDynamicLossPercentage) {
      const dynHBottom = window.CalculatorEngine.getHBottomDynamicLossPercentage(Math.max(0, Number(item.quantity) || 0));
      item.hBottomLossPercent = dynHBottom;
      item.mzParams = item.mzParams || {};
      item.mzParams.hBottomLossPercent = dynHBottom;
      const hBottomInput = document.getElementById(`mz-hbottom-loss-${item.id}`);
      if (hBottomInput && !hBottomInput.disabled) hBottomInput.value = dynHBottom;
    }
  } else if (target.classList.contains('input-item-length') || target.classList.contains('input-var-length')) {
    item.length = target.value !== '' ? (parseFloat(target.value) || 0) : '';
  } else if (target.classList.contains('input-item-unit') || target.classList.contains('input-var-unit')) {
    item.lengthUnit = target.value;
    if (window.BOMRules) {
      item.allowance = window.BOMRules.getSuggestedAllowance(item.category, item.zipperSize, item.lengthUnit, item.zipperType);
    }
  } else if (target.classList.contains('input-item-type') || target.classList.contains('input-var-type')) {
    item.zipperType = target.value;
    if (window.BOMRules) {
      item.allowance = window.BOMRules.getSuggestedAllowance(item.category, item.zipperSize, item.lengthUnit, item.zipperType);
      item.bomRows = window.BOMRules.generateSuggestedBOM(item, item.category);
    }
  } else if (target.classList.contains('input-item-loss') || target.classList.contains('input-var-loss')) {
    if (target.value !== '') {
      const classKey = target.getAttribute('data-class');
      item.classLossOverrides = item.classLossOverrides || {};
      if (classKey) item.classLossOverrides[classKey] = parseFloat(target.value) || 0;
      item.lossPercent = parseFloat(target.value) || 0;
    } else {
      const classKey = target.getAttribute('data-class');
      if (item.classLossOverrides && classKey) {
        delete item.classLossOverrides[classKey];
      }
    }
  } else if (target.classList.contains('input-item-color')) {
    item.color = target.value;
  } else if (target.classList.contains('input-item-remarks')) {
    item.remarks = target.value;
  }

  try {
    updateClassLossDisplay(item.id);
  } catch (err) {
    console.error(err);
  }

  try {
    updateLiveCalculations();
  } catch (err) {
    console.error(err);
  }
}

/**
 * Handle real-time parameter changes inside the right-side Select Item configuration panel
 * @param {Event} e
 */
function handleSelectItemConfigInput(e) {
  const target = e.target;
  if (!target) return;

  const activeItem = getActiveItem();
  if (!activeItem) return;

  // 1. Slider Add %
  if (target.classList.contains('input-group-slider-add')) {
    if (target.value !== '') {
      activeItem.isSliderOverridden = true;
      activeItem.sliderAdditionPercent = parseFloat(target.value) || 0;
      activeItem.sliderAddPercent = parseFloat(target.value) || 0;
    } else {
      activeItem.isSliderOverridden = false;
      const getSliderDefault = window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage);
      const dynSlider = getSliderDefault ? getSliderDefault(Math.max(0, Number(activeItem.quantity) || 0)) : 8.0;
      activeItem.sliderAdditionPercent = dynSlider;
      activeItem.sliderAddPercent = dynSlider;
    }
    updateLiveCalculations();
    return;
  }

  // 2. Pin Box Loss %
  if (target.classList.contains('input-group-pin-box')) {
    if (target.value !== '') {
      activeItem.isPinBoxLossOverridden = true;
      activeItem.pinBoxLossPercent = parseFloat(target.value) || 0;
    } else {
      activeItem.isPinBoxLossOverridden = false;
      const dynPin = window.CalculatorEngine && window.CalculatorEngine.getPinBoxDynamicLossPercentage
        ? window.CalculatorEngine.getPinBoxDynamicLossPercentage(Math.max(0, Number(activeItem.quantity) || 0))
        : 4.0;
      activeItem.pinBoxLossPercent = dynPin;
    }
    updateLiveCalculations();
    return;
  }

  // 3. CZ Parameters
  if (target.classList.contains('input-cz-param')) {
    const paramName = target.getAttribute('data-param');
    if (paramName) {
      activeItem.czParams = activeItem.czParams || {};
      if (target.value !== '') {
        const val = parseFloat(target.value);
        if (!isNaN(val)) {
          if (paramName.toLowerCase().includes('divisor') || paramName.toLowerCase().includes('div')) {
            activeItem.czParams[paramName] = val > 0 ? val : undefined;
          } else {
            activeItem.czParams[paramName] = val >= 0 ? val : 0;
          }
        }
      } else {
        delete activeItem.czParams[paramName];
      }
      updateLiveCalculations();
    }
    return;
  }

  // 4. MZ Parameters
  if (target.classList.contains('input-mz-param')) {
    const paramName = target.getAttribute('data-param');
    if (paramName) {
      activeItem.mzParams = activeItem.mzParams || {};
      if (paramName === 'hBottomLossPercent') {
        if (target.value !== '') {
          activeItem.isHBottomLossOverridden = true;
          activeItem.hBottomLossPercent = parseFloat(target.value) || 0;
          activeItem.mzParams.hBottomLossPercent = parseFloat(target.value) || 0;
        } else {
          activeItem.isHBottomLossOverridden = false;
          delete activeItem.hBottomLossPercent;
          delete activeItem.mzParams.hBottomLossPercent;
        }
      } else {
        if (target.value !== '') {
          activeItem.mzParams[paramName] = parseFloat(target.value);
        } else {
          delete activeItem.mzParams[paramName];
        }
      }
      updateLiveCalculations();
    }
    return;
  }

  // 5. Wire Parameters
  if (target.classList.contains('input-wire-param')) {
    const paramName = target.getAttribute('data-param');
    if (paramName) {
      activeItem.wireParams = activeItem.wireParams || {};
      if (target.value !== '') {
        const val = parseFloat(target.value);
        if (!isNaN(val)) {
          if (paramName.toLowerCase().includes('divisor') || paramName.toLowerCase().includes('div')) {
            activeItem.wireParams[paramName] = val > 0 ? val : undefined;
          } else {
            activeItem.wireParams[paramName] = val >= 0 ? val : 0;
          }
        }
      } else {
        delete activeItem.wireParams[paramName];
      }
      updateLiveCalculations();
    }
    return;
  }

  // 6. PZ Parameters
  if (target.classList.contains('input-pz-param')) {
    const paramName = target.getAttribute('data-param');
    if (paramName) {
      activeItem.pzParams = activeItem.pzParams || {};
      if (target.value !== '') {
        const val = parseFloat(target.value);
        if (!isNaN(val)) {
          if (paramName.toLowerCase().includes('divisor') || paramName.toLowerCase().includes('div')) {
            activeItem.pzParams[paramName] = val > 0 ? val : undefined;
          } else {
            activeItem.pzParams[paramName] = val >= 0 ? val : 0;
          }
        }
      } else {
        delete activeItem.pzParams[paramName];
      }
      updateLiveCalculations();
    }
    return;
  }

  // 7. Metadata (Style, Color, Remarks)
  if (target.classList.contains('input-group-style')) activeItem.styleName = target.value;
  if (target.classList.contains('input-group-color')) activeItem.color = target.value;
  if (target.classList.contains('input-group-remarks')) activeItem.remarks = target.value;
}

/**
 * Handle adding a new independent Category Group (Legacy wrapper)
 */
function handleAddCategoryGroup() {
  const selectAdd = document.getElementById('select-add-item-variant');
  const variantKey = selectAdd ? selectAdd.value : 'cz_5';
  handleAddNewItem(variantKey);
}

/**
 * Handle removing a Category Group (Legacy wrapper)
 * @param {string} groupId 
 */
function handleRemoveCategoryGroup(groupId) {
  handleRemoveItem(groupId);
}

/**
 * Handle adding variant to group (Legacy wrapper)
 * @param {string} groupId 
 */
function handleAddVariantToGroup(groupId) {
  handleAddNewItem('cz_5');
}

/**
 * Handle removing variant from group (Legacy wrapper)
 * @param {string} groupId 
 * @param {string} variantId 
 */
function handleRemoveVariantFromGroup(groupId, variantId) {
  handleRemoveItem(groupId || variantId);
}

/**
 * Master UI rebuild and recalculation function
 */
function rebuildAndRenderAll() {
  // 1. Sync state between items and category groups
  syncStateItemsAndGroups();

  // 2. Render independent items list on left
  renderItemsList();

  // 3. Render reusable "Select Item" configuration panel on right
  renderSelectItemPanel();

  // 4. Populate category groups container for backward compatibility
  renderCategoryGroups();

  // 5. Run master calculations across all independent items and build merged BOM
  updateLiveCalculations();
}

/**
 * Render independent items list into the left-side items container
 */
function renderItemsList() {
  const container = document.getElementById('items-container');
  const countBadge = document.getElementById('items-count-badge');
  const countDisplay = document.getElementById('items-count-display');

  const items = (appState.currentEstimate && Array.isArray(appState.currentEstimate.items))
    ? appState.currentEstimate.items
    : [];

  if (countBadge) countBadge.textContent = items.length;
  if (countDisplay) countDisplay.innerHTML = `Items (<span id="items-count-badge">${items.length}</span>)`;

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <svg class="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:40px;height:40px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="font-medium text-slate-700 text-sm mb-1">No Items Configured</p>
        <p class="text-xs text-muted">Select an item variant from the toolbar above and click <strong>+ Add New Item</strong> to begin.</p>
      </div>
    `;
    return;
  }

  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine : null;

  container.innerHTML = items.map((item, idx) => {
    const isActive = item.id === appState.activeItemId;
    const cat = item.category || 'cz';
    const size = item.zipperSize || (cat === 'wire' ? '#5_normal' : '#5');
    const unit = item.lengthUnit || 'inch';
    const type = item.zipperType || 'closed_end';

    let classKey = '';
    let isEligible = false;
    let lossDisplayVal = '';
    let consumptionDisplay = '0';

    if (calcEng && calcEng.getVariantZipperClass) {
      classKey = calcEng.getVariantZipperClass(item, cat);
      isEligible = calcEng.isClassEligibleForDynamicLoss ? calcEng.isClassEligibleForDynamicLoss(classKey) : false;
      const groupParams = item.czParams || item.mzParams || item.pzParams || item.wireParams || {};
      const consolidation = calcEng.consolidateGroupClasses ? calcEng.consolidateGroupClasses([item], cat, groupParams, item.classLossOverrides) : {};
      const cInfo = consolidation[classKey];

      if (cInfo) {
        if (cInfo.isOverridden && cInfo.overrideVal !== null) {
          lossDisplayVal = cInfo.overrideVal;
        } else if (isEligible && cInfo.defaultLossPercent !== null && cInfo.defaultLossPercent !== undefined) {
          lossDisplayVal = cInfo.defaultLossPercent;
        }
        consumptionDisplay = Math.round(cInfo.baseChainMtr || 0).toLocaleString('en-US');
      }
    }

    return `
      <div class="item-card mb-3 ${isActive ? 'is-active-item' : ''}" id="item-card-${item.id}" data-item-id="${item.id}">
        <div class="item-card-header flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/70">
          <div class="item-card-header-left flex items-center gap-2">
            <span class="item-index-badge">${idx + 1}</span>
            <strong class="item-variant-title text-sm font-bold text-slate-800">${escapeHtml(item.displayName || item.name)}</strong>
            ${isActive ? '<span class="badge badge-primary text-2xs font-bold px-2 py-0.5 item-active-pill">ACTIVE</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            ${items.length > 1 ? `
              <button type="button" class="btn btn-xs btn-ghost text-rose-500 hover:text-rose-700 btn-remove-item" data-item-id="${item.id}" title="Remove this Item">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="item-card-body p-3">
          <div class="form-grid-5">
            <!-- Zipper Type -->
            ${cat !== 'wire' ? `
              <div class="form-group mb-0">
                <label class="form-label text-xs font-semibold mb-1">Zipper Type <span class="text-rose-500">*</span></label>
                <select class="form-select form-select-sm input-item-type input-var-type" data-item-id="${item.id}" data-group-id="${item.id}" data-var-id="var_${item.id}">
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
                <input type="text" class="form-input form-input-sm input-item-color" data-item-id="${item.id}" placeholder="e.g. Golden / Brass" value="${escapeHtml(item.color || '')}">
              </div>
            `}

            <!-- Finished Length & Unit -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-semibold mb-1">Finished Length <span class="text-rose-500">*</span></label>
              <div class="input-with-addon-right">
                <input type="number" class="form-input form-input-sm font-mono input-item-length input-var-length" data-item-id="${item.id}" data-group-id="${item.id}" data-var-id="var_${item.id}" value="${item.length !== undefined && item.length !== null ? item.length : ''}" step="any" min="0" placeholder="0">
                <select class="form-select form-select-sm input-addon-select input-item-unit input-var-unit" data-item-id="${item.id}" data-group-id="${item.id}" data-var-id="var_${item.id}">
                  <option value="inch" ${unit === 'inch' ? 'selected' : ''}>Inch</option>
                  <option value="cm" ${unit === 'cm' ? 'selected' : ''}>cm</option>
                </select>
              </div>
            </div>

            <!-- Order Quantity -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-semibold mb-1">Order Quantity <span class="text-rose-500">*</span></label>
              <div class="input-with-addon">
                <input type="number" class="form-input form-input-sm font-mono input-item-qty input-var-qty" data-item-id="${item.id}" data-group-id="${item.id}" data-var-id="var_${item.id}" value="${item.quantity !== undefined && item.quantity !== null ? item.quantity : ''}" min="0" step="1" placeholder="0">
                <span class="input-addon input-addon-right text-xs">pcs</span>
              </div>
            </div>

            <!-- Product / Style Note (if not wire) -->
            ${cat !== 'wire' ? `
              <div class="form-group mb-0">
                <label class="form-label text-xs font-semibold mb-1">Color / Note</label>
                <input type="text" class="form-input form-input-sm input-item-color" data-item-id="${item.id}" placeholder="e.g. Black / #01" value="${escapeHtml(item.color || '')}">
              </div>
            ` : `
              <div class="form-group mb-0">
                <label class="form-label text-xs font-semibold mb-1">Remarks</label>
                <input type="text" class="form-input form-input-sm input-item-remarks" data-item-id="${item.id}" placeholder="e.g. Special order" value="${escapeHtml(item.remarks || '')}">
              </div>
            `}

            <!-- Loss % Column -->
            <div class="form-group mb-0 variant-loss-col" id="var-loss-col-${item.id}">
              <label class="form-label text-xs font-semibold mb-1 flex items-center justify-between" for="input-item-loss-${item.id}">
                <span>Loss %</span>
                <span class="badge ${isEligible ? 'badge-primary' : 'badge-secondary'} text-3xs font-bold font-mono var-class-badge" title="${classKey ? `Zipper Class: ${classKey}` : '—'}">${escapeHtml(classKey || '—')}</span>
              </label>
              <div class="input-with-addon">
                <input type="number" id="input-item-loss-${item.id}" class="form-input form-input-sm font-mono input-item-loss input-var-loss" data-item-id="${item.id}" data-group-id="${item.id}" data-var-id="var_${item.id}" data-class="${escapeHtml(classKey)}" value="${lossDisplayVal}" placeholder="${isEligible ? '0' : '—'}" min="0" max="100" step="0.5">
                <span class="input-addon input-addon-right text-xs">%</span>
              </div>
              <div class="variant-loss-meta mt-1 flex flex-col gap-0.5 text-3xs font-mono">
                <span class="var-loss-mtr-text text-slate-600">Base Chain: <strong class="var-loss-pool-val font-bold">${consumptionDisplay} Mtr</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render reusable "Select Item" configuration panel on the right side
 */
function renderSelectItemPanel() {
  const body = document.getElementById('select-item-config-body');
  const badgeWrap = document.getElementById('active-item-badge-wrapper');
  if (!body) return;

  const activeItem = getActiveItem();
  if (!activeItem) {
    if (badgeWrap) badgeWrap.innerHTML = '';
    body.innerHTML = `
      <div class="empty-state p-6 text-center text-slate-500">
        <p class="font-medium text-slate-700 mb-1">No Item Selected</p>
        <p class="text-xs text-muted">Select an item on the left or click <strong>+ Add New Item</strong> to configure its parameters.</p>
      </div>
    `;
    return;
  }

  if (badgeWrap) {
    badgeWrap.innerHTML = `<span class="badge badge-primary font-mono font-bold text-xs px-2.5 py-1">${escapeHtml(activeItem.displayName || activeItem.name)}</span>`;
  }

  // Render the configuration HTML for activeItem
  body.innerHTML = buildCategoryGroupHTML(activeItem, 0, 1);

  // Attach live listeners for the configuration inputs
  bindCategoryGroupEventListeners();
}

/**
 * Render all Category Groups into the Product Information container (Legacy alias)
 */
function renderCategoryGroups() {
  const container = document.getElementById('category-groups-container');
  if (!container) return;

  const groups = appState.currentEstimate.categoryGroups;
  if (!Array.isArray(groups) || groups.length === 0) {
    container.innerHTML = `<div class="empty-state">No items defined. Click "+ Add New Item" above to start.</div>`;
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
 * Format group loss meta string for display in headers and summary cards
 * @param {Object} group 
 * @returns {string}
 */
function renderGroupLossMeta(group) {
  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine : null;
  if (calcEng && calcEng.consolidateGroupClasses && Array.isArray(group.variants) && group.variants.length > 0) {
    const groupParams = group.czParams || group.mzParams || group.pzParams || group.wireParams || {};
    const consolidation = calcEng.consolidateGroupClasses(group.variants, group.category, groupParams, group.classLossOverrides);
    const parts = [];
    for (const [classKey, cInfo] of Object.entries(consolidation)) {
      const count = cInfo.variantCount || (cInfo.variants && cInfo.variants.length) || 1;
      const countStr = count > 1 ? ` (${count} vars, ${Math.round(cInfo.baseChainMtr)}m)` : ` (${Math.round(cInfo.baseChainMtr)}m)`;
      if (cInfo.effectiveLossPercent !== null && cInfo.effectiveLossPercent !== undefined) {
        parts.push(`${classKey}${countStr}: ${cInfo.effectiveLossPercent}%`);
      } else {
        parts.push(`${classKey}: —`);
      }
    }
    if (parts.length > 0) return parts.join(' | ');
  }
  return group.lossPercent !== undefined ? `${group.lossPercent}%` : '—';
}

/**
 * Build HTML for the dynamic class-level loss percentage section within a Category Group
 * @param {Object} group 
 * @returns {string}
 */
function buildClassLossSectionHTML(group) {
  const cat = group.category || '';
  if (!cat || (cat !== 'cz' && cat !== 'mz' && cat !== 'pz' && cat !== 'wire')) {
    return '';
  }

  const variants = Array.isArray(group.variants) ? group.variants : [];
  if (variants.length === 0) {
    return '';
  }

  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine : null;
  const groupParams = group.czParams || group.mzParams || group.pzParams || group.wireParams || {};
  const userOverrides = group.classLossOverrides || {};

  let classConsolidation = {};
  if (calcEng && calcEng.consolidateGroupClasses) {
    classConsolidation = calcEng.consolidateGroupClasses(variants, cat, groupParams, userOverrides);
  }

  const classEntries = Object.entries(classConsolidation);
  if (classEntries.length === 0) {
    return '';
  }

  return `
    <div class="class-loss-container mb-3" id="class-loss-container-${group.id}">
      <div class="class-loss-header flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-indigo-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Zipper Class Loss Percentage
          </span>
          <span class="text-xs text-muted font-normal">(Dynamic by class chain consumption)</span>
        </div>
      </div>

      <div class="class-loss-grid">
        ${classEntries.map(([classKey, cInfo]) => {
          const isEligible = cInfo.isEligible;
          const cleanKey = classKey.replace(/[^a-zA-Z0-9]/g, '_');

          // If unsupported (e.g. PZ#8 or two_way), lossDisplayVal is blank unless manually overridden
          let lossDisplayVal = '';
          if (cInfo.isOverridden && cInfo.overrideVal !== null) {
            lossDisplayVal = cInfo.overrideVal;
          } else if (isEligible && cInfo.defaultLossPercent !== null && cInfo.defaultLossPercent !== undefined) {
            lossDisplayVal = cInfo.defaultLossPercent;
          }

          const consumptionDisplay = Math.round(cInfo.baseChainMtr).toLocaleString('en-US');
          const exactConsumption = cInfo.baseChainMtr.toFixed(2);

          return `
            <div class="class-loss-card" id="card-class-loss-${group.id}-${cleanKey}">
              <div class="class-loss-info-block">
                <div class="class-loss-badge-row flex items-center gap-2">
                  <span class="badge ${isEligible ? 'badge-primary' : 'badge-secondary'} font-bold">${escapeHtml(classKey)}</span>
                  ${cInfo.isOverridden ? `<span class="badge badge-warning text-2xs">Custom Override</span>` : (isEligible ? `<span class="badge badge-subtle text-2xs font-normal">Chart Bracket</span>` : `<span class="badge badge-subtle text-2xs font-normal text-muted">No Dynamic Chart</span>`)}
                </div>
                <div class="class-loss-consumption-text mt-1 text-xs">
                  <span class="text-muted">Combined Chain Consumption:</span>
                  <strong class="font-mono text-slate-800 ml-1 class-loss-consumption-val">${consumptionDisplay} MTR</strong>
                  <span class="text-muted text-3xs font-mono ml-0.5 class-loss-exact-sub">(${exactConsumption} Mtr)</span>
                </div>
              </div>

              <div class="class-loss-input-block">
                <label class="class-loss-label text-xs font-semibold text-slate-700 mb-1" for="input-class-loss-${group.id}-${cleanKey}">
                  Loss Percentage:
                </label>
                <div class="input-with-addon class-loss-addon-wrapper">
                  <input type="number" 
                         id="input-class-loss-${group.id}-${cleanKey}" 
                         class="form-input form-input-sm font-mono input-class-loss" 
                         data-group-id="${group.id}" 
                         data-class="${escapeHtml(classKey)}"
                         value="${lossDisplayVal !== '' ? lossDisplayVal : ''}" 
                         placeholder="${isEligible ? '0' : '—'}"
                         min="0" max="100" step="0.5">
                  <span class="input-addon input-addon-right text-xs">%</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Update the dynamic class loss display elements inside variant cards without destroying DOM or losing focus
 * @param {string} groupId 
 */
function updateClassLossDisplay(groupId) {
  const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
  if (!group) return;

  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine : null;
  if (!calcEng || !calcEng.consolidateGroupClasses) return;

  const groupParams = group.czParams || group.mzParams || group.pzParams || group.wireParams || {};
  const consolidation = calcEng.consolidateGroupClasses(group.variants, group.category, groupParams, group.classLossOverrides);

  (group.variants || []).forEach(v => {
    const classKey = calcEng.getVariantZipperClass ? calcEng.getVariantZipperClass(v, group.category) : '';
    const cInfo = consolidation[classKey];
    if (!cInfo) return;

    const col = document.getElementById(`var-loss-col-${v.id}`);
    if (col) {
      const sharedCount = cInfo.variantCount || (cInfo.variants && cInfo.variants.length) || 1;
      const isShared = sharedCount > 1;
      const varMtr = calcEng.calculateVariantBaseChainMtr ? calcEng.calculateVariantBaseChainMtr(v, group.category, groupParams) : 0;
      const classMtr = cInfo.baseChainMtr || 0;
      const consumptionDisplay = Math.round(classMtr).toLocaleString('en-US');

      const badge = col.querySelector('.var-class-badge');
      if (badge) {
        badge.textContent = `${classKey || '—'}`;
        badge.className = `badge ${cInfo.isEligible ? (isShared ? 'badge-primary is-shared' : 'badge-primary') : 'badge-secondary'} text-3xs font-bold font-mono var-class-badge`;
        badge.title = classKey ? (isShared ? `Class ${classKey} is shared across ${sharedCount} variants in this group. Total chain required determines the factory loss % bracket.` : `Zipper Class: ${classKey}`) : '—';
      }

      const metaContainer = col.querySelector('.variant-loss-meta');
      if (metaContainer) {
        if (isShared) {
          metaContainer.innerHTML = `
            <div class="flex items-center justify-between text-slate-500">
              <span class="var-loss-own-mtr" title="Current variant requirement: ${varMtr.toFixed(1)} Mtr">Current: <strong class="var-loss-own-val">${Math.round(varMtr)}m</strong></span>
              ${cInfo.isOverridden ? `<span class="var-loss-status-tag badge badge-warning text-3xs" style="padding: 0px 4px;">Custom</span>` : ''}
            </div>
            <div class="flex items-center justify-between text-indigo-700 font-semibold" title="Combined ${classKey} total across ${sharedCount} variants is ${classMtr.toFixed(1)} Mtr, which sets this loss %">
              <span class="var-loss-mtr-text">Total: <strong class="var-loss-pool-val">${consumptionDisplay}m</strong></span>
            </div>
          `;
        } else {
          metaContainer.innerHTML = `
            <div class="flex items-center justify-between text-slate-600">
              <span class="var-loss-mtr-text" title="Pre-loss Base Chain for ${classKey} (${classMtr.toFixed(2)} Mtr)">
                <strong class="var-loss-pool-val font-bold">${consumptionDisplay} Mtr</strong>
              </span>
              ${cInfo.isOverridden ? `<span class="var-loss-status-tag badge badge-warning text-3xs" style="padding: 1px 4px;">Custom</span>` : ''}
            </div>
          `;
        }
      } else {
        // Fallback if metaContainer doesn't exist (e.g. simplified test mock DOM)
        const mtrText = col.querySelector('.var-loss-mtr-text');
        if (mtrText) {
          mtrText.textContent = isShared ? `Total: ${consumptionDisplay}m` : `${consumptionDisplay} Mtr`;
          mtrText.title = `Pre-loss Base Chain for ${classKey} (${classMtr.toFixed(2)} Mtr)`;
        }
        const statusTag = col.querySelector('.var-loss-status-tag');
        if (statusTag) {
          if (cInfo.isOverridden) {
            statusTag.textContent = 'Custom';
            statusTag.className = 'var-loss-status-tag badge badge-warning text-3xs';
          } else {
            statusTag.textContent = '';
            statusTag.className = 'var-loss-status-tag text-3xs';
          }
        }
      }

      const input = col.querySelector('.input-var-loss');
      if (input) {
        input.setAttribute('data-class', classKey);
        input.title = isShared ? `Shared ${classKey} pool: ${consumptionDisplay} Mtr across ${sharedCount} variants.` : (cInfo.isEligible ? `${classKey} total: ${consumptionDisplay} Mtr` : '');
        if (document.activeElement !== input) {
          let lossDisplayVal = '';
          if (cInfo.isOverridden && cInfo.overrideVal !== null) {
            lossDisplayVal = cInfo.overrideVal;
          } else if (cInfo.isEligible && cInfo.defaultLossPercent !== null && cInfo.defaultLossPercent !== undefined) {
            lossDisplayVal = cInfo.defaultLossPercent;
          }
          input.value = lossDisplayVal !== '' ? lossDisplayVal : '';
        }
      }
    }
  });

  const headerLossMeta = document.getElementById(`group-loss-meta-${groupId}`);
  if (headerLossMeta) {
    headerLossMeta.textContent = renderGroupLossMeta(group);
  }
}

/**
 * Extract live at-a-glance BOM calculated values for a Category Group's parameter previews
 * @param {Object} group 
 * @returns {Object}
 */
function getCategoryParamPreviewData(group) {
  const lastCalc = (typeof appState !== 'undefined' && appState && appState.lastCalculation) ? appState.lastCalculation : null;
  let groupResult = null;
  if (lastCalc && Array.isArray(lastCalc.categoryGroups)) {
    groupResult = lastCalc.categoryGroups.find(g => g.id === group.id);
  }
  const calc = (groupResult && groupResult.calculation) ? groupResult.calculation : null;
  const processedRows = (groupResult && groupResult.materials && Array.isArray(groupResult.materials.processedRows))
    ? groupResult.materials.processedRows
    : [];

  const groupVariants = group.variants || [];
  const hasOpenEnd = groupVariants.some(v => v.zipperType === 'open_end');
  const cat = group.category || '';

  // 1. Slider preview
  let sliderText = '—';
  if (calc && calc.sliderQuantity !== undefined) {
    sliderText = `Slider: ${Math.ceil(calc.sliderQuantity).toLocaleString('en-US')} Pcs`;
  }

  // 2. Pin Box preview
  let pinBoxText = '—';
  const pinBoxRow = processedRows.find(r => r.component === 'PIN BOX');
  if (pinBoxRow && pinBoxRow.totalQuantity > 0) {
    pinBoxText = `Pin Box: ${Math.round(pinBoxRow.totalQuantity).toLocaleString('en-US')} Pcs`;
  } else if (!hasOpenEnd) {
    pinBoxText = 'Pin Box: 0 Pcs (Closed End)';
  } else if (calc && calc.pinBoxQuantity !== undefined) {
    pinBoxText = `Pin Box: ${Math.round(calc.pinBoxQuantity).toLocaleString('en-US')} Pcs`;
  }

  // Previews mapping
  const previews = {
    slider: sliderText,
    pinBox: pinBoxText,
    czAllowance: '—',
    czTape: '—',
    czTop: '—',
    czBottom: '—',
    czResin: '—',
    czTollilon1: '—',
    czTollilon2: '—',
    czUTop: '—',
    mzTape: '—',
    mzTeeth: '—',
    mzTop: '—',
    mzHBottom: '—',
    wireAllowance: '—',
    wireDiv: '—',
    wire3Inch: '—',
    wire3Cm: '—',
    pzAllowance: '—',
    pzTape: '—',
    pzResin: '—'
  };

  if (calc) {
    if (cat === 'cz') {
      const chainVal = calc.baseChainConsumptionMtr !== undefined ? calc.baseChainConsumptionMtr : (calc.chainConsumptionMtr || 0);
      previews.czAllowance = `Base Chain: ${chainVal.toFixed(2)} Mtr`;
      previews.czTape = `Tape: ${(calc.totalTapeKg || 0).toFixed(2)} KG`;
      previews.czTop = `Top Stop: ${(calc.topStopKg || 0).toFixed(2)} KG`;
      previews.czBottom = `Bottom Stop: ${(calc.bottomStopKg || 0).toFixed(2)} KG`;
      previews.czResin = `Resin: ${(calc.resinKg || 0).toFixed(2)} KG`;
      previews.czTollilon1 = `Tollilon #1: ${(calc.tollilonOne || 0).toFixed(2)} U`;
      previews.czTollilon2 = `Tollilon #2: ${(calc.tollilonTwo || 0).toFixed(2)} U (${Math.round(calc.totalTollilon || 0)} Total)`;
      const uTopVal = calc.uTopQty !== undefined ? calc.uTopQty : (calc.uTopPcs || 0);
      previews.czUTop = `U-Top: ${Math.round(uTopVal).toLocaleString('en-US')} Pcs`;
    } else if (cat === 'mz') {
      previews.mzTape = `Tape: ${(calc.totalTapeKg || 0).toFixed(2)} KG`;
      previews.mzTeeth = `Teeth Wire: ${(calc.teethWireKg || 0).toFixed(2)} KG`;
      previews.mzTop = `Top Stop: ${(calc.topStopKg || 0).toFixed(2)} KG`;
      const hBottomRow = processedRows.find(r => r.component === 'H-BOTTOM');
      const hBottomQty = hBottomRow ? hBottomRow.totalQuantity : (calc.hBottomQuantity || 0);
      const hasMz3 = groupVariants.some(v => String(v.zipperSize || '').includes('3'));
      previews.mzHBottom = hasMz3 ? `H-Bottom: ${Math.round(hBottomQty).toLocaleString('en-US')} Pcs` : `— (MZ#3 only)`;
    } else if (cat === 'wire') {
      const wireMtr = calc.totalReqMtr || 0;
      previews.wireAllowance = `Req. Chain: ${wireMtr.toFixed(2)} Mtr`;
      previews.wireDiv = `Teeth Wire: ${(calc.totalWireKg || 0).toFixed(2)} KG`;
      previews.wire3Inch = `Teeth Wire: ${(calc.totalWireKg || 0).toFixed(2)} KG`;
      previews.wire3Cm = `Teeth Wire: ${(calc.totalWireKg || 0).toFixed(2)} KG`;
    } else if (cat === 'pz') {
      const chainVal = calc.baseChainConsumptionMtr !== undefined ? calc.baseChainConsumptionMtr : (calc.chainConsumptionMtr || 0);
      previews.pzAllowance = `Base Chain: ${chainVal.toFixed(2)} Mtr`;
      previews.pzTape = `Tape: ${(calc.totalTapeKg || 0).toFixed(2)} KG`;
      previews.pzResin = `Tape Wise: ${(calc.tapeResinKg || 0).toFixed(2)} KG`;
    }
  }

  return previews;
}

/**
 * Update all At-a-Glance BOM Parameter Previews across rendered category groups without DOM re-render
 */
function updateCategoryParameterPreviews() {
  const groups = (appState.currentEstimate && Array.isArray(appState.currentEstimate.categoryGroups))
    ? appState.currentEstimate.categoryGroups
    : [];

  groups.forEach(group => {
    const previews = getCategoryParamPreviewData(group);
    
    const updateEl = (id, text, isMuted = false) => {
      const el = document.getElementById(id);
      if (el) {
        const textSpan = el.querySelector('.preview-text');
        const badge = el.querySelector('.preview-badge');
        if (textSpan) {
          textSpan.textContent = text;
        } else {
          el.innerHTML = `<span class="preview-badge ${isMuted ? 'preview-muted' : ''}"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(text)}</span></span>`;
        }
        if (badge) {
          if (isMuted) {
            badge.classList.add('preview-muted');
          } else {
            badge.classList.remove('preview-muted');
          }
        }
      }
    };

    updateEl(`preview-slider-${group.id}`, previews.slider);
    updateEl(`preview-pin-box-${group.id}`, previews.pinBox, previews.pinBox.includes('Closed End') || previews.pinBox === '—');
    
    // CZ
    updateEl(`preview-cz-allowance-${group.id}`, previews.czAllowance);
    updateEl(`preview-cz-tape-${group.id}`, previews.czTape);
    updateEl(`preview-cz-top-${group.id}`, previews.czTop);
    updateEl(`preview-cz-bottom-${group.id}`, previews.czBottom);
    updateEl(`preview-cz-resin-${group.id}`, previews.czResin);
    updateEl(`preview-cz-tollilon1-${group.id}`, previews.czTollilon1);
    updateEl(`preview-cz-tollilon2-${group.id}`, previews.czTollilon2);
    updateEl(`preview-cz-utop-${group.id}`, previews.czUTop);

    // MZ
    updateEl(`preview-mz-tape-${group.id}`, previews.mzTape);
    updateEl(`preview-mz-teeth-${group.id}`, previews.mzTeeth);
    updateEl(`preview-mz-top-${group.id}`, previews.mzTop);
    updateEl(`preview-mz-hbottom-${group.id}`, previews.mzHBottom, previews.mzHBottom.includes('MZ#3 only'));

    // WIRE
    updateEl(`preview-wire-allowance-${group.id}`, previews.wireAllowance);
    updateEl(`preview-wire-div-${group.id}`, previews.wireDiv);
    updateEl(`preview-wire-inch-${group.id}`, previews.wire3Inch);
    updateEl(`preview-wire-cm-${group.id}`, previews.wire3Cm);

    // PZ
    updateEl(`preview-pz-allowance-${group.id}`, previews.pzAllowance);
    updateEl(`preview-pz-tape-${group.id}`, previews.pzTape);
    updateEl(`preview-pz-resin-${group.id}`, previews.pzResin);
  });
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

  const previews = getCategoryParamPreviewData(group);

  const effectiveVariants = (Array.isArray(group.variants) && group.variants.length > 0)
    ? group.variants
    : [{
        id: `var_${group.id}`,
        zipperSize: group.zipperSize || (cat === 'wire' ? '#5_normal' : '#5'),
        zipperType: group.zipperType || 'closed_end',
        length: group.length !== undefined && group.length !== null ? group.length : 7.5,
        lengthUnit: group.lengthUnit || 'inch',
        quantity: group.quantity !== undefined && group.quantity !== null ? group.quantity : 1000
      }];

  // MZ multi-variant detection
  const mzVariants = effectiveVariants;
  const hasMz5 = mzVariants.some(v => String(v.zipperSize || '').includes('5'));
  const hasMz3 = mzVariants.some(v => String(v.zipperSize || '').includes('3'));
  const primaryMzSize = (hasMz5 && !hasMz3) ? '#5' : (hasMz3 && !hasMz5 ? '#3' : ((mzVariants.length > 0 && mzVariants[0].zipperSize && mzVariants[0].zipperSize.includes('5')) ? '#5' : '#3'));
  const mzSizeTitle = (hasMz5 && hasMz3) ? 'MZ#5 & MZ#3' : (hasMz3 && !hasMz5 ? 'MZ#3' : 'MZ#5');
  const mzParams = (group.mzParams && typeof group.mzParams === 'object') ? group.mzParams : {};
  const defaultMzTapeDivisor = primaryMzSize === '#5' ? 71 : 97;
  const defaultTopStopFactor = primaryMzSize === '#5' ? 0.32 : 0.22;
  const isHBottomApplicable = (mzVariants.length > 0) ? hasMz3 : (primaryMzSize !== '#5');

  // CZ multi-variant detection
  const czParams = (group.czParams && typeof group.czParams === 'object') ? group.czParams : {};
  const czVariants = effectiveVariants;
  const hasCz5 = czVariants.some(v => String(v.zipperSize || '').includes('5'));
  const hasCz3 = czVariants.some(v => String(v.zipperSize || '').includes('3'));
  const primaryCzSize = (hasCz5 && !hasCz3) ? '#5' : (hasCz3 && !hasCz5 ? '#3' : ((czVariants.length > 0 && czVariants[0].zipperSize && czVariants[0].zipperSize.includes('5')) ? '#5' : '#3'));
  const czSizeTitle = (hasCz5 && hasCz3) ? 'CZ#5 & CZ#3' : (hasCz3 && !hasCz5 ? 'CZ#3' : 'CZ#5');
  const primaryUnit = (czVariants.length > 0 && czVariants[0].lengthUnit === 'cm') ? 'cm' : 'inch';
  const defaultCzAllowance = primaryCzSize === '#5' 
    ? (primaryUnit === 'cm' ? 4.5 : 1.78) 
    : (primaryUnit === 'cm' ? 4.0 : 1.58);
  const defaultCzTapeDivisor = primaryCzSize === '#5' ? 54.5 : 87.0;
  const defaultCzTopStopFactor = primaryCzSize === '#5' ? 0.04 : 0.02;
  const defaultCzBottomStopFactor = primaryCzSize === '#5' ? 0.04 : 0.03;
  const defaultCzResinDivisor = primaryCzSize === '#5' ? 900 : 1000;
  const defaultCzTollilon1Divisor = primaryCzSize === '#5' ? 7700 : 14400;
  const defaultCzTollilon2Divisor = primaryCzSize === '#5' ? 8600 : 9500;

  // WIRE multi-variant detection
  const wireParams = (group.wireParams && typeof group.wireParams === 'object') ? group.wireParams : {};
  const wireVariants = effectiveVariants;
  const hasWireLong = wireVariants.some(v => String(v.zipperSize || '').includes('long'));
  const hasWireNormal = wireVariants.some(v => String(v.zipperSize || '').includes('normal') || (!String(v.zipperSize || '').includes('long') && !String(v.zipperSize || '').includes('3')));
  const hasWire3 = wireVariants.some(v => String(v.zipperSize || '').includes('3'));

  const firstVariant = wireVariants[0] || null;
  const primaryWireType = firstVariant 
    ? (firstVariant.zipperSize && firstVariant.zipperSize.includes('3') ? '#3' : (firstVariant.zipperSize && firstVariant.zipperSize.includes('long') ? '#5_long' : '#5_normal'))
    : '#5_normal';
  const primaryWireUnit = (firstVariant && firstVariant.lengthUnit === 'cm') ? 'cm' : 'inch';
  const defaultWireAllowance = 1.97;
  const defaultWireDivisor = 20.6;
  const defaultWire3InchDivisor = 32.0;
  const defaultWire3CmDivisor = 27.73;

  let wireTitle = 'WIRE#5 Normal Teeth';
  if (hasWire3 && (hasWireLong || hasWireNormal)) {
    wireTitle = 'WIRE#3 & WIRE#5';
  } else if (hasWireLong && hasWireNormal) {
    wireTitle = 'WIRE#5 Normal & Long Teeth';
  } else if (hasWire3) {
    wireTitle = 'WIRE#3';
  } else if (hasWireLong) {
    wireTitle = 'WIRE#5 Long Teeth';
  } else if (primaryWireType === '#3') {
    wireTitle = 'WIRE#3';
  } else if (primaryWireType === '#5_long') {
    wireTitle = 'WIRE#5 Long Teeth';
  }

  // PZ multi-variant detection
  const pzParams = (group.pzParams && typeof group.pzParams === 'object') ? group.pzParams : {};
  const pzVariants = effectiveVariants;
  const primaryPzVariant = pzVariants[0] || null;
  const hasPz8 = pzVariants.some(v => String(v.zipperSize || '').includes('8'));
  const hasPz3 = pzVariants.some(v => String(v.zipperSize || '').includes('3'));
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

  // Dynamic Slider & Pin Box Loss Percentages for this category group
  const groupVariants = group.variants || [];
  const groupTotalZipperQty = groupVariants.reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
  const relevantPinBoxQty = (window.CalculatorEngine && window.CalculatorEngine.getRelevantPinBoxQuantity)
    ? window.CalculatorEngine.getRelevantPinBoxQuantity(groupVariants)
    : 0;
  const pinBoxScopeQty = relevantPinBoxQty > 0 ? relevantPinBoxQty : groupTotalZipperQty;

  const getSliderDefault = (window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage))
    ? (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage)
    : null;
  const defaultSliderAdd = getSliderDefault ? getSliderDefault(groupTotalZipperQty) : 8.0;

  const currentSliderVal = (group.sliderAdditionPercent !== undefined && group.sliderAdditionPercent !== null)
    ? group.sliderAdditionPercent
    : (group.sliderAddPercent !== undefined && group.sliderAddPercent !== null ? group.sliderAddPercent : null);

  let effectiveSliderLoss = defaultSliderAdd;
  if (group.isSliderOverridden && currentSliderVal !== null) {
    effectiveSliderLoss = Number(currentSliderVal);
  } else {
    group.sliderAdditionPercent = defaultSliderAdd;
    group.sliderAddPercent = defaultSliderAdd;
    effectiveSliderLoss = defaultSliderAdd;
  }

  const defaultPinBoxLoss = (window.CalculatorEngine && window.CalculatorEngine.getPinBoxDynamicLossPercentage)
    ? window.CalculatorEngine.getPinBoxDynamicLossPercentage(pinBoxScopeQty)
    : 4.0;
  const effectivePinBoxLoss = (group.isPinBoxLossOverridden && group.pinBoxLossPercent !== undefined && group.pinBoxLossPercent !== null)
    ? group.pinBoxLossPercent
    : (group.pinBoxLossPercent !== undefined && group.pinBoxLossPercent !== null
      ? group.pinBoxLossPercent
      : defaultPinBoxLoss);

  const mz3Variants = mzVariants.filter(v => {
    const sz = String((v && v.zipperSize) || '').trim();
    return sz.includes('3');
  });

  const mz3ZipperQty = mz3Variants.reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
  const defaultHBottomLoss = (window.CalculatorEngine && window.CalculatorEngine.getHBottomDynamicLossPercentage)
    ? window.CalculatorEngine.getHBottomDynamicLossPercentage(mz3ZipperQty)
    : 4.0;
  const currentHBottomParam = (group.mzParams && group.mzParams.hBottomLossPercent !== undefined && group.mzParams.hBottomLossPercent !== null)
    ? group.mzParams.hBottomLossPercent
    : group.hBottomLossPercent;
  const effectiveHBottomLoss = (group.isHBottomLossOverridden && currentHBottomParam !== undefined && currentHBottomParam !== null)
    ? currentHBottomParam
    : (currentHBottomParam !== undefined && currentHBottomParam !== null && currentHBottomParam !== 2.5
      ? currentHBottomParam
      : defaultHBottomLoss);

  const vSize = (group.variants && group.variants[0] && group.variants[0].zipperSize) || group.zipperSize || (cat === 'wire' ? '#5_normal' : '#5');
  let currentVariantKey = group.variantKey || '';
  if (!currentVariantKey) {
    if (cat === 'cz') currentVariantKey = (vSize === '#3' ? 'cz_3' : 'cz_5');
    else if (cat === 'mz') currentVariantKey = (vSize === '#3' ? 'mz_3' : (vSize === '#4' ? 'mz_4' : 'mz_5'));
    else if (cat === 'pz') currentVariantKey = (vSize === '#3' ? 'pz_3' : (vSize === '#8' ? 'pz_8' : 'pz_5'));
    else if (cat === 'wire') currentVariantKey = (vSize === '#3' ? 'wire_3' : (vSize === '#5_long' ? 'wire_5_long' : 'wire_5_normal'));
    else currentVariantKey = 'cz_5';
  }

  return `
    <div class="category-group-header">
      <div class="category-group-title-area">
        <span class="group-number-pill">Item</span>
        <h3 class="group-title-text">${escapeHtml(group.displayName || group.name || 'Select Item')}</h3>
        <span class="badge ${catBadgeClass}">${catBadge}</span>
      </div>

      <div class="category-group-header-actions">
        ${totalGroupsCount > 1 ? `
          <button type="button" class="btn btn-sm btn-ghost btn-remove-category-group btn-remove-item" data-group-id="${group.id}" data-item-id="${group.id}" title="Remove this Item">
            <svg class="w-4 h-4 text-rose-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Item
          </button>
        ` : ''}
      </div>
    </div>

    <div class="category-group-body">
      <!-- Item Variant & Factory Parameters Configuration Card -->
      <div class="category-selector-wrapper mb-3">
        <div class="category-selector-header">
          <h4 class="category-selector-heading">
            <svg class="w-4 h-4 text-indigo-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10M7 11h10M7 15h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
            Select Item <span class="text-rose-400 font-bold">*</span>
          </h4>
          <p class="category-selector-subtext">Configure item variant and production parameters</p>
        </div>

        <div class="category-controls-grid">
          <!-- 1. Select Item Field -->
          <div class="category-control-item category-control-main">
            <label class="category-control-label" for="select-cat-${group.id}">
              Select Item
            </label>
            <select id="select-cat-${group.id}" class="form-select select-group-category category-styled-select select-active-item-variant" data-group-id="${group.id}" data-item-id="${group.id}">
              <option value="cz_5" ${currentVariantKey === 'cz_5' ? 'selected' : ''}>CZ#5</option>
              <option value="cz_3" ${currentVariantKey === 'cz_3' ? 'selected' : ''}>CZ#3</option>
              <option value="mz_3" ${currentVariantKey === 'mz_3' ? 'selected' : ''}>MZ#3</option>
              <option value="mz_4" ${currentVariantKey === 'mz_4' ? 'selected' : ''}>MZ#4</option>
              <option value="mz_5" ${currentVariantKey === 'mz_5' ? 'selected' : ''}>MZ#5</option>
              <option value="pz_3" ${currentVariantKey === 'pz_3' ? 'selected' : ''}>PZ#3</option>
              <option value="pz_5" ${currentVariantKey === 'pz_5' ? 'selected' : ''}>PZ#5</option>
              <option value="pz_8" ${currentVariantKey === 'pz_8' ? 'selected' : ''}>PZ#8</option>
              <option value="wire_3" ${currentVariantKey === 'wire_3' ? 'selected' : ''}>WIRE#3</option>
              <option value="wire_5_normal" ${currentVariantKey === 'wire_5_normal' ? 'selected' : ''}>WIRE#5 Normal Teeth</option>
              <option value="wire_5_long" ${currentVariantKey === 'wire_5_long' ? 'selected' : ''}>WIRE#5 Long Teeth</option>
              <!-- Legacy category aliases for backward compatibility -->
              <option value="cz" style="display:none;" ${cat === 'cz' && !currentVariantKey ? 'selected' : ''}>Nylon Zipper (CZ)</option>
              <option value="mz" style="display:none;" ${cat === 'mz' && !currentVariantKey ? 'selected' : ''}>Metal Zipper (MZ)</option>
              <option value="wire" style="display:none;" ${cat === 'wire' && !currentVariantKey ? 'selected' : ''}>Brass / Metal Wire (WIRE)</option>
              <option value="pz" style="display:none;" ${cat === 'pz' && !currentVariantKey ? 'selected' : ''}>Plastic Zipper (PZ)</option>
            </select>
          </div>

          <!-- 2. Slider Add Percentage Field (Zipper categories only) -->
          ${isZipperCategory ? `
            <div class="category-control-item category-control-slider">
              <label class="category-control-label" for="input-slider-${group.id}" title="Slider Addition Allowance Percentage">
                Slider Add %
              </label>
              <div class="input-with-addon category-addon-wrapper">
                <input type="number" id="input-slider-${group.id}" class="form-input font-mono input-group-slider-add category-styled-input" 
                  data-group-id="${group.id}"
                  value="${effectiveSliderLoss}" 
                  min="0" max="100" step="0.1">
                <span class="input-addon input-addon-right category-addon-badge">%</span>
              </div>
              <div class="param-calc-preview" id="preview-slider-${group.id}">
                <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.slider)}</span></span>
              </div>
            </div>

            <!-- 3. Pin Box Loss Percentage Field (Zipper categories only) -->
            <div class="category-control-item category-control-pin-box">
              <label class="category-control-label" for="input-pin-box-${group.id}" title="Pin Box Loss Allowance Percentage">
                Pin Box Loss %
              </label>
              <div class="input-with-addon category-addon-wrapper">
                <input type="number" id="input-pin-box-${group.id}" class="form-input font-mono input-group-pin-box category-styled-input" 
                  data-group-id="${group.id}"
                  value="${effectivePinBoxLoss}" 
                  min="0" max="100" step="0.1">
                <span class="input-addon input-addon-right category-addon-badge">%</span>
              </div>
              <div class="param-calc-preview" id="preview-pin-box-${group.id}">
                <span class="preview-badge ${previews.pinBox.includes('Closed End') || previews.pinBox === '—' ? 'preview-muted' : ''}"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.pinBox)}</span></span>
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
                CZ Production Parameters (${czSizeTitle})
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
                <div class="param-calc-preview" id="preview-cz-allowance-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czAllowance)}</span></span>
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
                <div class="param-calc-preview" id="preview-cz-tape-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czTape)}</span></span>
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
                <div class="param-calc-preview" id="preview-cz-top-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czTop)}</span></span>
                </div>
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
                <div class="param-calc-preview" id="preview-cz-bottom-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czBottom)}</span></span>
                </div>
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
                <div class="param-calc-preview" id="preview-cz-resin-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czResin)}</span></span>
                </div>
              </div>

              <!-- 6. Tollilon Divisor 1 (ROW 2 Item 1) -->
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
                <div class="param-calc-preview" id="preview-cz-tollilon1-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czTollilon1)}</span></span>
                </div>
              </div>

              <!-- 7. Tollilon Divisor 2 (ROW 2 Item 2) -->
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
                <div class="param-calc-preview" id="preview-cz-tollilon2-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czTollilon2)}</span></span>
                </div>
              </div>

              ${(primaryCzSize === '#5' || hasCz5) ? `
                <!-- 8. Special U-Top Requirement (ROW 2 Item 3, spanning columns 3 to 5) -->
                <div class="category-dynamic-param-item category-dynamic-param-utop-card">
                  <label class="category-control-label" for="cz-utop-special-${group.id}" title="When checked, customer requires 1 U-Top per zipper instead of standard 2 pcs">
                    U-Top Requirement (CZ#5)
                  </label>
                  <div class="utop-checkbox-inner-card">
                    <label class="flex items-center gap-2" style="cursor: pointer; margin: 0; width: 100%;">
                      <input type="checkbox" id="cz-utop-special-${group.id}" 
                             class="input-cz-utop-special rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                             data-group-id="${group.id}" 
                             ${Boolean(group.isSpecialUTopOrder || (czParams && czParams.isSpecialUTopOrder)) ? 'checked' : ''}>
                      <span class="text-xs text-slate-700 font-semibold">Special U-Top Requirement (1 pc per zipper)</span>
                    </label>
                  </div>
                  <div class="param-calc-preview" id="preview-cz-utop-${group.id}">
                    <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.czUTop)}</span></span>
                  </div>
                </div>
              ` : ''}
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
                MZ Production Parameters (${mzSizeTitle})
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
                <div class="param-calc-preview" id="preview-mz-tape-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.mzTape)}</span></span>
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
                <div class="param-calc-preview" id="preview-mz-teeth-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.mzTeeth)}</span></span>
                </div>
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
                <div class="param-calc-preview" id="preview-mz-top-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.mzTop)}</span></span>
                </div>
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
              <div class="category-dynamic-param-item ${!isHBottomApplicable ? 'param-inactive' : ''}">
                <label class="category-control-label" for="mz-hbottom-loss-${group.id}" title="${isHBottomApplicable ? 'H-Bottom Stop Loss Addition Percentage for MZ#3' : 'H-Bottom Stop is applicable to MZ#3 only (inactive for MZ#5)'}">
                  H-Bottom Loss %
                  ${!isHBottomApplicable ? '<span class="text-3xs text-slate-400 font-normal ml-1">(MZ#3 only)</span>' : ''}
                </label>
                <div class="input-with-addon category-addon-wrapper">
                  <input type="number" id="mz-hbottom-loss-${group.id}" 
                         class="form-input font-mono category-styled-input input-mz-param input-group-hbottom-loss" 
                         data-group-id="${group.id}" 
                         data-param="hBottomLossPercent" 
                         value="${isHBottomApplicable ? effectiveHBottomLoss : ''}" 
                         placeholder="${isHBottomApplicable ? '0' : '—'}"
                         ${!isHBottomApplicable ? 'disabled' : ''}
                         title="${isHBottomApplicable ? 'H-Bottom Stop Loss Addition Percentage for MZ#3' : 'H-Bottom Stop is applicable to MZ#3 only (inactive for MZ#5)'}"
                         min="0" max="100" step="0.1">
                  <span class="input-addon input-addon-right category-addon-badge text-xs ${!isHBottomApplicable ? 'opacity-60 text-slate-400' : ''}">%</span>
                </div>
                <div class="param-calc-preview" id="preview-mz-hbottom-${group.id}">
                  <span class="preview-badge ${!isHBottomApplicable ? 'preview-muted' : ''}"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.mzHBottom)}</span></span>
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
                WIRE Production Parameters (${wireTitle})
              </span>
              <span class="category-dynamic-params-hint">Factory calculation constants for Brass / Metal Wire</span>
            </div>

            <div class="category-dynamic-params-grid">
              ${(hasWire3 || primaryWireType === '#3') ? `
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
                  <div class="param-calc-preview" id="preview-wire-inch-${group.id}">
                    <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.wire3Inch)}</span></span>
                  </div>
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
                  <div class="param-calc-preview" id="preview-wire-cm-${group.id}">
                    <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.wire3Cm)}</span></span>
                  </div>
                </div>
              ` : ''}

              ${hasWireLong ? `
                <!-- Wire Allowance (Long Teeth #5) -->
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
                  <div class="param-calc-preview" id="preview-wire-allowance-${group.id}">
                    <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.wireAllowance)}</span></span>
                  </div>
                </div>
              ` : ''}

              ${(hasWireNormal || hasWireLong || (primaryWireType !== '#3' && !hasWire3)) ? `
                <!-- Wire Divisor -->
                <div class="category-dynamic-param-item">
                  <label class="category-control-label" for="wire-div-${group.id}" title="Wire weight calculation divisor for Normal/Long Teeth #5">
                    Wire Divisor
                  </label>
                  <input type="number" id="wire-div-${group.id}" 
                         class="form-input font-mono category-styled-input input-wire-param" 
                         data-group-id="${group.id}" 
                         data-param="wireDivisor" 
                         value="${wireParams.wireDivisor !== undefined ? wireParams.wireDivisor : defaultWireDivisor}" 
                         min="1" max="500" step="0.1">
                  <div class="param-calc-preview" id="preview-wire-div-${group.id}">
                    <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.wireDiv)}</span></span>
                  </div>
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
                <div class="param-calc-preview" id="preview-pz-allowance-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.pzAllowance)}</span></span>
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
                <div class="param-calc-preview" id="preview-pz-tape-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.pzTape)}</span></span>
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
                <div class="param-calc-preview" id="preview-pz-resin-${group.id}">
                  <span class="preview-badge"><span class="preview-dot"></span><span class="preview-text">${escapeHtml(previews.pzResin)}</span></span>
                </div>
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

      <!-- Class Loss Section -->
      ${buildClassLossSectionHTML(group)}
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

  const calcEng = (typeof window !== 'undefined' && window.CalculatorEngine) ? window.CalculatorEngine : null;
  let classKey = '';
  let cInfo = null;
  let isEligible = false;
  let lossDisplayVal = '';
  let consumptionDisplay = '0';
  let isOverridden = false;
  let varMtr = 0;
  let isShared = false;
  let sharedCount = 1;

  if (calcEng && calcEng.getVariantZipperClass && calcEng.consolidateGroupClasses) {
    classKey = calcEng.getVariantZipperClass(v, cat);
    isEligible = calcEng.isClassEligibleForDynamicLoss ? calcEng.isClassEligibleForDynamicLoss(classKey) : false;
    
    const groupParams = group.czParams || group.mzParams || group.pzParams || group.wireParams || {};
    const consolidation = calcEng.consolidateGroupClasses(group.variants, cat, groupParams, group.classLossOverrides);
    cInfo = consolidation[classKey] || null;

    if (calcEng.calculateVariantBaseChainMtr) {
      varMtr = calcEng.calculateVariantBaseChainMtr(v, cat, groupParams) || 0;
    }

    if (cInfo) {
      sharedCount = cInfo.variantCount || (cInfo.variants && cInfo.variants.length) || 1;
      isShared = sharedCount > 1;
      isOverridden = Boolean(cInfo.isOverridden);
      if (isOverridden && cInfo.overrideVal !== null) {
        lossDisplayVal = cInfo.overrideVal;
      } else if (isEligible && cInfo.defaultLossPercent !== null && cInfo.defaultLossPercent !== undefined) {
        lossDisplayVal = cInfo.defaultLossPercent;
      }
      consumptionDisplay = Math.round(cInfo.baseChainMtr || 0).toLocaleString('en-US');
    }
  }

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
        <div class="form-grid-5">
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
            <div class="input-with-addon-right">
              <input type="number" class="form-input form-input-sm font-mono input-var-length" 
                data-group-id="${group.id}" 
                data-var-id="${v.id}" 
                value="${v.length !== undefined && v.length !== null ? v.length : 0}" 
                step="any" min="0" placeholder="0">
              <select class="form-select form-select-sm input-addon-select input-var-unit" 
                data-group-id="${group.id}" 
                data-var-id="${v.id}">
                <option value="inch" ${unit === 'inch' ? 'selected' : ''}>Inch</option>
                <option value="cm" ${unit === 'cm' ? 'selected' : ''}>cm</option>
              </select>
            </div>
          </div>

          <!-- Quantity -->
          <div class="form-group mb-0">
            <label class="form-label text-xs font-semibold mb-1">
              Order Quantity <span class="text-rose-500">*</span>
            </label>
            <div class="input-with-addon">
              <input type="number" class="form-input form-input-sm font-mono input-var-qty" 
                data-group-id="${group.id}" 
                data-var-id="${v.id}" 
                value="${v.quantity !== undefined && v.quantity !== null ? v.quantity : 0}" 
                min="0" step="1" placeholder="0">
              <span class="input-addon input-addon-right text-xs">pcs</span>
            </div>
          </div>

          <!-- Zipper Type / Wire Note -->
          ${cat !== 'wire' ? `
            <div class="form-group mb-0">
              <label class="form-label text-xs font-semibold mb-1">
                Zipper Type <span class="text-rose-500">*</span>
              </label>
              <select class="form-select form-select-sm input-var-type" 
                data-group-id="${group.id}" 
                data-var-id="${v.id}">
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

          <!-- Dynamic Loss Percentage Field (Inside Variant Card) -->
          <div class="form-group mb-0 variant-loss-col" id="var-loss-col-${v.id}">
            <label class="form-label text-xs font-semibold mb-1 flex items-center justify-between" for="input-var-loss-${v.id}">
              <span>Loss %</span>
              <span class="badge ${isEligible ? (isShared ? 'badge-primary is-shared' : 'badge-primary') : 'badge-secondary'} text-3xs font-bold font-mono var-class-badge" 
                    title="${classKey ? (isShared ? `Class ${classKey} is shared across ${sharedCount} variants in this group. Total chain required determines the factory loss % bracket.` : `Zipper Class: ${classKey}`) : '—'}">
                ${escapeHtml(classKey || '—')}
              </span>
            </label>
            <div class="input-with-addon">
              <input type="number" 
                     id="input-var-loss-${v.id}" 
                     class="form-input form-input-sm font-mono input-var-loss" 
                     data-group-id="${group.id}" 
                     data-var-id="${v.id}" 
                     data-class="${escapeHtml(classKey)}"
                     value="${lossDisplayVal !== '' ? lossDisplayVal : ''}" 
                     placeholder="${isEligible ? '0' : '—'}"
                     min="0" max="100" step="0.5"
                     title="${isShared ? `Combined ${classKey} total: ${consumptionDisplay} Mtr across ${sharedCount} variants.` : (isEligible ? `${classKey} total: ${consumptionDisplay} Mtr` : '')}">
              <span class="input-addon input-addon-right text-xs">%</span>
            </div>
            <div class="variant-loss-meta mt-1 flex flex-col gap-0.5 text-3xs font-mono">
              ${isShared ? `
                <div class="flex items-center justify-between text-slate-500">
                  <span class="var-loss-own-mtr" title="Current variant requirement: ${varMtr.toFixed(1)} Mtr">Current: <strong class="var-loss-own-val text-slate-700">${Math.round(varMtr)}m</strong></span>
                  ${isOverridden ? `<span class="var-loss-status-tag badge badge-warning text-3xs" style="padding: 0px 4px;">Custom</span>` : ''}
                </div>
                <div class="flex items-center justify-between text-indigo-700 font-semibold" title="Combined ${escapeHtml(classKey)} total across ${sharedCount} variants is ${cInfo ? cInfo.baseChainMtr.toFixed(1) : 0} Mtr, which sets this loss %">
                  <span class="var-loss-mtr-text">Total: <strong class="var-loss-pool-val">${consumptionDisplay}m</strong></span>
                </div>
              ` : `
                <div class="flex items-center justify-between text-slate-600">
                  <span class="var-loss-mtr-text" title="Pre-loss Base Chain for ${escapeHtml(classKey)} (${(cInfo && cInfo.baseChainMtr ? cInfo.baseChainMtr.toFixed(2) : '0')} Mtr)">
                    <strong class="var-loss-pool-val font-bold">${consumptionDisplay} Mtr</strong>
                  </span>
                  ${isOverridden ? `<span class="var-loss-status-tag badge badge-warning text-3xs" style="padding: 1px 4px;">Custom</span>` : ''}
                </div>
              `}
            </div>
          </div>
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

      // Ensure slider addition default and pin box loss are initialized if switching to a zipper category
      if (newCat === 'cz' || newCat === 'mz' || newCat === 'pz') {
        const groupQty = (group.variants || []).reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
        if (group.sliderAdditionPercent === undefined || !group.isSliderOverridden) {
          const getSliderDefault = window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage);
          const dynSliderAdd = getSliderDefault ? getSliderDefault(groupQty) : 8.0;
          group.sliderAdditionPercent = dynSliderAdd;
          group.sliderAddPercent = dynSliderAdd;
        }
        if (group.pinBoxLossPercent === undefined || !group.isPinBoxLossOverridden) {
          const relevantPinBoxQty = (window.CalculatorEngine && window.CalculatorEngine.getRelevantPinBoxQuantity)
            ? window.CalculatorEngine.getRelevantPinBoxQuantity(group.variants || [])
            : 0;
          const pinBoxScopeQty = relevantPinBoxQty > 0 ? relevantPinBoxQty : groupQty;
          group.pinBoxLossPercent = (window.CalculatorEngine && window.CalculatorEngine.getPinBoxDynamicLossPercentage)
            ? window.CalculatorEngine.getPinBoxDynamicLossPercentage(pinBoxScopeQty)
            : 8.0;
        }
        group.pinBoxPerZipper = 1;

        if (newCat === 'mz') {
          if (group.hBottomLossPercent === undefined || !group.isHBottomLossOverridden) {
            const mz3Variants = (group.variants || []).filter(v => {
              const sz = String((v && v.zipperSize) || '').trim();
              return sz.includes('3');
            });
            const mz3Qty = mz3Variants.reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
            const dynHBottomLoss = (window.CalculatorEngine && window.CalculatorEngine.getHBottomDynamicLossPercentage)
              ? window.CalculatorEngine.getHBottomDynamicLossPercentage(mz3Qty)
              : 8.0;
            group.hBottomLossPercent = dynHBottomLoss;
            group.mzParams = group.mzParams || {};
            group.mzParams.hBottomLossPercent = dynHBottomLoss;
          }
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

  // 2. Zipper Variant/Class Loss % Input (Dynamic Loss Override)
  const handleLossOverrideInput = (e) => {
    const groupId = e.target.getAttribute('data-group-id');
    const classKey = e.target.getAttribute('data-class');
    const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
    if (group && classKey) {
      group.classLossOverrides = group.classLossOverrides || {};
      if (e.target.value !== '') {
        const val = parseFloat(e.target.value);
        group.classLossOverrides[classKey] = isNaN(val) ? 0 : Math.max(0, val);
      } else {
        delete group.classLossOverrides[classKey];
      }
      try {
        updateClassLossDisplay(groupId);
      } catch (err) {
        console.error('Error updating class loss display:', err);
      }
      try {
        updateLiveCalculations();
      } catch (err) {
        console.error('Error updating live calculations:', err);
      }
    }
  };

  ['input', 'keyup', 'change', 'paste'].forEach(evtType => {
    container.querySelectorAll('.input-var-loss, .input-class-loss').forEach(input => {
      input.addEventListener(evtType, handleLossOverrideInput);
    });
  });

  // Legacy Category Loss % Input (if present)
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
        if (e.target.value !== '') {
          const val = parseFloat(e.target.value);
          group.isSliderOverridden = true;
          group.sliderAdditionPercent = !isNaN(val) ? Math.max(0, val) : 0;
          group.sliderAddPercent = group.sliderAdditionPercent;
        } else {
          // Clear / reset override to dynamic chart default
          group.isSliderOverridden = false;
          delete group.sliderAdditionPercent;
          delete group.sliderAddPercent;
          const getSliderDefault = window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage);
          const groupQty = (group.variants || []).reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
          const dynSliderAdd = getSliderDefault ? getSliderDefault(groupQty) : 8.0;
          group.sliderAdditionPercent = dynSliderAdd;
          group.sliderAddPercent = dynSliderAdd;
        }
        updateLiveCalculations();
      }
    });

    input.addEventListener('change', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group && e.target.value === '') {
        const getSliderDefault = window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage);
        const groupQty = (group.variants || []).reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
        const dynSliderAdd = getSliderDefault ? getSliderDefault(groupQty) : 8.0;
        group.isSliderOverridden = false;
        group.sliderAdditionPercent = dynSliderAdd;
        group.sliderAddPercent = dynSliderAdd;
        e.target.value = dynSliderAdd;
        updateLiveCalculations();
      }
    });
  });

  // 2b-2. Group Pin Box Loss % Input
  container.querySelectorAll('.input-group-pin-box').forEach(input => {
    input.addEventListener('input', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group) {
        group.isPinBoxLossOverridden = true;
        group.pinBoxLossPercent = e.target.value !== '' ? (parseFloat(e.target.value) || 0) : 0;
        updateLiveCalculations();
      }
    });
  });

  // 2b-3. Group H-Bottom Loss % Input
  container.querySelectorAll('.input-group-hbottom-loss').forEach(input => {
    input.addEventListener('input', (e) => {
      if (e.target.disabled) return;
      const groupId = e.target.getAttribute('data-group-id');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group) {
        if (e.target.value !== '') {
          const val = parseFloat(e.target.value);
          group.isHBottomLossOverridden = true;
          group.hBottomLossPercent = !isNaN(val) ? val : 0;
          group.mzParams = group.mzParams || {};
          group.mzParams.hBottomLossPercent = !isNaN(val) ? val : 0;
        } else {
          group.isHBottomLossOverridden = false;
          delete group.hBottomLossPercent;
          if (group.mzParams) delete group.mzParams.hBottomLossPercent;
          const mz3Variants = (group.variants || []).filter(item => {
            const sz = String((item && item.zipperSize) || '').trim();
            return sz.includes('3');
          });
          const mz3Qty = mz3Variants.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
          const dynHBottomLoss = (window.CalculatorEngine && window.CalculatorEngine.getHBottomDynamicLossPercentage)
            ? window.CalculatorEngine.getHBottomDynamicLossPercentage(mz3Qty)
            : 8.0;
          group.hBottomLossPercent = dynHBottomLoss;
          group.mzParams = group.mzParams || {};
          group.mzParams.hBottomLossPercent = dynHBottomLoss;
        }
        updateLiveCalculations();
      }
    });
  });

  // 2c. Group Dynamic MZ Parameters Input
  container.querySelectorAll('.input-mz-param').forEach(input => {
    input.addEventListener('input', (e) => {
      if (e.target.disabled) return;
      const groupId = e.target.getAttribute('data-group-id');
      const paramName = e.target.getAttribute('data-param');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group && paramName) {
        if (paramName === 'hBottomLossPercent') {
          if (e.target.value !== '') {
            const val = parseFloat(e.target.value);
            group.isHBottomLossOverridden = true;
            group.hBottomLossPercent = !isNaN(val) ? val : 0;
            group.mzParams = group.mzParams || {};
            group.mzParams.hBottomLossPercent = !isNaN(val) ? val : 0;
          } else {
            group.isHBottomLossOverridden = false;
            delete group.hBottomLossPercent;
            if (group.mzParams) delete group.mzParams.hBottomLossPercent;
            const mz3Variants = (group.variants || []).filter(item => {
              const sz = String((item && item.zipperSize) || '').trim();
              return sz.includes('3');
            });
            const mz3Qty = mz3Variants.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
            const dynHBottomLoss = (window.CalculatorEngine && window.CalculatorEngine.getHBottomDynamicLossPercentage)
              ? window.CalculatorEngine.getHBottomDynamicLossPercentage(mz3Qty)
              : 8.0;
            group.hBottomLossPercent = dynHBottomLoss;
            group.mzParams = group.mzParams || {};
            group.mzParams.hBottomLossPercent = dynHBottomLoss;
          }
        } else {
          group.mzParams = group.mzParams || {};
          if (e.target.value !== '') {
            group.mzParams[paramName] = parseFloat(e.target.value);
          } else {
            delete group.mzParams[paramName];
          }
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

  // 2d-2. Group Special U-Top Requirement Checkbox (CZ#5 only)
  container.querySelectorAll('.input-cz-utop-special').forEach(input => {
    input.addEventListener('change', (e) => {
      const groupId = e.target.getAttribute('data-group-id');
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      if (group) {
        const isChecked = Boolean(e.target.checked);
        group.isSpecialUTopOrder = isChecked;
        group.czParams = group.czParams || {};
        group.czParams.isSpecialUTopOrder = isChecked;
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
        const oldSize = v.zipperSize;
        v.zipperSize = e.target.value;
        if (group.classLossOverrides && window.CalculatorEngine && window.CalculatorEngine.getVariantZipperClass) {
          const oldClass = window.CalculatorEngine.getVariantZipperClass(group.category, v.zipperType, oldSize);
          const newClass = window.CalculatorEngine.getVariantZipperClass(group.category, v.zipperType, v.zipperSize);
          if (oldClass && group.classLossOverrides[oldClass] !== undefined) delete group.classLossOverrides[oldClass];
          if (newClass && group.classLossOverrides[newClass] !== undefined) delete group.classLossOverrides[newClass];
        }
        if (group.category === 'wire') {
          if (v.zipperSize === '#3' && (group.lossPercent === 5.0 || group.lossPercent === undefined)) {
            group.lossPercent = 4.0;
          } else if (v.zipperSize !== '#3' && (group.lossPercent === 4.0 || group.lossPercent === undefined)) {
            group.lossPercent = 5.0;
          }
        }
        if ((group.category === 'mz' || group.category === 'metal') && !group.isHBottomLossOverridden && window.CalculatorEngine && window.CalculatorEngine.getHBottomDynamicLossPercentage) {
          const mz3Variants = (group.variants || []).filter(item => {
            const sz = String((item && item.zipperSize) || '').trim();
            return sz.includes('3');
          });
          const mz3Qty = mz3Variants.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
          const dynHBottomLoss = window.CalculatorEngine.getHBottomDynamicLossPercentage(mz3Qty);
          group.hBottomLossPercent = dynHBottomLoss;
          group.mzParams = group.mzParams || {};
          group.mzParams.hBottomLossPercent = dynHBottomLoss;
        }
        if (window.BOMRules) {
          v.allowance = window.BOMRules.getSuggestedAllowance(group.category, v.zipperSize, v.lengthUnit, v.zipperType);
          v.bomRows = window.BOMRules.generateSuggestedBOM(v, group.category);
        }
        rebuildAndRenderAll();
      }
    });
  });

  // 6. Variant Field Inputs (Live Calculation Updates & Real-time Keystroke Tracking)
  const handleVariantDimensionInput = (e) => {
    const target = e.target;
    if (!target) return;
    const { groupId, varId } = getEventGroupAndVarIds(target);
    const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
    const v = findVariant(groupId, varId);
    if (!v || !group) return;

    if (target.classList.contains('input-var-qty')) {
      v.quantity = target.value !== '' ? (parseFloat(target.value) || 0) : '';
      if (!group.isSliderOverridden) {
        const getSliderDefault = window.CalculatorEngine && (window.CalculatorEngine.getSliderDynamicAddPercentage || window.CalculatorEngine.getSliderDynamicLossPercentage);
        if (getSliderDefault) {
          const groupQty = (group.variants || []).reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
          const dynSliderAdd = getSliderDefault(groupQty);
          group.sliderAdditionPercent = dynSliderAdd;
          group.sliderAddPercent = dynSliderAdd;
          const sliderInput = document.getElementById(`input-slider-${group.id}`);
          if (sliderInput) {
            sliderInput.value = dynSliderAdd;
          }
        }
      }
      if (!group.isPinBoxLossOverridden && window.CalculatorEngine && window.CalculatorEngine.getPinBoxDynamicLossPercentage) {
        const relevantPinBoxQty = window.CalculatorEngine.getRelevantPinBoxQuantity 
          ? window.CalculatorEngine.getRelevantPinBoxQuantity(group.variants || []) 
          : 0;
        const groupQty = (group.variants || []).reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
        const pinBoxScopeQty = relevantPinBoxQty > 0 ? relevantPinBoxQty : groupQty;
        const dynPinBoxLoss = window.CalculatorEngine.getPinBoxDynamicLossPercentage(pinBoxScopeQty);
        group.pinBoxLossPercent = dynPinBoxLoss;
        const pinBoxInput = document.getElementById(`input-pin-box-${group.id}`);
        if (pinBoxInput) {
          pinBoxInput.value = dynPinBoxLoss;
        }
      }
      if ((group.category === 'mz' || group.category === 'metal') && !group.isHBottomLossOverridden && window.CalculatorEngine && window.CalculatorEngine.getHBottomDynamicLossPercentage) {
        const mz3Variants = (group.variants || []).filter(item => {
          const sz = String((item && item.zipperSize) || '').trim();
          return sz.includes('3');
        });
        if (mz3Variants.length > 0) {
          const mz3Qty = mz3Variants.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
          const dynHBottomLoss = window.CalculatorEngine.getHBottomDynamicLossPercentage(mz3Qty);
          group.hBottomLossPercent = dynHBottomLoss;
          group.mzParams = group.mzParams || {};
          group.mzParams.hBottomLossPercent = dynHBottomLoss;
          const hBottomInput = document.getElementById(`mz-hbottom-loss-${group.id}`);
          if (hBottomInput && !hBottomInput.disabled) {
            hBottomInput.value = dynHBottomLoss;
          }
        }
      }
    } else if (target.classList.contains('input-var-length')) {
      v.length = target.value !== '' ? (parseFloat(target.value) || 0) : '';
    }

    // Clear manual class override if any so dynamic chart bracket recalculation immediately reflects typed quantity/length
    if (group.classLossOverrides && window.CalculatorEngine && window.CalculatorEngine.getVariantZipperClass) {
      const classKey = window.CalculatorEngine.getVariantZipperClass(v, group.category);
      if (classKey && group.classLossOverrides[classKey] !== undefined) {
        delete group.classLossOverrides[classKey];
      }
    }

    // 1. IMMEDIATELY update variant card loss % and Mtr displays on EVERY keystroke
    try {
      updateClassLossDisplay(groupId);
    } catch (err) {
      console.error('Error updating class loss display:', err);
    }

    // 2. Refresh live BOM calculation tables
    try {
      updateLiveCalculations();
    } catch (err) {
      console.error('Error updating live calculations:', err);
    }
  };

  ['input', 'keyup', 'change', 'paste'].forEach(evtType => {
    container.querySelectorAll('.input-var-length, .input-var-qty').forEach(input => {
      input.addEventListener(evtType, handleVariantDimensionInput);
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

  container.querySelectorAll('.input-var-type').forEach(select => {
    select.addEventListener('change', (e) => {
      const { groupId, varId } = getEventGroupAndVarIds(e.target);
      const group = appState.currentEstimate.categoryGroups.find(g => g.id === groupId);
      const v = findVariant(groupId, varId);
      if (v && group) {
        const oldType = v.zipperType;
        v.zipperType = e.target.value;
        if (group.classLossOverrides && window.CalculatorEngine && window.CalculatorEngine.getVariantZipperClass) {
          const oldClass = window.CalculatorEngine.getVariantZipperClass(group.category, oldType, v.zipperSize);
          const newClass = window.CalculatorEngine.getVariantZipperClass(group.category, v.zipperType, v.zipperSize);
          if (oldClass && group.classLossOverrides[oldClass] !== undefined) delete group.classLossOverrides[oldClass];
          if (newClass && group.classLossOverrides[newClass] !== undefined) delete group.classLossOverrides[newClass];
        }
        if (window.BOMRules) {
          v.allowance = window.BOMRules.getSuggestedAllowance(group.category, v.zipperSize, v.lengthUnit, v.zipperType);
          v.bomRows = window.BOMRules.generateSuggestedBOM(v, group.category);
        }
        if (!group.isPinBoxLossOverridden && window.CalculatorEngine && window.CalculatorEngine.getPinBoxDynamicLossPercentage) {
          const relevantPinBoxQty = window.CalculatorEngine.getRelevantPinBoxQuantity 
            ? window.CalculatorEngine.getRelevantPinBoxQuantity(group.variants || []) 
            : 0;
          const groupQty = (group.variants || []).reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
          const pinBoxScopeQty = relevantPinBoxQty > 0 ? relevantPinBoxQty : groupQty;
          group.pinBoxLossPercent = window.CalculatorEngine.getPinBoxDynamicLossPercentage(pinBoxScopeQty);
        }
        rebuildAndRenderAll();
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

  try {
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

    // 3. Update Zipper Class Loss displays across category groups
    if (Array.isArray(appState.currentEstimate.categoryGroups)) {
      appState.currentEstimate.categoryGroups.forEach(g => {
        updateClassLossDisplay(g.id);
      });
    }

    // 4. Update At-a-Glance Category BOM Parameter Previews
    updateCategoryParameterPreviews();
  } catch (err) {
    console.error('Error during updateLiveCalculations:', err);
  }
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

  // 3. Fallback: Return first available material from the active item / category group
  const activeGroupId = appState.activeItemId || appState.selectedCalcDetailsGroupId;
  if (activeGroupId && Array.isArray(lastCalc.categoryGroups)) {
    const activeGroup = lastCalc.categoryGroups.find(g => g.id === activeGroupId);
    if (activeGroup && activeGroup.materials && Array.isArray(activeGroup.materials.processedRows) && activeGroup.materials.processedRows.length > 0) {
      const first = activeGroup.materials.processedRows[0];
      const rowUniqueKey = first.uniqueKey || `${activeGroup.id}__${first.key || first.id}`;
      return {
        ...first,
        uniqueKey: rowUniqueKey,
        groupId: first.groupId || activeGroup.id,
        groupName: first.groupName || activeGroup.name,
        groupCategory: first.groupCategory || activeGroup.category,
        groupStyleName: first.groupStyleName || activeGroup.styleName,
        groupColor: first.groupColor || activeGroup.color
      };
    }
  }

  if (activeGroupId && Array.isArray(lastCalc.items)) {
    const activeItm = lastCalc.items.find(it => it.id === activeGroupId);
    if (activeItm && activeItm.materials && Array.isArray(activeItm.materials.processedRows) && activeItm.materials.processedRows.length > 0) {
      const first = activeItm.materials.processedRows[0];
      const rowUniqueKey = first.uniqueKey || `${activeItm.id}__${first.key || first.id}`;
      return {
        ...first,
        uniqueKey: rowUniqueKey,
        groupId: first.groupId || activeItm.id,
        groupName: first.groupName || activeItm.name,
        groupCategory: first.groupCategory || activeItm.category,
        groupStyleName: first.groupStyleName || activeItm.styleName,
        groupColor: first.groupColor || activeItm.color
      };
    }
  }

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
      const srcRow = { ...activeMaterial, ...src };
      const srcQtyFormatted = formatNumberPrecision(src.quantity, 4, srcRow);
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
    const sumParts = sources.map((s, idx) => {
      const sRow = { ...activeMaterial, ...s };
      return `Source ${idx + 1} [${escapeHtml(s.groupName)}]: ${formatNumberPrecision(s.quantity, 4, sRow)} ${escapeHtml(s.unit || unitLabel)}`;
    }).join(' + ');
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
    const primarySubtypeRow = groupRows.find(r => r.subtypeKey || (r.calculationDetail && r.calculationDetail.size));
    const defaultSubKey = primarySubtypeRow 
      ? (primarySubtypeRow.subtypeKey || primarySubtypeRow.calculationDetail.size)
      : 'default';

    groupRows.forEach(r => {
      const subKey = r.subtypeKey || (r.calculationDetail && r.calculationDetail.size) || defaultSubKey;
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
                ${(group.variants || []).length} Variant${(group.variants || []).length > 1 ? 's' : ''} &bull; Total Order: <strong>${(group.totalQuantity || 0).toLocaleString()} pcs</strong> &bull; Factory Loss: <strong>${renderGroupLossMeta(group)}</strong>
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
      items: [],
      categoryGroups: [],
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

    appState.activeItemId = null;
    appState.selectedCalcDetailsGroupId = null;
    appState.selectedMaterialKey = null;
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
