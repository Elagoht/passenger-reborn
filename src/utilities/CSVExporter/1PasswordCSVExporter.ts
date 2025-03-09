import { Account } from '@prisma/client';
import CSVExporter from '.';

/**
 * 1Password-specific CSV exporter implementation
 */
class OnePasswordCSVExporter extends CSVExporter {
  protected getHeaders(): string[] {
    return [
      'title',
      'website',
      'username',
      'password',
      'notes',
      'custom fields',
    ];
  }

  protected mapAccount(account: Account): Record<string, string> {
    return {
      title: account.platform || '',
      website: account.url || '',
      username: account.identity || '',
      password: account.passphrase || '',
      notes: account.note || '',
      'custom fields': '',
    };
  }
}

export default OnePasswordCSVExporter;
