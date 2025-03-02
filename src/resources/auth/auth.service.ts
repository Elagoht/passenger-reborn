import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import Environment from 'src/utilities/Environment';
import { PrismaService } from 'src/utilities/Prisma';
import RequestInitialize from './schemas/requests/initialize';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async initialize(body: RequestInitialize) {
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
  }

  async login(password: string) {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new BadRequestException('Application has not been setup yet');
    }

    if (!(await this.comparePassword(password, user.password))) {
      throw new BadRequestException('Invalid passphrase');
    }

    return { token: await this.generateToken(user) };
  }

  private async hashPassword(password: string) {
    return await hash(password, 10);
  }

  private async comparePassword(password: string, hashedPassword: string) {
    return await compare(password, hashedPassword);
  }

  private async generateToken(user: User) {
    return sign({}, Environment.JWT_SECRET, {
      expiresIn: '1h',
    });
  }
}
