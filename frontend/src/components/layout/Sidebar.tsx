import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  SlidersHorizontal, 
  FileText, 
  GraduationCap, 
  Building2, 
  X,
  Clock,
  Shield,
  Layers
} from 'lucide-react';
import { UserRole } from '../../types/inventory';
import { InventoryStore } from '../../services/inventoryStore';

export type PageId = 
  | 'dashboard'
  | 'inventory'
  | 'issue'
  | 'returns'
  | 'renewals'
  | 'overdue'
  | 'students'
  | 'stock-adjust'
  | 'reports'
  | 'student-portal';

interface SidebarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  currentRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  currentRole,
  isOpen,
  onClose,
}) => {
  const [pendingRenewalsCount, setPendingRenewalsCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  const updateBadges = () => {
    const renewals = InventoryStore.getRenewals();
    setPendingRenewalsCount(renewals.filter(r => r.status === 'PENDING').length);

    const issues = InventoryStore.getIssues();
    setOverdueCount(issues.filter(i => i.status === 'OVERDUE' && i.outstandingQuantity > 0).length);
  };

  useEffect(() => {
    updateBadges();
    window.addEventListener('inventory-store-updated', updateBadges);
    window.addEventListener('inventory-system-date-changed', updateBadges);
    return () => {
      window.removeEventListener('inventory-store-updated', updateBadges);
      window.removeEventListener('inventory-system-date-changed', updateBadges);
    };
  }, []);

  const coordinatorNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Coordinator Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory Catalog', icon: Boxes },
    { id: 'issue', label: 'Issue Items (15-Day Loan)', icon: ArrowUpRight },
    { id: 'returns', label: 'Record Returns', icon: ArrowDownLeft },
    { 
      id: 'renewals', 
      label: 'Renewal Approvals', 
      icon: RotateCcw, 
      badge: pendingRenewalsCount > 0 ? pendingRenewalsCount : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    { 
      id: 'overdue', 
      label: 'Overdue Items', 
      icon: AlertTriangle, 
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'stock-adjust', label: 'Stock Adjustments', icon: SlidersHorizontal },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
  ];

  const studentNavItems: NavItem[] = [
    { id: 'student-portal', label: 'My Borrowed Items', icon: GraduationCap },
    { id: 'renewals', label: 'My Renewal Requests', icon: Clock },
    { id: 'inventory', label: 'View Lab Catalog', icon: Boxes },
  ];

  const activeNav = currentRole === 'COORDINATOR' ? coordinatorNavItems : studentNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col
        transition-transform duration-200 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Department Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/50">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                DFIS Inventory
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">
                University Dept System
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Banner */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Access Mode:</span>
          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
            currentRole === 'COORDINATOR' 
              ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' 
              : 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
          }`}>
            {currentRole === 'COORDINATOR' ? 'Coordinator (Admin)' : 'Student View'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            {currentRole === 'COORDINATOR' ? 'Management Modules' : 'Student Portal'}
          </div>

          {activeNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as PageId);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-700/30 font-semibold' 
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Policy Highlight Banner */}
        <div className="p-3 mx-3 mb-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Policy #5 Rules</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Standard loan period is exactly <strong className="text-slate-200">15 calendar days</strong>. Approvals required for renewals (+15 days).
          </p>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-xs border border-slate-600">
              {currentRole === 'COORDINATOR' ? 'KM' : 'RS'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-200 truncate text-[11px]">
                {currentRole === 'COORDINATOR' ? 'Dr. S. K. Mehta' : 'Rahul Sharma'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentRole === 'COORDINATOR' ? 'Inventory Coordinator' : 'Enrol: DFIS26001'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
