import { ApiProperty } from '@nestjs/swagger';

export class ResponseTag {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number, nullable: true })
  icon: number | null;

  @ApiProperty({ type: String, nullable: true })
  color: string | null;

  @ApiProperty({ type: Boolean, nullable: true, example: false })
  isPanic: boolean;
}
