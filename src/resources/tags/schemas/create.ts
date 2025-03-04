import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

class RequestCreateTag {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the tag' })
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ description: 'The icon of the tag' })
  icon: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The color of the tag' })
  color: string;
}

export default RequestCreateTag;
