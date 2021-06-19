import { Document } from 'mongoose';

export interface RefreshSession extends Document{
  userId: string;
  refreshToken: string;
  ip: string;
  userAgent: string;
  expiresIn: number;
  createdAt: number;
  fingerprint: string;
}
