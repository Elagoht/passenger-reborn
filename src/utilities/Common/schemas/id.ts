import { ApiProperty } from '@nestjs/swagger';

export class ResponseId {
  @ApiProperty({ type: String })
  id: string;
}
