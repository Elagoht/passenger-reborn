import { PartialType } from '@nestjs/swagger';
import RequestCreateAccount from './create';

class RequestUpdateAccount extends PartialType(RequestCreateAccount) {}

export default RequestUpdateAccount;
