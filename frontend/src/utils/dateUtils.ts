/**
 * Utility functions for date manipulation and due date calculations
 * Rule 5: Automatic due date = exactly 15 calendar days after issue date
 * Rule 8: Each approved renewal extends due date by 15 calendar days from existing due date
 */

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + 15); // Exactly 15 calendar days
  if (days !== 15) {
    const custom = parseDate(dateStr);
    custom.setDate(custom.getDate() + days);
    return formatDate(custom);
  }
  return formatDate(d);
}

export function calculateDueDate(issueDate: string): string {
  return addDays(issueDate, 15);
}

export function calculateRenewalDueDate(currentDueDate: string): string {
  return addDays(currentDueDate, 15);
}

export function getDaysDifference(targetDateStr: string, baseDateStr: string): number {
  const target = parseDate(targetDateStr).getTime();
  const base = parseDate(baseDateStr).getTime();
  const diffTime = target - base;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getOverdueDays(dueDateStr: string, currentDateStr: string): number {
  const diff = getDaysDifference(currentDateStr, dueDateStr);
  return diff > 0 ? diff : 0;
}

export function isOverdue(dueDateStr: string, currentDateStr: string): boolean {
  return getDaysDifference(currentDateStr, dueDateStr) > 0;
}

export function isDueSoon(dueDateStr: string, currentDateStr: string, withinDays: number = 3): boolean {
  const daysUntilDue = getDaysDifference(dueDateStr, currentDateStr);
  return daysUntilDue >= 0 && daysUntilDue <= withinDays;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
