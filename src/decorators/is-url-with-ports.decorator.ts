import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsUrlWithPort(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUrlWithPort',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Regex to validate URL with an optional port
          const urlPattern =
            /^(https?:\/\/)?([a-zA-Z0-9.-]+)(:\d+)?(\/[^\s]*)?$/;
          // Check if the value is a string and matches the URL pattern
          return typeof value === 'string' && urlPattern.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid URL`;
        },
      },
    });
  };
}
