import { Document } from 'mongoose';

export interface ForgotPassword extends Document {
    email: string;
    verification: string;
    expires: number;
    ipOfRequest: string;
    browserOfRequest: string;
    countryOfRequest: string;
}
