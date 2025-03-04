import { ApiProperty } from '@nestjs/swagger';

class PassphraseHistoryItem {
  @ApiProperty()
  strength: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  deletedAt: Date | null;
}

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

export class ResponseAccountItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ type: String, nullable: true, required: false })
  note: string | null;

  @ApiProperty({ type: String, nullable: true, required: false })
  icon: string | null;

  @ApiProperty({ type: [TagBadgeItem] })
  tags: TagBadgeItem[];
}

export class ResponseAccountSimilar extends ResponseAccountItem {
  @ApiProperty()
  distance: number;
}
