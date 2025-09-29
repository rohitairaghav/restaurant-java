import * as React from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './lib/stores/auth';

// Constants from web app
const INVENTORY_CATEGORIES = [
  'Vegetables', 'Fruits', 'Meat', 'Seafood', 'Dairy', 'Grains',
  'Spices', 'Beverages', 'Cleaning Supplies', 'Other'
];

const UNITS = [
  'kg', 'g', 'lbs', 'oz', 'liters', 'ml', 'pieces', 'boxes', 'cans', 'bottles'
];

const TRANSACTION_REASONS = {
  in: ['purchase', 'delivery'],
  out: ['sale', 'waste', 'transfer']
};

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  min_threshold: number;
  supplier_id?: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

interface StockTransaction {
  id: string;
  item_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: 'purchase' | 'delivery' | 'sale' | 'waste' | 'transfer';
  notes?: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
}

interface AppState {
  activeTab: string;
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  showAddModal: boolean;
  showAddInventoryModal: boolean;
  showUpdateModal: boolean;
  selectedItem: InventoryItem | null;
  loading: boolean;
  error: string | null;
  showLoginModal: boolean;
}

interface AppProps {
  user?: any;
  onSignOut?: () => void;
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      activeTab: 'inventory',
      inventory: [
        {
          id: '1',
          name: 'Fresh Carrots',
          category: 'Vegetables',
          unit: 'kg',
          cost_per_unit: 2.50,
          current_stock: 120,
          min_threshold: 30,
          restaurant_id: 'demo-restaurant',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Premium Beef',
          category: 'Meat',
          unit: 'kg',
          cost_per_unit: 25.00,
          current_stock: 45,
          min_threshold: 50,
          restaurant_id: 'demo-restaurant',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Whole Milk',
          category: 'Dairy',
          unit: 'liters',
          cost_per_unit: 1.20,
          current_stock: 0,
          min_threshold: 20,
          restaurant_id: 'demo-restaurant',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ],
      transactions: [
        {
          id: 't1',
          item_id: '1',
          type: 'in',
          quantity: 50,
          reason: 'delivery',
          notes: 'Weekly delivery from supplier',
          user_id: 'user-manager',
          restaurant_id: 'demo-restaurant',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 't2',
          item_id: '2',
          type: 'out',
          quantity: 15,
          reason: 'sale',
          notes: 'Used for dinner service',
          user_id: 'user-kitchen',
          restaurant_id: 'demo-restaurant',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 't3',
          item_id: '3',
          type: 'in',
          quantity: 25,
          reason: 'purchase',
          notes: 'Emergency restock',
          user_id: 'user-staff',
          restaurant_id: 'demo-restaurant',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ],
      showAddModal: false,
      showAddInventoryModal: false,
      showUpdateModal: false,
      selectedItem: null,
      loading: false,
      error: null,
      showLoginModal: false
    };
  }

  async componentDidMount() {
    await this.fetchInventoryItems();
    await this.fetchTransactions();
  }

  fetchInventoryItems = async () => {
    this.setState({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*, suppliers(name)')
        .order('name');

      if (error) throw error;
      this.setState({ inventory: data || [], loading: false });
    } catch (error: any) {
      this.setState({ error: error.message, loading: false });
    }
  };

  fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_transactions')
        .select(`
          *,
          inventory_items(name, unit),
          user_profiles(email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      this.setState({ transactions: data || [] });
    } catch (error: any) {
      this.setState({ error: error.message });
    }
  };

  setActiveTab = (tab: string) => {
    this.setState({ activeTab: tab });
  };

  updateStock = async (itemId: string, quantity: number, type: 'in' | 'out', reason: 'purchase' | 'delivery' | 'sale' | 'waste' | 'transfer', notes?: string) => {
    this.setState({ loading: true, error: null });
    try {
      // Create the stock transaction
      const transactionData = {
        item_id: itemId,
        type,
        quantity,
        reason,
        notes: notes || `Mobile ${type === 'in' ? 'stock in' : 'stock out'}`,
        user_id: 'mobile-user',
        restaurant_id: 'demo-restaurant'
      };

      const { data: transactionResult, error: transactionError } = await supabase
        .from('stock_transactions')
        .insert(transactionData)
        .select(`
          *,
          inventory_items(name, unit),
          user_profiles(email)
        `)
        .single();

      if (transactionError) throw transactionError;

      // Update the inventory item stock
      const item = this.state.inventory.find(i => i.id === itemId);
      if (item) {
        const newStock = type === 'in' ? item.current_stock + quantity : item.current_stock - quantity;
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ current_stock: Math.max(0, newStock) })
          .eq('id', itemId);

        if (updateError) throw updateError;
      }

      // Refresh the data
      await this.fetchInventoryItems();
      await this.fetchTransactions();

      this.setState({
        showUpdateModal: false,
        selectedItem: null,
        loading: false
      });
    } catch (error: any) {
      this.setState({ error: error.message, loading: false });
    }
  };

  addNewItem = async (name: string, category: string, unit: string, costPerUnit: number, minThreshold: number, supplierId?: string) => {
    this.setState({ loading: true, error: null });
    try {
      const itemData = {
        name,
        category,
        unit,
        cost_per_unit: costPerUnit,
        current_stock: 0, // New items start with 0 stock, just like web app
        min_threshold: minThreshold,
        supplier_id: supplierId || null,
        restaurant_id: 'demo-restaurant'
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(itemData)
        .select('*, suppliers(name)')
        .single();

      if (error) throw error;

      // Refresh the inventory items
      await this.fetchInventoryItems();

      this.setState({
        showAddInventoryModal: false,
        loading: false
      });
    } catch (error: any) {
      this.setState({ error: error.message, loading: false });
    }
  };

  getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) return { text: '❌ Out of Stock', color: '#ef4444' };
    if (item.current_stock <= item.min_threshold) return { text: '⚠️ Low Stock', color: '#f59e0b' };
    return { text: '✅ In Stock', color: '#10b981' };
  };

  getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'Vegetables': '🥕',
      'Fruits': '🍎',
      'Meat': '🥩',
      'Seafood': '🐟',
      'Dairy': '🧀',
      'Grains': '🌾',
      'Spices': '🌶️',
      'Beverages': '🥤',
      'Cleaning Supplies': '🧽',
      'Other': '📦'
    };
    return emojiMap[category] || '📦';
  };

  formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    return `${diffInHours} hours ago`;
  };

  render() {
    const { activeTab, inventory, transactions, showAddModal, showUpdateModal, selectedItem } = this.state;

    const containerStyle = {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column' as const,
    };

    const headerStyle = {
      backgroundColor: '#2563eb',
      paddingTop: '60px',
      paddingBottom: '20px',
      paddingLeft: '20px',
      paddingRight: '20px',
      textAlign: 'center' as const,
    };

    const titleStyle = {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '4px',
      margin: '0',
    };

    const subtitleStyle = {
      fontSize: '14px',
      color: '#bfdbfe',
      margin: '0',
    };

    const tabContainerStyle = {
      display: 'flex',
      flexDirection: 'row' as const,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
    };

    const tabStyle = {
      flex: 1,
      padding: '15px',
      textAlign: 'center' as const,
      border: 'none',
      borderBottom: '2px solid transparent',
      backgroundColor: 'transparent',
      cursor: 'pointer',
    };

    const activeTabStyle = {
      borderBottomColor: '#2563eb',
    };

    const tabTextStyle = {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '500',
    };

    const activeTabTextStyle = {
      color: '#2563eb',
      fontWeight: 'bold',
    };

    const contentStyle = {
      flex: 1,
      padding: '16px',
      overflowY: 'auto' as const,
    };

    const sectionTitleStyle = {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '16px',
      margin: '0 0 16px 0',
    };

    const cardStyle = {
      backgroundColor: '#ffffff',
      padding: '16px',
      marginBottom: '12px',
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    };

    const alertCardStyle = {
      borderLeft: '4px solid #f59e0b',
    };

    const criticalCardStyle = {
      borderLeft: '4px solid #ef4444',
    };

    const cardTitleStyle = {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '4px',
      margin: '0 0 4px 0',
    };

    const cardSubtitleStyle = {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '2px',
      margin: '0 0 2px 0',
    };

    const cardStatusStyle = {
      fontSize: '12px',
      fontWeight: '600',
      marginTop: '4px',
      margin: '4px 0 0 0',
    };

    const alertTitleStyle = {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '4px',
      margin: '0 0 4px 0',
    };

    const alertTextStyle = {
      fontSize: '13px',
      color: '#4b5563',
      margin: '0',
    };

    const statusBarStyle = {
      backgroundColor: '#f3f4f6',
      padding: '8px',
      textAlign: 'center' as const,
      borderTop: '1px solid #e5e7eb',
    };

    const statusTextStyle = {
      fontSize: '11px',
      color: '#6b7280',
      margin: '0',
    };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
          <div>
            <h1 style={titleStyle}>🍽️ Restaurant Inventory</h1>
            <p style={subtitleStyle}>
              {this.props.user ? `${this.props.user.email} (${this.props.user.role})` : 'Mobile App - Web Simulation'}
            </p>
          </div>
          {this.props.user && this.props.onSignOut && (
            <button
              onClick={this.props.onSignOut}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      <div style={tabContainerStyle}>
        <button
          style={{...tabStyle, ...(activeTab === 'inventory' ? activeTabStyle : {})}}
          onClick={() => this.setActiveTab('inventory')}
        >
          <span style={{...tabTextStyle, ...(activeTab === 'inventory' ? activeTabTextStyle : {})}}>
            📦 Inventory
          </span>
        </button>
        <button
          style={{...tabStyle, ...(activeTab === 'alerts' ? activeTabStyle : {})}}
          onClick={() => this.setActiveTab('alerts')}
        >
          <span style={{...tabTextStyle, ...(activeTab === 'alerts' ? activeTabTextStyle : {})}}>
            🔔 Alerts
          </span>
        </button>
        <button
          style={{...tabStyle, ...(activeTab === 'reports' ? activeTabStyle : {})}}
          onClick={() => this.setActiveTab('reports')}
        >
          <span style={{...tabTextStyle, ...(activeTab === 'reports' ? activeTabTextStyle : {})}}>
            📊 Reports
          </span>
        </button>
        <button
          style={{...tabStyle, ...(activeTab === 'tracking' ? activeTabStyle : {})}}
          onClick={() => this.setActiveTab('tracking')}
        >
          <span style={{...tabTextStyle, ...(activeTab === 'tracking' ? activeTabTextStyle : {})}}>
            📋 Tracking
          </span>
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'inventory' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h2 style={sectionTitleStyle}>Current Inventory</h2>
              <button
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={() => this.setState({ showAddInventoryModal: true })}
              >
                + Add Item
              </button>
            </div>

            {inventory.map(item => {
              const status = this.getStockStatus(item);
              return (
                <div key={item.id} style={cardStyle}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                      <h3 style={cardTitleStyle}>{this.getCategoryEmoji(item.category)} {item.name}</h3>
                      <div style={{marginBottom: '8px'}}>
                        <p style={{...cardSubtitleStyle, margin: '2px 0'}}>Category: {item.category}</p>
                        <p style={{...cardSubtitleStyle, margin: '2px 0'}}>Unit: {item.unit}</p>
                        <p style={{...cardSubtitleStyle, margin: '2px 0'}}>Cost per unit: {this.formatCurrency(item.cost_per_unit)}</p>
                      </div>
                      <p style={cardSubtitleStyle}>
                        Current Stock: <span style={{...cardStatusStyle, color: status.color}}>
                          {item.current_stock} {item.unit}
                        </span>
                        <span style={{fontSize: '12px', color: '#6b7280', marginLeft: '8px'}}>
                          (Min: {item.min_threshold} {item.unit})
                        </span>
                      </p>
                      <p style={{...cardStatusStyle, color: status.color}}>{status.text}</p>
                      <p style={{...cardSubtitleStyle, fontSize: '11px', marginTop: '4px'}}>
                        Updated {this.formatTimeAgo(item.updated_at)}
                      </p>
                    </div>
                    <div style={{display: 'flex', gap: '8px', marginTop: '4px'}}>
                      <button
                        style={{
                          backgroundColor: item.current_stock === 0 ? '#ef4444' : '#10b981',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const quantity = parseInt(prompt(`Enter quantity to ${item.current_stock === 0 ? 'restock' : 'add'}:`) || '0');
                          if (quantity > 0) {
                            this.updateStock(item.id, quantity, 'in', item.current_stock === 0 ? 'purchase' : 'delivery');
                          }
                        }}
                      >
                        {item.current_stock === 0 ? 'Restock Now' : 'Update Stock'}
                      </button>
                      <button
                        style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const quantity = parseInt(prompt(`Remove quantity from ${item.name}:`) || '0');
                          if (quantity > 0) {
                            this.updateStock(item.id, quantity, 'out', 'sale');
                          }
                        }}
                      >
                        Remove Stock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Inventory Modal */}
        {this.state.showAddInventoryModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              margin: '8px',
              width: 'calc(100% - 16px)',
              maxWidth: '400px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h3 style={{...cardTitleStyle, margin: '0'}}>Add New Item</h3>
                <button
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '8px',
                    minHeight: '44px',
                    minWidth: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => this.setState({ showAddInventoryModal: false })}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                const category = formData.get('category') as string;
                const unit = formData.get('unit') as string;
                const costPerUnit = parseFloat(formData.get('cost_per_unit') as string);
                const minThreshold = parseFloat(formData.get('min_threshold') as string);
                const supplierId = formData.get('supplier_id') as string;

                if (name && category && unit && costPerUnit >= 0 && minThreshold >= 0) {
                  this.addNewItem(name, category, unit, costPerUnit, minThreshold, supplierId || undefined);
                }
              }}>
                <div style={{marginBottom: '16px'}}>
                  <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{marginBottom: '16px'}}>
                  <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select category</option>
                    {INVENTORY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                    Unit *
                  </label>
                  <select
                    name="unit"
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select unit</option>
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                    Cost per unit *
                  </label>
                  <input
                    type="number"
                    name="cost_per_unit"
                    step="0.01"
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{marginBottom: '16px'}}>
                  <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                    Minimum threshold *
                  </label>
                  <input
                    type="number"
                    name="min_threshold"
                    step="0.01"
                    min="0"
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{marginBottom: '16px'}}>
                  <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                    Supplier
                  </label>
                  <select
                    name="supplier_id"
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="">No supplier</option>
                    <option value="supplier-1">Local Farm Co</option>
                    <option value="supplier-2">Fresh Food Distributors</option>
                    <option value="supplier-3">Premium Meat Supply</option>
                  </select>
                </div>

                <div style={{display: 'flex', gap: '12px'}}>
                  <button
                    type="button"
                    onClick={() => this.setState({ showAddInventoryModal: false })}
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '16px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      minHeight: '48px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            <h2 style={sectionTitleStyle}>Stock Alerts</h2>
            {(() => {
              const outOfStockItems = inventory.filter(item => item.current_stock === 0);
              const lowStockItems = inventory.filter(item => item.current_stock > 0 && item.current_stock <= item.min_threshold);

              return (
                <>
                  {outOfStockItems.map(item => (
                    <div key={item.id} style={{...cardStyle, ...criticalCardStyle}}>
                      <h3 style={alertTitleStyle}>❌ Out of Stock</h3>
                      <p style={alertTextStyle}>
                        {this.getCategoryEmoji(item.category)} {item.name} - Immediate restock needed
                      </p>
                      <p style={{...alertTextStyle, fontSize: '12px', marginTop: '4px', color: '#9ca3af'}}>
                        Category: {item.category} | Unit: {item.unit} | Cost: {this.formatCurrency(item.cost_per_unit)}
                      </p>
                    </div>
                  ))}

                  {lowStockItems.map(item => (
                    <div key={item.id} style={{...cardStyle, ...alertCardStyle}}>
                      <h3 style={alertTitleStyle}>🚨 Low Stock Alert</h3>
                      <p style={alertTextStyle}>
                        {this.getCategoryEmoji(item.category)} {item.name} - Only {item.current_stock} {item.unit} remaining
                      </p>
                      <p style={{...alertTextStyle, fontSize: '12px', marginTop: '4px', color: '#9ca3af'}}>
                        Minimum threshold: {item.min_threshold} {item.unit} | Cost: {this.formatCurrency(item.cost_per_unit)}
                      </p>
                    </div>
                  ))}

                  {outOfStockItems.length === 0 && lowStockItems.length === 0 && (
                    <div style={cardStyle}>
                      <h3 style={cardTitleStyle}>✅ All Good!</h3>
                      <p style={cardSubtitleStyle}>No stock alerts at this time. All inventory levels are above minimum thresholds.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h2 style={sectionTitleStyle}>Analytics Dashboard</h2>
            {(() => {
              const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0);
              const totalItems = inventory.reduce((sum, item) => sum + item.current_stock, 0);
              const categoryCounts = inventory.reduce((acc, item) => {
                acc[item.category] = (acc[item.category] || 0) + item.current_stock;
                return acc;
              }, {} as { [key: string]: number });
              const sortedCategories = Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

              const todayTransactions = transactions.filter(t =>
                new Date(t.created_at).toDateString() === new Date().toDateString()
              );
              const totalOut = todayTransactions
                .filter(t => t.type === 'out')
                .reduce((sum, t) => sum + t.quantity, 0);

              return (
                <>
                  <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>📈 Current Inventory</h3>
                    <p style={cardSubtitleStyle}>Total Value: {this.formatCurrency(totalInventoryValue)}</p>
                    <p style={cardSubtitleStyle}>Total Items: {totalItems} units</p>
                    <p style={cardSubtitleStyle}>Unique Products: {inventory.length}</p>
                  </div>

                  <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>📊 Today's Activity</h3>
                    <p style={cardSubtitleStyle}>Transactions: {todayTransactions.length}</p>
                    <p style={cardSubtitleStyle}>Items Used: {totalOut} units</p>
                    <p style={cardSubtitleStyle}>Stock Movements: {todayTransactions.filter(t => t.type === 'in').length} in, {todayTransactions.filter(t => t.type === 'out').length} out</p>
                  </div>

                  <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>🎯 Top Categories by Stock</h3>
                    {sortedCategories.length > 0 ? (
                      sortedCategories.map(([category, count], index) => (
                        <p key={category} style={cardSubtitleStyle}>
                          {index + 1}. {this.getCategoryEmoji(category)} {category} ({count} units)
                        </p>
                      ))
                    ) : (
                      <p style={cardSubtitleStyle}>No categories found</p>
                    )}
                  </div>

                  <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>⚠️ Stock Status</h3>
                    <p style={cardSubtitleStyle}>
                      Out of Stock: {inventory.filter(item => item.current_stock === 0).length} items
                    </p>
                    <p style={cardSubtitleStyle}>
                      Low Stock: {inventory.filter(item => item.current_stock > 0 && item.current_stock <= item.min_threshold).length} items
                    </p>
                    <p style={cardSubtitleStyle}>
                      Well Stocked: {inventory.filter(item => item.current_stock > item.min_threshold).length} items
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'tracking' && (
          <div>
            <div style={{marginBottom: '16px'}}>
              <h2 style={sectionTitleStyle}>Stock Transactions</h2>
              <button
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => this.setState({ showAddModal: true })}
              >
                + Add Transaction
              </button>
            </div>

            {/* Add Transaction Modal */}
            {this.state.showAddModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  margin: '8px',
                  width: 'calc(100% - 16px)',
                  maxWidth: '400px',
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                    <h3 style={{...cardTitleStyle, margin: '0'}}>Add Stock Transaction</h3>
                    <button
                      style={{
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '12px',
                        borderRadius: '8px',
                        minHeight: '44px',
                        minWidth: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => this.setState({ showAddModal: false })}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const itemId = formData.get('item_id') as string;
                    const type = formData.get('type') as 'in' | 'out';
                    const quantity = parseFloat(formData.get('quantity') as string);
                    const reason = formData.get('reason') as 'purchase' | 'delivery' | 'sale' | 'waste' | 'transfer';
                    const notes = formData.get('notes') as string;

                    if (itemId && quantity > 0 && reason) {
                      this.updateStock(itemId, quantity, type, reason, notes || undefined);
                    }
                  }}>
                    <div style={{marginBottom: '16px'}}>
                      <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                        Item *
                      </label>
                      <select
                        name="item_id"
                        required
                        style={{
                          width: '100%',
                          padding: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          minHeight: '48px',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select item</option>
                        {inventory.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} (Current: {item.current_stock} {item.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{marginBottom: '16px'}}>
                      <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                        Type *
                      </label>
                      <select
                        name="type"
                        required
                        style={{
                          width: '100%',
                          padding: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          minHeight: '48px',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                        onChange={() => {
                          const reasonSelect = document.querySelector('select[name="reason"]') as HTMLSelectElement;
                          if (reasonSelect) reasonSelect.value = '';
                        }}
                      >
                        <option value="">Select type</option>
                        <option value="in">Stock In</option>
                        <option value="out">Stock Out</option>
                      </select>
                    </div>

                    <div style={{marginBottom: '16px'}}>
                      <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                        Reason *
                      </label>
                      <select
                        name="reason"
                        required
                        style={{
                          width: '100%',
                          padding: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          minHeight: '48px',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select reason</option>
                        <optgroup label="Stock In">
                          <option value="purchase">Purchase</option>
                          <option value="delivery">Delivery</option>
                        </optgroup>
                        <optgroup label="Stock Out">
                          <option value="sale">Sale</option>
                          <option value="waste">Waste</option>
                          <option value="transfer">Transfer</option>
                        </optgroup>
                      </select>
                    </div>

                    <div style={{marginBottom: '16px'}}>
                      <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        step="0.01"
                        min="0.01"
                        required
                        style={{
                          width: '100%',
                          padding: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          minHeight: '48px',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{marginBottom: '16px'}}>
                      <label style={{...cardSubtitleStyle, fontWeight: '500', display: 'block', marginBottom: '4px'}}>
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          minHeight: '80px',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{display: 'flex', gap: '12px'}}>
                      <button
                        type="button"
                        onClick={() => this.setState({ showAddModal: false })}
                        style={{
                          flex: 1,
                          padding: '16px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          minHeight: '48px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '16px',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          minHeight: '48px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Add Transaction
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Transaction List */}
            <div style={{marginTop: '16px'}}>
              {transactions.map((transaction) => {
                const item = inventory.find(i => i.id === transaction.item_id);
                const isStockIn = transaction.type === 'in';

                return (
                  <div
                    key={transaction.id}
                    style={{
                      ...cardStyle,
                      borderLeft: `4px solid ${isStockIn ? '#10b981' : '#ef4444'}`,
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontSize: '16px'}}>
                          {isStockIn ? '↗️' : '↘️'}
                        </span>
                        <span style={{
                          ...cardSubtitleStyle,
                          fontWeight: '500',
                          color: isStockIn ? '#10b981' : '#ef4444',
                          margin: '0'
                        }}>
                          {isStockIn ? 'Stock In' : 'Stock Out'}
                        </span>
                      </div>
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {transaction.reason}
                      </span>
                    </div>

                    <div style={{marginBottom: '8px'}}>
                      <h4 style={{...cardTitleStyle, fontSize: '16px', margin: '0 0 4px 0'}}>
                        {item ? this.getCategoryEmoji(item.category) : '📦'} {item?.name || 'Unknown Item'}
                      </h4>
                      <p style={{...cardSubtitleStyle, margin: '0'}}>
                        Quantity: {transaction.quantity} {item?.unit || 'units'}
                      </p>
                    </div>

                    {transaction.notes && (
                      <p style={{...cardSubtitleStyle, fontSize: '12px', fontStyle: 'italic', margin: '8px 0'}}>
                        "{transaction.notes}"
                      </p>
                    )}

                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', paddingTop: '8px', borderTop: '1px solid #f3f4f6'}}>
                      <span>By: {transaction.user_id}</span>
                      <span>{this.formatTimeAgo(transaction.created_at)}</span>
                    </div>
                  </div>
                );
              })}

              {transactions.length === 0 && (
                <div style={{
                  ...cardStyle,
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: '#6b7280'
                }}>
                  <p style={{margin: '0 0 8px 0'}}>No transactions found</p>
                  <p style={{margin: '0', fontSize: '14px'}}>Add your first transaction to get started</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={statusBarStyle}>
        <p style={statusTextStyle}>
          React Native Web ✅ | Touch Events ✅ | Mobile Features ✅
        </p>
      </div>
    </div>
  );
  }
}

// Class component wrapper to handle authentication without hooks
interface AuthWrapperState {
  user: any;
  loading: boolean;
  showLogin: boolean;
  email: string;
  password: string;
  loginError: string | null;
}

class AuthenticatedApp extends React.Component<{}, AuthWrapperState> {
  private unsubscribe: (() => void) | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      user: null,
      loading: true,
      showLogin: false,
      email: '',
      password: '',
      loginError: null
    };
  }

  async componentDidMount() {
    // Initialize auth and subscribe to changes
    await useAuthStore.getState().initialize();

    // Subscribe to auth store changes
    this.unsubscribe = useAuthStore.subscribe((state) => {
      this.setState({
        user: state.user,
        loading: state.loading
      });
    });

    // Set initial state
    const currentState = useAuthStore.getState();
    this.setState({
      user: currentState.user,
      loading: currentState.loading
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleLogin = async () => {
    try {
      this.setState({ loginError: null });
      await useAuthStore.getState().signIn(this.state.email, this.state.password);
      this.setState({ showLogin: false });
    } catch (error: any) {
      this.setState({ loginError: error.message });
    }
  };

  handleDemoLogin = () => {
    this.setState({ email: 'manager@demo.com', password: 'demo123' }, () => {
      this.handleLogin();
    });
  };

  handleSignOut = async () => {
    try {
      await useAuthStore.getState().signOut();
      // The store subscription will automatically update the state
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  render() {
    const { user, loading, showLogin, email, password, loginError } = this.state;

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#6b7280', margin: 0 }}>Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '400px',
            margin: '16px'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '24px',
              color: '#1f2937'
            }}>
              🍽️ Restaurant Inventory
            </h1>

            {!showLogin ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                  Sign in to manage your restaurant inventory
                </p>

                <button
                  onClick={this.handleDemoLogin}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  🚀 Try Demo (Manager)
                </button>

                <button
                  onClick={() => this.setState({ showLogin: true })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    color: '#3b82f6',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Sign In with Email
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => this.setState({ email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="manager@demo.com"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => this.setState({ password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="demo123"
                  />
                </div>

                {loginError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {loginError}
                  </div>
                )}

                <button
                  onClick={this.handleLogin}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  Sign In
                </button>

                <button
                  onClick={() => this.setState({ showLogin: false })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>

                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <strong>Demo Credentials:</strong><br />
                  Manager: manager@demo.com / demo123<br />
                  Staff: staff@demo.com / demo123
                </div>
              </div>
            )}
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
        </div>
      );
    }

    return <App user={user} onSignOut={this.handleSignOut} />;
  }
}

export default AuthenticatedApp;