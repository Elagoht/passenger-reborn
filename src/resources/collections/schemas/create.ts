import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class RequestCreateCollection {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the collection' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The description of the collection' })
  description: string;
}

export default RequestCreateCollection;
