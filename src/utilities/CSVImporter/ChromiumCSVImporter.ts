import RequestCreateAccount from 'src/resources/accounts/schemas/requests/create';
import CSVImporter from '.';

class ChromeCSVImporter extends CSVImporter {
  protected readonly requiredHeaders: string[] = [
    'name',
    'url',
    'username',
    'password',
  ];

  public mapRow(row: Record<string, string>): RequestCreateAccount {
    return {
      identity: row.username,
      platform: row.name ?? this.getPlatformByURL(row.url),
      url: row.url,
      passphrase: row.password,
      note: null,
      icon: null,
    };
  }
}

export default ChromeCSVImporter;
