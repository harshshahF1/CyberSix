import { 
  InventoryItem, 
  IndividualAsset, 
  Student, 
  IssueRecord, 
  ReturnRecord, 
  RenewalRecord, 
  StockAdjustmentRecord, 
  StorageLocation,
  ItemCondition,
  StockAdjustmentType
} from '../types/inventory';
import { calculateDueDate, calculateRenewalDueDate, isOverdue } from '../utils/dateUtils';

const STORAGE_KEYS = {
  ITEMS: 'msc_dfis_inventory_items',
  STUDENTS: 'msc_dfis_inventory_students',
  ISSUES: 'msc_dfis_inventory_issues',
  RETURNS: 'msc_dfis_inventory_returns',
  RENEWALS: 'msc_dfis_inventory_renewals',
  ADJUSTMENTS: 'msc_dfis_inventory_adjustments',
  LOCATIONS: 'msc_dfis_inventory_locations',
  SYSTEM_DATE: 'msc_dfis_system_date',
};

// Seed 10 development boards DB-001 through DB-010
const seedDevelopmentBoardAssets: IndividualAsset[] = Array.from({ length: 10 }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  const assetId = `DB-${num}`;
  const isIssued = i === 0; // DB-001 is issued to Rahul Sharma
  return {
    id: `asset-db-${i + 1}`,
    itemId: 'item-dev-board-01',
    assetId: assetId,
    serialNumber: `SN-STM32-2026-${num}`,
    location: 'Cyber Lab 102 - Cupboard B-1',
    condition: 'USABLE',
    status: isIssued ? 'ISSUED' : 'AVAILABLE',
    currentStudentId: isIssued ? 'stu-01' : undefined,
    currentIssueId: isIssued ? 'issue-01' : undefined,
  };
});

const defaultLocations: StorageLocation[] = [
  { id: 'loc-1', department: 'DFIS', laboratory: 'Cyber Lab 102', room: '102', cupboard: 'Cupboard B-1' },
  { id: 'loc-2', department: 'DFIS', laboratory: 'Embedded & Forensics Lab', room: '103', cupboard: 'Cupboard A-2' },
  { id: 'loc-3', department: 'DFIS', laboratory: 'Hardware Lab', room: '104', cupboard: 'Shelf C' },
  { id: 'loc-4', department: 'DFIS', laboratory: 'Department Secure Vault', room: '101', cupboard: 'Forensics Safe' },
];

const defaultItems: InventoryItem[] = [
  {
    id: 'item-dev-board-01',
    itemCode: 'DB-STM32-ARM',
    name: 'STM32 ARM Cortex Development Board',
    category: 'Development Boards',
    description: 'Hardware security & embedded forensics dev boards with ARM Cortex-M4 microcontroller.',
    makeModel: 'STMicroelectronics NUCLEO-F446RE',
    trackingType: 'INDIVIDUAL_ASSET',
    totalQuantity: 10,
    availableQuantity: 9, // 1 issued to Rahul Sharma (DB-001)
    issuedQuantity: 1,
    damagedQuantity: 0,
    maintenanceQuantity: 0,
    retiredQuantity: 0,
    location: 'Cyber Lab 102 - Cupboard B-1',
    individualAssets: seedDevelopmentBoardAssets,
    createdAt: '2026-09-15',
    updatedAt: '2026-10-01',
  },
  {
    id: 'item-usb-cable-01',
    itemCode: 'CBL-USB-C2M',
    name: 'Reusable USB-C to USB-A Cable (2m)',
    category: 'Cables & Adapters',
    description: 'High-speed braided data and debugging cables for embedded targets.',
    makeModel: 'Anker PowerLine+ 2.0m',
    trackingType: 'QUANTITY_REUSABLE',
    totalQuantity: 20,
    availableQuantity: 18, // 2 issued to Rahul Sharma
    issuedQuantity: 2,
    damagedQuantity: 0,
    maintenanceQuantity: 0,
    retiredQuantity: 0,
    location: 'Hardware Lab 104 - Shelf C',
    createdAt: '2026-09-15',
    updatedAt: '2026-10-01',
  },
  {
    id: 'item-logic-analyzer-01',
    itemCode: 'LA-24MHZ-8CH',
    name: 'USB 8-Channel Logic Analyzer 24MHz',
    category: 'Test & Measurement',
    description: 'Hardware protocol sniffing analyzer for I2C, SPI, and UART digital forensics.',
    makeModel: 'Saleae Compatible 24MHz Logic Pro',
    trackingType: 'INDIVIDUAL_ASSET',
    totalQuantity: 5,
    availableQuantity: 4,
    issuedQuantity: 1,
    damagedQuantity: 0,
    maintenanceQuantity: 0,
    retiredQuantity: 0,
    location: 'Embedded & Forensics Lab - Cupboard A-2',
    individualAssets: [
      { id: 'la-1', itemId: 'item-logic-analyzer-01', assetId: 'LA-001', location: 'Cupboard A-2', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'la-2', itemId: 'item-logic-analyzer-01', assetId: 'LA-002', location: 'Cupboard A-2', condition: 'USABLE', status: 'ISSUED', currentStudentId: 'stu-02', currentIssueId: 'issue-03' },
      { id: 'la-3', itemId: 'item-logic-analyzer-01', assetId: 'LA-003', location: 'Cupboard A-2', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'la-4', itemId: 'item-logic-analyzer-01', assetId: 'LA-004', location: 'Cupboard A-2', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'la-5', itemId: 'item-logic-analyzer-01', assetId: 'LA-005', location: 'Cupboard A-2', condition: 'USABLE', status: 'AVAILABLE' },
    ],
    createdAt: '2026-09-15',
    updatedAt: '2026-10-10',
  },
  {
    id: 'item-serial-adapter-01',
    itemCode: 'ADP-FTDI-UART',
    name: 'USB-TTL FTDI Serial Converter',
    category: 'Cables & Adapters',
    description: '3.3V/5V FT232RL USB to TTL serial transceiver module for serial console debugging.',
    makeModel: 'FTDI Chip FT232RL',
    trackingType: 'QUANTITY_REUSABLE',
    totalQuantity: 15,
    availableQuantity: 14,
    issuedQuantity: 1, // 1 outstanding from Priya Patel (originally 3, returned 2 partial)
    damagedQuantity: 0,
    maintenanceQuantity: 0,
    retiredQuantity: 0,
    location: 'Hardware Lab 104 - Shelf C',
    createdAt: '2026-09-15',
    updatedAt: '2026-10-02',
  },
  {
    id: 'item-yubikey-01',
    itemCode: 'SEC-YUBIKEY-5NFC',
    name: 'YubiKey 5 NFC Hardware Token',
    category: 'Security Tokens',
    description: 'FIDO2 / U2F cryptographic hardware security key for biometric and smart card labs.',
    makeModel: 'Yubico 5 Series NFC',
    trackingType: 'INDIVIDUAL_ASSET',
    totalQuantity: 8,
    availableQuantity: 7,
    issuedQuantity: 0,
    damagedQuantity: 1,
    maintenanceQuantity: 0,
    retiredQuantity: 0,
    location: 'Department Secure Vault - Forensics Safe',
    individualAssets: [
      { id: 'yk-1', itemId: 'item-yubikey-01', assetId: 'YK-001', location: 'Vault 101', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'yk-2', itemId: 'item-yubikey-01', assetId: 'YK-002', location: 'Vault 101', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'yk-3', itemId: 'item-yubikey-01', assetId: 'YK-003', location: 'Vault 101', condition: 'DAMAGED', status: 'IN_MAINTENANCE' },
      { id: 'yk-4', itemId: 'item-yubikey-01', assetId: 'YK-004', location: 'Vault 101', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'yk-5', itemId: 'item-yubikey-01', assetId: 'YK-005', location: 'Vault 101', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'yk-6', itemId: 'item-yubikey-01', assetId: 'YK-006', location: 'Vault 101', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'yk-7', itemId: 'item-yubikey-01', assetId: 'YK-007', location: 'Vault 101', condition: 'USABLE', status: 'AVAILABLE' },
      { id: 'yk-8', itemId: 'item-yubikey-01', assetId: 'YK-008', location: 'Vault 101', condition: 'USABLE', status: 'AVAILABLE' },
    ],
    createdAt: '2026-09-15',
    updatedAt: '2026-09-25',
  }
];

const defaultStudents: Student[] = [
  {
    id: 'stu-01',
    name: 'Rahul Sharma',
    enrolmentNumber: 'DFIS26001',
    programme: 'M.Sc. DFIS',
    semester: 'Semester I',
    email: 'rahul.sharma@univ.edu',
    phone: '+91 98765 43210',
    activeBorrowCount: 2, // 1 board + 2 cables
    maxBorrowLimit: 3,
  },
  {
    id: 'stu-02',
    name: 'Ananya Iyer',
    enrolmentNumber: 'DFIS26002',
    programme: 'M.Sc. DFIS',
    semester: 'Semester I',
    email: 'ananya.iyer@univ.edu',
    phone: '+91 98765 43211',
    activeBorrowCount: 1, // 1 logic analyzer
    maxBorrowLimit: 3,
  },
  {
    id: 'stu-03',
    name: 'Priya Patel',
    enrolmentNumber: 'DFIS26003',
    programme: 'M.Sc. DFIS',
    semester: 'Semester I',
    email: 'priya.patel@univ.edu',
    phone: '+91 98765 43212',
    activeBorrowCount: 1, // 1 serial adapter remaining (partial return done)
    maxBorrowLimit: 3,
  },
  {
    id: 'stu-04',
    name: 'Vikramaditya Verma',
    enrolmentNumber: 'DFIS26004',
    programme: 'M.Sc. DFIS',
    semester: 'Semester I',
    email: 'vikram.verma@univ.edu',
    phone: '+91 98765 43213',
    activeBorrowCount: 0,
    maxBorrowLimit: 3,
  },
  {
    id: 'stu-05',
    name: 'Rohit Deshmukh',
    enrolmentNumber: 'DFIS26005',
    programme: 'M.Sc. DFIS',
    semester: 'Semester I',
    email: 'rohit.deshmukh@univ.edu',
    phone: '+91 98765 43214',
    activeBorrowCount: 0,
    maxBorrowLimit: 3,
  }
];

// Preloaded issue matching the exact problem statement:
// A student (Rahul Sharma) is issued one development board (DB-001) and two USB cables on 1 October 2026.
// Due date: 16 October 2026.
const defaultIssues: IssueRecord[] = [
  {
    id: 'issue-01',
    issueNumber: 'ISS-2026-1001',
    studentId: 'stu-01',
    studentName: 'Rahul Sharma',
    studentEnrolment: 'DFIS26001',
    itemId: 'item-dev-board-01',
    itemName: 'STM32 ARM Cortex Development Board',
    itemCode: 'DB-STM32-ARM',
    trackingType: 'INDIVIDUAL_ASSET',
    assetId: 'DB-001',
    quantity: 1,
    outstandingQuantity: 1,
    returnedQuantity: 0,
    purpose: 'Embedded Firmware Forensics Lab 1 Assignment',
    issueDate: '2026-10-01',
    dueDate: '2026-10-16', // 15 calendar days from 1 Oct
    issuingStaff: 'Dr. S. K. Mehta (Coordinator)',
    status: 'ACTIVE',
    renewalCount: 0,
    acknowledgementGenerated: true,
    notes: 'Issued in pristine condition for M.Sc. DFIS Sem I lab work.',
  },
  {
    id: 'issue-02',
    issueNumber: 'ISS-2026-1002',
    studentId: 'stu-01',
    studentName: 'Rahul Sharma',
    studentEnrolment: 'DFIS26001',
    itemId: 'item-usb-cable-01',
    itemName: 'Reusable USB-C to USB-A Cable (2m)',
    itemCode: 'CBL-USB-C2M',
    trackingType: 'QUANTITY_REUSABLE',
    quantity: 2,
    outstandingQuantity: 2,
    returnedQuantity: 0,
    purpose: 'Board interconnect & debugging power link',
    issueDate: '2026-10-01',
    dueDate: '2026-10-16', // 15 calendar days from 1 Oct
    issuingStaff: 'Dr. S. K. Mehta (Coordinator)',
    status: 'ACTIVE',
    renewalCount: 0,
    acknowledgementGenerated: true,
    notes: '2 braided cables issued together with dev board.',
  },
  {
    id: 'issue-03',
    issueNumber: 'ISS-2026-1003',
    studentId: 'stu-02',
    studentName: 'Ananya Iyer',
    studentEnrolment: 'DFIS26002',
    itemId: 'item-logic-analyzer-01',
    itemName: 'USB 8-Channel Logic Analyzer 24MHz',
    itemCode: 'LA-24MHZ-8CH',
    trackingType: 'INDIVIDUAL_ASSET',
    assetId: 'LA-002',
    quantity: 1,
    outstandingQuantity: 1,
    returnedQuantity: 0,
    purpose: 'SPI Bus packet capture analysis project',
    issueDate: '2026-10-05',
    dueDate: '2026-10-20',
    issuingStaff: 'Dr. S. K. Mehta (Coordinator)',
    status: 'ACTIVE',
    renewalCount: 0,
    acknowledgementGenerated: true,
  },
  {
    id: 'issue-04',
    issueNumber: 'ISS-2026-1004',
    studentId: 'stu-03',
    studentName: 'Priya Patel',
    studentEnrolment: 'DFIS26003',
    itemId: 'item-serial-adapter-01',
    itemName: 'USB-TTL FTDI Serial Converter',
    itemCode: 'ADP-FTDI-UART',
    trackingType: 'QUANTITY_REUSABLE',
    quantity: 3,
    outstandingQuantity: 1,
    returnedQuantity: 2,
    purpose: 'Multi-port serial communication test harness',
    issueDate: '2026-09-20',
    dueDate: '2026-10-05',
    issuingStaff: 'Dr. S. K. Mehta (Coordinator)',
    status: 'PARTIALLY_RETURNED',
    renewalCount: 0,
    acknowledgementGenerated: true,
    notes: '2 returned on 2 Oct; 1 adapter still outstanding with student.',
  }
];

const defaultReturns: ReturnRecord[] = [
  {
    id: 'ret-01',
    issueId: 'issue-04',
    studentId: 'stu-03',
    studentName: 'Priya Patel',
    itemId: 'item-serial-adapter-01',
    itemName: 'USB-TTL FTDI Serial Converter',
    quantityReturned: 2,
    returnDate: '2026-10-02',
    conditionOnReturn: 'USABLE',
    receivingStaff: 'Dr. S. K. Mehta',
    remarks: 'Partial return of 2 adapters in clean condition. 1 remaining outstanding.',
    isPartial: true,
  }
];

// Preloaded pending renewal request for Rahul Sharma's cables (issue-02)
const defaultRenewals: RenewalRecord[] = [
  {
    id: 'ren-01',
    issueId: 'issue-02',
    studentId: 'stu-01',
    studentName: 'Rahul Sharma',
    studentEnrolment: 'DFIS26001',
    itemName: 'Reusable USB-C to USB-A Cable (2m)',
    requestDate: '2026-10-14',
    status: 'PENDING',
    originalDueDate: '2026-10-16',
    proposedDueDate: '2026-10-31', // +15 days from original due date
    requestedByStudentId: 'stu-01',
    remarks: 'Require additional 15 days to finish final firmware verification in Lab 102.',
  }
];

const defaultAdjustments: StockAdjustmentRecord[] = [
  {
    id: 'adj-01',
    itemId: 'item-dev-board-01',
    itemName: 'STM32 ARM Cortex Development Board',
    adjustmentType: 'NEW_STOCK',
    quantity: 10,
    reason: 'Initial procurement for M.Sc. DFIS Semester I Embedded Forensics Lab.',
    responsibleUser: 'Dr. S. K. Mehta (Coordinator)',
    timestamp: '2026-09-15 10:30',
  },
  {
    id: 'adj-02',
    itemId: 'item-usb-cable-01',
    itemName: 'Reusable USB-C to USB-A Cable (2m)',
    adjustmentType: 'NEW_STOCK',
    quantity: 20,
    reason: 'Department stock purchase - 20 reusable cables.',
    responsibleUser: 'Dr. S. K. Mehta (Coordinator)',
    timestamp: '2026-09-15 11:00',
  },
  {
    id: 'adj-03',
    itemId: 'item-yubikey-01',
    itemName: 'YubiKey 5 NFC Hardware Token',
    assetId: 'YK-003',
    adjustmentType: 'DAMAGE_FLAG',
    quantity: 1,
    reason: 'NFC chip failure discovered during pre-session audit. Marked for maintenance.',
    responsibleUser: 'Dr. S. K. Mehta (Coordinator)',
    timestamp: '2026-09-25 14:15',
  }
];

// Reference date for simulated university semester: 19 October 2026
// This makes issues from 1 Oct (due 16 Oct) overdue by 3 days, exactly matching the problem statement prompt!
const DEFAULT_SYSTEM_DATE = '2026-10-19';

export class InventoryStore {
  private static load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(`Error loading ${key}`, e);
    }
    return fallback;
  }

  private static save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key}`, e);
    }
  }

  // System Date
  static getSystemDate(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_DATE);
    return saved || DEFAULT_SYSTEM_DATE;
  }

  static setSystemDate(dateStr: string): void {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_DATE, dateStr);
    window.dispatchEvent(new Event('inventory-system-date-changed'));
  }

  // Items
  static getItems(): InventoryItem[] {
    return this.load<InventoryItem[]>(STORAGE_KEYS.ITEMS, defaultItems);
  }

  static saveItems(items: InventoryItem[]): void {
    this.save(STORAGE_KEYS.ITEMS, items);
  }

  static getItemById(id: string): InventoryItem | undefined {
    return this.getItems().find(i => i.id === id);
  }

  // Students
  static getStudents(): Student[] {
    return this.load<Student[]>(STORAGE_KEYS.STUDENTS, defaultStudents);
  }

  static saveStudents(students: Student[]): void {
    this.save(STORAGE_KEYS.STUDENTS, students);
  }

  static getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  // Issues
  static getIssues(): IssueRecord[] {
    const currentDate = this.getSystemDate();
    const issues = this.load<IssueRecord[]>(STORAGE_KEYS.ISSUES, defaultIssues);
    // Dynamically update status to OVERDUE if outstanding and past due date
    return issues.map(iss => {
      if (iss.outstandingQuantity > 0 && isOverdue(iss.dueDate, currentDate)) {
        return { ...iss, status: 'OVERDUE' };
      }
      return iss;
    });
  }

  static saveIssues(issues: IssueRecord[]): void {
    this.save(STORAGE_KEYS.ISSUES, issues);
  }

  // Returns
  static getReturns(): ReturnRecord[] {
    return this.load<ReturnRecord[]>(STORAGE_KEYS.RETURNS, defaultReturns);
  }

  static saveReturns(returns: ReturnRecord[]): void {
    this.save(STORAGE_KEYS.RETURNS, returns);
  }

  // Renewals
  static getRenewals(): RenewalRecord[] {
    return this.load<RenewalRecord[]>(STORAGE_KEYS.RENEWALS, defaultRenewals);
  }

  static saveRenewals(renewals: RenewalRecord[]): void {
    this.save(STORAGE_KEYS.RENEWALS, renewals);
  }

  // Adjustments
  static getAdjustments(): StockAdjustmentRecord[] {
    return this.load<StockAdjustmentRecord[]>(STORAGE_KEYS.ADJUSTMENTS, defaultAdjustments);
  }

  static saveAdjustments(adj: StockAdjustmentRecord[]): void {
    this.save(STORAGE_KEYS.ADJUSTMENTS, adj);
  }

  // Locations
  static getLocations(): StorageLocation[] {
    return this.load<StorageLocation[]>(STORAGE_KEYS.LOCATIONS, defaultLocations);
  }

  static saveLocations(locs: StorageLocation[]): void {
    this.save(STORAGE_KEYS.LOCATIONS, locs);
  }

  // Reset database to pristine M.Sc. DFIS defaults
  static resetToDefaults(): void {
    this.save(STORAGE_KEYS.ITEMS, defaultItems);
    this.save(STORAGE_KEYS.STUDENTS, defaultStudents);
    this.save(STORAGE_KEYS.ISSUES, defaultIssues);
    this.save(STORAGE_KEYS.RETURNS, defaultReturns);
    this.save(STORAGE_KEYS.RENEWALS, defaultRenewals);
    this.save(STORAGE_KEYS.ADJUSTMENTS, defaultAdjustments);
    this.save(STORAGE_KEYS.LOCATIONS, defaultLocations);
    this.save(STORAGE_KEYS.SYSTEM_DATE, DEFAULT_SYSTEM_DATE);
    window.dispatchEvent(new Event('inventory-store-updated'));
  }

  // Core Business Action: Issue Item
  // Rule 1: Registered students only
  // Rule 2: Only available items in usable condition
  // Rule 3: Issued quantity cannot exceed available stock
  // Rule 4: Individually tracked asset cannot be issued to more than one student
  // Rule 5: Automatically calculate due date as 15 calendar days after issue date
  static issueItem(params: {
    studentId: string;
    itemId: string;
    assetId?: string;
    quantity: number;
    purpose: string;
    issueDate: string;
    issuingStaff: string;
    notes?: string;
  }): { success: boolean; message: string; issueRecord?: IssueRecord } {
    const students = this.getStudents();
    const items = this.getItems();
    const student = students.find(s => s.id === params.studentId);
    const item = items.find(i => i.id === params.itemId);

    if (!student) {
      return { success: false, message: 'Mandatory Rule 1 Failed: Student is not registered in the department system.' };
    }

    if (!item) {
      return { success: false, message: 'Item not found in inventory catalog.' };
    }

    if (params.quantity <= 0) {
      return { success: false, message: 'Requested quantity must be at least 1.' };
    }

    if (item.availableQuantity < params.quantity) {
      return {
        success: false,
        message: `Stock Unavailable: ${params.quantity} ${item.name} were requested, but only ${item.availableQuantity} are currently available.`
      };
    }

    // Individual asset validations
    if (item.trackingType === 'INDIVIDUAL_ASSET') {
      if (!params.assetId) {
        return { success: false, message: 'Please select a specific Asset ID for individually tracked equipment.' };
      }
      const asset = item.individualAssets?.find(a => a.assetId === params.assetId);
      if (!asset) {
        return { success: false, message: `Asset ID ${params.assetId} does not exist for this item.` };
      }
      if (asset.status !== 'AVAILABLE' || asset.condition !== 'USABLE') {
        return { 
          success: false, 
          message: `Mandatory Rule 4 Failed: Asset ${params.assetId} is currently ${asset.status} (condition: ${asset.condition}) and cannot be issued.` 
        };
      }
    }

    // Check student borrowing limit
    if (student.activeBorrowCount + 1 > student.maxBorrowLimit) {
      return {
        success: false,
        message: `Student borrow limit exceeded: ${student.name} has already reached the maximum limit of ${student.maxBorrowLimit} active loans.`
      };
    }

    // Calculate due date: 15 calendar days
    const dueDate = calculateDueDate(params.issueDate);
    const issueId = `issue-${Date.now()}`;
    const issueNumber = `ISS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIssue: IssueRecord = {
      id: issueId,
      issueNumber,
      studentId: student.id,
      studentName: student.name,
      studentEnrolment: student.enrolmentNumber,
      itemId: item.id,
      itemName: item.name,
      itemCode: item.itemCode,
      trackingType: item.trackingType,
      assetId: params.assetId,
      quantity: params.quantity,
      outstandingQuantity: params.quantity,
      returnedQuantity: 0,
      purpose: params.purpose,
      issueDate: params.issueDate,
      dueDate,
      issuingStaff: params.issuingStaff,
      status: 'ACTIVE',
      renewalCount: 0,
      acknowledgementGenerated: true,
      notes: params.notes,
    };

    // Update Item stock
    item.availableQuantity -= params.quantity;
    item.issuedQuantity += params.quantity;
    item.updatedAt = params.issueDate;

    if (item.trackingType === 'INDIVIDUAL_ASSET' && params.assetId && item.individualAssets) {
      const asset = item.individualAssets.find(a => a.assetId === params.assetId);
      if (asset) {
        asset.status = 'ISSUED';
        asset.currentStudentId = student.id;
        asset.currentIssueId = issueId;
      }
    }

    // Update Student loan count
    student.activeBorrowCount += 1;

    // Save
    const issues = this.getIssues();
    issues.unshift(newIssue);
    this.saveIssues(issues);
    this.saveItems(items);
    this.saveStudents(students);

    // Log adjustment audit trail
    const adjustments = this.getAdjustments();
    adjustments.unshift({
      id: `adj-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      assetId: params.assetId,
      adjustmentType: 'CORRECTION_SUBTRACT',
      quantity: params.quantity,
      reason: `Issued to ${student.name} (${student.enrolmentNumber}) for ${params.purpose}. Due: ${dueDate}`,
      responsibleUser: params.issuingStaff,
      timestamp: `${params.issueDate} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    });
    this.saveAdjustments(adjustments);

    window.dispatchEvent(new Event('inventory-store-updated'));
    return { 
      success: true, 
      message: `Item successfully issued to ${student.name}. Due date set to ${dueDate} (15 calendar days).`,
      issueRecord: newIssue 
    };
  }

  // Core Business Action: Record Return
  // Rule 9: Returned items become available only after receipt and condition are recorded
  // Rule 10: Damaged or maintenance items remain unavailable until coordinator updates status
  // Rule 11: Partial returns supported, with remaining quantity continuing as outstanding
  // Rule 12: Audit logged with date and responsible staff
  static recordReturn(params: {
    issueId: string;
    quantityReturned: number;
    returnDate: string;
    conditionOnReturn: ItemCondition;
    receivingStaff: string;
    remarks: string;
  }): { success: boolean; message: string } {
    const issues = this.getIssues();
    const items = this.getItems();
    const students = this.getStudents();

    const issue = issues.find(i => i.id === params.issueId);
    if (!issue) {
      return { success: false, message: 'Issue record not found.' };
    }

    if (params.quantityReturned <= 0) {
      return { success: false, message: 'Return quantity must be greater than 0.' };
    }

    if (params.quantityReturned > issue.outstandingQuantity) {
      return {
        success: false,
        message: `Invalid return quantity: Student has ${issue.outstandingQuantity} outstanding, but ${params.quantityReturned} was entered.`
      };
    }

    const item = items.find(i => i.id === issue.itemId);
    if (!item) {
      return { success: false, message: 'Associated inventory item record not found.' };
    }

    const isPartial = params.quantityReturned < issue.outstandingQuantity;
    issue.returnedQuantity += params.quantityReturned;
    issue.outstandingQuantity -= params.quantityReturned;

    if (issue.outstandingQuantity === 0) {
      issue.status = 'RETURNED';
      // Decrement student active loan count
      const student = students.find(s => s.id === issue.studentId);
      if (student && student.activeBorrowCount > 0) {
        student.activeBorrowCount -= 1;
      }
    } else {
      issue.status = 'PARTIALLY_RETURNED';
    }

    // Update item stock counts based on condition
    item.issuedQuantity -= params.quantityReturned;
    if (params.conditionOnReturn === 'USABLE') {
      // Rule 9: Only restored to available if usable
      item.availableQuantity += params.quantityReturned;
    } else if (params.conditionOnReturn === 'DAMAGED') {
      // Rule 10: Damaged remains unavailable
      item.damagedQuantity = (item.damagedQuantity || 0) + params.quantityReturned;
    } else if (params.conditionOnReturn === 'IN_MAINTENANCE') {
      // Rule 10: Maintenance remains unavailable
      item.maintenanceQuantity = (item.maintenanceQuantity || 0) + params.quantityReturned;
    } else if (params.conditionOnReturn === 'RETIRED') {
      item.retiredQuantity = (item.retiredQuantity || 0) + params.quantityReturned;
    }

    // If individual asset, update asset status
    if (item.trackingType === 'INDIVIDUAL_ASSET' && issue.assetId && item.individualAssets) {
      const asset = item.individualAssets.find(a => a.assetId === issue.assetId);
      if (asset) {
        asset.condition = params.conditionOnReturn;
        asset.status = params.conditionOnReturn === 'USABLE' ? 'AVAILABLE' : 'IN_MAINTENANCE';
        if (issue.outstandingQuantity === 0) {
          asset.currentStudentId = undefined;
          asset.currentIssueId = undefined;
        }
      }
    }

    // Create Return Record
    const returns = this.getReturns();
    const returnRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      issueId: issue.id,
      studentId: issue.studentId,
      studentName: issue.studentName,
      itemId: item.id,
      itemName: item.name,
      assetId: issue.assetId,
      quantityReturned: params.quantityReturned,
      returnDate: params.returnDate,
      conditionOnReturn: params.conditionOnReturn,
      receivingStaff: params.receivingStaff,
      remarks: params.remarks,
      isPartial,
    };
    returns.unshift(returnRecord);

    // Save
    this.saveIssues(issues);
    this.saveItems(items);
    this.saveStudents(students);
    this.saveReturns(returns);

    // Audit log
    const adjustments = this.getAdjustments();
    adjustments.unshift({
      id: `adj-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      assetId: issue.assetId,
      adjustmentType: params.conditionOnReturn === 'USABLE' ? 'CORRECTION_ADD' : 'DAMAGE_FLAG',
      quantity: params.quantityReturned,
      reason: `Return recorded from ${issue.studentName} (${params.conditionOnReturn} condition). Remarks: ${params.remarks}`,
      responsibleUser: params.receivingStaff,
      timestamp: `${params.returnDate} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    });
    this.saveAdjustments(adjustments);

    window.dispatchEvent(new Event('inventory-store-updated'));
    return {
      success: true,
      message: isPartial
        ? `Partial return of ${params.quantityReturned} unit(s) recorded. ${issue.outstandingQuantity} unit(s) remain outstanding.`
        : `Complete return of ${item.name} successfully recorded. Condition: ${params.conditionOnReturn}.`
    };
  }

  // Core Business Action: Request Renewal (by Student)
  // Rule 6: Students must return or obtain approved renewal by due date
  // Rule 7: Submitting alone does not extend due date
  static requestRenewal(params: {
    issueId: string;
    studentId: string;
    remarks: string;
  }): { success: boolean; message: string } {
    const issues = this.getIssues();
    const issue = issues.find(i => i.id === params.issueId);
    if (!issue) {
      return { success: false, message: 'Issue record not found.' };
    }

    if (issue.studentId !== params.studentId) {
      return { success: false, message: 'Unauthorized: You can only renew items issued to your student account.' };
    }

    if (issue.outstandingQuantity <= 0) {
      return { success: false, message: 'This item has already been fully returned.' };
    }

    const renewals = this.getRenewals();
    const existingPending = renewals.find(r => r.issueId === issue.id && r.status === 'PENDING');
    if (existingPending) {
      return { success: false, message: 'A renewal request is already pending coordinator approval for this item.' };
    }

    if (issue.renewalCount >= 2) {
      return { success: false, message: 'Maximum renewal limit (2 times) reached for this loan. Please return the item.' };
    }

    const proposedDueDate = calculateRenewalDueDate(issue.dueDate);
    const currentDate = this.getSystemDate();

    const renewalRecord: RenewalRecord = {
      id: `ren-${Date.now()}`,
      issueId: issue.id,
      studentId: issue.studentId,
      studentName: issue.studentName,
      studentEnrolment: issue.studentEnrolment,
      itemName: issue.itemName,
      assetId: issue.assetId,
      requestDate: currentDate,
      status: 'PENDING',
      originalDueDate: issue.dueDate,
      proposedDueDate,
      remarks: params.remarks,
      requestedByStudentId: params.studentId,
    };

    renewals.unshift(renewalRecord);
    this.saveRenewals(renewals);
    window.dispatchEvent(new Event('inventory-store-updated'));

    return {
      success: true,
      message: `Renewal request submitted. Current due date remains ${issue.dueDate} until approved by the coordinator (Rule 7).`
    };
  }

  // Core Business Action: Review Renewal (by Coordinator)
  // Rule 8: Approved renewal extends due date by 15 calendar days from existing due date
  // Rule 7: If rejected, due date remains unchanged
  static reviewRenewal(params: {
    renewalId: string;
    approve: boolean;
    remarks: string;
    approvingStaff: string;
  }): { success: boolean; message: string } {
    const renewals = this.getRenewals();
    const renewal = renewals.find(r => r.id === params.renewalId);
    if (!renewal) {
      return { success: false, message: 'Renewal request not found.' };
    }

    const issues = this.getIssues();
    const issue = issues.find(i => i.id === renewal.issueId);
    if (!issue) {
      return { success: false, message: 'Associated issue record not found.' };
    }

    const currentDate = this.getSystemDate();

    if (params.approve) {
      // Rule 8: Extend due date by 15 calendar days from current due date
      const newDueDate = calculateRenewalDueDate(issue.dueDate);
      issue.dueDate = newDueDate;
      issue.renewalCount += 1;
      issue.lastRenewalDate = currentDate;
      // If was previously overdue, recalculate against current date
      if (isOverdue(newDueDate, currentDate)) {
        issue.status = 'OVERDUE';
      } else {
        issue.status = 'ACTIVE';
      }

      renewal.status = 'APPROVED';
      renewal.revisedDueDate = newDueDate;
      renewal.approvingStaff = params.approvingStaff;
      renewal.remarks = params.remarks;

      this.saveIssues(issues);
      this.saveRenewals(renewals);

      // Audit log
      const adjustments = this.getAdjustments();
      adjustments.unshift({
        id: `adj-${Date.now()}`,
        itemId: issue.itemId,
        itemName: issue.itemName,
        assetId: issue.assetId,
        adjustmentType: 'CORRECTION_ADD',
        quantity: 0,
        reason: `Renewal approved for ${issue.studentName}. Due date extended by 15 days to ${newDueDate}. Remarks: ${params.remarks}`,
        responsibleUser: params.approvingStaff,
        timestamp: `${currentDate} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      });
      this.saveAdjustments(adjustments);

      window.dispatchEvent(new Event('inventory-store-updated'));
      return {
        success: true,
        message: `Renewal approved! Due date extended by 15 calendar days to ${newDueDate}.`
      };
    } else {
      // Rejected: due date unchanged
      renewal.status = 'REJECTED';
      renewal.approvingStaff = params.approvingStaff;
      renewal.remarks = params.remarks;

      this.saveRenewals(renewals);
      window.dispatchEvent(new Event('inventory-store-updated'));
      return {
        success: true,
        message: `Renewal rejected. Original due date (${issue.dueDate}) remains in effect.`
      };
    }
  }

  // Stock Adjustment (New stock, damage flag, correction, retirement)
  static adjustStock(params: {
    itemId: string;
    assetId?: string;
    adjustmentType: StockAdjustmentType;
    quantity: number;
    reason: string;
    responsibleUser: string;
  }): { success: boolean; message: string } {
    const items = this.getItems();
    const item = items.find(i => i.id === params.itemId);
    if (!item) {
      return { success: false, message: 'Item not found.' };
    }

    const currentDate = this.getSystemDate();

    switch (params.adjustmentType) {
      case 'NEW_STOCK':
        item.totalQuantity += params.quantity;
        item.availableQuantity += params.quantity;
        // If individual asset and assetId given, add to individualAssets
        if (item.trackingType === 'INDIVIDUAL_ASSET' && params.assetId) {
          if (!item.individualAssets) item.individualAssets = [];
          item.individualAssets.push({
            id: `asset-${Date.now()}`,
            itemId: item.id,
            assetId: params.assetId,
            location: item.location,
            condition: 'USABLE',
            status: 'AVAILABLE'
          });
        }
        break;

      case 'CORRECTION_ADD':
        item.totalQuantity += params.quantity;
        item.availableQuantity += params.quantity;
        break;

      case 'CORRECTION_SUBTRACT':
        if (item.availableQuantity < params.quantity) {
          return { success: false, message: `Cannot reduce: Only ${item.availableQuantity} available in usable stock.` };
        }
        item.totalQuantity -= params.quantity;
        item.availableQuantity -= params.quantity;
        break;

      case 'DAMAGE_FLAG':
        if (item.availableQuantity < params.quantity) {
          return { success: false, message: `Only ${item.availableQuantity} available to flag as damaged.` };
        }
        item.availableQuantity -= params.quantity;
        item.damagedQuantity = (item.damagedQuantity || 0) + params.quantity;
        if (item.trackingType === 'INDIVIDUAL_ASSET' && params.assetId && item.individualAssets) {
          const asset = item.individualAssets.find(a => a.assetId === params.assetId);
          if (asset) {
            asset.condition = 'DAMAGED';
            asset.status = 'IN_MAINTENANCE';
          }
        }
        break;

      case 'RESTORE_TO_USABLE':
        if ((item.damagedQuantity || 0) + (item.maintenanceQuantity || 0) < params.quantity) {
          return { success: false, message: 'Quantity exceeds currently damaged or maintenance stock.' };
        }
        if (item.damagedQuantity >= params.quantity) {
          item.damagedQuantity -= params.quantity;
        } else {
          item.maintenanceQuantity -= params.quantity;
        }
        item.availableQuantity += params.quantity;
        if (item.trackingType === 'INDIVIDUAL_ASSET' && params.assetId && item.individualAssets) {
          const asset = item.individualAssets.find(a => a.assetId === params.assetId);
          if (asset) {
            asset.condition = 'USABLE';
            asset.status = 'AVAILABLE';
          }
        }
        break;

      case 'RETIREMENT':
        if (item.availableQuantity < params.quantity) {
          return { success: false, message: `Cannot retire: Available quantity is less than ${params.quantity}.` };
        }
        item.totalQuantity -= params.quantity;
        item.availableQuantity -= params.quantity;
        item.retiredQuantity = (item.retiredQuantity || 0) + params.quantity;
        if (item.trackingType === 'INDIVIDUAL_ASSET' && params.assetId && item.individualAssets) {
          const asset = item.individualAssets.find(a => a.assetId === params.assetId);
          if (asset) {
            asset.condition = 'RETIRED';
            asset.status = 'RETIRED';
          }
        }
        break;
    }

    item.updatedAt = currentDate;
    this.saveItems(items);

    const adjustments = this.getAdjustments();
    adjustments.unshift({
      id: `adj-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      assetId: params.assetId,
      adjustmentType: params.adjustmentType,
      quantity: params.quantity,
      reason: params.reason,
      responsibleUser: params.responsibleUser,
      timestamp: `${currentDate} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    });
    this.saveAdjustments(adjustments);

    window.dispatchEvent(new Event('inventory-store-updated'));
    return { success: true, message: `Stock adjustment (${params.adjustmentType}) successfully applied.` };
  }

  // Add / Edit Inventory item
  static saveItem(itemData: Partial<InventoryItem>): { success: boolean; message: string; item?: InventoryItem } {
    const items = this.getItems();
    const currentDate = this.getSystemDate();

    if (itemData.id) {
      // Edit existing
      const index = items.findIndex(i => i.id === itemData.id);
      if (index === -1) return { success: false, message: 'Item not found' };
      
      const existing = items[index];
      const updated: InventoryItem = {
        ...existing,
        ...itemData,
        updatedAt: currentDate,
      } as InventoryItem;

      items[index] = updated;
      this.saveItems(items);
      window.dispatchEvent(new Event('inventory-store-updated'));
      return { success: true, message: `Item "${updated.name}" updated successfully.`, item: updated };
    } else {
      // Create new
      const newItemId = `item-${Date.now()}`;
      const totalQty = itemData.totalQuantity || 1;
      
      let individualAssets: IndividualAsset[] = [];
      if (itemData.trackingType === 'INDIVIDUAL_ASSET') {
        const prefix = itemData.itemCode?.split('-')[0] || 'AST';
        individualAssets = Array.from({ length: totalQty }, (_, i) => ({
          id: `asset-${newItemId}-${i + 1}`,
          itemId: newItemId,
          assetId: `${prefix}-${String(i + 1).padStart(3, '0')}`,
          location: itemData.location || 'Department Store',
          condition: 'USABLE',
          status: 'AVAILABLE',
        }));
      }

      const newItem: InventoryItem = {
        id: newItemId,
        itemCode: itemData.itemCode || `ITM-${Date.now().toString().slice(-4)}`,
        name: itemData.name || 'Untitled Item',
        category: itemData.category || 'General Equipment',
        description: itemData.description || '',
        makeModel: itemData.makeModel || '',
        trackingType: itemData.trackingType || 'QUANTITY_REUSABLE',
        totalQuantity: totalQty,
        availableQuantity: totalQty,
        issuedQuantity: 0,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        retiredQuantity: 0,
        location: itemData.location || 'Cyber Lab 102',
        individualAssets: itemData.trackingType === 'INDIVIDUAL_ASSET' ? individualAssets : undefined,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      items.unshift(newItem);
      this.saveItems(items);
      window.dispatchEvent(new Event('inventory-store-updated'));
      return { success: true, message: `Item "${newItem.name}" created with code ${newItem.itemCode}.`, item: newItem };
    }
  }

  // Add / Edit Student
  static saveStudent(studentData: Partial<Student>): { success: boolean; message: string } {
    const students = this.getStudents();
    if (studentData.id) {
      const idx = students.findIndex(s => s.id === studentData.id);
      if (idx === -1) return { success: false, message: 'Student record not found.' };
      students[idx] = { ...students[idx], ...studentData } as Student;
      this.saveStudents(students);
      window.dispatchEvent(new Event('inventory-store-updated'));
      return { success: true, message: `Student profile updated.` };
    } else {
      // Check duplicate enrolment
      if (students.some(s => s.enrolmentNumber.toLowerCase() === studentData.enrolmentNumber?.toLowerCase())) {
        return { success: false, message: `Enrolment number ${studentData.enrolmentNumber} is already registered.` };
      }
      const newStudent: Student = {
        id: `stu-${Date.now()}`,
        name: studentData.name || '',
        enrolmentNumber: studentData.enrolmentNumber || '',
        programme: studentData.programme || 'M.Sc. DFIS',
        semester: studentData.semester || 'Semester I',
        email: studentData.email || '',
        phone: studentData.phone || '',
        activeBorrowCount: 0,
        maxBorrowLimit: studentData.maxBorrowLimit || 3,
      };
      students.unshift(newStudent);
      this.saveStudents(students);
      window.dispatchEvent(new Event('inventory-store-updated'));
      return { success: true, message: `Student ${newStudent.name} (${newStudent.enrolmentNumber}) registered.` };
    }
  }
}
