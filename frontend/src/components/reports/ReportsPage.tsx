import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  Users, 
  Boxes, 
  Building2, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { InventoryItem, Student, IssueRecord, ReturnRecord } from '../../types/inventory';
import { formatDisplayDate, getOverdueDays, isOverdue } from '../../utils/dateUtils';

type ReportPerspective = 'STUDENT_WISE' | 'ITEM_WISE' | 'PROGRAMME_WISE' | 'LAB_WISE';

export const ReportsPage: React.FC = () => {
  const [perspective, setPerspective] = useState<ReportPerspective>('STUDENT_WISE');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');

  const loadData = () => {
    setItems(InventoryStore.getItems());
    setStudents(InventoryStore.getStudents());
    setIssues(InventoryStore.getIssues());
    setReturns(InventoryStore.getReturns());
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

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers = '';
    let rows: string[] = [];

    if (perspective === 'STUDENT_WISE') {
      headers = 'Enrolment No,Student Name,Programme,Active Loans,Item Code,Item Name,Asset ID,Issue Date,Due Date,Status';
      issues.forEach(iss => {
        rows.push(`"${iss.studentEnrolment}","${iss.studentName}","M.Sc. DFIS",${iss.outstandingQuantity},"${iss.itemCode}","${iss.itemName}","${iss.assetId || ''}","${iss.issueDate}","${iss.dueDate}","${iss.status}"`);
      });
    } else if (perspective === 'ITEM_WISE') {
      headers = 'Item Code,Item Name,Category,Tracking Type,Total Qty,Available Qty,Issued Qty,Damaged Qty,Location';
      items.forEach(itm => {
        rows.push(`"${itm.itemCode}","${itm.name}","${itm.category}","${itm.trackingType}",${itm.totalQuantity},${itm.availableQuantity},${itm.issuedQuantity},${itm.damagedQuantity || 0},"${itm.location}"`);
      });
    } else {
      headers = 'Ref No,Borrower,Item,Quantity,Issue Date,Due Date,Status';
      issues.forEach(iss => {
        rows.push(`"${iss.issueNumber}","${iss.studentName}","${iss.itemName}",${iss.quantity},"${iss.issueDate}","${iss.dueDate}","${iss.status}"`);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DFIS_Inventory_Report_${perspective}_${systemDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden in Print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Inventory Audit & Analytical Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export departmental records student-wise, item-wise, programme-wise, and laboratory-wise.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Perspective Tabs (Hidden in Print) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setPerspective('STUDENT_WISE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            perspective === 'STUDENT_WISE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student-Wise Audit</span>
        </button>

        <button
          onClick={() => setPerspective('ITEM_WISE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            perspective === 'ITEM_WISE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Item-Wise Balance</span>
        </button>

        <button
          onClick={() => setPerspective('PROGRAMME_WISE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            perspective === 'PROGRAMME_WISE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Programme-Wise</span>
        </button>

        <button
          onClick={() => setPerspective('LAB_WISE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            perspective === 'LAB_WISE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Laboratory-Wise Allocation</span>
        </button>
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Formal Report Header */}
        <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Department of Digital Forensics & Information Security
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase">
              Official Departmental Hardware Inventory & Loan Audit Report
            </h2>
            <p className="text-xs text-slate-600">
              Perspective: <strong className="text-blue-700">{perspective.replace('_', ' ')}</strong> • Report Generated: {formatDisplayDate(systemDate)}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Authorised Coordinator: <strong>Dr. S. K. Mehta</strong></div>
            <div className="text-[11px]">Academic Year 2026-27 • Semester I</div>
          </div>
        </div>

        {/* Perspective 1: STUDENT_WISE */}
        {perspective === 'STUDENT_WISE' && (
          <div className="space-y-6">
            {students.map((student) => {
              const studentIssues = issues.filter(i => i.studentId === student.id);
              const activeCount = studentIssues.filter(i => i.outstandingQuantity > 0).length;

              return (
                <div key={student.id} className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                      <span className="ml-2 font-mono text-blue-700 font-semibold">({student.enrolmentNumber})</span>
                      <span className="ml-3 text-slate-500 text-[11px]">{student.programme} • {student.semester}</span>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        activeCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {activeCount} Active Loan(s)
                      </span>
                    </div>
                  </div>

                  {studentIssues.length === 0 ? (
                    <div className="p-3 text-slate-400 italic text-[11px]">
                      No transaction history recorded for this student.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-100/60 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3">Asset ID / Code</th>
                          <th className="py-2 px-3 text-center">Qty Outstanding</th>
                          <th className="py-2 px-3">Issue Date</th>
                          <th className="py-2 px-3">Due Date</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentIssues.map((iss) => {
                          const isOver = isOverdue(iss.dueDate, systemDate);
                          const overdueDays = getOverdueDays(iss.dueDate, systemDate);
                          return (
                            <tr key={iss.id}>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{iss.itemName}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{iss.assetId || iss.itemCode}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-800">{iss.outstandingQuantity}</td>
                              <td className="py-2.5 px-3 font-mono">{formatDisplayDate(iss.issueDate)}</td>
                              <td className="py-2.5 px-3 font-mono font-medium">{formatDisplayDate(iss.dueDate)}</td>
                              <td className="py-2.5 px-3">
                                {isOver ? (
                                  <span className="font-bold text-rose-700">Overdue ({overdueDays}d)</span>
                                ) : iss.status === 'PARTIALLY_RETURNED' ? (
                                  <span className="font-semibold text-amber-700">Partial Return</span>
                                ) : (
                                  <span className="text-blue-700 font-medium">{iss.status}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Perspective 2: ITEM_WISE */}
        {perspective === 'ITEM_WISE' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item Code & Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Total</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-center">Issued</th>
                  <th className="py-3 px-4 text-center">Damaged</th>
                  <th className="py-3 px-4">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{i.name}</div>
                      <div className="font-mono text-blue-600 text-[11px]">{i.itemCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{i.category}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{i.totalQuantity}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{i.availableQuantity}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">{i.issuedQuantity}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-700">{(i.damagedQuantity || 0) + (i.maintenanceQuantity || 0)}</td>
                    <td className="py-3 px-4 text-slate-600">{i.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Perspective 3: PROGRAMME_WISE */}
        {perspective === 'PROGRAMME_WISE' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 mb-1">M.Sc. Digital Forensics & InfoSec (Semester I)</h3>
              <p className="text-slate-600 mb-3">Total Registered Candidates: 5 • Active Equipment Borrowers: 3</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Issued Assets</span>
                  <div className="text-xl font-bold text-blue-700">
                    {issues.filter(i => i.outstandingQuantity > 0).reduce((acc, i) => acc + i.outstandingQuantity, 0)} Units
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Overdue Violations</span>
                  <div className="text-xl font-bold text-rose-700">
                    {issues.filter(i => i.outstandingQuantity > 0 && isOverdue(i.dueDate, systemDate)).length} Loans
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Clean Returns</span>
                  <div className="text-xl font-bold text-emerald-700">
                    {returns.length} Transactions
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Perspective 4: LAB_WISE */}
        {perspective === 'LAB_WISE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {InventoryStore.getLocations().map((loc) => {
              const labItems = items.filter(i => i.location.includes(loc.laboratory) || i.location.includes(loc.cupboard));
              return (
                <div key={loc.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900">{loc.laboratory}</h4>
                      <p className="text-[11px] text-slate-500">Room {loc.room} • {loc.cupboard}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {labItems.length} Equipment Types
                    </span>
                  </div>

                  <ul className="space-y-1 text-[11px] text-slate-700">
                    {labItems.map(item => (
                      <li key={item.id} className="flex justify-between py-1 border-b border-slate-100 last:border-none">
                        <span>{item.name}</span>
                        <span className="font-mono font-bold">{item.availableQuantity}/{item.totalQuantity} avail</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Report Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Official University Records System • Department of Digital Forensics & InfoSec</span>
          <span>Certified by: Dr. S. K. Mehta (Authorised Inventory Coordinator)</span>
        </div>
      </div>
    </div>
  );
};
