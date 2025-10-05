'use client';

import { useEffect, useState } from 'react';
import { useInventoryStore } from '@/lib/stores/inventory';
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { isDemoMode } from '@/lib/demo-mode';
import { exportToExcel, exportToPDF, exportToCSV } from '@/lib/export-utils';

interface PurchaseRecord {
  date: string;
  unit_price: number;
  quantity: number;
  amount: number;
}

interface ReportRow {
  supplier: string;
  item_name: string;
  category: string;
  sku: string;
  unit: string;
  current_stock: number;
  min_threshold: number;
  purchase_1_date: string;
  purchase_1_unit_price: number;
  purchase_1_quantity: number;
  purchase_1_amount: number;
  purchase_2_date: string;
  purchase_2_unit_price: number;
  purchase_2_quantity: number;
  purchase_2_amount: number;
  purchase_3_date: string;
  purchase_3_unit_price: number;
  purchase_3_quantity: number;
  purchase_3_amount: number;
}

export default function ReportsView() {
  const { items, fetchItems } = useInventoryStore();
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (items.length > 0) {
      loadReportData();
    }
  }, [items]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const data: ReportRow[] = [];

      for (const item of items) {
        let purchases: PurchaseRecord[] = [];

        if (!isDemoMode()) {
          // Fetch last 3 purchases for this item from stock transactions
          const supabase = createClient();
          const { data: transactions, error } = await supabase
            .from('stock_transactions')
            .select('created_at, quantity, cost')
            .eq('item_id', item.id)
            .eq('type', 'in')
            .order('created_at', { ascending: false })
            .limit(3);

          if (error) {
            console.error('Error fetching transactions:', error);
          }

          purchases = (transactions || []).map(t => {
            const totalCost = t.cost || (item.cost_per_unit * t.quantity);
            const costPerUnit = t.cost ? (t.cost / t.quantity) : item.cost_per_unit;

            return {
              date: t.created_at,
              unit_price: costPerUnit,
              quantity: t.quantity,
              amount: totalCost
            };
          });

          // If no stock-in transactions found, generate sample data based on item creation date
          if (purchases.length === 0) {
            const itemCreated = new Date(item.created_at);
            purchases = [
              {
                date: itemCreated.toISOString(),
                unit_price: item.cost_per_unit,
                quantity: item.current_stock || 0,
                amount: item.cost_per_unit * (item.current_stock || 0)
              }
            ];
          }
        } else {
          // Demo mode: generate sample purchase data
          purchases = [
            {
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              unit_price: item.cost_per_unit,
              quantity: 50,
              amount: item.cost_per_unit * 50
            },
            {
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              unit_price: item.cost_per_unit * 0.95,
              quantity: 40,
              amount: item.cost_per_unit * 0.95 * 40
            },
            {
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              unit_price: item.cost_per_unit * 0.9,
              quantity: 60,
              amount: item.cost_per_unit * 0.9 * 60
            }
          ];
        }

        const row: ReportRow = {
          supplier: (item as any).suppliers?.name || 'N/A',
          item_name: item.name,
          category: item.category,
          sku: (item as any).sku || item.id.substring(0, 8).toUpperCase(),
          unit: item.unit,
          current_stock: item.current_stock,
          min_threshold: item.min_threshold,
          purchase_1_date: purchases[0]?.date ? new Date(purchases[0].date).toLocaleDateString() : 'N/A',
          purchase_1_unit_price: purchases[0]?.unit_price || 0,
          purchase_1_quantity: purchases[0]?.quantity || 0,
          purchase_1_amount: purchases[0]?.amount || 0,
          purchase_2_date: purchases[1]?.date ? new Date(purchases[1].date).toLocaleDateString() : 'N/A',
          purchase_2_unit_price: purchases[1]?.unit_price || 0,
          purchase_2_quantity: purchases[1]?.quantity || 0,
          purchase_2_amount: purchases[1]?.amount || 0,
          purchase_3_date: purchases[2]?.date ? new Date(purchases[2].date).toLocaleDateString() : 'N/A',
          purchase_3_unit_price: purchases[2]?.unit_price || 0,
          purchase_3_quantity: purchases[2]?.quantity || 0,
          purchase_3_amount: purchases[2]?.amount || 0,
        };

        data.push(row);
      }

      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(reportData, 'inventory-report');
  };

  const handleExportPDF = () => {
    exportToPDF(reportData, 'inventory-report');
  };

  const handleExportCSV = () => {
    exportToCSV(reportData, 'inventory-report');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory Report</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive inventory report with purchase history
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet size={20} />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText size={20} />
            Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileDown size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Threshold
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Purchase 1 Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                  Purchase 2 Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                  Purchase 3 Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sticky left-0 bg-white">
                    {row.supplier}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {row.item_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {row.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {row.sku}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {row.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {row.current_stock}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {row.min_threshold}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap bg-blue-50">
                    {row.purchase_1_date}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap bg-blue-50">
                    ${row.purchase_1_unit_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap bg-blue-50">
                    {row.purchase_1_quantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap bg-blue-50">
                    ${row.purchase_1_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap bg-green-50">
                    {row.purchase_2_date}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap bg-green-50">
                    ${row.purchase_2_unit_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap bg-green-50">
                    {row.purchase_2_quantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap bg-green-50">
                    ${row.purchase_2_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap bg-yellow-50">
                    {row.purchase_3_date}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap bg-yellow-50">
                    ${row.purchase_3_unit_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap bg-yellow-50">
                    {row.purchase_3_quantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap bg-yellow-50">
                    ${row.purchase_3_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reportData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No inventory data available for report.
        </div>
      )}
    </div>
  );
}
