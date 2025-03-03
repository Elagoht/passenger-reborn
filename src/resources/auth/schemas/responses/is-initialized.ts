import { ApiProperty } from '@nestjs/swagger';

export class ResponseIsInitialized {
  @ApiProperty({
    type: Boolean,
    description: 'Whether the application has been initialized',
  })
  initialized: boolean;
}
