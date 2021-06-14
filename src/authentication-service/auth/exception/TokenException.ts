export class TokenError extends Error {
  public response: { key: string; code: number; message: string };

  constructor(public readonly error: { readonly key: string, readonly code: number, readonly message: string}, ...args) {
    super(...args);
    this.response = {key: error.key, code: error.code, message: error.message};
  }
}

// export class TokenError {
//   constructor(key: string, code: number, message: string) {
//     const error = Error(message);
//
//     // set immutable object properties
//     Object.defineProperty(error, 'message', {
//       get() {
//         return message;
//       }
//     });
//     Object.defineProperty(key, 'key', {
//       get() {
//         return key;
//       }
//     });
//     Object.defineProperty(code, 'code', {
//       get() {
//         return code;
//       }
//     });
//     Object.defineProperty(error, 'name', {
//       get() {
//         return 'DataError';
//       }
//     });
//     // capture where error occurred
//     Error.captureStackTrace(error, TokenError);
//     return error;
//   }
// }
