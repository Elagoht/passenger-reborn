import RequestCreateAccount from 'src/resources/accounts/schemas/requests/create';
import CSVImporter from '.';

/**
 * Firefox-specific CSV importer implementation
 */
class FirefoxCSVImporter extends CSVImporter {
  protected readonly requiredHeaders: string[] = [
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

  public mapRow(row: Record<string, string>): RequestCreateAccount {
    return {
      identity: row.username,
      platform: this.getPlatformByURL(row.url),
      url: row.url,
      passphrase: row.password,
      note: row.httpRealm,
    };
  }
}

export default FirefoxCSVImporter;
