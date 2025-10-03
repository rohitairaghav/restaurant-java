'use client';

import { useEffect, useState } from 'react';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import { formatCurrency, isLowStock } from '@restaurant-inventory/shared';
import { Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';
import InventoryForm from './InventoryForm';

export default function InventoryList() {
  const { items, loading, error, fetchItems, deleteItem, checkItemHasTransactions, checkItemHasAlerts } = useInventoryStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemsWithTransactions, setItemsWithTransactions] = useState<Set<string>>(new Set());
  const [itemsWithAlerts, setItemsWithAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Check which items have transactions and alerts
  useEffect(() => {
    const checkDependencies = async () => {
      const itemsWithTxns = new Set<string>();
      const itemsWithAlertsSet = new Set<string>();
      
      for (const item of items) {
        const [hasTransactions, hasAlerts] = await Promise.all([
          checkItemHasTransactions(item.id),
          checkItemHasAlerts(item.id)
        ]);
        
        if (hasTransactions) {
          itemsWithTxns.add(item.id);
        }
        if (hasAlerts) {
          itemsWithAlertsSet.add(item.id);
        }
      }
      
      setItemsWithTransactions(itemsWithTxns);
      setItemsWithAlerts(itemsWithAlertsSet);
    };

    if (items.length > 0) {
      checkDependencies();
    }
  }, [items, checkItemHasTransactions, checkItemHasAlerts]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id);
    const itemName = item?.name || 'this item';
    
    // Check if item has transactions or alerts
    const hasTransactions = itemsWithTransactions.has(id);
    const hasAlerts = itemsWithAlerts.has(id);
    
    if (hasTransactions && hasAlerts) {
      alert(`Cannot delete "${itemName}" because it has stock transactions and alerts. Please delete all related stock transactions and alerts first.`);
      return;
    } else if (hasTransactions) {
      alert(`Cannot delete "${itemName}" because it has stock transactions. Please delete all related stock transactions first from the Stock Management page.`);
      return;
    } else if (hasAlerts) {
      alert(`Cannot delete "${itemName}" because it has alerts. Please delete all related alerts first from the Alerts page.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      await deleteItem(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

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
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-danger-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-danger-800">Error</h3>
            <p className="text-danger-600 mt-1">{error}</p>
            {error.includes('stock transactions') && error.includes('alerts') && (
              <p className="text-danger-600 mt-2 text-sm">
                To delete this item, you must first delete all related stock transactions from the Stock Management page and all related alerts from the Alerts page.
              </p>
            )}
            {error.includes('stock transactions') && !error.includes('alerts') && (
              <p className="text-danger-600 mt-2 text-sm">
                To delete this item, you must first delete all related stock transactions from the Stock Management page.
              </p>
            )}
            {error.includes('alerts') && !error.includes('stock transactions') && (
              <p className="text-danger-600 mt-2 text-sm">
                To delete this item, you must first delete all related alerts from the Alerts page.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Inventory Items</h2>
        {user?.role === 'manager' && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-primary-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Add Item
          </button>
        )}
      </div>

      {showForm && (
        <InventoryForm
          item={editingItem}
          onClose={handleCloseForm}
        />
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-white p-4 rounded-lg shadow border-l-4 ${
              isLowStock(item)
                ? item.current_stock <= 0
                  ? 'border-l-danger-500'
                  : 'border-l-warning-500'
                : 'border-l-success-500'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold truncate">{item.name}</h3>
                  {isLowStock(item) && (
                    <AlertTriangle
                      size={20}
                      className={item.current_stock <= 0 ? 'text-danger-500' : 'text-warning-500'}
                    />
                  )}
                </div>

                <div className="space-y-1 text-sm sm:text-base">
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <span className="text-gray-600">Category: {item.category}</span>
                    <span className="text-gray-600">Unit: {item.unit}</span>
                  </div>

                  <p className="text-gray-600">
                    Cost per unit: {formatCurrency(item.cost_per_unit)}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm text-gray-500">Current Stock:</span>
                    <span className={`font-medium ${
                      isLowStock(item)
                        ? item.current_stock <= 0
                          ? 'text-danger-600'
                          : 'text-warning-600'
                        : 'text-success-600'
                    }`}>
                      {item.current_stock} {item.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      (Min: {item.min_threshold} {item.unit})
                    </span>
                  </div>
                </div>
              </div>

              {user?.role === 'manager' && (
                <div className="flex sm:flex-col gap-2 self-start">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 sm:flex-none p-3 sm:p-2 text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200 sm:border-0 transition-colors"
                  >
                    <Edit size={18} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={itemsWithTransactions.has(item.id) || itemsWithAlerts.has(item.id)}
                    title={
                      itemsWithTransactions.has(item.id) && itemsWithAlerts.has(item.id)
                        ? 'Cannot delete: Item has stock transactions and alerts'
                        : itemsWithTransactions.has(item.id)
                        ? 'Cannot delete: Item has stock transactions'
                        : itemsWithAlerts.has(item.id)
                        ? 'Cannot delete: Item has alerts'
                        : 'Delete item'
                    }
                    className={`flex-1 sm:flex-none p-3 sm:p-2 rounded-lg border sm:border-0 transition-colors ${
                      itemsWithTransactions.has(item.id) || itemsWithAlerts.has(item.id)
                        ? 'text-gray-400 cursor-not-allowed bg-gray-50 border-gray-200'
                        : 'text-danger-600 hover:bg-danger-50 border-danger-200'
                    }`}
                  >
                    <Trash2 size={18} className="mx-auto" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No inventory items found. Add your first item to get started.
          </div>
        )}
      </div>
    </div>
  );
}