import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Search,
  Filter
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { RenewalRecord, IssueRecord } from '../../types/inventory';
import { formatDisplayDate, calculateRenewalDueDate } from '../../utils/dateUtils';

export const RenewalManagementPage: React.FC = () => {
  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalRecord | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(true);
  const [coordinatorRemarks, setCoordinatorRemarks] = useState<string>('');
  const [approvingStaff, setApprovingStaff] = useState<string>('Dr. S. K. Mehta (Coordinator)');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    setRenewals(InventoryStore.getRenewals());
    setSystemDate(InventoryStore.getSystemDate());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('inventory-store-updated', loadData);
    window.addEventListener('inventory-system-date-changed', loadData);
    return () => {
      window.removeEventListener('inventory-store-updated', loadData);
      window.removeEventListener('inventory-system-date-changed', loadData);
    };
  }, []);

  const handleDecision = () => {
    if (!selectedRenewal) return;

    const res = InventoryStore.reviewRenewal({
      renewalId: selectedRenewal.id,
      approve: isApproving,
      remarks: coordinatorRemarks.trim() || (isApproving ? 'Approved 15-day extension' : 'Rejected by Coordinator'),
      approvingStaff,
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setSelectedRenewal(null);
      setCoordinatorRemarks('');
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const filteredRenewals = renewals.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = 
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentEnrolment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.assetId && r.assetId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = renewals.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-800">Renewal Approvals & Extensions</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingCount} Pending Action
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforces Rule 7 & 8: Submission does not extend due date; approved renewals extend the due date by 15 calendar days from the existing due date.
          </p>
        </div>

        {/* Policy Explainer Tag */}
        <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-100 text-xs text-blue-900 max-w-sm">
          <strong className="block text-[11px] uppercase tracking-wider text-blue-700">Extension Formula (Rule 8)</strong>
          <span className="text-[11px]">Revised Due Date = Existing Due Date + 15 Calendar Days</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, enrolment, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Requests ({renewals.length})</option>
            <option value="PENDING">Pending Review ({pendingCount})</option>
            <option value="APPROVED">Approved ({renewals.filter(r => r.status === 'APPROVED').length})</option>
            <option value="REJECTED">Rejected ({renewals.filter(r => r.status === 'REJECTED').length})</option>
          </select>
        </div>
      </div>

      {/* Renewals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Student Requester</th>
                <th className="py-3 px-4">Borrowed Equipment</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Current Due Date</th>
                <th className="py-3 px-4">Revised Due Date (+15d)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Student Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRenewals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No renewal requests matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRenewals.map((ren) => (
                  <tr key={ren.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div>{ren.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{ren.studentEnrolment}</div>
                    </td>

                    {/* Equipment */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <div>{ren.itemName}</div>
                      {ren.assetId && (
                        <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                          Asset ID: {ren.assetId}
                        </span>
                      )}
                    </td>

                    {/* Request Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDisplayDate(ren.requestDate)}
                    </td>

                    {/* Current Due Date */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {formatDisplayDate(ren.originalDueDate)}
                    </td>

                    {/* Revised Due Date */}
                    <td className="py-3.5 px-4">
                      {ren.status === 'APPROVED' ? (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {formatDisplayDate(ren.revisedDueDate || ren.proposedDueDate)}
                        </span>
                      ) : ren.status === 'PENDING' ? (
                        <span className="font-mono text-slate-500">
                          {formatDisplayDate(ren.proposedDueDate)} (Proposed)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unchanged</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ren.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        ren.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {ren.status}
                      </span>
                    </td>

                    {/* Student Reason */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={ren.remarks}>
                      {ren.remarks || 'Standard assignment extension'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {ren.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRenewal(ren);
                              setIsApproving(false);
                            }}
                            className="p-1.5 text-rose-700 hover:bg-rose-50 rounded"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRenewal(ren);
                              setIsApproving(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
                            title="Approve (+15 Days)"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Reviewed by {ren.approvingStaff?.split(' ')[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {selectedRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {isApproving ? 'Approve 15-Day Renewal Request' : 'Reject Renewal Request'}
            </h3>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-3 space-y-1">
              <div>Student: <strong>{selectedRenewal.studentName}</strong> ({selectedRenewal.studentEnrolment})</div>
              <div>Equipment: <strong>{selectedRenewal.itemName}</strong></div>
              <div>Current Due Date: <span className="font-mono font-semibold">{formatDisplayDate(selectedRenewal.originalDueDate)}</span></div>
              {isApproving && (
                <div className="text-emerald-700 font-bold pt-1">
                  New Due Date: {formatDisplayDate(selectedRenewal.proposedDueDate)} (+15 Calendar Days)
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coordinator Remarks / Justification:
              </label>
              <textarea
                value={coordinatorRemarks}
                onChange={(e) => setCoordinatorRemarks(e.target.value)}
                placeholder={isApproving ? 'e.g. Approved for laboratory completion.' : 'e.g. Cannot extend due to high demand for upcoming semester assessment.'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedRenewal(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDecision}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs ${
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
