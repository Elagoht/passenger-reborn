export default class Reporter {
  static levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const areSimilar =
          str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ||
          (this.isSeparator(str1[i - 1]) && this.isSeparator(str2[j - 1]));

        if (areSimilar) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] =
            Math.min(
              dp[i - 1][j - 1], // replace
              dp[i - 1][j], // delete
              dp[i][j - 1], // insert
            ) + 1;
        }
      }
    }

    return dp[m][n];
  }

  private static isSeparator(char: string): boolean {
    return /[-_.,\s]/.test(char);
  }
}
