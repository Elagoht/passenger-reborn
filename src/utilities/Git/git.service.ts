import { Injectable } from '@nestjs/common';
import { rm } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import simpleGit, { SimpleGit } from 'simple-git';

@Injectable()
export class GitService {
  private git: SimpleGit;

  public constructor() {
    this.git = simpleGit();
  }

  public async isRemoteRepository(url: string) {
    const isRepository = await this.git.listRemote([url]);
    return isRepository.length > 0;
  }

  public async cloneRepository(url: string, path: string) {
    await this.git.clone(url, join(cwd(), 'data', path));
  }

  public async pullRepository(path: string) {
    await this.git.pull(path);
  }

  public getRepositoryRawUrl(url: string): string | undefined {
    const hostType = this.getHostType(url);
    switch (hostType) {
      case 'github': {
        const [owner, repo] = url.split('/').slice(3);
        return `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main`;
      }
      // ! NOT TESTED
      case 'gitlab': {
        const [owner, repo] = url.split('/').slice(3);
        return `https://gitlab.com/${owner}/${repo}/raw/refs/heads/main`;
      }
      // ! NOT TESTED
      case 'bitbucket': {
        const [owner, repo] = url.split('/').slice(3);
        return `https://bitbucket.org/${owner}/${repo}/raw/refs/heads/main`;
      }
      default:
        return;
    }
  }

  public getHostType(url: string): KnownHostType | undefined {
    const host = new URL(url).host;
    if (host.includes('github.com')) {
      return 'github';
    }
    if (host.includes('gitlab.com')) {
      return 'gitlab';
    }
    if (host.includes('bitbucket.org')) {
      return 'bitbucket';
    }
    return;
  }

  /**
   * **USE WITH CAUTION**
   */
  public async deleteRepository(path: string) {
    await rm(join(cwd(), 'data', path), { recursive: true, force: true });
  }
}

type KnownHostType = 'github' | 'gitlab' | 'bitbucket';
