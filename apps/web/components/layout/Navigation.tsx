'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useAlertsStore } from '@/lib/stores/alerts';
import { Package, TrendingUp, AlertCircle, LogOut, Menu, X, Users, Truck, FileText, ChefHat, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OfflineStatus from '../offline/OfflineStatus';

export default function Navigation() {
  const { user, signOut } = useAuthStore();
  const { unreadCount, fetchAlerts } = useAlertsStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user, fetchAlerts]);

  const navItems = [
    {
      href: '/dashboard',
      label: 'Inventory',
      icon: Package,
      roles: ['manager', 'staff'],
    },
    {
      href: '/dashboard/stock',
      label: 'Stock Tracking',
      icon: TrendingUp,
      roles: ['manager', 'staff'],
    },
    {
      href: '/dashboard/recipes',
      label: 'Recipes',
      icon: ChefHat,
      roles: ['manager', 'staff'],
    },
    {
      href: '/dashboard/sales',
      label: 'Sales',
      icon: ShoppingCart,
      roles: ['manager', 'staff'],
    },
    {
      href: '/dashboard/alerts',
      label: 'Alerts',
      icon: AlertCircle,
      roles: ['manager', 'staff'],
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics',
      icon: TrendingUp,
      roles: ['manager'],
    },
    {
      href: '/dashboard/reports',
      label: 'Reports',
      icon: FileText,
      roles: ['manager'],
    },
    {
      href: '/dashboard/users',
      label: 'User Administration',
      icon: Users,
      roles: ['manager'],
    },
    {
      href: '/dashboard/suppliers',
      label: 'Suppliers',
      icon: Truck,
      roles: ['manager'],
    },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || 'staff')
  );

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Restaurant Inventory</h1>
          <p className="text-xs text-gray-600">
            {user?.email} ({user?.role})
          </p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="bg-white w-72 h-full shadow-lg">
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-900">Restaurant Inventory</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.email} ({user?.role})
              </p>
            </div>

            <div className="px-3">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                    {item.href === '/dashboard/alerts' && unreadCount > 0 && (
                      <span className="bg-danger-500 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="absolute bottom-6 left-3 right-3 space-y-3">
              <OfflineStatus />
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full transition-colors"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen flex-col fixed left-0 top-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Restaurant Inventory</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user?.email} ({user?.role})
          </p>
        </div>

        <div className="px-3 flex-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {item.label}
                {item.href === '/dashboard/alerts' && unreadCount > 0 && (
                  <span className="bg-danger-500 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-3 space-y-3 border-t border-gray-200">
          <OfflineStatus />
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}