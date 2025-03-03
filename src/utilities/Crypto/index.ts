import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import Environment from '../Environment';

@Injectable()
export class CryptoService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;
  private static readonly SIMHASH_SIZE = 64;

  private static readonly PBKDF2_ITERATIONS = 600000;
  private static readonly PBKDF2_KEYLEN = 32;
  private static readonly PBKDF2_DIGEST = 'sha256';
  private static readonly PBKDF2_SALT_LENGTH = 16;

  private readonly key: Buffer;

  constructor() {
    this.key = crypto
      .createHash('sha256')
      .update(Environment.ENCRYPTION_KEY)
      .digest();
  }

  hashWithPbkdf2(value: string): string {
    const salt = crypto.randomBytes(CryptoService.PBKDF2_SALT_LENGTH);

    const derivedKey = crypto.pbkdf2Sync(
      value,
      salt,
      CryptoService.PBKDF2_ITERATIONS,
      CryptoService.PBKDF2_KEYLEN,
      CryptoService.PBKDF2_DIGEST,
    );

    return `${CryptoService.PBKDF2_ITERATIONS}:${salt.toString(
      'base64',
    )}:${derivedKey.toString('base64')}`;
  }

  compareWithPbkdf2(value: string, storedHash: string): boolean {
    const [iterations, salt, hash] = storedHash.split(':');

    const derivedKey = crypto.pbkdf2Sync(
      value,
      Buffer.from(salt, 'base64'),
      parseInt(iterations, 10),
      CryptoService.PBKDF2_KEYLEN,
      CryptoService.PBKDF2_DIGEST,
    );

    return crypto.timingSafeEqual(derivedKey, Buffer.from(hash, 'base64'));
  }

  encrypt(text: string): string {
    const initializationVector = crypto.randomBytes(CryptoService.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      CryptoService.ALGORITHM,
      this.key,
      initializationVector,
    );

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return (
      initializationVector.toString('hex') + ':' + encrypted.toString('hex')
    );
  }

  decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(
      CryptoService.ALGORITHM,
      this.key,
      iv,
    );

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }

  generateSimhash(text: string): string {
    // Split text into features (words and character sequences)
    const features = this.extractFeatures(text);

    // Initialize vector for simhash calculation
    const vector = new Array(CryptoService.SIMHASH_SIZE).fill(0);

    // For each feature, calculate its hash and update vector
    features.forEach((feature) => {
      const featureHash = this.hashFeature(feature);

      // Update vector based on feature hash bits
      for (let i = 0; i < CryptoService.SIMHASH_SIZE; i++) {
        if ((featureHash[Math.floor(i / 8)] & (1 << i % 8)) !== 0) {
          vector[i]++;
        } else {
          vector[i]--;
        }
      }
    });

    // Convert vector to final simhash
    const simhash = Buffer.alloc(CryptoService.SIMHASH_SIZE / 8);
    for (let i = 0; i < CryptoService.SIMHASH_SIZE; i++) {
      if (vector[i] > 0) {
        simhash[Math.floor(i / 8)] |= 1 << i % 8;
      }
    }

    return simhash.toString('hex');
  }

  calculateSimhashDistance(hash1: string, hash2: string): number {
    const buf1 = Buffer.from(hash1, 'hex');
    const buf2 = Buffer.from(hash2, 'hex');

    let distance = 0;
    for (let i = 0; i < buf1.length; i++) {
      const xor = buf1[i] ^ buf2[i];
      distance += this.countSetBits(xor);
    }

    return distance;
  }

  private extractFeatures(text: string): string[] {
    // Split into words and generate character n-grams
    const words = text.toLowerCase().split(/\W+/);
    const ngrams = this.generateNgrams(text.toLowerCase(), 3);
    return [...words, ...ngrams];
  }

  private generateNgrams(text: string, n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.slice(i, i + n));
    }
    return ngrams;
  }

  /**
   * A weak hash function, but it's fast and good enough for our purposes
   */
  private hashFeature(feature: string): Buffer {
    return crypto.createHash('md5').update(feature).digest();
  }

  private countSetBits(n: number): number {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }

  /**
   * @returns 16 characters long passphrase
   */
  public generateRandomPassphrase(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}
