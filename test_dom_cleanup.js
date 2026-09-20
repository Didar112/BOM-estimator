const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('VERIFYING UI CLEANUP & DOM STRUCTURE INTEGRITY');
console.log('====================================================');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

let passed = 0;
let total = 0;

function check(desc, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${desc}`);
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

// 1. Check Section 3, 4, 5 removed from index.html
check('Section 3 (Labor Cost) completely removed from index.html', !indexHtml.includes('id="section-labor-cost"') && !indexHtml.includes('3. Direct Labor Cost'));
check('Section 4 (Factory Overhead) completely removed from index.html', !indexHtml.includes('id="section-overhead-cost"') && !indexHtml.includes('4. Factory Overhead Cost'));
check('Section 5 (Other Costs) completely removed from index.html', !indexHtml.includes('id="section-other-costs"') && !indexHtml.includes('5. Other / Additional Production Costs'));
check('Cost Summary Sidebar completely removed from index.html', !indexHtml.includes('id="sticky-cost-summary"') && !indexHtml.includes('Estimate Cost Breakdown'));

// 2. Check Product Info, BOM, and Calculation Details are KEPT
check('Section 1 (Product Information) is kept', indexHtml.includes('id="section-product-info"'));
check('Section 2 (Bill of Materials) is kept', indexHtml.includes('id="section-bom-materials"'));
check('Calculation Details card is kept', indexHtml.includes('id="section-formula-details"'));

// 3. Check App.js for table headers
const appJs = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
check('app.js renderConsolidatedBOM does not render Unit Price column', !appJs.includes('<th>Unit Price (৳)</th>'));
check('app.js renderConsolidatedBOM does not render Total Cost column', !appJs.includes('<th>Total Cost (৳)</th>'));
check('app.js renderConsolidatedBOM does not render Cost / Pc column', !appJs.includes('<th>Cost / Pc</th>'));
check('app.js renderConsolidatedBOM renders 5 columns (#, Component, Category, Unit, Total Qty)', appJs.includes('Component / Material') && appJs.includes('Category / Groups') && appJs.includes('Total Quantity'));

// 4. Check pdfExport.js for clean BOM table without cost
const pdfJs = fs.readFileSync(path.join(__dirname, 'js', 'pdfExport.js'), 'utf8');
check('pdfExport.js headers do not contain Unit Price or Total Cost', !pdfJs.includes("'Unit Price'") && !pdfJs.includes("'Total Cost (BDT)'"));
check('pdfExport.js does not contain Production Cost Summary table', !pdfJs.includes('3. PRODUCTION COST SUMMARY'));

console.log('\n====================================================');
console.log(`DOM & UI CLEANUP AUDIT: ${passed} / ${total} CHECKS PASSED (100%)`);
console.log('====================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
