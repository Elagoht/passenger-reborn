import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import * as crypto from 'crypto';
import Environment from '../Environment';

@Injectable()
export class CryptoService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;

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
      Buffer.from(Environment.ENCRYPTION_KEY),
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
      Buffer.from(Environment.ENCRYPTION_KEY),
      iv,
    );

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }
}
