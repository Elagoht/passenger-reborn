import { BadRequestException, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import Environment from 'src/utilities/Environment';
import { PrismaService } from 'src/utilities/Prisma';
import { RequestChangePassphrase } from './schemas/requests/change';
import RequestInitialize from './schemas/requests/initialize';
import RequestLogin from './schemas/requests/login';
import { RequestResetPassphrase } from './schemas/requests/reset';
import ResponseToken from './schemas/responses/token';

@Injectable()
export class AuthService {
  public constructor(private readonly prisma: PrismaService) {}

  public async initialize(body: RequestInitialize): Promise<ResponseToken> {
    const user = await this.prisma.user.findFirst();

    if (user) {
      throw new BadRequestException('Application has already been setup');
    }

    await this.prisma.user.create({
      data: {
        password: await this.hashPassword(body.passphrase),
        recoveryKey: await this.hashPassword(body.recoveryKey),
      },
    });

    return { token: await this.generateToken() };
  }

  public async login(body: RequestLogin): Promise<ResponseToken> {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new BadRequestException('Application has not been setup yet');
    }

    if (!(await this.comparePassword(body.passphrase, user.password))) {
      throw new BadRequestException('Invalid passphrase');
    }

    return { token: await this.generateToken() };
  }

  public async resetPassphrase(body: RequestResetPassphrase) {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new BadRequestException('Application has not been setup yet');
    }

    if (!(await this.comparePassword(body.recoveryKey, user.recoveryKey))) {
      throw new BadRequestException('Invalid recovery key');
    }

    const newRandomPassphrase =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await this.hashPassword(newRandomPassphrase),
      },
    });

    return { assignedPassphrase: newRandomPassphrase };
  }

  public async changePassphrase(body: RequestChangePassphrase) {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new BadRequestException('Application has not been setup yet');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await this.hashPassword(body.passphrase),
      },
    });
  }

  private async hashPassword(password: string) {
    return await hash(password, 10);
  }

  private async comparePassword(password: string, hashedPassword: string) {
    return await compare(password, hashedPassword);
  }

  /**
   * This is a single user application,
   * so we can sign an empty payload
   */
  private async generateToken() {
    return sign({}, Environment.JWT_SECRET, {
      expiresIn: '1h',
    });
  }
}
