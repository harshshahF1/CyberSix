import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  User,
  Shield,
  KeyRound
} from 'lucide-react';
import { UserRole } from '../../types/inventory';
import { InventoryStore } from '../../services/inventoryStore';

interface LoginPageProps {
  onLogin: (role: UserRole, studentId?: string) => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('COORDINATOR');
  const [username, setUsername] = useState('coordinator@dfis.univ.edu');
  const [password, setPassword] = useState('password123');
  const [selectedStudentId, setSelectedStudentId] = useState('stu-01');

  const students = InventoryStore.getStudents();

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'COORDINATOR') {
      setUsername('coordinator@dfis.univ.edu');
    } else {
      setUsername('DFIS26001');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'COORDINATOR') {
      onLogin('COORDINATOR');
    } else {
      onLogin('STUDENT', selectedStudentId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Navy Header */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-xl bg-blue-600 mx-auto flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-900/60">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold tracking-tight">University Portal Authentication</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Department of Digital Forensics & Information Security
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => handleRoleTabChange('COORDINATOR')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'COORDINATOR'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Coordinator Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('STUDENT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'STUDENT'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Student Portal</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {selectedRole === 'COORDINATOR' ? (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Coordinator Institutional Email
                  </label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Authorised staff: Dr. S. K. Mehta</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department Security Key
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Registered Student Account
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.enrolmentNumber}) • {s.programme} [{s.activeBorrowCount} active loans]
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Rahul Sharma has pre-loaded 15-day loans matching Problem Statement #5.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Student Portal PIN / Password
                  </label>
                  <input
                    type="password"
                    value="••••••••"
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>Login to {selectedRole === 'COORDINATOR' ? 'Coordinator Dashboard' : 'Student Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {onCancel && (
            <div className="mt-3 text-center">
              <button
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Continue browsing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
