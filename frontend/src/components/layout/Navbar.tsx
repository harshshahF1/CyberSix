import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  RotateCcw, 
  User, 
  Bell, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2, 
  ChevronDown,
  Menu
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { UserRole } from '../../types/inventory';
import { formatDisplayDate } from '../../utils/dateUtils';

interface NavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  selectedStudentId,
  setSelectedStudentId,
  onToggleSidebar,
}) => {
  const [systemDate, setSystemDate] = useState<string>(InventoryStore.getSystemDate());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const students = InventoryStore.getStudents();
  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];

  useEffect(() => {
    const handleDateUpdate = () => {
      setSystemDate(InventoryStore.getSystemDate());
    };
    window.addEventListener('inventory-system-date-changed', handleDateUpdate);
    return () => window.removeEventListener('inventory-system-date-changed', handleDateUpdate);
  }, []);

  const handleDateChange = (newDate: string) => {
    InventoryStore.setSystemDate(newDate);
    setSystemDate(newDate);
    setIsDatePickerOpen(false);
    showToast(`Simulation date updated to ${formatDisplayDate(newDate)}`);
  };

  const handleResetData = () => {
    if (confirm('Reset inventory database to the initial M.Sc. DFIS laboratory demonstration state?')) {
      InventoryStore.resetToDefaults();
      setSystemDate(InventoryStore.getSystemDate());
      showToast('Inventory database reset to M.Sc. DFIS initial state');
    }
  };

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-blue-50 text-blue-700 border border-blue-200">
                M.Sc. DFIS • Semester I
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-slate-800">
                Department of Digital Forensics & InfoSec
              </h2>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Equipment Inventory & 15-Day Loan Management System
            </p>
          </div>
        </div>

        {/* Right: Simulation Date, Reset Button & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Simulated Date Controller */}
          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium transition-colors"
              title="Click to test different simulation dates (e.g. Issue date 1 Oct, Due date 16 Oct, Overdue 19 Oct)"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline text-slate-500">System Date:</span>
              <span className="font-semibold text-slate-800">{formatDisplayDate(systemDate)}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Semester Date Simulator</span>
                  <span className="text-[10px] text-blue-600 font-normal">Test 15-day rules</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Fast-forward dates to test automatic overdue calculations, renewals, and reminders:
                </p>
                
                <div className="space-y-1 mb-3">
                  <button
                    onClick={() => handleDateChange('2026-10-01')}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-blue-50 text-slate-700 flex justify-between items-center"
                  >
                    <span>1 Oct 2026 (Issue Date)</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Day 1</span>
                  </button>
                  <button
                    onClick={() => handleDateChange('2026-10-15')}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-amber-50 text-slate-700 flex justify-between items-center"
                  >
                    <span>15 Oct 2026 (Due Tomorrow)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Upcoming</span>
                  </button>
                  <button
                    onClick={() => handleDateChange('2026-10-16')}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-amber-50 text-slate-700 flex justify-between items-center"
                  >
                    <span>16 Oct 2026 (Due Date)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">15-Day Due</span>
                  </button>
                  <button
                    onClick={() => handleDateChange('2026-10-19')}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-red-50 text-slate-700 flex justify-between items-center font-medium"
                  >
                    <span>19 Oct 2026 (3 Days Overdue)</span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Overdue</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] text-slate-500 mb-1">Custom Date:</label>
                  <input
                    type="date"
                    value={systemDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data */}
          <button
            onClick={handleResetData}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 transition-colors flex items-center gap-1.5"
            title="Reset to problem statement default data (M.Sc. DFIS 10 boards, 20 cables)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Seed Data</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setCurrentRole('COORDINATOR')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                currentRole === 'COORDINATOR'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Coordinator</span>
            </button>
            <button
              onClick={() => setCurrentRole('STUDENT')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                currentRole === 'STUDENT'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Student</span>
            </button>
          </div>

          {/* Student Account Selector (visible when in student mode) */}
          {currentRole === 'STUDENT' && (
            <div className="hidden sm:flex items-center">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.enrolmentNumber})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notificationMsg && (
        <div className="absolute top-16 right-6 bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}
    </header>
  );
};
