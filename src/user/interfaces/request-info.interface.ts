export interface RequestInfo {
  accessToken: string;
  ip: string;
  userAgent: string;
  fingerprint: string;
  refreshToken: string;
  userId: string;
}

export interface IpAgentFingerprint{
  ip: string;
  userAgent: string;
  fingerprint: string;
}
