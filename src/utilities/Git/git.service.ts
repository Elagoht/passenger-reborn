import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { readdir, rm, stat } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';

@Injectable()
export class GitService {
  public constructor() {}

  private activeClones: Map<string, { pid?: number }> = new Map();

  public cloneRepository(
    url: string,
    path: string,
    onSuccess?: () => void,
    onFail?: () => void,
  ) {
    const fullPath = join(cwd(), 'data', path);

    // Create an entry for this clone operation
    this.activeClones.set(path, {});

    // Use child_process to get access to the process ID
    const cloneProcess = exec(`git clone ${url} ${fullPath}`);

    // Store the process ID for potential termination
    this.activeClones.set(path, { pid: cloneProcess.pid });

    // Set up event handlers for cleanup
    cloneProcess.on('exit', (code) => {
      this.activeClones.delete(path);
      if (code === 0) {
        onSuccess?.();
      } else {
        onFail?.();
      }
    });

    cloneProcess.on('error', () => {
      this.activeClones.delete(path);
      onFail?.();
    });
  }

  public async cancelClone(path: string): Promise<boolean> {
    const cloneOperation = this.activeClones.get(path);

    if (!cloneOperation || !cloneOperation.pid) {
      return false; // No active clone to cancel
    }

    try {
      // Kill the process
      process.kill(cloneOperation.pid);

      // Clean up the partially cloned directory if it exists
      const fullPath = join(cwd(), 'data', path);
      await rm(fullPath, {
        recursive: true,
        force: true,
        // Ignore errors if directory doesn't exist
      }).catch(() => void 0);

      // Remove from active clones
      this.activeClones.delete(path);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * **USE WITH CAUTION**
   */
  public async deleteRepository(path: string) {
    await rm(join(cwd(), 'data', path), { recursive: true, force: true });
  }

  public async getFileTree(path: string) {
    const fullPath = join(cwd(), 'data', path);
    const files = await readdir(fullPath, { recursive: true });
    return files;
  }

  /**
   * Checks if a repository directory exists
   * @param path Path to the repository
   * @returns True if the repository directory exists
   */
  public async repositoryExists(path: string): Promise<boolean> {
    try {
      const fullPath = join(cwd(), 'data', path);
      const stats = await stat(fullPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Checks if a directory is a valid git repository
   * @param path Path to the repository
   * @returns True if the directory is a valid git repository
   */
  public async isValidRepository(path: string): Promise<boolean> {
    try {
      const fullPath = join(cwd(), 'data', path);

      // Check if the directory exists
      const stats = await stat(fullPath);
      if (!stats.isDirectory()) {
        return false;
      }

      // Check if it has a .git directory
      const gitDirExists = await stat(join(fullPath, '.git'))
        .then((stats) => stats.isDirectory())
        .catch(() => false);

      if (!gitDirExists) {
        return false;
      }

      // Try to run a git command to verify it's a valid repo
      return new Promise<boolean>((resolve) => {
        exec(`git -C ${fullPath} status`, (error) => {
          if (error) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch {
      return false;
    }
  }
}
