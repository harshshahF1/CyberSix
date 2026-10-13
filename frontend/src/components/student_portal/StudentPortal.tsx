import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  Tag, 
  Send, 
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { IssueRecord, RenewalRecord, ReturnRecord, Student } from '../../types/inventory';
import { formatDisplayDate, getDaysDifference, getOverdueDays, isOverdue } from '../../utils/dateUtils';

interface StudentPortalProps {
  studentId: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [myIssues, setMyIssues] = useState<IssueRecord[]>([]);
  const [myRenewals, setMyRenewals] = useState<RenewalRecord[]>([]);
  const [myReturns, setMyReturns] = useState<ReturnRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');

  // Renewal Modal
  const [renewalModalIssue, setRenewalModalIssue] = useState<IssueRecord | null>(null);
  const [renewalRemarks, setRenewalRemarks] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    const curStudent = InventoryStore.getStudentById(studentId);
    setStudent(curStudent || null);

    const allIssues = InventoryStore.getIssues();
    setMyIssues(allIssues.filter(i => i.studentId === studentId));

    const allRenewals = InventoryStore.getRenewals();
    setMyRenewals(allRenewals.filter(r => r.studentId === studentId));

    const allReturns = InventoryStore.getReturns();
    setMyReturns(allReturns.filter(r => r.studentId === studentId));

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
  }, [studentId]);

  const handleRequestRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalModalIssue || !student) return;

    const res = InventoryStore.requestRenewal({
      issueId: renewalModalIssue.id,
      studentId: student.id,
      remarks: renewalRemarks.trim() || 'Laboratory experiment extension requested by student.',
    });

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setRenewalModalIssue(null);
      setRenewalRemarks('');
      loadData();
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const activeIssues = myIssues.filter(i => i.outstandingQuantity > 0);
  const pastIssues = myIssues.filter(i => i.outstandingQuantity === 0);

  if (!student) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Welcome Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-800/30">
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{student.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {student.enrolmentNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.programme} • {student.semester} • Lab Borrowing Limit: {student.maxBorrowLimit} Items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Borrowing Slot</span>
            <span className="font-bold text-slate-800">
              {activeIssues.length} of {student.maxBorrowLimit} in use
            </span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Active Borrowed Items (The Core Requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">My Currently Borrowed Laboratory Equipment</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            System Date: {formatDisplayDate(systemDate)}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {activeIssues.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No active equipment loans</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Visit Cyber Lab 102 to request equipment from the coordinator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeIssues.map((iss) => {
                const isItemOverdue = isOverdue(iss.dueDate, systemDate);
                const overdueDays = getOverdueDays(iss.dueDate, systemDate);
                const daysRemaining = getDaysDifference(iss.dueDate, systemDate);
                const hasPendingRenewal = myRenewals.some(r => r.issueId === iss.id && r.status === 'PENDING');

                return (
                  <div 
                    key={iss.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between text-xs space-y-3 ${
                      isItemOverdue 
                        ? 'border-rose-300 bg-rose-50/40' 
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-sm text-slate-800">
                          {iss.itemName}
                        </span>
                        {isItemOverdue ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                            Overdue ({overdueDays}d)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                            {daysRemaining} Days Left
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1">
                        {iss.assetId && (
                          <div>Asset Tag: <strong className="font-mono text-blue-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{iss.assetId}</strong></div>
                        )}
                        <div>Outstanding Qty: <strong className="text-slate-800">{iss.outstandingQuantity}</strong></div>
                        <div>Purpose: <span className="italic text-slate-600">{iss.purpose}</span></div>
                      </div>
                    </div>

                    {/* Due Date Indicator Box */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">15-Day Due Date</span>
                        <span className={`font-mono font-bold ${isItemOverdue ? 'text-rose-700' : 'text-slate-800'}`}>
                          {formatDisplayDate(iss.dueDate)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Issue Date</span>
                        <span className="font-mono text-slate-600 text-[11px]">{formatDisplayDate(iss.issueDate)}</span>
                      </div>
                    </div>

                    {/* Action: Request 15-Day Renewal */}
                    <div className="pt-1">
                      {hasPendingRenewal ? (
                        <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between font-medium">
                          <span>Renewal Request Pending Coordinator Approval</span>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                      ) : (
                        <button
                          onClick={() => setRenewalModalIssue(iss)}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Request 15-Day Renewal (Rule 6)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: My Renewal Trackers & Return History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Renewal Status Tracker */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>My Renewal Requests Status (Rule 7 & 8)</span>
          </h3>

          <div className="space-y-2.5">
            {myRenewals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No renewal requests submitted.</p>
            ) : (
              myRenewals.map((ren) => (
                <div key={ren.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{ren.itemName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ren.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      ren.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {ren.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Requested: {formatDisplayDate(ren.requestDate)}</span>
                    <span>Revised Due: <strong className="font-mono text-emerald-700">{formatDisplayDate(ren.revisedDueDate || ren.proposedDueDate)}</strong></span>
                  </div>
                  {ren.remarks && (
                    <p className="text-[11px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-100">
                      Coordinator Remarks: "{ren.remarks}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Past Return Receipts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>My Completed Return Records</span>
          </h3>

          <div className="space-y-2.5">
            {myReturns.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No returned items on record yet.</p>
            ) : (
              myReturns.map((ret) => (
                <div key={ret.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{ret.itemName}</span>
                    <div className="text-[11px] text-slate-500">
                      Returned on {formatDisplayDate(ret.returnDate)} • Received by {ret.receivingStaff}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {ret.conditionOnReturn}
                    </span>
                    <div className="text-[11px] font-bold text-slate-700 mt-1">
                      {ret.quantityReturned} unit(s)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Renewal Request Submission Modal */}
      {renewalModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-base font-bold text-slate-800">Submit 15-Day Renewal Request</h3>
              <button
                onClick={() => setRenewalModalIssue(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs mb-4 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Mandatory Rule 7 & 8 Notice</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Submitting this request does <strong>not</strong> automatically extend your due date. The coordinator must review and approve it. If approved, your due date will extend by 15 calendar days from the existing due date.
              </p>
            </div>

            <form onSubmit={handleRequestRenewal} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Equipment to Renew:</span>
                <strong className="text-slate-800 text-sm">{renewalModalIssue.itemName} {renewalModalIssue.assetId ? `(${renewalModalIssue.assetId})` : ''}</strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Renewal / Academic Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Need to re-run embedded SPI firmware captures for Assignment 2 verification."
                  value={renewalRemarks}
                  onChange={(e) => setRenewalRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenewalModalIssue(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Request to Coordinator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
