import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import RequestCreateAccount from './create';

class RequestUpdateAccount extends OmitType(PartialType(RequestCreateAccount), [
  'tags',
]) {
  @ApiProperty({
    description: 'Array from tag ids to add to the account',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    nullable: true,
  })
  @IsArray()
  @IsOptional()
  addTags: string[] | null;

  @ApiProperty({
    description: 'Array from tag ids to remove from the account',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    nullable: true,
  })
  @IsArray()
  @IsOptional()
  removeTags: string[] | null;
}

export default RequestUpdateAccount;
