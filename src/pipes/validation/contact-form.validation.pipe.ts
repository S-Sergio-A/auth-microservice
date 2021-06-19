import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidationException } from '../../exceptions/Validation.exception';

@Injectable()
export class ContactFormValidationPipe implements PipeTransform {
  constructor(
    private readonly validation: ValidationService,
  ) {}
  
  async transform(value, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('No data submitted');
    }

    if (!metadata.metatype || !this._toValidate(metadata.metatype)) {
      return value;
    }

    const { errors, isValid } = await this.validation.validateContactForm(value);

    if (isValid) {
      return value;
    } else {
      throw new ValidationException(errors);
    }
  }

  private _toValidate(metatype): boolean {
    return typeof metatype === 'object';
  }
}
