import { Document } from 'mongoose';

export interface Vault extends Document{
  userId: string;
  salt: string;
}
