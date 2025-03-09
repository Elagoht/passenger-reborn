import RequestCreateAccount from 'src/resources/accounts/schemas/requests/create';
import CSVImporter from '.';

class LastPassCSVImporter extends CSVImporter {
  protected readonly requiredHeaders: string[] = [
    'url',
    'username',
    'password',
    'extra',
    'name',
    'grouping',
    'fav',
  ];

  public mapRow(row: Record<string, string>): RequestCreateAccount {
    return {
      identity: row.username,
      platform: row.name ?? this.getPlatformByURL(row.url),
      url: row.url,
      passphrase: row.password,
      note: row.extra,
      icon: null,
    };
  }
}

export default LastPassCSVImporter;
