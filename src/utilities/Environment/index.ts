import { config } from 'dotenv';

config();

class Environment {
  public static readonly JWT_SECRET = process.env.JWT_SECRET!;
  public static readonly PORT = process.env.PORT!;
}

export default Environment;
