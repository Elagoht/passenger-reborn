import { BadRequestException } from '@nestjs/common';
import RequestCreateAccount from 'src/resources/accounts/schemas/requests/create';
import CSV from '../CSV';

/**
 * Abstract base class for CSV import operations
 * Handles common CSV processing functionality
 */
abstract class CSVImporter {
  protected abstract readonly requiredHeaders: string[];
  private content: CSV;
  private requests: RequestCreateAccount[] = [];

  public constructor(content: CSV) {
    this.content = content;
  }

  /**
   * Get the required prisma object to create the accounts
   * **DOES NOT CREATE ANY ACCOUNTS**
   * Create accounts using the ORM
   * @returns The imported requests
   */
  public getImportedRequests(): RequestCreateAccount[] {
    this.checkHeaders();

    for (const row of this.content.getContent()) {
      const request = this.mapRow(row);
      this.requests.push(request);
    }

    return this.requests;
  }

  public getRequiredHeaders(): string[] {
    return this.requiredHeaders;
  }

  /**
   * Check if the required headers are present in the CSV
   * @throws BadRequestException if any required header is missing
   */
  private checkHeaders(): void {
    const headers = this.content.getHeaders();
    const missingHeaders = this.requiredHeaders.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Missing required headers: ${missingHeaders.join(', ')}`,
      );
    }
  }

  /**
   * Get the platform based on the URL,
   * simply returns the domain of the URL
   * @param url - The URL of the account
   * @returns The platform of the account
   */
  protected getPlatformByURL(url: string): string {
    try {
      return new URL(url).hostname ?? url;
    } catch {
      return url;
    }
  }

  /**
   * Maps a row from the CSV to a RequestCreateAccount object
   * Must be implemented by derived classes
   */
  protected abstract mapRow(row: object): RequestCreateAccount;
}

export default CSVImporter;
