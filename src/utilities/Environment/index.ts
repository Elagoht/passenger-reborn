import { config } from 'dotenv';

config();

export class Environment {
  public static readonly JWT_SECRET = process.env.JWT_SECRET!;
  public static readonly PORT = process.env.PORT!;
  public static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
  public static readonly NODE_ENV = process.env.NODE_ENV || 'development';
  public static readonly CORS_ORIGIN =
    process.env.CORS_ORIGIN || 'http://localhost:3000';
}
