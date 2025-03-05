type HIBPLeak = {
  logo: string;
  name: string;
  title: string;
  domain: string;
  date: string;
  pwnCount: number;
  verified: boolean;
};

type HIBPLeakListItem = HIBPLeak & { id: string };

type HIBPLeakRaw = {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  LogoPath: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  IsMalware: boolean;
  IsSubscriptionFree: boolean;
  IsStealerLog: boolean;
};

type HIBPLeaksDB = Map<string, HIBPLeakListItem>;
