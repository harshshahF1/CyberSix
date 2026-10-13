import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  GraduationCap, 
  Mail, 
  Phone, 
  BookOpen, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  History
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { Student, IssueRecord } from '../../types/inventory';
import { formatDisplayDate } from '../../utils/dateUtils';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('ALL');

  // Register Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    enrolmentNumber: '',
    programme: 'M.Sc. DFIS',
    semester: 'Semester I',
    email: '',
    phone: '',
    maxBorrowLimit: 3,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Student Detail Inspection Modal
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  const loadData = () => {
    setStudents(InventoryStore.getStudents());
    setIssues(InventoryStore.getIssues());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('inventory-store-updated', loadData);
    return () => window.removeEventListener('inventory-store-updated', loadData);
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError('Student full name is required.');
      return;
    }
    if (!formData.enrolmentNumber?.trim()) {
      setFormError('Enrolment number is required (e.g. DFIS26006).');
      return;
    }

    const res = InventoryStore.saveStudent(formData);
    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setIsModalOpen(false);
    setFormData({
      name: '',
      enrolmentNumber: '',
      programme: 'M.Sc. DFIS',
      semester: 'Semester I',
      email: '',
      phone: '',
      maxBorrowLimit: 3,
    });
    loadData();
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrolmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProg = programmeFilter === 'ALL' || s.programme === programmeFilter;
    return matchesSearch && matchesProg;
  });

  const studentBorrowHistory = selectedStudentForHistory 
    ? issues.filter(i => i.studentId === selectedStudentForHistory.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Student Registry & Loan Entitlement</h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {students.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforces Mandatory Rule 1: Items can be issued only to verified registered students in the department.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, enrolment number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500">Programme:</span>
          <select
            value={programmeFilter}
            onChange={(e) => setProgrammeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Programmes</option>
            <option value="M.Sc. DFIS">M.Sc. DFIS</option>
            <option value="B.Tech CS">B.Tech CS</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Student Details</th>
                <th className="py-3 px-4">Enrolment Number</th>
                <th className="py-3 px-4">Programme & Semester</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Active Loans / Limit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No students matched the search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const isLimitReached = stu.activeBorrowCount >= stu.maxBorrowLimit;
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {stu.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Univ Student ID: {stu.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {stu.enrolmentNumber}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-700">{stu.programme}</div>
                        <div className="text-[11px] text-slate-400">{stu.semester}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        <div>{stu.email}</div>
                        <div className="text-slate-400">{stu.phone}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          isLimitReached
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : stu.activeBorrowCount > 0
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {stu.activeBorrowCount} / {stu.maxBorrowLimit} Active
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForHistory(stu)}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Loan Records</span>
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

      {/* Student Loan History Modal */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[11px] font-mono text-blue-600 font-bold uppercase">
                  {selectedStudentForHistory.enrolmentNumber}
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedStudentForHistory.name} — Academic Loan Records
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedStudentForHistory.programme} • {selectedStudentForHistory.semester}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {studentBorrowHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No equipment borrowing records on file for this student.
                </p>
              ) : (
                studentBorrowHistory.map((hist) => (
                  <div key={hist.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{hist.itemName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hist.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                        hist.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' :
                        hist.status === 'PARTIALLY_RETURNED' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {hist.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-4">
                      <span>Issued: <strong>{formatDisplayDate(hist.issueDate)}</strong></span>
                      <span>Due: <strong>{formatDisplayDate(hist.dueDate)}</strong></span>
                      {hist.assetId && <span>Asset: <strong className="font-mono text-blue-700">{hist.assetId}</strong></span>}
                      <span>Outstanding: <strong>{hist.outstandingQuantity}</strong></span>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      Purpose: {hist.purpose}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-800">Register New Student</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sanya Mukhopadhyay"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enrolment Number *</label>
                <input
                  type="text"
                  placeholder="e.g. DFIS26006"
                  value={formData.enrolmentNumber}
                  onChange={(e) => setFormData({ ...formData, enrolmentNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Programme *</label>
                  <select
                    value={formData.programme}
                    onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="M.Sc. DFIS">M.Sc. DFIS</option>
                    <option value="B.Tech CS">B.Tech CS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                    <option value="Semester III">Semester III</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. student@univ.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
