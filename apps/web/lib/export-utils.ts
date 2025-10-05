import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToExcel(data: any[], filename: string) {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Generate and download the file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(data: any[], filename: string) {
  const doc = new jsPDF('landscape');

  // Title
  doc.setFontSize(16);
  doc.text('Inventory Report', 14, 15);

  // Prepare table headers
  const headers = [
    ['Supplier', 'Item Name', 'Category', 'SKU', 'Unit', 'Current Stock', 'Min Threshold',
     'P1 Date', 'P1 Unit Price', 'P1 Qty', 'P1 Amount',
     'P2 Date', 'P2 Unit Price', 'P2 Qty', 'P2 Amount',
     'P3 Date', 'P3 Unit Price', 'P3 Qty', 'P3 Amount']
  ];

  // Prepare table data
  const tableData = data.map(row => [
    row.supplier,
    row.item_name,
    row.category,
    row.sku,
    row.unit,
    row.current_stock,
    row.min_threshold,
    row.purchase_1_date,
    `$${row.purchase_1_unit_price.toFixed(2)}`,
    row.purchase_1_quantity,
    `$${row.purchase_1_amount.toFixed(2)}`,
    row.purchase_2_date,
    `$${row.purchase_2_unit_price.toFixed(2)}`,
    row.purchase_2_quantity,
    `$${row.purchase_2_amount.toFixed(2)}`,
    row.purchase_3_date,
    `$${row.purchase_3_unit_price.toFixed(2)}`,
    row.purchase_3_quantity,
    `$${row.purchase_3_amount.toFixed(2)}`,
  ]);

  // Generate table
  autoTable(doc, {
    head: headers,
    body: tableData,
    startY: 25,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      7: { cellWidth: 20 },
      11: { cellWidth: 20 },
      15: { cellWidth: 20 },
    },
  });

  // Save the PDF
  doc.save(`${filename}.pdf`);
}

export function exportToCSV(data: any[], filename: string) {
  // Define headers
  const headers = [
    'Supplier', 'Item Name', 'Category', 'SKU', 'Unit', 'Current Stock', 'Min Threshold',
    'Purchase 1 Date', 'Purchase 1 Unit Price', 'Purchase 1 Quantity', 'Purchase 1 Amount',
    'Purchase 2 Date', 'Purchase 2 Unit Price', 'Purchase 2 Quantity', 'Purchase 2 Amount',
    'Purchase 3 Date', 'Purchase 3 Unit Price', 'Purchase 3 Quantity', 'Purchase 3 Amount'
  ];

  // Convert data to CSV format
  const csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach(row => {
    const values = [
      row.supplier,
      row.item_name,
      row.category,
      row.sku,
      row.unit,
      row.current_stock,
      row.min_threshold,
      row.purchase_1_date,
      row.purchase_1_unit_price.toFixed(2),
      row.purchase_1_quantity,
      row.purchase_1_amount.toFixed(2),
      row.purchase_2_date,
      row.purchase_2_unit_price.toFixed(2),
      row.purchase_2_quantity,
      row.purchase_2_amount.toFixed(2),
      row.purchase_3_date,
      row.purchase_3_unit_price.toFixed(2),
      row.purchase_3_quantity,
      row.purchase_3_amount.toFixed(2),
    ];
    csvRows.push(values.map(v => `"${v}"`).join(','));
  });

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
