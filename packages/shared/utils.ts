import type { InventoryItem, StockTransaction } from './types';

export const calculateStockBalance = (
  item: InventoryItem,
  transactions: StockTransaction[]
): number => {
  const itemTransactions = transactions.filter(t => t.item_id === item.id);

  const stockIn = itemTransactions
    .filter(t => t.type === 'in')
    .reduce((sum, t) => sum + t.quantity, 0);

  const stockOut = itemTransactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + t.quantity, 0);

  return stockIn - stockOut;
};

export const isLowStock = (item: InventoryItem): boolean => {
  return item.current_stock <= item.min_threshold;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};