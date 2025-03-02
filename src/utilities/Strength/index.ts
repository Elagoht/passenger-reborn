export class Strength {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_SCORE = 100;
  private static readonly MIN_VALID_SCORE = 60;

  private static readonly CHECKS: readonly StrengthCheck[] = [
    {
      check: (pass: string) => !/\d/.test(pass),
      penalty: 20,
      message: 'Add numbers for stronger password',
    },
    {
      check: (pass: string) => !/[A-Z]/.test(pass),
      penalty: 20,
      message: 'Add uppercase letters for stronger password',
    },
    {
      check: (pass: string) => !/[a-z]/.test(pass),
      penalty: 20,
      message: 'Add lowercase letters for stronger password',
    },
    {
      check: (pass: string) => !/[!@#$%^&*(),.?":{}|<>]/.test(pass),
      penalty: 20,
      message: 'Add special characters for stronger password',
    },
    {
      check: (pass: string) => Strength.checkRepeatedCharacters(pass),
      penalty: 10,
      message: 'Avoid repeating characters',
    },
    {
      check: (pass: string) => Strength.hasSequentialCharacters(pass),
      penalty: 15,
      message: 'Avoid sequential characters',
    },
  ] as const;

  static evaluate(passphrase: string): StrengthResult {
    // Basic length check
    if (passphrase.length < this.MIN_LENGTH) {
      return {
        score: 0,
        isValid: false,
        feedback: [
          `Password must be at least ${this.MIN_LENGTH} characters long`,
        ],
      };
    }

    let score = this.MAX_SCORE;
    const feedback: string[] = [];

    // Run all checks
    for (const { check, penalty, message } of this.CHECKS) {
      if (check(passphrase)) {
        score -= penalty;
        feedback.push(message);
      }
    }

    score = this.normalizeScore(score);

    return {
      score,
      isValid: score >= this.MIN_VALID_SCORE,
      feedback: feedback.length ? feedback : ['Password is strong'],
    };
  }

  private static normalizeScore(score: number): number {
    return Math.max(0, Math.min(score, this.MAX_SCORE));
  }

  private static readonly SEQUENCES = [
    'abcdefghijklmnopqrstuvwxyz',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    '1234567890',
  ] as const;

  private static checkRepeatedCharacters(passphrase: string): boolean {
    const charCount: { [key: string]: number } = {};
    for (const char of passphrase) {
      charCount[char] = (charCount[char] || 0) + 1;
      if (charCount[char] > 2) return true;
    }
    return false;
  }

  private static hasSequentialCharacters(passphrase: string): boolean {
    const lowercasePass = passphrase.toLowerCase();
    return this.SEQUENCES.some((sequence) => {
      for (let i = 0; i < sequence.length - 2; i++) {
        const pattern = sequence.slice(i, i + 3);
        if (lowercasePass.includes(pattern)) return true;
      }
      return false;
    });
  }
}
