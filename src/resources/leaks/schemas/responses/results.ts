import { ApiProperty } from '@nestjs/swagger';

export class ResponseLeak {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  domain: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  pwnCount: number;

  @ApiProperty()
  verified: boolean;

  @ApiProperty({ required: false })
  logo?: string;
}

export default class ResponseLeakResults {
  @ApiProperty()
  page: number;

  @ApiProperty()
  take: number | undefined;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [ResponseLeak] })
  data: ResponseLeak[];
}
