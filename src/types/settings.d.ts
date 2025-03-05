type DeterminatedSetting = 'panicTagId' | 'strictMode';

type DeterminatedSettings = {
  [key in DeterminatedSetting]: string;
};
