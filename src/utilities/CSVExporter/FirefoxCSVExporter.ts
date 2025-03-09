import { Account } from '@prisma/client';
import CSVExporter from '.';

/**
 * Firefox-specific CSV exporter implementation
 */
class FirefoxCSVExporter extends CSVExporter {
  protected getHeaders(): string[] {
    return [
      'url',
      'username',
      'password',
      'httpRealm',
      'formActionOrigin',
      'guid',
      'timeCreated',
      'timeLastUsed',
      'timePasswordChanged',
    ];
  }

  protected mapAccount(account: Account): Record<string, string> {
    const now = Math.floor(Date.now() / 1000).toString();

    return {
      url: account.url || '',
      username: account.identity || '',
      password: account.passphrase || '',
      httpRealm: account.note || '',
      formActionOrigin: '',
      guid: account.id || '',
      timeCreated: now,
      timeLastUsed: now,
      timePasswordChanged: now,
    };
  }
}

export default FirefoxCSVExporter;
