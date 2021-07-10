export interface Room {
  id: string;
  name: string;
  description?: string;
  isUser: boolean;
  isPrivate: boolean;
  usersID?: string[];
  messagesID?: string[];
  membersCount?: number;
  createdAt: string;
}
