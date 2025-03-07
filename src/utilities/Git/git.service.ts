import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { readdir, rm } from 'fs/promises';
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

    cloneProcess.on('error', (err) => {
      this.activeClones.delete(path);
      onFail?.();
      console.error('Git clone error: ', err);
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
    } catch (error) {
      console.error('Failed to cancel clone:', error);
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
}
