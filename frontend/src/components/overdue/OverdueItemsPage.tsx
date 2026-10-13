import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Send, 
  CheckCircle2, 
  ArrowDownLeft, 
  Calendar, 
  Mail, 
  ShieldAlert, 
  Search,
  Check
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { IssueRecord } from '../../types/inventory';
import { formatDisplayDate, getOverdueDays, isOverdue } from '../../utils/dateUtils';
import { PageId } from '../layout/Sidebar';

interface OverdueItemsPageProps {
  onNavigate: (page: PageId) => void;
}

export const OverdueItemsPage: React.FC<OverdueItemsPageProps> = ({ onNavigate }) => {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');
  const [reminderModalIssue, setReminderModalIssue] = useState<IssueRecord | null>(null);
  const [sentReminders, setSentReminders] = useState<string[]>([]);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadData = () => {
    setIssues(InventoryStore.getIssues());
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

  const overdueIssues = issues.filter(
    i => i.outstandingQuantity > 0 && isOverdue(i.dueDate, systemDate)
  );

  const handleSendReminder = (issue: IssueRecord) => {
    setSentReminders([...sentReminders, issue.id]);
    setReminderModalIssue(null);
    setNotificationMsg(`Official return reminder notice dispatched to ${issue.studentName} (${issue.studentEnrolment}).`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-600 text-white rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Overdue Items & Loan Violations</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {overdueIssues.length} Outstanding Violations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracks items exceeding 15 calendar days loan limit without return or approved renewal (Problem Statement Section 3).
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Active Simulation Date: <strong>{formatDisplayDate(systemDate)}</strong></span>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Main Overdue Alert Cards */}
      {overdueIssues.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Items Currently Overdue</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            All department hardware loans are within their 15-day borrowing window or have approved renewals in place.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueIssues.map((iss) => {
            const days = getOverdueDays(iss.dueDate, systemDate);
            const isReminderSent = sentReminders.includes(iss.id);

            return (
              <div 
                key={iss.id}
                className="bg-white rounded-xl border border-rose-200 shadow-xs p-5 relative overflow-hidden"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-600" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Structured text matching exact problem statement specification */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>OVERDUE BY {days} {days === 1 ? 'DAY' : 'DAYS'}</span>
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Ref: {iss.issueNumber}
                      </span>
                    </div>

                    {/* Official Statement Format */}
                    <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-100 text-xs text-slate-800 leading-relaxed font-medium">
                      “{iss.trackingType === 'INDIVIDUAL_ASSET' ? `${iss.itemName} (${iss.assetId})` : `${iss.outstandingQuantity} units of ${iss.itemName}`} issued to student enrolment number <strong className="font-mono text-rose-800 font-bold">{iss.studentEnrolment}</strong> was due on <span className="font-semibold underline">{formatDisplayDate(iss.dueDate)}</span> and is overdue by <span className="text-rose-700 font-bold">{days} {days === 1 ? 'day' : 'days'}</span>.”
                    </div>

                    {/* Metadata Details */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Student: <strong className="text-slate-700">{iss.studentName}</strong></span>
                      <span>•</span>
                      <span>Issued: {formatDisplayDate(iss.issueDate)}</span>
                      <span>•</span>
                      <span>Coordinator: {iss.issuingStaff}</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      onClick={() => setReminderModalIssue(iss)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                        isReminderSent
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isReminderSent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reminder Dispatched</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Notice</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onNavigate('returns')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Record Return</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reminder Notice Modal */}
      {reminderModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-600" />
              <span>Official Department Overdue Notice</span>
            </h3>

            <p className="text-xs text-slate-600 mb-3">
              Preview email notice to be dispatched to <strong>{reminderModalIssue.studentName}</strong>:
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2 mb-4 font-mono">
              <div className="text-[11px] text-slate-500">
                To: {reminderModalIssue.studentEnrolment.toLowerCase()}@univ.edu<br />
                Subject: URGENT: Overdue Hardware Return Notice - {reminderModalIssue.itemName}
              </div>
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-700 leading-relaxed font-sans">
                Dear {reminderModalIssue.studentName},<br /><br />
                Department records indicate that <strong>{reminderModalIssue.itemName} {reminderModalIssue.assetId ? `(${reminderModalIssue.assetId})` : ''}</strong> issued to you was due on <strong>{formatDisplayDate(reminderModalIssue.dueDate)}</strong> and is currently overdue.<br /><br />
                Please return this equipment immediately to Cyber Lab 102 to avoid suspension of department borrowing privileges.<br /><br />
                — Dr. S. K. Mehta (Coordinator)
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReminderModalIssue(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendReminder(reminderModalIssue)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
