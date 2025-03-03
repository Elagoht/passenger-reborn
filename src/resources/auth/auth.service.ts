import { BadRequestException, Injectable } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import { CryptoService } from 'src/utilities/Crypto';
import Environment from 'src/utilities/Environment';
import { PrismaService } from 'src/utilities/Prisma';
import { RequestChangePassphrase } from './schemas/requests/change';
import RequestInitialize from './schemas/requests/initialize';
import RequestLogin from './schemas/requests/login';
import { RequestResetPassphrase } from './schemas/requests/reset';
import ResponseInitialize from './schemas/responses/initialize';
import ResponseToken from './schemas/responses/token';

@Injectable()
export class AuthService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /**
   * Check if the application has been initialized
   */
  public async isInitialized(): Promise<boolean> {
    return !!(await this.prisma.user.findFirst());
  }

  /**
   * Single user application, no user management
   */
  public async initialize(
    body: RequestInitialize,
  ): Promise<ResponseInitialize> {
    const user = await this.prisma.user.findFirst();

    if (user) {
      throw new BadRequestException('Application has already been setup');
    }

    const passphrase = this.crypto.hashWithPbkdf2(body.passphrase);
    const recoveryKey = this.crypto.hashWithPbkdf2(body.passphrase);

    await this.prisma.user.create({
      data: {
        password: passphrase,
        recoveryKey,
      },
    });

    return {
      token: this.generateToken(),
      recoveryKey,
    };
  }

  /**
   * Generate a jwt token for the user
   */
  public async login(body: RequestLogin): Promise<ResponseToken> {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new BadRequestException('Application has not been setup yet');
    }

    if (!this.crypto.compareWithPbkdf2(body.passphrase, user.password)) {
      throw new BadRequestException('Invalid credentials');
    }

    return { token: this.generateToken() };
  }

  /**
   * This will generate and return a new passphrase to the user
   * then user can use changePassphrase to update the passphrase
   */
  public async resetPassphrase(body: RequestResetPassphrase) {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new BadRequestException('Application has not been setup yet');
    }

    if (body.recoveryKey !== user.recoveryKey) {
      throw new BadRequestException('Invalid recovery key');
    }

    const newRandomPassphrase = this.crypto.generateRandomPassphrase();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: this.crypto.hashWithPbkdf2(newRandomPassphrase) },
    });

    return { assignedPassphrase: newRandomPassphrase };
  }

  /**
   * Change the passphrase by providing jwt token
   */
  public async changePassphrase(body: RequestChangePassphrase) {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new BadRequestException('Application has not been setup yet');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: this.crypto.hashWithPbkdf2(body.passphrase),
      },
    });
  }

  /**
   * This is a single user application,
   * so we can sign an empty payload
   */
  private generateToken() {
    return sign({}, Environment.JWT_SECRET, {
      expiresIn: '1h',
    });
  }
}
