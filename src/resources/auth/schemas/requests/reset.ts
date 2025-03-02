import { IsNotEmpty, IsString } from 'class-validator';

export class RequestResetPassphrase {
  @IsString()
  @IsNotEmpty()
  recoveryKey: string;
}
