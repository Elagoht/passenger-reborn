import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import * as crypto from 'crypto';
import Environment from '../Environment';

@Injectable()
export class CryptoService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32; // 256 bits = 32 bytes
  private static readonly SIMHASH_SIZE = 64; // 64-bit simhash

  private readonly key: Buffer;

  constructor() {
    // Derive a 32-byte key from the environment key using SHA-256
    this.key = crypto
      .createHash('sha256')
      .update(Environment.ENCRYPTION_KEY)
      .digest();
  }

  async hash(value: string): Promise<string> {
    return hash(value, CryptoService.SALT_ROUNDS);
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return compare(value, hashedValue);
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
}
