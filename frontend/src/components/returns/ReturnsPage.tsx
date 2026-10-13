import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Search, 
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { IssueRecord, ItemCondition, ReturnRecord } from '../../types/inventory';
import { formatDisplayDate, getOverdueDays, isOverdue } from '../../utils/dateUtils';

export const ReturnsPage: React.FC = () => {
  const [activeIssues, setActiveIssues] = useState<IssueRecord[]>([]);
  const [pastReturns, setPastReturns] = useState<ReturnRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');

  // Selected Issue for Return
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [quantityReturned, setQuantityReturned] = useState<number>(1);
  const [conditionOnReturn, setConditionOnReturn] = useState<ItemCondition>('USABLE');
  const [returnDate, setReturnDate] = useState('');
  const [receivingStaff, setReceivingStaff] = useState('Dr. S. K. Mehta (Coordinator)');
  const [remarks, setRemarks] = useState('');

  // Search in outstanding list
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = () => {
    const issues = InventoryStore.getIssues();
    const outstanding = issues.filter(i => i.outstandingQuantity > 0);
    setActiveIssues(outstanding);
    setPastReturns(InventoryStore.getReturns());
    const curDate = InventoryStore.getSystemDate();
    setSystemDate(curDate);
    if (!returnDate) {
      setReturnDate(curDate);
    }
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

  const selectedIssue = activeIssues.find(i => i.id === selectedIssueId);

  // Auto-set max return quantity when selected issue changes
  useEffect(() => {
    if (selectedIssue) {
      setQuantityReturned(selectedIssue.outstandingQuantity);
    }
  }, [selectedIssueId]);

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedIssueId) {
      setErrorMsg('Please select an active loan to receive.');
      return;
    }

    if (!receivingStaff.trim()) {
      setErrorMsg('Receiving staff member name is required.');
      return;
    }

    const res = InventoryStore.recordReturn({
      issueId: selectedIssueId,
      quantityReturned: Number(quantityReturned),
      returnDate,
      conditionOnReturn,
      receivingStaff,
      remarks: remarks.trim() || `Returned in ${conditionOnReturn} condition`,
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setSelectedIssueId('');
    setRemarks('');
    loadData();
  };

  const filteredIssues = activeIssues.filter(i => 
    i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.studentEnrolment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.assetId && i.assetId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-slate-800">Record Equipment Returns & Condition Inspection</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Supports complete and partial returns (Rule 11), inspects item condition upon return (Rule 9), and isolates damaged stock (Rule 10).
        </p>
      </div>

      {/* Grid: Form (Left) & Outstanding Loans Selection (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Return Processing Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Return Intake Inspection</span>
              <span className="text-[11px] font-mono font-normal text-slate-500">
                Receipt Date: {formatDisplayDate(systemDate)}
              </span>
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              {/* Select Loan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Active Issue Record *
                </label>
                <select
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                  required
                >
                  <option value="">-- Choose Loan from List --</option>
                  {activeIssues.map((iss) => (
                    <option key={iss.id} value={iss.id}>
                      {iss.studentName} ({iss.studentEnrolment}) — {iss.itemName} {iss.assetId ? `[Asset ${iss.assetId}]` : `[${iss.outstandingQuantity} outstanding]`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Loan Details Summary */}
              {selectedIssue && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{selectedIssue.itemName}</span>
                    {selectedIssue.assetId && (
                      <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        Asset ID: {selectedIssue.assetId}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Student: <strong>{selectedIssue.studentName}</strong> ({selectedIssue.studentEnrolment})
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-100">
                    <span>Outstanding: <strong className="text-blue-800">{selectedIssue.outstandingQuantity} units</strong></span>
                    <span className="font-mono">Due: {formatDisplayDate(selectedIssue.dueDate)}</span>
                  </div>
                </div>
              )}

              {/* Return Quantity (Support Partial Returns - Rule 11) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Quantity Returned (Partial Return Support - Rule 11) *
                  </label>
                  {selectedIssue && (
                    <span className="text-[10px] text-slate-500">
                      Outstanding: {selectedIssue.outstandingQuantity}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedIssue?.outstandingQuantity || 1}
                  value={quantityReturned}
                  onChange={(e) => setQuantityReturned(parseInt(e.target.value) || 1)}
                  disabled={!selectedIssue || selectedIssue.trackingType === 'INDIVIDUAL_ASSET'}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 font-semibold text-slate-800"
                  required
                />
                {selectedIssue && quantityReturned < selectedIssue.outstandingQuantity && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
                    Partial return: {selectedIssue.outstandingQuantity - quantityReturned} unit(s) will continue as outstanding with the student.
                  </p>
                )}
              </div>

              {/* Condition Inspection (Rules 9 & 10) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition On Return (Mandatory Inspection) *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setConditionOnReturn('USABLE')}
                    className={`p-2 rounded-lg border font-medium text-left transition-all ${
                      conditionOnReturn === 'USABLE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Usable (Good)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Restores available stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConditionOnReturn('DAMAGED')}
                    className={`p-2 rounded-lg border font-medium text-left transition-all ${
                      conditionOnReturn === 'DAMAGED'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Damaged</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Remains unavailable (Rule 10)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConditionOnReturn('IN_MAINTENANCE')}
                    className={`p-2 rounded-lg border font-medium text-left transition-all ${
                      conditionOnReturn === 'IN_MAINTENANCE'
                        ? 'border-purple-600 bg-purple-50 text-purple-800 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-purple-600" />
                      <span>Needs Maint</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Moves to repair queue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConditionOnReturn('RETIRED')}
                    className={`p-2 rounded-lg border font-medium text-left transition-all ${
                      conditionOnReturn === 'RETIRED'
                        ? 'border-slate-600 bg-slate-100 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Scrapped/Lost</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Written off department pool</span>
                  </button>
                </div>
              </div>

              {/* Return Date & Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receiving Staff *
                  </label>
                  <input
                    type="text"
                    value={receivingStaff}
                    onChange={(e) => setReceivingStaff(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition Remarks / Inspection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cables tested and coils verified; headers in clean condition."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedIssueId}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Return & Update Stock Status</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Outstanding Loans Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Active Outstanding Loans Awaiting Return
              </h2>
              <p className="text-xs text-slate-500">
                Click "Select for Return" to quickly inspect and check in any borrowed item.
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="pb-2">Student Borrower</th>
                  <th className="pb-2">Item & Asset ID</th>
                  <th className="pb-2 text-center">Outstanding</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching active loans found.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((iss) => {
                    const isItemOverdue = isOverdue(iss.dueDate, systemDate);
                    const overdueDays = getOverdueDays(iss.dueDate, systemDate);
                    const isSelected = selectedIssueId === iss.id;

                    return (
                      <tr 
                        key={iss.id} 
                        className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/70' : ''}`}
                      >
                        <td className="py-3 font-semibold text-slate-800">
                          <div>{iss.studentName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{iss.studentEnrolment}</div>
                        </td>

                        <td className="py-3 font-medium text-slate-700">
                          <div>{iss.itemName}</div>
                          {iss.assetId ? (
                            <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                              {iss.assetId}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">{iss.itemCode}</span>
                          )}
                        </td>

                        <td className="py-3 text-center font-bold text-slate-800">
                          {iss.outstandingQuantity} {iss.returnedQuantity > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal block">
                              ({iss.returnedQuantity} returned)
                            </span>
                          )}
                        </td>

                        <td className="py-3">
                          <div className="font-mono font-medium">{formatDisplayDate(iss.dueDate)}</div>
                          <div className="text-[10px] text-slate-400">Issued: {formatDisplayDate(iss.issueDate)}</div>
                        </td>

                        <td className="py-3">
                          {isItemOverdue ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Overdue ({overdueDays}d)
                            </span>
                          ) : iss.status === 'PARTIALLY_RETURNED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Partial Return
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="py-3 text-right">
                          <button
                            onClick={() => setSelectedIssueId(iss.id)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Return History Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Completed & Recorded Return Receipts (Rule 12 Audit Log)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="pb-2">Return Date</th>
                <th className="pb-2">Borrower</th>
                <th className="pb-2">Item Returned</th>
                <th className="pb-2 text-center">Quantity</th>
                <th className="pb-2">Condition on Return</th>
                <th className="pb-2">Receiving Coordinator</th>
                <th className="pb-2">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono text-slate-600 text-[11px]">
                    {formatDisplayDate(ret.returnDate)}
                  </td>
                  <td className="py-2.5 font-medium text-slate-800">
                    {ret.studentName}
                  </td>
                  <td className="py-2.5 font-medium text-slate-700">
                    {ret.itemName}
                    {ret.assetId && <span className="ml-1 text-[11px] font-mono text-slate-500">({ret.assetId})</span>}
                  </td>
                  <td className="py-2.5 text-center font-bold text-slate-800">
                    {ret.quantityReturned} {ret.isPartial && <span className="text-[10px] text-amber-600">(Partial)</span>}
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ret.conditionOnReturn === 'USABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      ret.conditionOnReturn === 'DAMAGED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {ret.conditionOnReturn}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600 text-[11px]">
                    {ret.receivingStaff}
                  </td>
                  <td className="py-2.5 text-slate-500 text-[11px] italic max-w-xs truncate">
                    {ret.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
