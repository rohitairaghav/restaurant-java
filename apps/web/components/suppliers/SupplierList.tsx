'use client';

import { useState, useEffect } from 'react';
import { useInventoryStore } from '@/lib/stores/inventory';
import { useAuthStore } from '@/lib/stores/auth';
import type { Supplier } from '@restaurant-inventory/shared';
import { Plus, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react';
import SupplierForm from './SupplierForm';

export default function SupplierList() {
  const { suppliers, loading, error, fetchSuppliers, deleteSupplier } = useInventoryStore();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteSupplier(id);
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  const isManager = user?.role === 'manager';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" role="status" aria-label="Loading suppliers">
          <span className="sr-only">Loading suppliers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-danger-600 mb-4">{error}</div>
        <button
          onClick={() => fetchSuppliers()}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">
            Manage your suppliers and their contact information
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-primary-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Add Supplier
          </button>
        )}
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No suppliers found</div>
          {isManager && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Add your first supplier
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {supplier.name}
                </h3>
                {isManager && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                      title="Edit supplier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      disabled={deletingId === supplier.id}
                      className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg disabled:opacity-50"
                      title="Delete supplier"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {supplier.contact_person && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} className="text-gray-400" />
                    <span>{supplier.contact_person}</span>
                  </div>
                )}

                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <a
                      href={`tel:${supplier.phone}`}
                      className="hover:text-primary-600"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                )}

                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <a
                      href={`mailto:${supplier.email}`}
                      className="hover:text-primary-600"
                    >
                      {supplier.email}
                    </a>
                  </div>
                )}

                {supplier.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Added {new Date(supplier.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
