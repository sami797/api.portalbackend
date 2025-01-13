import { Injectable } from "@nestjs/common";
import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from "class-validator";

@ValidatorConstraint({ name: 'ValidateName', async: true })
@Injectable()
export class ValidateName implements ValidatorConstraintInterface {

  async validate(value: string) {
    try {
    let regex = new RegExp(/^[^!@#$%^&*()<>\/{}";'\\.,~`±§]*$/);
    if(regex.test(value)){
        return true
    }else{
        return false
    }
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Invalid Username, Username cannot contain special characters `;
  }
}


@ValidatorConstraint({ name: 'CustomDateValidator', async: false })
export class CustomDateValidator implements ValidatorConstraintInterface {
  validate(value: Date, args: ValidationArguments) {
    return value > new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return args.constraints[0];
  }
}

export function IsDateGreaterThan(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsDateGreaterThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          
          if (relatedValue instanceof Date && value instanceof Date) {
            return value.getTime() > relatedValue.getTime();
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be greater than ${relatedPropertyName}`;
        },
      },
    });
  };
}

export function IsDateGreaterThanToday(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsDateGreaterThanToday',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const currentDate = new Date();          
          if (value instanceof Date) {
            return value.getTime() > currentDate.getTime();
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be greater than today's date`;
        },
      },
    });
  };
}

@ValidatorConstraint({ name: 'IsEnumValue', async: false })
export class IsEnumValue implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [enumType] = args.constraints;

    if (!Array.isArray(value)) {
      return false;
    }

    for (const item of value) {
      if (!Object.values(enumType).includes(item)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Each value in the array must be a valid enum value`;
  }
}

export function IsEnumArray(enumType: object, validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'IsEnumArray',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [enumType],
      options: validationOptions,
      validator: IsEnumValue,
    });
  };
}