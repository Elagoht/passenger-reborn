import { PartialType } from '@nestjs/swagger';
import RequestCreateTag from './create';

export class RequestUpdateTag extends PartialType(RequestCreateTag) {}
