import { PartialType } from '@nestjs/swagger';
import RequestCreatePassphrase from './create';

class RequestUpdatePassphrase extends PartialType(RequestCreatePassphrase) {}

export default RequestUpdatePassphrase;
