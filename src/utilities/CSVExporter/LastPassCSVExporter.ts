import { Account } from '@prisma/client';
import CSVExporter from '.';

/**
 * LastPass-specific CSV exporter implementation
 */
class LastPassCSVExporter extends CSVExporter {
  protected getHeaders(): string[] {
    return ['url', 'username', 'password', 'extra', 'name', 'grouping', 'fav'];
  }

  protected mapAccount(account: Account): Record<string, string> {
    return {
      url: account.url || '',
      username: account.identity || '',
      password: account.passphrase || '',
      extra: account.note || '',
      name: account.platform || '',
      grouping: '',
      fav: '0',
    };
  }
}

export default LastPassCSVExporter;
