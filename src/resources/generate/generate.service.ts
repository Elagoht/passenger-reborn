import { Injectable } from '@nestjs/common';
import { Generator } from 'src/utilities/Generator';
import GeneratedResponse from './schemas/response/generated';

@Injectable()
export class GenerateService {
  /**
   * Assuming randomly generated passphrases will not be
   * remembered, we can generate a new passphrase with
   * a longer length.
   */
  passphrase(length: number = 32): GeneratedResponse {
    return {
      passphrase: Generator.passphrase(length),
    };
  }

  /**
   * Output will be looking similar to the input string.
   */
  alternative(input: string): GeneratedResponse {
    return {
      passphrase: Generator.alternative(input),
    };
  }
}
