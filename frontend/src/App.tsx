/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { CoordinatorDashboard } from './components/dashboard/CoordinatorDashboard';
import { InventoryList } from './components/inventory/InventoryList';
import { IssueItemPage } from './components/issue/IssueItemPage';
import { ReturnsPage } from './components/returns/ReturnsPage';
import { RenewalManagementPage } from './components/renewals/RenewalManagementPage';
import { OverdueItemsPage } from './components/overdue/OverdueItemsPage';
import { StudentManagement } from './components/students/StudentManagement';
import { StockAdjustmentPage } from './components/stock/StockAdjustmentPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { StudentPortal } from './components/student_portal/StudentPortal';
import { LoginPage } from './components/auth/LoginPage';
import { UserRole } from './types/inventory';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('COORDINATOR');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-01'); // Rahul Sharma
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preselectedItemId, setPreselectedItemId] = useState<string | undefined>(undefined);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Handle role switch from top navbar or login
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'STUDENT') {
      setCurrentPage('student-portal');
    } else {
      if (currentPage === 'student-portal') {
        setCurrentPage('dashboard');
      }
    }
  };

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreselectIssueItem = (itemId: string) => {
    setPreselectedItemId(itemId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Navy Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={handleNavigate}
        currentRole={currentRole}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (offset by 64px on lg for sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Navbar
          currentRole={currentRole}
          setCurrentRole={handleRoleChange}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Page Routing */}
          {currentPage === 'dashboard' && currentRole === 'COORDINATOR' && (
            <CoordinatorDashboard 
              onNavigate={handleNavigate} 
              onOpenIssueModal={() => handleNavigate('issue')}
              onOpenReturnModal={() => handleNavigate('returns')}
              onOpenItemModal={() => handleNavigate('inventory')}
            />
          )}

          {currentPage === 'inventory' && (
            <InventoryList
              onNavigate={handleNavigate}
              onPreselectIssueItem={handlePreselectIssueItem}
            />
          )}

          {currentPage === 'issue' && (
            <IssueItemPage preselectedItemId={preselectedItemId} />
          )}

          {currentPage === 'returns' && (
            <ReturnsPage />
          )}

          {currentPage === 'renewals' && (
            <RenewalManagementPage />
          )}

          {currentPage === 'overdue' && (
            <OverdueItemsPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'students' && (
            <StudentManagement />
          )}

          {currentPage === 'stock-adjust' && (
            <StockAdjustmentPage />
          )}

          {currentPage === 'reports' && (
            <ReportsPage />
          )}

          {currentPage === 'student-portal' && (
            <StudentPortal studentId={selectedStudentId} />
          )}
        </main>
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginPage
          onLogin={(role, studentId) => {
            setCurrentRole(role);
            if (studentId) setSelectedStudentId(studentId);
            if (role === 'STUDENT') setCurrentPage('student-portal');
            else setCurrentPage('dashboard');
            setIsLoginModalOpen(false);
          }}
          onCancel={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}
