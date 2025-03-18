import RequestCreateAccount from 'src/resources/accounts/schemas/requests/create';
import CSVImporter from '.';

class OnePasswordCSVImporter extends CSVImporter {
  protected readonly requiredHeaders: string[] = [
    'title',
    'website',
    'username',
    'password',
    'notes',
    'custom fields',
  ];

  public mapRow(row: Record<string, string>): RequestCreateAccount {
    return {
      identity: row.username,
      platform: this.getPlatformByURL(row.website),
      url: row.website,
      passphrase: row.password,
      note: row.notes,
      tags: null,
    };
  }
}
export default OnePasswordCSVImporter;
