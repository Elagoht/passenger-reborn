/**
 * An analysis is a process that checks a wordlist against saved accounts.
 * Simply brute-forcing yourself before any hacker does, so you can take
 * action before them.
 *
 * The analysis report will be saved in the database and can be retrieved later.
 *
 * For MVP, polling will be used to get the running analysis logs.
 * In future, websocket will be used for better performance.
 *
 * Initialize analysis is a fire and forget process. The analysis will be
 * running in the background and the response will be sent to the client
 * immediately.
 *
 * Observe method will be used to get the analysis logs.
 *
 * **How a analysis works:**
 * 0. Take timestamp of the start time
 * 1. Create a hash map of accounts ids and their decrypted passwords
 * 2. Create another hash map to track shared passwords, this will be used to
 *    avoid to check the same password more than once
 * 3. Get the set of password lengths from decrypted passwords. Word lists
 *    are separated by password length, and sorted alphabetically.
 * 4. Iterate over the decrypted passwords, binary search for the password
 *    length in the word list and check if the password is in the hash map.
 * 5. If the password is in the hash map, add accound Id's to the infected
 *    accounts hash map. Check shared passwords between accounts and also add them.
 * 6. After the word list is checked, update the analysis status to COMPLETED
 * 7. Take timestamp of the end time
 * 8. Calculate the time took to complete the analysis
 * 9. Return the analysis report
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AnalysisStatus, WordlistStatus } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { ResponseId } from 'src/utilities/Common/schemas/id';
import { CryptoService } from 'src/utilities/Crypto/crypto.service';
import Pagination from 'src/utilities/Pagination';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';
import { ResponseWordListCard } from '../wordlists/schemas/responses/wordlists';

@Injectable()
export class AnalysesService {
  private logs: Map<string, string[]>;
  private activeAnalysisId: string | null;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {
    this.logs = new Map();
    this.activeAnalysisId = null;
  }

  public async getAvailableWordlists(
    pagination: PaginationParams,
  ): Promise<ResponseWordListCard[]> {
    return this.prisma.wordlist.findMany({
      where: { status: WordlistStatus.VALIDATED },
      ...new Pagination(pagination).getQuery(),
      select: {
        id: true,
        displayName: true,
        description: true,
        status: true,
        totalPasswords: true,
        year: true,
        size: true,
        sizeUnits: true,
      },
    });
  }

  public async getAnalysisReports(pagination: PaginationParams) {
    return this.prisma.analysis.findMany(new Pagination(pagination).getQuery());
  }

  public async getAnalysisReport(id: string) {
    return this.prisma.analysis.findUniqueOrThrow({
      where: { id },
      include: {
        accounts: {
          select: {
            id: true,
            platform: true,
            url: true,
            tags: { select: { id: true, icon: true, name: true, color: true } },
          },
        },
      },
    });
  }

  public getAnalysisLogs(id: string): string[] {
    const logs = this.logs.get(id);
    if (!logs) {
      return ['No logs available for this analysis'];
    }
    return logs;
  }

  public async initializeAnalysis(wordlistId: string): Promise<ResponseId> {
    // Check if there's already an active analysis
    if (this.activeAnalysisId) {
      throw new BadRequestException('An analysis is already running');
    }

    // Verify the wordlist exists and is validated
    const wordlist = await this.prisma.wordlist.findUniqueOrThrow({
      where: { id: wordlistId },
    });

    if (
      wordlist.status === WordlistStatus.IMPORTED ||
      wordlist.status === WordlistStatus.DOWNLOADING
    ) {
      throw new BadRequestException('Wordlist is not downloaded');
    }

    if (wordlist.status !== WordlistStatus.VALIDATED) {
      throw new BadRequestException('Wordlist is not validated');
    }

    // Create a new analysis record
    const analysis = await this.prisma.analysis.create({
      data: {
        status: AnalysisStatus.IDLE,
        totalMatched: 0,
        totalChecked: 0,
        tookMiliseconds: 0,
        wordlists: { connect: { id: wordlistId } },
        message: `Analysis initialized for wordlist: ${wordlist.displayName}`,
      },
    });

    // Initialize logs for this analysis
    this.logs.set(analysis.id, [
      `[${new Date().toISOString()}] Analysis initialized`,
    ]);

    // Start the analysis process asynchronously
    this.runAnalysis(analysis.id, wordlistId).catch((error) => {
      void this.handleAnalysisError(analysis.id, error);
    });

    return { id: analysis.id };
  }

  private async runAnalysis(
    analysisId: string,
    wordlistId: string,
  ): Promise<void> {
    try {
      this.activeAnalysisId = analysisId;
      const startTime = Date.now();

      // Update analysis status to RUNNING
      await this.updateAnalysisStatus(
        analysisId,
        AnalysisStatus.RUNNING,
        'Analysis started',
      );

      // Get all accounts
      this.addLog(analysisId, 'Fetching accounts...');
      const accounts = await this.prisma.account.findMany({
        select: { id: true, passphrase: true },
      });

      if (accounts.length === 0) {
        this.addLog(analysisId, 'No accounts found to analyze');
        await this.updateAnalysisStatus(
          analysisId,
          AnalysisStatus.COMPLETED,
          'No accounts to analyze',
        );
        this.activeAnalysisId = null;
        return;
      }

      // Extract password processing to a separate method
      const { accountPasswords, passwordToAccounts, passwordLengths } =
        this.processAccountPasswords(analysisId, accounts);

      // Get wordlist details
      const wordlist = await this.prisma.wordlist.findUniqueOrThrow({
        where: { id: wordlistId },
      });

      this.addLog(
        analysisId,
        `Analyzing ${accounts.length} accounts against wordlist: ${
          wordlist.displayName
        }`,
      );

      // Extract wordlist checking logic to a separate method
      const { matchedAccountIds, totalChecked } =
        await this.checkPasswordsAgainstWordlist(
          analysisId,
          wordlist,
          passwordLengths,
          accountPasswords,
          passwordToAccounts,
        );

      // Step 6-9: Complete the analysis
      const endTime = Date.now();

      // Update the analysis with results
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: AnalysisStatus.COMPLETED,
          totalMatched: matchedAccountIds.size,
          totalChecked,
          tookMiliseconds: endTime - startTime,
          accounts: {
            connect: Array.from(matchedAccountIds).map((id) => ({ id })),
          },
          message: `Analysis completed: ${
            matchedAccountIds.size
          } vulnerable accounts found`,
        },
      });

      this.addLog(
        analysisId,
        `Analysis completed in ${endTime - startTime} miliseconds. Found ${
          matchedAccountIds.size
        } vulnerable accounts out of ${accounts.length} total accounts.`,
      );
    } catch (error) {
      await this.handleAnalysisError(analysisId, error);
      throw error;
    } finally {
      this.activeAnalysisId = null;
    }
  }

  /**
   * Process account passwords to create necessary data structures for analysis
   */
  private processAccountPasswords(
    analysisId: string,
    accounts: { id: string; passphrase: string }[],
  ) {
    this.addLog(analysisId, 'Decrypting account passwords...');
    const accountPasswords = new Map<string, string>();
    const passwordToAccounts = new Map<string, string[]>();
    const passwordLengths = new Set<number>();

    for (const account of accounts) {
      const decryptedPassword = this.crypto.decrypt(account.passphrase);
      accountPasswords.set(account.id, decryptedPassword);
      passwordLengths.add(decryptedPassword.length);

      // Track shared passwords
      if (!passwordToAccounts.has(decryptedPassword)) {
        passwordToAccounts.set(decryptedPassword, []);
      }
      passwordToAccounts.get(decryptedPassword)!.push(account.id);
    }

    return { accountPasswords, passwordToAccounts, passwordLengths };
  }

  /**
   * Check passwords against wordlist files
   */
  private async checkPasswordsAgainstWordlist(
    analysisId: string,
    wordlist: {
      id: string;
      displayName: string;
      slug: string;
      minLength: number;
      maxLength: number;
    },
    passwordLengths: Set<number>,
    accountPasswords: Map<string, string>,
    passwordToAccounts: Map<string, string[]>,
  ): Promise<{ matchedAccountIds: Set<string>; totalChecked: number }> {
    const matchedAccountIds = new Set<string>();
    let totalChecked = 0;

    // Process each password length file in the wordlist
    for (const passwordLength of passwordLengths) {
      // Skip if outside the range of the wordlist
      if (
        passwordLength < wordlist.minLength ||
        passwordLength > wordlist.maxLength
      ) {
        this.addLog(
          analysisId,
          `Skipping passwords of length ${passwordLength} (outside wordlist range)`,
        );
        continue;
      }

      this.addLog(
        analysisId,
        `Processing passwords of length ${passwordLength}...`,
      );

      try {
        // Read the wordlist file for this length
        const filePath = join(
          cwd(),
          'data',
          'wordlists',
          wordlist.slug,
          'data',
          `${passwordLength}.ticket`,
        );

        const fileContent = await readFile(filePath, 'utf-8');
        const wordlistPasswords = fileContent.split('\n').filter(Boolean);

        totalChecked += wordlistPasswords.length;

        // Get unique passwords of this length from our accounts
        const uniqueAccountPasswords = this.getUniquePasswordsOfLength(
          accountPasswords,
          passwordLength,
        );

        // Only log if there are passwords to check
        if (uniqueAccountPasswords.size > 0) {
          this.addLog(
            analysisId,
            `Checking ${uniqueAccountPasswords.size} unique passwords against ${wordlistPasswords.length} wordlist entries`,
          );
        }

        // Check each unique account password using binary search
        this.checkUniquePasswordsAgainstWordlist(
          analysisId,
          uniqueAccountPasswords,
          wordlistPasswords,
          passwordToAccounts,
          matchedAccountIds,
        );
      } catch (error) {
        this.addLog(
          analysisId,
          `Error processing passwords of length ${passwordLength}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return { matchedAccountIds, totalChecked };
  }

  /**
   * Get unique passwords of a specific length from account passwords
   */
  private getUniquePasswordsOfLength(
    accountPasswords: Map<string, string>,
    length: number,
  ): Set<string> {
    const uniquePasswords = new Set<string>();
    accountPasswords.forEach((password) => {
      if (password.length === length) {
        uniquePasswords.add(password);
      }
    });
    return uniquePasswords;
  }

  /**
   * Check unique passwords against wordlist entries
   */
  private checkUniquePasswordsAgainstWordlist(
    analysisId: string,
    uniquePasswords: Set<string>,
    wordlistPasswords: string[],
    passwordToAccounts: Map<string, string[]>,
    matchedAccountIds: Set<string>,
  ): void {
    for (const password of uniquePasswords) {
      // Perform binary search on the wordlist
      const found = this.binarySearch(wordlistPasswords, password);

      if (found) {
        const affectedAccounts = passwordToAccounts.get(password)!;

        // Create a masked version of the password for logging
        const maskedPassword = this.maskPassword(password);

        this.addLog(
          analysisId,
          `Found match: "${maskedPassword}" used by ${affectedAccounts.length} account(s)`,
        );

        // Add all affected accounts to the matched set
        affectedAccounts.forEach((accountId) => {
          matchedAccountIds.add(accountId);
        });
      }
    }
  }

  /**
   * Add a log entry for an analysis
   */
  private addLog(analysisId: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    if (!this.logs.has(analysisId)) {
      this.logs.set(analysisId, []);
    }

    this.logs.get(analysisId)!.push(logEntry);
    Logger.log(`Analysis ${analysisId}: ${message}`);
  }

  /**
   * Update the status of an analysis
   */
  private async updateAnalysisStatus(
    analysisId: string,
    status: AnalysisStatus,
    message: string,
  ): Promise<void> {
    await this.prisma.analysis.update({
      where: { id: analysisId },
      data: { status, message },
    });
    this.addLog(analysisId, message);
  }

  /**
   * Observe an analysis by getting its current status and logs
   * This provides real-time monitoring of a running analysis through polling
   * @param id The ID of the analysis to observe
   */
  public observeAnalysis(id: string) {
    // Check if the analysis exists in our logs
    if (!this.logs.has(id)) {
      return {
        id,
        isActive: false,
        logs: ['No logs available for this analysis'],
        progress: { totalMatched: 0, totalChecked: 0 },
      };
    }

    // Get the logs for this analysis
    const logs = this.getAnalysisLogs(id);

    // Extract progress information from logs
    const progress = this.extractProgressFromLogs(logs);

    return {
      id,
      isActive: this.activeAnalysisId === id,
      progress,
      logs,
    };
  }

  /**
   * Extract progress information from analysis logs
   */
  private extractProgressFromLogs(logs: string[]): {
    totalMatched: number;
    totalChecked: number;
  } {
    let totalMatched = 0;
    let totalChecked = 0;

    // Parse logs to extract progress information
    for (const log of logs) {
      const matchedMatch = log.match(/Found match.*used by (\d+) account/);
      if (matchedMatch) {
        totalMatched += parseInt(matchedMatch[1], 10);
      }

      const checkedMatch = log.match(/Checking (\d+) passwords/);
      if (checkedMatch) {
        totalChecked += parseInt(checkedMatch[1], 10);
      }
    }

    return { totalMatched, totalChecked };
  }

  public async stopAnalysis(id: string): Promise<void> {
    // Check if the analysis exists
    await this.prisma.analysis.findUniqueOrThrow({ where: { id } });

    // Only stop if this is the active analysis
    if (this.activeAnalysisId === id) {
      this.activeAnalysisId = null;
      await this.updateAnalysisStatus(
        id,
        AnalysisStatus.FAILED,
        'Analysis stopped by user',
      );
      this.addLog(id, 'Analysis was manually stopped');
    } else {
      throw new BadRequestException('This analysis is not currently running');
    }
  }

  private binarySearch(sortedArray: string[], target: string): boolean {
    let left = 0;
    let right = sortedArray.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const comparison = target.localeCompare(sortedArray[mid]);

      if (comparison === 0) {
        return true; // Found the target
      } else if (comparison < 0) {
        right = mid - 1; // Target is in the left half
      } else {
        left = mid + 1; // Target is in the right half
      }
    }

    return false; // Target not found
  }

  /**
   * Creates a masked version of a password for logging purposes
   * Shows only the first and last character, with asterisks in between
   */
  private maskPassword(password: string): string {
    if (password.length <= 2) {
      return '*'.repeat(password.length);
    }

    const firstChar = password.charAt(0);
    const lastChar = password.charAt(password.length - 1);
    const middleAsterisks = '*'.repeat(Math.min(password.length - 2, 6));

    return `${firstChar}${middleAsterisks}${lastChar}`;
  }

  /**
   * Handle analysis errors consistently
   */
  private async handleAnalysisError(
    analysisId: string,
    error: unknown,
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    await this.updateAnalysisStatus(
      analysisId,
      AnalysisStatus.FAILED,
      `Analysis failed: ${errorMessage}`,
    );
    this.addLog(analysisId, `Error occurred: ${errorMessage}`);
  }
}
