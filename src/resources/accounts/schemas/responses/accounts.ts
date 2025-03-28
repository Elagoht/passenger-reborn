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
}

export class ResponseAccountCardItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  identity: string;

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

  @ApiProperty({ type: String, nullable: true, required: false })
  passphrase: string | null;
}

export class ResponseAccountSimilar extends ResponseAccountCardItem {
  @ApiProperty()
  distance: number;
}
