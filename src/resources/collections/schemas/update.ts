import { PartialType } from '@nestjs/swagger';
import RequestCreateCollection from './create';

export class RequestUpdateCollection extends PartialType(
  RequestCreateCollection,
) {}
