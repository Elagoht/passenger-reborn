import { Account } from '@prisma/client';

/**
 * Abstract base class for CSV export operations
 * Handles common CSV processing functionality
 */
abstract class CSVExporter {
  protected accounts: Account[];

  /**
   * Creates a new CSVExporter instance
   * @param accounts - The accounts to export
   */
  public constructor(accounts: Account[]) {
    this.accounts = accounts;
  }

  /**
   * Get the headers for the CSV file
   * Must be implemented by derived classes
   */
  protected abstract getHeaders(): string[];

  /**
   * Maps an account to a row in the CSV file
   * Must be implemented by derived classes
   */
  protected abstract mapAccount(account: Account): Record<string, string>;

  /**
   * Exports the accounts to a CSV string
   * @returns The CSV string
   */
  public export(): string {
    const headers = this.getHeaders();
    const rows = this.accounts.map((account) => this.mapAccount(account));

    // Create CSV content
    const headerRow = headers.join(',');
    const dataRows = rows.map((row) =>
      headers
        .map((header) => {
          // Escape values that contain commas or quotes
          const value = row[header] || '';
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(','),
    );

    return [headerRow, ...dataRows].join('\n');
  }
}

export default CSVExporter;
