export type ItemTrackingType = 'INDIVIDUAL_ASSET' | 'QUANTITY_REUSABLE';

export type ItemCondition = 'USABLE' | 'DAMAGED' | 'IN_MAINTENANCE' | 'RETIRED';

export type IssueStatus = 'ACTIVE' | 'PARTIALLY_RETURNED' | 'RETURNED' | 'OVERDUE';

export type RenewalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type UserRole = 'COORDINATOR' | 'STUDENT';

export interface StorageLocation {
  id: string;
  department: string;
  laboratory: string;
  room: string;
  cupboard: string;
}

export interface IndividualAsset {
  id: string;
  itemId: string;
  assetId: string; // e.g. "DB-001"
  serialNumber?: string;
  location: string;
  condition: ItemCondition;
  status: 'AVAILABLE' | 'ISSUED' | 'IN_MAINTENANCE' | 'RETIRED';
  currentStudentId?: string;
  currentIssueId?: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string; // e.g. "DEV-BOARD-STM32", "USB-C-2M"
  name: string;
  category: string;
  description: string;
  makeModel: string;
  trackingType: ItemTrackingType;
  totalQuantity: number;
  availableQuantity: number;
  issuedQuantity: number;
  damagedQuantity: number;
  maintenanceQuantity: number;
  retiredQuantity: number;
  location: string; // e.g., "Embedded & Forensics Lab - Cupboard B-2"
  individualAssets?: IndividualAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  enrolmentNumber: string; // e.g. "DFIS26001"
  programme: string; // e.g. "M.Sc. DFIS"
  semester: string; // e.g. "Semester I"
  email: string;
  phone: string;
  activeBorrowCount: number;
  maxBorrowLimit: number; // e.g. 3
}

export interface IssueRecord {
  id: string;
  issueNumber: string; // e.g. "ISSUE-2026-001"
  studentId: string;
  studentName: string;
  studentEnrolment: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  trackingType: ItemTrackingType;
  assetId?: string; // If individually tracked, e.g. "DB-001"
  quantity: number;
  outstandingQuantity: number;
  returnedQuantity: number;
  purpose: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (calculated as issueDate + 15 calendar days)
  issuingStaff: string;
  status: IssueStatus;
  renewalCount: number;
  lastRenewalDate?: string;
  acknowledgementGenerated: boolean;
  notes?: string;
}

export interface ReturnRecord {
  id: string;
  issueId: string;
  studentId: string;
  studentName: string;
  itemId: string;
  itemName: string;
  assetId?: string;
  quantityReturned: number;
  returnDate: string;
  conditionOnReturn: ItemCondition;
  receivingStaff: string;
  remarks: string;
  isPartial: boolean;
}

export interface RenewalRecord {
  id: string;
  issueId: string;
  studentId: string;
  studentName: string;
  studentEnrolment: string;
  itemName: string;
  assetId?: string;
  requestDate: string;
  status: RenewalStatus;
  originalDueDate: string;
  proposedDueDate: string;
  revisedDueDate?: string;
  approvingStaff?: string;
  remarks?: string;
  requestedByStudentId: string;
}

export type StockAdjustmentType = 
  | 'NEW_STOCK'
  | 'CORRECTION_ADD'
  | 'CORRECTION_SUBTRACT'
  | 'DAMAGE_FLAG'
  | 'RESTORE_TO_USABLE'
  | 'RETIREMENT';

export interface StockAdjustmentRecord {
  id: string;
  itemId: string;
  itemName: string;
  assetId?: string;
  adjustmentType: StockAdjustmentType;
  quantity: number;
  reason: string;
  responsibleUser: string;
  timestamp: string;
}

export interface SystemUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  studentId?: string; // Links to Student if role is STUDENT
}
