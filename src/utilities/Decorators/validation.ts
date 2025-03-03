import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isMasterPassphrase', async: false })
class IsMasterPassphraseConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (typeof value !== 'string') return false;
    if (value.length < 16) return false;

    const constraints = {
      lowercase: /[a-z]/g,
      uppercase: /[A-Z]/g,
      numbers: /[0-9]/g,
      special: /[!@#$%^&*(),.?":{}|<>]/g,
    };

    const counts = {
      lowercase: (value.match(constraints.lowercase) || []).length,
      uppercase: (value.match(constraints.uppercase) || []).length,
      numbers: (value.match(constraints.numbers) || []).length,
      special: (value.match(constraints.special) || []).length,
    };

    return (
      counts.lowercase >= 2 &&
      counts.uppercase >= 2 &&
      counts.numbers >= 2 &&
      counts.special >= 2
    );
  }

  defaultMessage() {
    return 'Master passphrase must be at least 16 characters long and contain at least 2 lowercase letters, 2 uppercase letters, 2 numbers, and 2 special characters';
  }
}

export function IsMasterPassphrase(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMasterPassphrase',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMasterPassphraseConstraint,
    });
  };
}
