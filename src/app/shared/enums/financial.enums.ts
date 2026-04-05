/**
 * Financial Enums for Frontend
 */
export enum FinancialSide {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export function getFinancialSideLabel(side: FinancialSide | null | undefined): string {
  switch (side) {
    case FinancialSide.INCOME:
      return 'Income';
    case FinancialSide.EXPENSE:
      return 'Expense';
    default:
      return 'Unknown';
  }
}

export function getFinancialSideColor(side: FinancialSide | null | undefined): string {
  switch (side) {
    case FinancialSide.INCOME:
      return '#10b981'; // Green
    case FinancialSide.EXPENSE:
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}
