type StrengthCheck = {
  check: (pass: string) => boolean;
  penalty: number;
  message: string;
};

type StrengthResult = {
  score: number;
  isValid: boolean;
  feedback: string[];
};
