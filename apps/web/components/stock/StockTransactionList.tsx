'use client';

import { useEffect, useState } from 'react';
import { useStockStore } from '@/lib/stores/stock';
import { formatDateTime } from '@restaurant-inventory/shared';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import StockForm from './StockForm';

export default function StockTransactionList() {
  const { transactions, loading, error, fetchTransactions } = useStockStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-md p-4">
        <p className="text-danger-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Stock Transactions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-primary-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={20} />
          Add Transaction
        </button>
      </div>

      {showForm && (
        <StockForm onClose={() => setShowForm(false)} />
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`bg-white p-4 rounded-lg shadow border-l-4 ${
              transaction.type === 'in' ? 'border-l-success-500' : 'border-l-danger-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {transaction.type === 'in' ? (
                  <ArrowUp className="w-5 h-5 text-success-500" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-danger-500" />
                )}
                <span className={`font-medium ${
                  transaction.type === 'in' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {transaction.reason}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {(transaction as any).inventory_items?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Quantity: {transaction.quantity} {(transaction as any).inventory_items?.unit}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                <span>By: {(transaction as any).user_profiles?.email}</span>
                <span>{formatDateTime(transaction.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {(transaction as any).inventory_items?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {transaction.type === 'in' ? (
                        <ArrowUp className="w-4 h-4 text-success-500 mr-2" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-danger-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        transaction.type === 'in' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity} {(transaction as any).inventory_items?.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {transaction.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(transaction as any).user_profiles?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(transaction.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions found. Add your first transaction to get started.
        </div>
      )}
    </div>
  );
}