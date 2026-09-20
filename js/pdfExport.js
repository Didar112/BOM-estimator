/**
 * PDF Export Module for Zipper BOM Calculator
 * Generates a high-quality, professional multi-category group manufacturing quotation / BOM sheet
 * using client-side jsPDF and jsPDF-AutoTable.
 */

/**
 * Format numbers for PDF output without broken Unicode characters
 * @param {number} num 
 * @param {number} [decimals=2] 
 * @returns {string}
 */
function formatPDFCurrency(num, decimals = 2) {
  const val = Number(num);
  if (isNaN(val)) return 'BDT 0.00';
  return 'BDT ' + val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format factory category label
 * @param {string} cat 
 * @returns {string}
 */
function formatCategoryLabel(cat) {
  const c = String(cat || '').toLowerCase().trim();
  if (c === 'cz' || c === 'nylon') return 'Nylon Zipper (CZ)';
  if (c === 'mz' || c === 'metal') return 'Metal Zipper (MZ)';
  if (c === 'wire') return 'Brass / Metal Wire (WIRE)';
  if (c === 'pz' || c === 'plastic') return 'Plastic Zipper (PZ)';
  return 'Nylon Zipper (CZ)';
}

/**
 * Format string label for display (e.g. 'closed_end' -> 'Closed End')
 * @param {string} str 
 * @returns {string}
 */
function formatLabel(str) {
  if (!str) return '';
  return str
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Generate and download a professional PDF report from an estimate calculation
 * @param {Object} estimateState - Current or saved estimate data
 * @param {Object} calculationResult - Output of calculateFullEstimate()
 */
function exportEstimateToPDF(estimateState, calculationResult) {
  if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    alert('PDF generation library is not loaded. Please check your internet connection.');
    return;
  }

  const { jsPDF } = window.jspdf || window;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const categoryGroups = (calculationResult && Array.isArray(calculationResult.categoryGroups))
    ? calculationResult.categoryGroups
    : [];

  const aggregatedMaterials = (calculationResult && calculationResult.aggregatedMaterials) ? calculationResult.aggregatedMaterials : {};
  const totals = calculationResult ? calculationResult.totals : {};
  const labor = calculationResult ? calculationResult.labor : {};
  const overhead = calculationResult ? calculationResult.overhead : {};
  const otherCosts = calculationResult ? calculationResult.otherCosts : {};

  const estimateName = estimateState.name || estimateState.styleName || `Zipper BOM Estimate`;
  const estimateRef = estimateState.reference || ('EST-' + Math.floor(1000 + Math.random() * 9000));
  const calcDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Color Palette Constants
  const COLOR_NAVY_PRIMARY = [30, 58, 138]; // Blue 900
  const COLOR_NAVY_DARK = [15, 23, 42];    // Slate 900
  const COLOR_TEXT_DARK = [30, 41, 59];     // Slate 800
  const COLOR_TEXT_MUTED = [100, 116, 139]; // Slate 500
  const COLOR_BG_LIGHT = [248, 250, 252];   // Slate 50
  const COLOR_BORDER = [226, 232, 240];     // Slate 200

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 14;
  const usableWidth = pageWidth - (marginX * 2); // 182mm
  let currentY = 14;

  // ==================== 1. HEADER SECTION ====================
  doc.setFillColor(...COLOR_NAVY_PRIMARY);
  doc.rect(marginX, currentY, usableWidth, 22, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ZIPPER BOM & PRODUCTION COST ESTIMATE', marginX + 6, currentY + 8.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Multi-Category Group Factory Calculation Sheet | Bangladeshi Factory Edition`, marginX + 6, currentY + 15.5);

  // Reference & Date Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Ref: ${estimateRef}`, pageWidth - marginX - 6, currentY + 8.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${calcDate}`, pageWidth - marginX - 6, currentY + 15.5, { align: 'right' });

  currentY += 26;

  // ==================== 2. ESTIMATE OVERVIEW ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_NAVY_PRIMARY);
  doc.text(estimateName, marginX, currentY);

  currentY += 3.5;

  const totalOrderPcs = totals.quantity || 0;
  const groupCount = categoryGroups.length;

  const orderOverviewData = [
    [
      { content: 'Category Groups:', styles: { fontStyle: 'bold', textColor: COLOR_TEXT_MUTED } },
      { content: `${groupCount} Independent Group(s)`, styles: { fontStyle: 'bold' } },
      { content: 'Total Order Volume:', styles: { fontStyle: 'bold', textColor: COLOR_TEXT_MUTED } },
      { content: `${totalOrderPcs.toLocaleString('en-US')} pcs`, styles: { fontStyle: 'bold', textColor: COLOR_NAVY_PRIMARY } }
    ]
  ];

  doc.autoTable({
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: usableWidth,
    body: orderOverviewData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: COLOR_TEXT_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 34, fillColor: COLOR_BG_LIGHT },
      1: { cellWidth: 57 },
      2: { cellWidth: 36, fillColor: COLOR_BG_LIGHT },
      3: { cellWidth: 55 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // ==================== 3. CATEGORY GROUPS & VARIANTS ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_NAVY_PRIMARY);
  doc.text('1. CATEGORY GROUPS & PRODUCT VARIANTS', marginX, currentY);

  currentY += 2.5;

  const variantTableHeaders = [
    ['Group', '#', 'Variant Title', 'Category', 'Size / Type', 'Length', 'Order Qty (pcs)']
  ];

  const variantTableRows = [];

  categoryGroups.forEach((g, gIdx) => {
    const catLabel = formatCategoryLabel(g.category);
    const variants = Array.isArray(g.variants) ? g.variants : [];

    variants.forEach((v, vIdx) => {
      variantTableRows.push([
        `Group ${gIdx + 1}`,
        vIdx + 1,
        v.name || `Variant ${vIdx + 1}`,
        catLabel,
        v.zipperSize || '#5',
        `${v.length || 0} ${v.lengthUnit || 'inch'}`,
        Number(v.quantity || 0).toLocaleString('en-US')
      ]);
    });
  });

  // Total Quantity Row
  variantTableRows.push([
    { content: '', colSpan: 5, styles: { fillColor: [241, 245, 249] } },
    { content: 'Total Order Quantity:', styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: COLOR_NAVY_PRIMARY } },
    { content: `${totalOrderPcs.toLocaleString('en-US')} pcs`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: COLOR_NAVY_PRIMARY } }
  ]);

  doc.autoTable({
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: usableWidth,
    head: variantTableHeaders,
    body: variantTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2.2
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLOR_TEXT_DARK,
      cellPadding: 2,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 40, fontStyle: 'bold' },
      3: { cellWidth: 36 },
      4: { cellWidth: 32 },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // ==================== 4. CONSOLIDATED MERGED BOM ====================
  if (currentY > 210) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_NAVY_PRIMARY);
  doc.text('2. CONSOLIDATED BILL OF MATERIALS (MERGED BOM)', marginX, currentY);

  currentY += 2.5;

  const aggHeaders = [
    ['#', 'Component', 'Material / Specification', 'Groups', 'Unit', 'Total Req. Qty']
  ];

  const aggRows = (aggregatedMaterials.processedRows || []).map((row, idx) => {
    const totalQty = window.CalculatorEngine ? 
      window.CalculatorEngine.formatQuantity(row.totalQuantity, 4) : 
      String(row.totalQuantity || 0);

    const groupsLabel = (Array.isArray(row.groupNames) && row.groupNames.length > 0)
      ? row.groupNames.join(', ')
      : (Array.isArray(row.usedInCategories) ? row.usedInCategories.join(', ') : 'All');

    return [
      idx + 1,
      row.component || '',
      row.materialName || row.specification || '',
      groupsLabel,
      row.unit || '',
      totalQty
    ];
  });

  doc.autoTable({
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: usableWidth,
    head: aggHeaders,
    body: aggRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_NAVY_PRIMARY,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2.2
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLOR_TEXT_DARK,
      cellPadding: 2,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 30, fontSize: 7 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: COLOR_BG_LIGHT
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // ==================== 5. FOOTER ====================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Rule line
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(marginX, 282, pageWidth - marginX, 282);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text(
      '* NOTICE: Generated for material planning and manufacturing requirements based on factory allowances.',
      marginX,
      286
    );

    doc.setFont('helvetica', 'normal');
    doc.text(
      `Zipper BOM Calculator | Page ${i} of ${totalPages}`,
      pageWidth - marginX,
      286,
      { align: 'right' }
    );
  }

  const safeName = estimateName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  doc.save(`zipper_bom_estimate_${safeName}_${Date.now()}.pdf`);
}


// Export for global access in Vanilla JS
if (typeof window !== 'undefined') {
  window.PDFExportModule = {
    exportEstimateToPDF,
    formatCategoryLabel
  };
}
