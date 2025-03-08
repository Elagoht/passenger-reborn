import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ResponseAccountCardItem } from 'src/resources/accounts/schemas/responses/accounts';

export class ResponseCollection {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ type: [ResponseAccountCardItem] })
  accounts: ResponseAccountCardItem[];
}

export class ResponseCollectionListItem extends OmitType(ResponseCollection, [
  'accounts',
]) {
  @ApiProperty({ type: Number })
  accountCount: number;
}
