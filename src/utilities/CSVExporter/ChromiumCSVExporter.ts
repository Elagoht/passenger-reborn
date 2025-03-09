import { Account } from '@prisma/client';
import CSVExporter from '.';

/**
 * Chromium-specific CSV exporter implementation
 */
class ChromiumCSVExporter extends CSVExporter {
  protected getHeaders(): string[] {
    return ['name', 'url', 'username', 'password'];
  }

  protected mapAccount(account: Account): Record<string, string> {
    return {
      name: account.platform || '',
      url: account.url || '',
      username: account.identity || '',
      password: account.passphrase || '',
    };
  }
}

export default ChromiumCSVExporter;
