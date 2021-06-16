import { Schema, HookNextFunction } from 'mongoose';
import argon2 from 'argon2';
import validator from 'validator';

export const UserSchema = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
      validate: validator.isEmail,
      maxlength: 254,
      minlength: 6,
      required: [true, 'EMAIL_IS_BLANK']
    },
    username: {
      type: String,
      minlength: 4,
      maxlength: 20,
      required: [true, 'USERNAME_IS_BLANK']
    },
    password: {
      type: String,
      minlength: 8,
      maxlength: 40,
      required: [true, 'PASSWORD_IS_BLANK']
    },
    firstName: {
      type: String,
      minlength: 1,
      maxlength: 50,
      required: [false, 'FIRST_NAME_IS_BLANK']
    },
    lastName: {
      type: String,
      minlength: 1,
      maxlength: 50,
      required: [false, 'LAST_NAME_IS_BLANK']
    },
    birthday: {
      type: Date,
      minlength: 10,
      maxlength: 10,
      required: [false, 'BIRTHDAY_IS_BLANK']
    },
    phoneNumber: {
      type: String,
      minlength: 12,
      maxlength: 20,
      validate: {
        validator: (val) => {
          if (val.includes('+38') && !validator.isMobilePhone(val.replace(/\s/g, '').replace(/-/g, ''), 'uk-UA')) {
            return true;
          } else if (
            (val.includes('+7') || val.includes('+8')) &&
            !validator.isMobilePhone(val.telNum.replace(/\s/g, '').replace(/-/g, ''), 'ru-RU')
          ) {
            return true;
          } else if (val.includes('+1') && !validator.isMobilePhone(val.replace(/\s/g, '').replace(/-/g, ''), 'en-US')) {
            return true;
          }
        },
        message: "Mobile phone number isn't Ukrainian, Russian or American."
      },
      required: [false, 'PHONE_NUMBER_IS_BLANK']
    },
    verification: {
      type: String,
      validate: validator.isUUID
    },
    isActive: {
      type: Boolean,
      default: false
    },
    verificationExpires: {
      type: Number,
      default: Date.now
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    blockExpires: {
      type: Number,
      default: Date.now
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

UserSchema.pre('save', async function (next: HookNextFunction) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    this['password'] = argon2.hash(this['password'], {
      hashLength: 40,
      memoryCost: 81920,
      timeCost: 4,
      type: argon2.argon2id
    });
    return next();
  } catch (err) {
    return next(err);
  }
});
