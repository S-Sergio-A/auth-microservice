import { Document } from 'mongoose';

export interface User extends Document{
  email: string;
  username: string;
  password: string;
  userId: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  phoneNumber?: string;
  verification: boolean;
  verificationExpires: number;
  loginAttempts: number;
  isBlocked: boolean;
  blockExpires?: number;
}
