import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  CheckCircle, 
  ArrowUpRight, 
  AlertTriangle, 
  RotateCcw, 
  Wrench, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Check, 
  X, 
  Plus, 
  ArrowDownLeft, 
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { InventoryItem, IssueRecord, RenewalRecord, StockAdjustmentRecord } from '../../types/inventory';
import { formatDisplayDate, getOverdueDays, isOverdue, isDueSoon } from '../../utils/dateUtils';
import { PageId } from '../layout/Sidebar';

interface CoordinatorDashboardProps {
  onNavigate: (page: PageId) => void;
  onOpenIssueModal?: () => void;
  onOpenReturnModal?: () => void;
  onOpenItemModal?: () => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  onNavigate,
  onOpenIssueModal,
  onOpenReturnModal,
  onOpenItemModal,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');
  const [approvalModalRenewal, setApprovalModalRenewal] = useState<RenewalRecord | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [isApproving, setIsApproving] = useState(true);

  const loadDashboardData = () => {
    setItems(InventoryStore.getItems());
    setIssues(InventoryStore.getIssues());
    setRenewals(InventoryStore.getRenewals());
    setAdjustments(InventoryStore.getAdjustments());
    setSystemDate(InventoryStore.getSystemDate());
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('inventory-store-updated', loadDashboardData);
    window.addEventListener('inventory-system-date-changed', loadDashboardData);
    return () => {
      window.removeEventListener('inventory-store-updated', loadDashboardData);
      window.removeEventListener('inventory-system-date-changed', loadDashboardData);
    };
  }, []);

  // Compute metrics
  const totalUnits = items.reduce((acc, i) => acc + i.totalQuantity, 0);
  const availableUnits = items.reduce((acc, i) => acc + i.availableQuantity, 0);
  const issuedUnits = items.reduce((acc, i) => acc + i.issuedQuantity, 0);
  const damagedOrMaintUnits = items.reduce((acc, i) => acc + (i.damagedQuantity || 0) + (i.maintenanceQuantity || 0), 0);

  const overdueIssues = issues.filter(i => i.outstandingQuantity > 0 && isOverdue(i.dueDate, systemDate));
  const upcomingIssues = issues.filter(i => i.outstandingQuantity > 0 && !isOverdue(i.dueDate, systemDate) && isDueSoon(i.dueDate, systemDate, 5));
  const pendingRenewals = renewals.filter(r => r.status === 'PENDING');

  const handleProcessRenewal = (approve: boolean) => {
    if (!approvalModalRenewal) return;
    const res = InventoryStore.reviewRenewal({
      renewalId: approvalModalRenewal.id,
      approve,
      remarks: approvalRemarks || (approve ? 'Standard 15-day extension granted by Coordinator' : 'Denied due to high demand'),
      approvingStaff: 'Dr. S. K. Mehta (Coordinator)'
    });
    setApprovalModalRenewal(null);
    setApprovalRemarks('');
    loadDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">Coordinator Overview & Control Center</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live System
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of Digital Forensics & Information Security (DFIS) • Semester I Hardware Inventory
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('issue')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Item</span>
          </button>
          <button
            onClick={() => onNavigate('returns')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Record Return</span>
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Inventory</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Inventory */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Stock</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{totalUnits}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{items.length} unique catalog items</div>
          </div>
        </div>

        {/* Available Stock */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-medium text-emerald-800">Usable Stock</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{availableUnits}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Ready for student issue</div>
          </div>
        </div>

        {/* Currently Issued */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-medium text-blue-800">Active Loans</span>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">{issuedUnits}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">With registered students</div>
          </div>
        </div>

        {/* Overdue Items */}
        <div 
          onClick={() => onNavigate('overdue')}
          className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            overdueIssues.length > 0
              ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold text-rose-800">Overdue Items</span>
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-700">{overdueIssues.length}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              {overdueIssues.length > 0 ? 'Requires immediate action' : 'No overdue loans'}
            </div>
          </div>
        </div>

        {/* Pending Renewals */}
        <div 
          onClick={() => onNavigate('renewals')}
          className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            pendingRenewals.length > 0
              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold text-amber-800">Pending Renewals</span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{pendingRenewals.length}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting coordinator approval</div>
          </div>
        </div>

        {/* Damaged / Maintenance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Damaged/Maint</span>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{damagedOrMaintUnits}</div>
            <div className="text-[11px] text-purple-600 font-medium mt-0.5">Restricted from loan</div>
          </div>
        </div>
      </div>

      {/* Critical Attention Banner: Overdue Alerts (Matches prompt example format) */}
      {overdueIssues.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-600 text-white rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-rose-900">
                Mandatory Policy Notice: Items Past 15-Day Due Date
              </h2>
            </div>
            <button
              onClick={() => onNavigate('overdue')}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>View All Overdue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 mt-3">
            {overdueIssues.map((iss) => {
              const days = getOverdueDays(iss.dueDate, systemDate);
              return (
                <div 
                  key={iss.id} 
                  className="bg-white border border-rose-200/80 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="text-slate-800 font-semibold leading-relaxed">
                      "{iss.trackingType === 'INDIVIDUAL_ASSET' ? `${iss.itemName} (${iss.assetId})` : `${iss.outstandingQuantity}x ${iss.itemName}`} issued to student enrolment number <span className="font-mono font-bold text-rose-700">{iss.studentEnrolment}</span> ({iss.studentName}) was due on <span className="font-medium underline">{formatDisplayDate(iss.dueDate)}</span> and is overdue by <span className="text-rose-600 font-bold">{days} {days === 1 ? 'day' : 'days'}</span>."
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Issue Ref: {iss.issueNumber} • Loan Date: {formatDisplayDate(iss.issueDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate('returns')}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-md text-xs transition-colors"
                    >
                      Receive Return
                    </button>
                    <button
                      onClick={() => onNavigate('overdue')}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-md text-xs transition-colors"
                    >
                      Send Reminder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Grid: Pending Renewals & Upcoming Due Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Renewal Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">Pending Renewal Approvals</h3>
              {pendingRenewals.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  {pendingRenewals.length}
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate('renewals')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Queue
            </button>
          </div>

          <div className="p-4 flex-1">
            {pendingRenewals.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="font-medium text-slate-600">All renewals reviewed</p>
                <p className="text-[11px] text-slate-400">No student renewal requests currently pending.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRenewals.map((ren) => (
                  <div key={ren.id} className="p-3 bg-amber-50/40 rounded-lg border border-amber-200 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{ren.itemName}</span>
                        {ren.assetId && <span className="ml-1 text-[11px] font-mono font-medium text-slate-600">({ren.assetId})</span>}
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Student: <strong className="text-slate-800">{ren.studentName}</strong> ({ren.studentEnrolment})
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded border border-amber-100 text-[11px]">
                      <div>
                        <span className="text-slate-500">Current Due:</span>
                        <div className="font-semibold text-slate-700">{formatDisplayDate(ren.originalDueDate)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Proposed (+15d):</span>
                        <div className="font-bold text-emerald-600">{formatDisplayDate(ren.proposedDueDate)}</div>
                      </div>
                    </div>

                    {ren.remarks && (
                      <p className="text-[11px] text-slate-600 italic bg-white/60 p-1.5 rounded">
                        "{ren.remarks}"
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setApprovalModalRenewal(ren);
                          setIsApproving(false);
                        }}
                        className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => {
                          setApprovalModalRenewal(ren);
                          setIsApproving(true);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve (+15 Days)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Due Dates */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Upcoming Due Dates (Next 5 Days)</h3>
              {upcomingIssues.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {upcomingIssues.length}
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate('issue')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              All Active Loans
            </button>
          </div>

          <div className="p-4 flex-1">
            {upcomingIssues.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 text-blue-300 mb-2" />
                <p className="font-medium text-slate-600">No loans due within 5 days</p>
                <p className="text-[11px] text-slate-400">All student loans have healthy remaining loan periods.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingIssues.map((iss) => (
                  <div key={iss.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {iss.trackingType === 'INDIVIDUAL_ASSET' ? `${iss.itemName} (${iss.assetId})` : `${iss.outstandingQuantity}x ${iss.itemName}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {iss.studentName} • {iss.studentEnrolment}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Due {formatDisplayDate(iss.dueDate)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Issued: {formatDisplayDate(iss.issueDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions & Inventory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions / Audit Feed (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Recent Audit & Transaction Records</h3>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Full Audit Trail
            </button>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Item / Asset</th>
                  <th className="pb-2">Operation</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.slice(0, 5).map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50">
                    <td className="py-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {adj.timestamp}
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">
                      {adj.itemName}
                      {adj.assetId && <span className="ml-1 text-[11px] text-slate-500 font-mono">({adj.assetId})</span>}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adj.adjustmentType === 'NEW_STOCK' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        adj.adjustmentType === 'CORRECTION_ADD' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        adj.adjustmentType === 'CORRECTION_SUBTRACT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {adj.adjustmentType}
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold text-slate-700">
                      {adj.quantity > 0 ? adj.quantity : '—'}
                    </td>
                    <td className="py-2.5 text-slate-500 text-[11px]">
                      {adj.responsibleUser}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Laboratory & Equipment Allocation Overview (1 column) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Laboratory Inventory Health</h3>
            <p className="text-[11px] text-slate-500 mb-4">Stock distribution by tracking category</p>

            <div className="space-y-3">
              {items.map((item) => {
                const percentAvailable = item.totalQuantity > 0 
                  ? Math.round((item.availableQuantity / item.totalQuantity) * 100) 
                  : 0;
                return (
                  <div key={item.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-600">
                        {item.availableQuantity} / {item.totalQuantity} avail
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all" 
                        style={{ width: `${percentAvailable}%` }}
                        title={`${item.availableQuantity} Available`}
                      />
                      <div 
                        className="bg-blue-500 h-full transition-all" 
                        style={{ width: `${Math.round((item.issuedQuantity / item.totalQuantity) * 100)}%` }}
                        title={`${item.issuedQuantity} Issued`}
                      />
                      <div 
                        className="bg-rose-500 h-full transition-all" 
                        style={{ width: `${Math.round(((item.damagedQuantity || 0) / item.totalQuantity) * 100)}%` }}
                        title={`${item.damagedQuantity} Damaged`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Issued</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Damaged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Approval / Rejection */}
      {approvalModalRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {isApproving ? 'Approve Loan Renewal (+15 Calendar Days)' : 'Reject Loan Renewal Request'}
            </h3>
            
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              {isApproving ? (
                <>
                  Under <strong>Mandatory Rule 8</strong>, approving this renewal will extend the due date by exactly 15 calendar days from the existing due date ({formatDisplayDate(approvalModalRenewal.originalDueDate)} &rarr; <span className="font-bold text-emerald-600">{formatDisplayDate(approvalModalRenewal.proposedDueDate)}</span>).
                </>
              ) : (
                <>
                  Under <strong>Mandatory Rule 7</strong>, rejecting will keep the original due date ({formatDisplayDate(approvalModalRenewal.originalDueDate)}) unchanged. The student must return the equipment.
                </>
              )}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coordinator Remarks / Justification:
              </label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder={isApproving ? 'e.g. Approved for extended forensics assignment completion.' : 'e.g. Rejecting due to equipment requirements for Semester I examination.'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setApprovalModalRenewal(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessRenewal(isApproving)}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-colors shadow-xs ${
                  isApproving ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isApproving ? 'Confirm 15-Day Extension' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
