/**
 * Each character looks similar with their array of characters.
 * This means passphrase should be as powerful as possible while
 * still being easy to read and remember.
 */
const manipulate: Record<string, string[]> = {
  q: ['Q', 'q'],
  w: ['W', 'm', 'M', 'w'],
  e: ['E', '€', '£', 'e'],
  r: ['R', 'r'],
  t: ['T', '7', 't'],
  y: ['Y', 'h', 'y'],
  u: ['U', 'u', 'n'],
  i: ['I', '1', 'i'],
  o: ['O', '0', 'o'],
  p: ['P', 'p'],
  a: ['A', '4', '@', 'a'],
  s: ['S', '$', '5', 's'],
  d: ['D', 'd'],
  f: ['F'],
  g: ['G', '6', '9', 'g'],
  h: ['H', 'y', 'h'],
  j: ['J', 'j'],
  k: ['K', 'k'],
  l: ['L', 'l'],
  z: ['Z', '2', 'z'],
  x: ['X', 'x'],
  c: ['C', 'c'],
  v: ['V', 'v'],
  b: ['B', '3', '8', 'b'],
  n: ['N', 'n', 'u'],
  m: ['M', 'W', 'w', 'm'],
  $: ['S', 's', '5'],
  '@': ['A', 'a'],
  '€': ['E', 'e'],
  '£': ['E', 'e'],
  '?': ['7'],
  '0': ['O', 'o', '0'],
  '1': ['i', '1'],
  '2': ['Z', 'z', '2'],
  '3': ['B', '3'],
  '4': ['A', '4'],
  '5': ['S', 's', '$'],
  '6': ['G', '6'],
  '7': ['7', '?', 'T'],
  '8': ['B', '8'],
  '9': ['g', '9'],
};

const specials = '@_.-€£$~!#%^&*()+=[]{}|;:,<>?/';
const lowers = 'abcdefghijklmnopqrstuvyz';
const uppers = lowers.toUpperCase();
const numbers = '0123456789';
const chars = lowers + uppers + numbers + specials;

/**
 * Generator class for generating passphrases and manipulated passwords.
 */
export class Generator {
  /**
   * Generates a manipulated passphrase from an input string.
   *
   * @param input The input string to manipulate.
   * @returns A manipulated passphrase.
   */
  static alternative(input: string): string {
    let passphrase = '';
    for (const character of input) {
      const lowerChar = character.toLowerCase();
      passphrase += manipulate[lowerChar]
        ? manipulate[lowerChar][
            Math.floor(Math.random() * manipulate[lowerChar].length)
          ]
        : lowerChar;
    }
    return passphrase;
  }

  /**
   * Generates a new passphrase with a specified length.
   *
   * @param wantedLength The desired length of the passphrase.
   * @returns A new passphrase.
   */
  static passphrase(wantedLength: number = 32): string {
    const length = wantedLength < 8 ? 8 : wantedLength;
    let passphrase = '';

    // Generate a passphrase with the specified length
    for (let i = passphrase.length; i < length; i++) {
      passphrase += chars[Math.floor(Math.random() * chars.length)];
    }

    /**
     * ! We do not use a while loop to ensure that
     * the passphrase contains at least two characters
     * from each set. Using a while loop, can result
     * in an infinite loop if the random number
     * generator keeps generating the same index.
     */

    // Generate 8 different indices
    const positions = Array.from({ length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    // Ensure that the passphrase contains at least two characters from each set
    const passphraseArray = passphrase.split('');
    for (let position = 0; position < 8; ++position) {
      let set: string;
      switch (position % 4) {
        case 0:
          set = lowers;
          break;
        case 1:
          set = uppers;
          break;
        case 2:
          set = numbers;
          break;
        default:
          set = specials;
      }
      passphraseArray[positions[position]] =
        set[Math.floor(Math.random() * set.length)];
    }

    return passphraseArray.join('');
  }
}
