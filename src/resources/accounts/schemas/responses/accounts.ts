import { ApiProperty } from '@nestjs/swagger';

class TagBadgeItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  icon: number;

  @ApiProperty()
  color: string;

  @ApiProperty({ type: Boolean, nullable: true })
  isPanic: boolean | undefined;
}

export class ResponseAccountCardItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  identity: string;

  @ApiProperty({ type: String, nullable: true, required: false })
  icon: string | null;

  @ApiProperty({ type: [TagBadgeItem] })
  tags: TagBadgeItem[];

  @ApiProperty()
  url: string;
}

export class ResponseAccount extends ResponseAccountCardItem {
  @ApiProperty({ type: String, nullable: true, required: false })
  note: string | null;

  @ApiProperty({ type: Number, nullable: true, required: false })
  copiedCount: number | null;

  @ApiProperty({ type: Date, nullable: true, required: false })
  lastCopiedAt: Date | null;
}

export class ResponseAccountSimilar extends ResponseAccountCardItem {
  @ApiProperty()
  distance: number;
}
