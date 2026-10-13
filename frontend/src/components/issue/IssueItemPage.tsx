import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  Clock, 
  FileText, 
  Info,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { InventoryItem, Student, IssueRecord } from '../../types/inventory';
import { calculateDueDate, formatDisplayDate } from '../../utils/dateUtils';
import { AcknowledgementModal } from '../common/AcknowledgementModal';

interface IssueItemPageProps {
  preselectedItemId?: string;
}

export const IssueItemPage: React.FC<IssueItemPageProps> = ({ preselectedItemId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeIssues, setActiveIssues] = useState<IssueRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || '');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [purpose, setPurpose] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [issuingStaff, setIssuingStaff] = useState('Dr. S. K. Mehta (Coordinator)');
  const [notes, setNotes] = useState('');

  // UI State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedIssueSlip, setGeneratedIssueSlip] = useState<IssueRecord | null>(null);

  const loadData = () => {
    setStudents(InventoryStore.getStudents());
    const allItems = InventoryStore.getItems();
    setItems(allItems);
    setActiveIssues(InventoryStore.getIssues());
    const curDate = InventoryStore.getSystemDate();
    setSystemDate(curDate);
    if (!issueDate) {
      setIssueDate(curDate);
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

  useEffect(() => {
    if (preselectedItemId) {
      setSelectedItemId(preselectedItemId);
    }
  }, [preselectedItemId]);

  const selectedItem = items.find(i => i.id === selectedItemId);
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Available individual assets for selected item
  const availableAssets = selectedItem?.individualAssets?.filter(
    a => a.status === 'AVAILABLE' && a.condition === 'USABLE'
  ) || [];

  // Reset asset selection when item changes
  useEffect(() => {
    if (selectedItem?.trackingType === 'INDIVIDUAL_ASSET') {
      if (availableAssets.length > 0) {
        setSelectedAssetId(availableAssets[0].assetId);
      } else {
        setSelectedAssetId('');
      }
      setQuantity(1);
    } else {
      setSelectedAssetId('');
      setQuantity(1);
    }
  }, [selectedItemId]);

  // Calculated 15-day due date
  const calculatedDueDate = issueDate ? calculateDueDate(issueDate) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedStudentId) {
      setErrorMsg('Mandatory Rule 1: Please select a registered student.');
      return;
    }

    if (!selectedItemId) {
      setErrorMsg('Please select an inventory item to issue.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg('Please specify the academic or laboratory purpose.');
      return;
    }

    // Call store issue action
    const res = InventoryStore.issueItem({
      studentId: selectedStudentId,
      itemId: selectedItemId,
      assetId: selectedItem?.trackingType === 'INDIVIDUAL_ASSET' ? selectedAssetId : undefined,
      quantity: Number(quantity),
      purpose,
      issueDate,
      issuingStaff,
      notes,
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    if (res.issueRecord) {
      setGeneratedIssueSlip(res.issueRecord);
    }

    // Reset form fields
    setPurpose('');
    setNotes('');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Issue Items & 15-Day Loan Desk</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Enforces mandatory loan rules: Registered student verification, stock availability check, single-borrower asset assignment, and automatic 15 calendar days due date calculation.
        </p>
      </div>

      {/* Grid: Issue Form + Policy Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>New Equipment Issue Transaction</span>
            <span className="text-[11px] font-normal text-slate-500 font-mono">
              System Date: {formatDisplayDate(systemDate)}
            </span>
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Transaction Rejected</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Issue Successfully Processed</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Registered Student (Rule 1) *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                required
              >
                <option value="">-- Choose Registered Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.enrolmentNumber}) • {s.programme} - {s.semester} [{s.activeBorrowCount}/{s.maxBorrowLimit} active loans]
                  </option>
                ))}
              </select>

              {selectedStudent && (
                <div className="mt-2 p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-700">Enrolment:</span>{' '}
                    <span className="font-mono text-blue-700">{selectedStudent.enrolmentNumber}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-600">{selectedStudent.programme} ({selectedStudent.semester})</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      selectedStudent.activeBorrowCount >= selectedStudent.maxBorrowLimit
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedStudent.activeBorrowCount} / {selectedStudent.maxBorrowLimit} Active Loans
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Item Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Inventory Item (Rule 2: Usable Stock Only) *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                required
              >
                <option value="">-- Choose Hardware Item --</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id} disabled={i.availableQuantity <= 0}>
                    {i.name} ({i.itemCode}) — Available: {i.availableQuantity} of {i.totalQuantity} {i.availableQuantity <= 0 ? '[OUT OF STOCK]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* If Item is INDIVIDUAL_ASSET: Pick Asset ID */}
            {selectedItem?.trackingType === 'INDIVIDUAL_ASSET' && (
              <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-200">
                <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose Specific Asset ID (Rule 4: Single Student Assignment) *</span>
                </label>
                {availableAssets.length > 0 ? (
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono font-bold"
                    required
                  >
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.assetId}>
                        Asset ID: {asset.assetId} — Condition: {asset.condition} ({asset.location})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-rose-700 font-medium py-1">
                    No individual assets currently available in usable condition.
                  </div>
                )}
                <p className="text-[10px] text-indigo-700 mt-1">
                  This item is individually serialized. Quantity is locked to 1.
                </p>
              </div>
            )}

            {/* If Item is QUANTITY_REUSABLE: Enter Quantity */}
            {selectedItem?.trackingType === 'QUANTITY_REUSABLE' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Requested Quantity (Rule 3) *
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Available in stock: <strong className="text-emerald-600">{selectedItem.availableQuantity} units</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.availableQuantity || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                  required
                />
              </div>
            )}

            {/* Dates & Auto Due Calculation Display (Rule 5) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Issue Date *</span>
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Calculated Due Date (Rule 5)</span>
                </label>
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>{calculatedDueDate ? formatDisplayDate(calculatedDueDate) : '—'}</span>
                  <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded font-normal">
                    +15 Calendar Days
                  </span>
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lab Experiment / Project Purpose *
              </label>
              <input
                type="text"
                placeholder="e.g. Embedded Firmware Forensics Lab 2 or Capstone Project Verification"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Staff & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issuing Staff Member *
                </label>
                <input
                  type="text"
                  value={issuingStaff}
                  onChange={(e) => setIssuingStaff(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coordinator Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspected pristine condition"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Issue Hardware & Generate Acknowledgment Slip</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Policy Reference Checklist */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between text-xs space-y-4">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold mb-3 pb-2 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Mandatory Loan Policies Enforced</span>
            </div>

            <div className="space-y-3 text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-700">Registered Students Only:</strong> Unregistered or guest accounts are strictly prohibited from borrowing.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-700">Usable Stock Only:</strong> Items flagged as damaged or in maintenance are hidden from issue.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-700">Available Stock Limit:</strong> Issued quantity cannot exceed current available balance.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-700">Single Asset Assignment:</strong> Individually serialized assets cannot be assigned to more than one borrower simultaneously.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-slate-700">15-Day Rule:</strong> Every issued item must be returned or renewed within 15 calendar days of issue.
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Active Loans In Department
            </span>
            <div className="text-xl font-bold text-slate-800">
              {activeIssues.filter(i => i.outstandingQuantity > 0).length} Outstanding Issues
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across M.Sc. DFIS Semester I hardware courses
            </p>
          </div>
        </div>
      </div>

      {/* Printable Slip Modal */}
      <AcknowledgementModal
        isOpen={!!generatedIssueSlip}
        onClose={() => setGeneratedIssueSlip(null)}
        issue={generatedIssueSlip}
      />
    </div>
  );
};
