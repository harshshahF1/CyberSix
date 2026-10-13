import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Download, Calendar, Hash } from 'lucide-react';
import { IssueRecord } from '../../types/inventory';
import { formatDisplayDate } from '../../utils/dateUtils';

interface AcknowledgementModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: IssueRecord | null;
}

export const AcknowledgementModal: React.FC<AcknowledgementModalProps> = ({
  isOpen,
  onClose,
  issue,
}) => {
  if (!isOpen || !issue) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 print:shadow-none print:border-none print:max-w-none">
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Official Equipment Issue Acknowledgement Generated</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs flex items-center gap-1 border border-slate-200"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Slip Content */}
        <div className="border-2 border-slate-800 rounded-lg p-5 bg-white space-y-4">
          {/* Slip Header */}
          <div className="text-center pb-3 border-b border-slate-300">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              Department of Digital Forensics & Information Security
            </div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              Hardware Laboratory Equipment Issue Slip
            </h2>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 mt-1 font-mono">
              <span>Slip No: <strong>{issue.issueNumber}</strong></span>
              <span>•</span>
              <span>Issue Date: <strong>{formatDisplayDate(issue.issueDate)}</strong></span>
            </div>
          </div>

          {/* Student & Borrowing Particulars */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Borrower Name</span>
              <div className="font-bold text-slate-800">{issue.studentName}</div>
              <div className="text-[11px] font-mono text-slate-600">Enrol: {issue.studentEnrolment}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Programme / Sem</span>
              <div className="font-semibold text-slate-800">M.Sc. DFIS</div>
              <div className="text-[11px] text-slate-600">Semester I Hardware Lab</div>
            </div>
          </div>

          {/* Issued Hardware Table */}
          <div className="border border-slate-200 rounded overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                <tr>
                  <th className="py-1.5 px-3">Item Description</th>
                  <th className="py-1.5 px-3">Asset / Code</th>
                  <th className="py-1.5 px-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {issue.itemName}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                    {issue.assetId ? `Asset ID: ${issue.assetId}` : issue.itemCode}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {issue.quantity}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Critical Mandatory Due Date Alert */}
          <div className="p-3 bg-blue-50 border-2 border-blue-600 rounded-lg text-center">
            <div className="text-[10px] uppercase font-bold tracking-wider text-blue-800">
              Mandatory 15-Day Return Due Date
            </div>
            <div className="text-lg font-black text-blue-900 my-0.5">
              {formatDisplayDate(issue.dueDate)}
            </div>
            <p className="text-[10px] text-blue-700 font-medium">
              Every issued item must be returned or renewed within 15 calendar days of its issue date.
            </p>
          </div>

          {/* Purpose & Notes */}
          <div className="text-[11px] text-slate-600 space-y-1">
            <div>
              <strong className="text-slate-700">Stated Purpose:</strong> {issue.purpose}
            </div>
            {issue.notes && (
              <div>
                <strong className="text-slate-700">Remarks:</strong> {issue.notes}
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-6 text-center text-xs border-t border-slate-300">
            <div>
              <div className="border-b border-dashed border-slate-400 mb-1 pb-4">
                <span className="font-serif italic text-slate-400">[Student Signature]</span>
              </div>
              <span className="text-[10px] text-slate-600 uppercase font-semibold">
                Borrower Acknowledgment
              </span>
            </div>

            <div>
              <div className="border-b border-dashed border-slate-400 mb-1 pb-4">
                <span className="font-semibold text-slate-800 text-[11px]">{issue.issuingStaff}</span>
              </div>
              <span className="text-[10px] text-slate-600 uppercase font-semibold">
                Authorized Lab Coordinator
              </span>
            </div>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="pt-4 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
