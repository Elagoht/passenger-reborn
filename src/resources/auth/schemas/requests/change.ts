import { IsNotEmpty, IsString } from 'class-validator';

export class RequestChangePassphrase {
  @IsString()
  @IsNotEmpty()
  passphrase: string;
}
